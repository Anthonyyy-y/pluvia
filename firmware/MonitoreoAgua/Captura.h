#pragma once
// Incluir después de las funciones de control. Solo el loop lee estas variables.
#include "Telemetria.h"
#include "RedConfig.h"

inline Telemetria::Muestra capturarSistema(uint32_t ahora, uint64_t uptime, uint32_t secuencia) {
  using namespace Telemetria;
  Muestra m{};
  m.uptimeMs = uptime;
  m.secuencia = secuencia;
  for (uint8_t i = 0; i < 4; i++) {
    Punto &p = m.puntos[i];
    const Lectura &r = sensores[i];
    const Sensor &s = SENSORES[i];
    p.instalado = s.instalado;
    p.valido = sensorOK(i, ahora);
    p.estado = estadoMedicion(i, ahora);
    bool vencido = transcurrio(ahora, r.instante, SENSOR_FRESCO_MS);
    if (!s.instalado) p.motivo = "SIN_SENSOR";
    else if (!p.valido) p.motivo = r.muestreada && vencido ? "CADUCADA" : r.detalle;
    p.edadMs = s.instalado && r.muestreada ? int64_t(uint32_t(ahora - r.instante)) : -1;
    bool geometria = s.instalado && geometriaValida(i);
    p.calibrado = geometria && RedConfig::CALIBRACION_CONFIRMADA[i];
    p.vacio = geometria ? s.vacioCm : NAN;
    p.lleno = geometria ? s.llenoCm : NAN;
    p.distancia = s.instalado && !vencido ? r.distancia : NAN;
    p.altura = p.valido ? r.alturaCm : NAN;
    p.porcentaje = p.valido && p.calibrado ? r.nivel : NAN;
  }
  static constexpr const char *etapas[] = {
    "REPOSO", "LIMPIANDO", "VERIFICANDO", "COMPUERTA", "DRENANDO", "REVISAR", "ERROR_SENSOR"
  };
  static_assert(int(Etapa::ERROR_SENSOR) + 1 == sizeof(etapas) / sizeof(etapas[0]),
                "Revisar nombres del contrato al cambiar las etapas");
  m.etapa = etapas[int(etapa)];
  m.motor = salida[0];
  m.evacuacion = salida[1];
  m.riego = salida[2];
  m.anguloOrdenado = anguloOrdenado;
  m.admiteEntrada = m.puntos[3].valido && !depositoLleno;
  m.permiteRiego = m.puntos[3].valido && depositoDisponible;
  m.ldr = lecturaLdr;
  m.hayLuz = hayLuz;
  return m;
}
