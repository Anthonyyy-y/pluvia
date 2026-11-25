#include "Telemetria.h"
#include <math.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include <inttypes.h>

namespace Telemetria {
bool idValido(const char *id) {
  size_t largo = strlen(id);
  if (largo == 0 || largo > 64) return false;
  return strspn(id, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-") == largo;
}

namespace {
// Escritura acotada. Un mensaje truncado nunca se envía al servidor.
class Json {
 public:
  Json(char *destino, size_t limite) : destino(destino), limite(limite) {}
  void texto(const char *formato, ...) {
    if (!completo) return;
    va_list args;
    va_start(args, formato);
    int n = vsnprintf(destino + usados, limite - usados, formato, args);
    va_end(args);
    if (n < 0 || static_cast<size_t>(n) >= limite - usados) completo = false;
    else usados += static_cast<size_t>(n);
  }
  void numero(float valor) {
    if (isfinite(valor)) texto("%.5f", static_cast<double>(valor));
    else texto("null");
  }
  size_t longitud() const { return completo ? usados : 0; }
 private:
  char *destino;
  size_t limite;
  size_t usados = 0;
  bool completo = true;
};
const char *booleano(bool valor) { return valor ? "true" : "false"; }
}

// Los nombres de estado, etapa y error son literales internos del firmware.
// La identidad configurable se valida antes de interpolarla en la cadena.
size_t codificar(const Muestra &m, const char *dispositivo, const char *arranque,
                 int rssi, uint32_t esperaMs, char *json, size_t capacidad) {
  if (!capacidad || !idValido(dispositivo) || !idValido(arranque)) return 0;
  Json out(json, capacidad);
  out.texto(R"({"version":1,"device_id":"%s","source":"REAL","boot_id":"%s","seq":)" "%" PRIu32,
            dispositivo, arranque, m.secuencia);
  out.texto(",\"uptime_ms\":%" PRIu64 ",\"points\":{", m.uptimeMs);
  const char *nombres[] = {"A1", "A2", "A3", "DEPOSITO"};
  for (size_t i = 0; i < 4; i++) {
    const Punto &p = m.puntos[i];
    out.texto(R"(%s"%s":{"installed":%s,"valid":%s,"state":"%s","reason":)",
              i == 0 ? "" : ",", nombres[i], booleano(p.instalado), booleano(p.valido), p.estado);
    if (p.motivo) out.texto("\"%s\"", p.motivo);
    else out.texto("null");
    out.texto(",\"distance_cm\":"); out.numero(p.distancia);
    out.texto(",\"height_cm\":"); out.numero(p.altura);
    out.texto(",\"height_pct\":"); out.numero(p.porcentaje);
    out.texto(",\"age_ms\":");
    if (p.edadMs < 0) out.texto("null");
    else out.texto("%" PRId64, p.edadMs + esperaMs);
    out.texto(R"(,"calibration":{"confirmed":%s,"empty_cm":)", booleano(p.calibrado));
    out.numero(p.vacio);
    out.texto(",\"full_cm\":"); out.numero(p.lleno);
    out.texto("}}");
  }
  out.texto(R"(},"outputs":{"motor":%s,"gate_deg":%d,"drain":%s,"irrigation":%s,"stage":"%s"},)",
            booleano(m.motor), m.anguloOrdenado, booleano(m.evacuacion), booleano(m.riego), m.etapa);
  out.texto(R"("tank":{"can_receive":%s,"can_irrigate":%s},"light":{"adc":%d,"daylight":%s},)",
            booleano(m.admiteEntrada), booleano(m.permiteRiego), m.ldr, booleano(m.hayLuz));
  out.texto(R"("network":{"rssi_dbm":)");
  if (rssi < 0 && rssi >= -127) out.texto("%d", rssi);
  else out.texto("null");
  out.texto("}}");
  return out.longitud();
}
}
