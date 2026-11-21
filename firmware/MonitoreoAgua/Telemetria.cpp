#include "Telemetria.h"
#include "RedConfig.h"
#include "Configuracion.h"
#include <Arduino.h>
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <HTTPClient.h>
#include <esp_random.h>
#include <esp_timer.h>
#include <time.h>

namespace Telemetria {
namespace {
QueueHandle_t cola = nullptr;
using namespace RedConfig;
using namespace Credenciales;

bool destinoPermitido(const String &url) {
  if (!url.endsWith("/api/v1/telemetry")) return false;
  if (url.startsWith("https://")) return CA_PEM[0];
  if (!PERMITIR_HTTP_EN_LAN || !url.startsWith("http://")) return false;
  // HTTP sin cifrar solo con una IPv4 privada explícita.
  String autoridad = url.substring(7, url.indexOf('/', 7));
  int puerto = autoridad.indexOf(':');
  String host = puerto < 0 ? autoridad : autoridad.substring(0, puerto);
  IPAddress ip;
  if (!ip.fromString(host) || ip.type() != IPv4) return false;
  return ip[0] == 10 || (ip[0] == 172 && ip[1] >= 16 && ip[1] <= 31)
                     || (ip[0] == 192 && ip[1] == 168);
}

// El núcleo 3.3.12 precompilado puede omitir MBEDTLS_HAVE_TIME_DATE.
// HTTPClient llama a esta sobrecarga antes de escribir cabecera o cuerpo.
class ClienteSeguro : public NetworkClientSecure {
 public:
  int connect(const char *host, uint16_t puerto, int32_t limite) override {
    if (!NetworkClientSecure::connect(host, puerto, limite)) return 0;
    time_t segundos = time(nullptr);
    struct tm utc;
    const mbedtls_x509_crt *cert = getPeerCertificate();
    if (cert && gmtime_r(&segundos, &utc)) {
      mbedtls_x509_time ahora = {utc.tm_year + 1900, utc.tm_mon + 1, utc.tm_mday,
                                 utc.tm_hour, utc.tm_min, utc.tm_sec};
      for (; cert; cert = cert->next) {
        if (mbedtls_x509_time_cmp(&ahora, &cert->valid_from) < 0 ||
            mbedtls_x509_time_cmp(&ahora, &cert->valid_to) > 0) break;
      }
      if (!cert) return 1;
    }
    stop();
    return 0;
  }
};

int enviar(NetworkClient &cliente, const String &url, char *cuerpo, size_t longitud) {
  HTTPClient http;
  if (!http.begin(cliente, url)) return -1;
  http.setConnectTimeout(TIMEOUT_CONEXION_MS);
  http.setTimeout(TIMEOUT_RESPUESTA_MS);
  http.setReuse(false);
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + TOKEN_DISPOSITIVO);
  int estado = http.POST(reinterpret_cast<uint8_t *>(cuerpo), longitud);
  http.end();
  return estado;
}

void tarea(void *) {
  const String url(URL_TELEMETRIA);
  const bool usaTLS = url.startsWith("https://");
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_CLAVE);
  // El generador hardware tiene disponible la entropía del subsistema de radio.
  char arranque[33];
  uint8_t azar[16];
  esp_fill_random(azar, sizeof(azar));
  for (size_t i = 0; i < sizeof(azar); i++) snprintf(arranque + i*2, 3, "%02x", azar[i]);
  bool relojIniciado = false;

  uint32_t ultimoIntentoWifi = millis();
  uint32_t esperaError = 1000;
  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      if (millis() - ultimoIntentoWifi >= REINTENTO_WIFI_MS) {
        WiFi.reconnect();
        ultimoIntentoWifi = millis();
      }
      vTaskDelay(pdMS_TO_TICKS(250));
      continue;
    }
    if (usaTLS && !relojIniciado) {
      configTime(0, 0, SERVIDOR_HORA);
      relojIniciado = true;
    }
    // TLS precisa un reloj de calendario sincronizado para validar certificados.
    if (usaTLS && time(nullptr) < 1704067200) {
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }
    Muestra m;
    if (xQueueReceive(cola, &m, pdMS_TO_TICKS(1000)) != pdTRUE) continue;
    uint64_t espera = uint64_t(esp_timer_get_time() / 1000) - m.uptimeMs;
    if (espera >= INTERVALO_ENVIO_MS) continue;
    bool aunVigente = true;
    for (const auto &p : m.puntos) {
      if (p.valido && uint64_t(p.edadMs) + espera >= Config::SENSOR_FRESCO_MS) aunVigente = false;
    }
    if (!aunVigente) continue;
    char cuerpo[2600];
    size_t longitud = codificar(m, ID_DISPOSITIVO, arranque, WiFi.RSSI(), espera,
                                cuerpo, sizeof(cuerpo));
    if (!longitud) continue;
    int respuesta;
    if (usaTLS) {
      ClienteSeguro cliente;
      cliente.setCACert(CA_PEM);
      cliente.setHandshakeTimeout(TIMEOUT_TLS_S);
      respuesta = enviar(cliente, url, cuerpo, longitud);
    } else {
      NetworkClient cliente;
      respuesta = enviar(cliente, url, cuerpo, longitud);
    }
    if (respuesta == 200 || respuesta == 201) {
      esperaError = 1000;
    } else {
      // Solo esta tarea espera. Al volver, obtiene la última muestra disponible.
      vTaskDelay(pdMS_TO_TICKS(esperaError));
      esperaError = min(esperaError * 2, REINTENTO_MAXIMO_MS);
    }
  }
}
}

void iniciar() {
  if (cola || !WIFI_SSID[0] || !TOKEN_DISPOSITIVO[0] ||
      !idValido(ID_DISPOSITIVO) || !destinoPermitido(URL_TELEMETRIA)) return;
  cola = xQueueCreate(1, sizeof(Muestra));
  if (cola && xTaskCreatePinnedToCore(tarea, "envio-pluvia", 12288, nullptr, 1, nullptr, 0) != pdPASS) {
    vQueueDelete(cola);
    cola = nullptr;
  }
}

bool activa() { return cola != nullptr; }
void ofrecer(const Muestra &m) {
  if (cola) xQueueOverwrite(cola, &m);
}
}
