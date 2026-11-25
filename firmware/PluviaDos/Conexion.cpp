#include "Conexion.h"
#include "Ajustes.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <NetworkClientSecure.h>
#include <esp_http_server.h>
#include <time.h>

namespace Conexion {
namespace {
QueueHandle_t ultima = nullptr, pendientes = nullptr;
httpd_handle_t local = nullptr;

esp_err_t responder(httpd_req_t *req) {
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, OPTIONS");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Private-Network", "true");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  if (req->method == HTTP_OPTIONS) return httpd_resp_send(req, nullptr, 0);
  Datos::Par par;
  httpd_resp_set_type(req, "application/json");
  if (xQueuePeek(ultima, &par, 0) != pdTRUE) {
    httpd_resp_set_status(req, "503 Service Unavailable");
    return httpd_resp_sendstr(req, "{\"error\":\"Esperando sensores\"}");
  }
  return httpd_resp_sendstr(req, par.paquete);
}

void iniciarHTTP() {
  httpd_config_t cfg = HTTPD_DEFAULT_CONFIG();
  cfg.stack_size = 6144;
  if (httpd_start(&local, &cfg) != ESP_OK) return;
  httpd_uri_t ruta{};
  ruta.uri = "/api/v1/lecturas";
  ruta.handler = responder;
  ruta.method = HTTP_GET;
  httpd_register_uri_handler(local, &ruta);
  ruta.method = HTTP_OPTIONS;
  httpd_register_uri_handler(local, &ruta);
}

// El núcleo ESP32 3.3.12 incluye el almacén de autoridades y puede omitir la
// comprobación de fechas de mbedTLS. Completarla antes de transmitir el token.
class TLS : public NetworkClientSecure {
  int connect(const char *host, uint16_t puerto, int32_t limite) override {
    if (!NetworkClientSecure::connect(host, puerto, limite)) return 0;
    time_t segundos = time(nullptr);
    struct tm utc;
    auto cert = getPeerCertificate();
    if (cert && gmtime_r(&segundos, &utc)) {
      mbedtls_x509_time ahora{utc.tm_year + 1900, utc.tm_mon + 1, utc.tm_mday,
                             utc.tm_hour, utc.tm_min, utc.tm_sec};
      while (cert && mbedtls_x509_time_cmp(&ahora, &cert->valid_from) >= 0 &&
             mbedtls_x509_time_cmp(&ahora, &cert->valid_to) <= 0) cert = cert->next;
      if (!cert) return 1;
    }
    stop();
    return 0;
  }
};

void tarea(void *) {
  const bool publicarNube = !Cfg::simulacion && Red::token[0] && Datos::idValido(Red::dispositivo)
    && String(Red::destino).startsWith("https://") && String(Red::destino).endsWith("/api/v1/telemetry");
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(Red::wifi, Red::clave);
  uint32_t intento = millis(), pausa = 1000;
  bool conectado = false, horaIniciada = false;
  int ultimoHTTP = 0;
  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      conectado = false;
      if (millis() - intento >= 12000) { WiFi.reconnect(); intento = millis(); }
      vTaskDelay(pdMS_TO_TICKS(250));
      continue;
    }
    if (!conectado) {
      Serial.printf("# WiFi http://%s/api/v1/lecturas\n", WiFi.localIP().toString().c_str());
      conectado = true;
    }
    if (!local) iniciarHTTP();
    if (!publicarNube) { vTaskDelay(pdMS_TO_TICKS(1000)); continue; }
    if (!horaIniciada) { configTime(0, 0, "pool.ntp.org", "time.google.com"); horaIniciada = true; }
    if (time(nullptr) < 1704067200) { vTaskDelay(pdMS_TO_TICKS(500)); continue; }
    Datos::Par par;
    if (xQueueReceive(pendientes, &par, pdMS_TO_TICKS(1000)) != pdTRUE) continue;
    TLS cliente;
    cliente.useBuiltinCACertBundle();
    cliente.setHandshakeTimeout(6);
    HTTPClient http;
    int estado = -1;
    if (http.begin(cliente, Red::destino)) {
      http.setConnectTimeout(4000);
      http.setTimeout(5500);
      http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + Red::token);
      estado = http.POST(reinterpret_cast<uint8_t *>(par.paquete), strlen(par.paquete));
      http.end();
    }
    if (estado != ultimoHTTP) { Serial.printf("# Nube HTTP %d\n", estado); ultimoHTTP = estado; }
    if (estado == 201 || estado == 200) pausa = 1000;
    else { vTaskDelay(pdMS_TO_TICKS(pausa)); pausa = min(30000UL, (unsigned long)pausa * 2); }
  }
}
}
void iniciar() {
  if (!Red::wifi[0]) return;
  ultima = xQueueCreate(1, sizeof(Datos::Par));
  pendientes = xQueueCreate(1, sizeof(Datos::Par));
  if (ultima && pendientes && xTaskCreate(tarea, "pluvia-wifi", 12288, nullptr, 1, nullptr) == pdPASS) return;
  if (ultima) vQueueDelete(ultima);
  if (pendientes) vQueueDelete(pendientes);
  ultima = pendientes = nullptr;
  Serial.println("# WiFi sin memoria");
}
void publicar(const Datos::Par &p) {
  if (ultima) xQueueOverwrite(ultima, &p);
  if (pendientes) xQueueOverwrite(pendientes, &p);
}
}
