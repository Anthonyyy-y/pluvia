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
#include <atomic>

namespace Telemetria {
namespace {
QueueHandle_t cola = nullptr;
using namespace RedConfig;
using namespace Credenciales;

// HTTPClient devuelve >= 100 para HTTP y negativos para errores de transporte.
enum EstadoLocal { INICIAL, CONFIGURACION_INCOMPLETA, DESTINO_INVALIDO, SIN_MEMORIA,
                   ESPERANDO_WIFI, ESPERANDO_HORA, ESPERANDO_MUESTRA,
                   MUESTRA_CADUCADA, JSON_NO_GENERADO };
std::atomic<int> estadoRed{INICIAL};
std::atomic<int> estadoWifi{WL_IDLE_STATUS};

const char *nombreEstadoWifi(int estado) {
  switch (estado) {
    case WL_IDLE_STATUS: return "INACTIVO";
    case WL_NO_SSID_AVAIL: return "RED_NO_DISPONIBLE";
    case WL_SCAN_COMPLETED: return "ESCANEO_COMPLETADO";
    case WL_CONNECTED: return "CONECTADO";
    case WL_CONNECT_FAILED: return "CONEXION_FALLIDA";
    case WL_CONNECTION_LOST: return "CONEXION_PERDIDA";
    case WL_DISCONNECTED: return "DESCONECTADO";
    default: return "DESCONOCIDO";
  }
}

bool destinoPermitido(const String &url) {
  if (!url.endsWith("/api/v1/telemetry")) return false;
  if (url.startsWith("https://")) return true;
  if (!PERMITIR_HTTP_EN_LAN || !url.startsWith("http://")) return false;
  // HTTP sin cifrar solo con una IPv4 privada explícita.
  String autoridad = url.substring(7, url.indexOf('/', 7));
  int puerto = autoridad.indexOf(':');
  if (puerto >= 0) {
    String numero = autoridad.substring(puerto + 1);
    if (numero.isEmpty() || numero.length() > 5 ||
        strspn(numero.c_str(), "0123456789") != numero.length() ||
        numero.toInt() < 1 || numero.toInt() > 65535) return false;
  }
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
  bool conectado = false;
  for (;;) {
    int wifiActual = WiFi.status();
    estadoWifi = wifiActual;
    if (wifiActual != WL_CONNECTED) {
      conectado = false;
      estadoRed = ESPERANDO_WIFI;
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
      estadoRed = ESPERANDO_HORA;
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }
    if (!conectado) {
      conectado = true;
      estadoRed = ESPERANDO_MUESTRA;
    }
    Muestra m;
    if (xQueueReceive(cola, &m, pdMS_TO_TICKS(1000)) != pdTRUE) continue;
    uint64_t espera = uint64_t(esp_timer_get_time() / 1000) - m.uptimeMs;
    if (espera >= INTERVALO_ENVIO_MS) {
      estadoRed = MUESTRA_CADUCADA;
      continue;
    }
    bool aunVigente = true;
    for (const auto &p : m.puntos) {
      if (p.valido && uint64_t(p.edadMs) + espera >= Config::SENSOR_FRESCO_MS) aunVigente = false;
    }
    if (!aunVigente) {
      estadoRed = MUESTRA_CADUCADA;
      continue;
    }
    char cuerpo[2600];
    size_t longitud = codificar(m, ID_DISPOSITIVO, arranque, WiFi.RSSI(), espera,
                                cuerpo, sizeof(cuerpo));
    if (!longitud) {
      estadoRed = JSON_NO_GENERADO;
      continue;
    }
    int respuesta;
    if (usaTLS) {
      ClienteSeguro cliente;
      if (CA_PEM[0]) cliente.setCACert(CA_PEM);
      else cliente.useBuiltinCACertBundle();
      cliente.setHandshakeTimeout(TIMEOUT_TLS_S);
      respuesta = enviar(cliente, url, cuerpo, longitud);
    } else {
      NetworkClient cliente;
      respuesta = enviar(cliente, url, cuerpo, longitud);
    }
    estadoRed = respuesta;
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
  if (cola) return;
  if (!WIFI_SSID[0] || !TOKEN_DISPOSITIVO[0] || !idValido(ID_DISPOSITIVO)) {
    estadoRed = CONFIGURACION_INCOMPLETA;
    return;
  }
  if (!destinoPermitido(URL_TELEMETRIA)) {
    estadoRed = DESTINO_INVALIDO;
    return;
  }
  estadoRed = ESPERANDO_WIFI;
  cola = xQueueCreate(1, sizeof(Muestra));
  // iniciar() se ejecuta desde setup(), antes de que la tarea active la radio.
  if (cola && DIAGNOSTICO_RED_USB) {
    Serial.println("RED,INICIANDO_WIFI");
    Serial.flush();
  }
  if (cola && xTaskCreatePinnedToCore(tarea, "envio-pluvia", 12288, nullptr, 1, nullptr, 0) != pdPASS) {
    vQueueDelete(cola);
    cola = nullptr;
  }
  if (!cola) estadoRed = SIN_MEMORIA;
}

bool activa() { return cola != nullptr; }
void ofrecer(const Muestra &m) {
  if (cola) xQueueOverwrite(cola, &m);
}

// Imprimir desde loop() evita intercalar texto dentro de las tramas PIS.
void informarPorUSB() {
  if (!DIAGNOSTICO_RED_USB) return;
  static int anterior = INICIAL;
  static int wifiAnterior = -1;
  static uint32_t ultimoDiagnostico = 0;
  int actual = estadoRed.load();
  int wifiActual = estadoWifi.load();
  uint32_t ahora = millis();
  bool cambioWifi = actual == ESPERANDO_WIFI && wifiActual != wifiAnterior;
  if (actual == anterior && !cambioWifi &&
      uint32_t(ahora - ultimoDiagnostico) < REPETIR_DIAGNOSTICO_MS) return;
  anterior = actual;
  wifiAnterior = wifiActual;
  ultimoDiagnostico = ahora;
  switch (actual) {
    case INICIAL: Serial.println("RED,SIN_INICIAR"); break;
    case CONFIGURACION_INCOMPLETA: Serial.println("RED,REVISAR_SSID_ID_Y_TOKEN"); break;
    case DESTINO_INVALIDO: Serial.println("RED,REVISAR_URL_TELEMETRIA"); break;
    case SIN_MEMORIA: Serial.println("RED,MEMORIA_INSUFICIENTE"); break;
    case ESPERANDO_WIFI:
      Serial.printf("RED,ESPERANDO_WIFI,%d,%s\n", wifiActual, nombreEstadoWifi(wifiActual));
      break;
    case ESPERANDO_HORA: Serial.println("RED,WIFI_CONECTADO,ESPERANDO_NTP"); break;
    case ESPERANDO_MUESTRA: Serial.println("RED,WIFI_CONECTADO"); break;
    case MUESTRA_CADUCADA: Serial.println("RED,MUESTRA_DESCARTADA,CADUCADA"); break;
    case JSON_NO_GENERADO: Serial.println("RED,MUESTRA_DESCARTADA,JSON_NO_GENERADO"); break;
    default:
      if (actual < 0) Serial.printf("RED,ERROR_TRANSPORTE,%d\n", actual);
      else Serial.printf("RED,HTTP,%d\n", actual);
  }
}
}
