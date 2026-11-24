#pragma once
#include <stdint.h>
#include <stddef.h>

namespace Telemetria {
// Todos los punteros apuntan a literales estáticos. La cola copia la estructura.
struct Punto {
  bool instalado;
  bool valido;
  const char *estado;
  const char *motivo;
  float distancia, altura, porcentaje;
  int64_t edadMs; // -1 se publica como null.
  bool calibrado;
  float vacio, lleno;
};
struct Muestra {
  Punto puntos[4];
  bool motor, evacuacion, riego;
  int anguloOrdenado;
  const char *etapa;
  bool admiteEntrada, permiteRiego;
  bool hayLuz;
  int ldr;
  uint64_t uptimeMs;
  uint32_t secuencia;
};

bool idValido(const char *id);
size_t codificar(const Muestra &m, const char *dispositivo, const char *arranque,
                 int rssi, uint32_t esperaMs, char *json, size_t capacidad);
void iniciar();
bool activa();
void ofrecer(const Muestra &m);
}
