#pragma once
#include <cmath>
#include <cstdio>
#include <cstdint>
#include <cstring>
#include <inttypes.h>

namespace Datos {
// D1 y D2 se adquieren en turnos sucesivos. ts es el instante de la adquisición
// del sensor en milisegundos desde el arranque, no una fecha de calendario.
struct Par {
  char linea[2][400];
  char paquete[1100];
};
inline const char *booleano(bool valor) { return valor ? "true" : "false"; }
inline void decimal(char (&salida)[24], float valor) {
  if (std::isfinite(valor)) snprintf(salida, sizeof(salida), "%.3f", double(valor));
  else strcpy(salida, "null");
}
inline bool idValido(const char *v) {
  size_t n = strlen(v);
  return n > 0 && n <= 64 && strspn(v, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-") == n;
}
inline bool codificar(Par &par, const char *dispositivo, const char *arranque,
                      uint32_t secuencia, uint64_t uptime, const uint64_t ts[2],
                      const float alturaCm[2], bool bomba, float reservaS,
                      bool motor, bool compuerta, bool luz, bool simulacion) {
  if (!idValido(dispositivo) || !idValido(arranque)) return false;
  char reserva[24]; decimal(reserva, reservaS);
  const char *origen = simulacion ? "SIMULACION" : "REAL";
  for (unsigned i = 0; i < 2; ++i) {
    char altura[24]; decimal(altura, alturaCm[i]);
    int n = snprintf(par.linea[i], sizeof(par.linea[i]),
      "{\"ts\":%" PRIu64 ",\"sensor\":\"D%u\",\"valor\":%s,\"bombaEstado\":%s,\"nivelEstanque\":null,\"reservaEstimadaS\":%s,"
      "\"motorEstado\":%s,\"compuertaAbierta\":%s,\"luz\":%s,\"source\":\"%s\"}",
      ts[i], i+1, altura, booleano(bomba), reserva, booleano(motor), booleano(compuerta), booleano(luz), origen);
    if (n < 0 || size_t(n) >= sizeof(par.linea[i])) return false;
  }
  int n = snprintf(par.paquete, sizeof(par.paquete),
    "{\"version\":2,\"source\":\"%s\",\"device_id\":\"%s\",\"boot_id\":\"%s\",\"seq\":%" PRIu32
    ",\"uptime_ms\":%" PRIu64 ",\"lecturas\":[%s,%s]}",
    origen, dispositivo, arranque, secuencia, uptime, par.linea[0], par.linea[1]);
  return n > 0 && size_t(n) < sizeof(par.paquete);
}
}
