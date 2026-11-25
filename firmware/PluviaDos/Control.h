#pragma once
#include "Ajustes.h"
#include <math.h>

struct Control {
  bool confirmado = false, compuerta = false, motor = false, bomba = false;
  float disponibleMs = 0;
  uint32_t anterior = 0, movimiento = 0, comienzoMotor = 0, comienzoDosis = 0;
  uint32_t duracionDosis = 0, desdeAlto = 0, desdeBajo = 0;
  bool contandoAlto = false, contandoBajo = false, armado = true, lleno = false;

  void confirmarVacio(uint32_t ahora) {
    // Una confirmación por arranque. No borra un saldo ya calculado.
    if (!confirmado) { confirmado = true; anterior = ahora; }
  }

  void paso(uint32_t ahora, float d1, float d2, bool luz) {
    const uint32_t dt = ahora - anterior;
    const uint32_t edadServo = ahora - movimiento;
    anterior = ahora;
    // Sumar entrada y restar bombeo del mismo intervalo antes de limitar el saldo.
    uint32_t entradaMs = 0;
    if (compuerta && edadServo > Cfg::viajeServoMs) {
      const uint32_t estable = edadServo - Cfg::viajeServoMs;
      entradaMs = dt < estable ? dt : estable;
    }
    disponibleMs = fminf(Cfg::capacidadMs, fmaxf(0.0f,
        disponibleMs + entradaMs * Cfg::relacionCaudal - (bomba ? dt : 0)));
    const bool validos = isfinite(d1) && isfinite(d2);
    bool abrir = compuerta;
    if (disponibleMs >= Cfg::capacidadMs) lleno = true;
    if (disponibleMs <= Cfg::capacidadMs - 1000) lleno = false;
    if (!confirmado || !validos || lleno || (d1 < 40 && d2 < 40)) abrir = false;
    else if (d1 >= 50 || d2 >= 50) abrir = true;
    if (abrir != compuerta) { compuerta = abrir; movimiento = ahora; }
    const bool servoQuieto = uint32_t(ahora - movimiento) >= Cfg::viajeServoMs;

    if (isfinite(d1) && d1 < 40) {
      if (!contandoBajo) desdeBajo = ahora;
      contandoBajo = true;
      if (ahora - desdeBajo >= Cfg::confirmarMs) armado = true;
    } else contandoBajo = false;
    if (isfinite(d1) && d1 >= 80) {
      if (!contandoAlto) desdeAlto = ahora;
      contandoAlto = true;
    } else contandoAlto = false;

    if (motor && (!isfinite(d1) || d1 < 40 || !servoQuieto ||
                   ahora - comienzoMotor >= Cfg::motorMs)) motor = false;
    if (confirmado && armado && contandoAlto && servoQuieto &&
        ahora - desdeAlto >= Cfg::confirmarMs) {
      motor = true; armado = false; comienzoMotor = ahora;
    }

    const bool puedeRegar = confirmado && luz && servoQuieto && !motor && disponibleMs >= 1;
    if (!puedeRegar || ahora - comienzoDosis >= duracionDosis) bomba = false;
    if (puedeRegar && !bomba) {
      comienzoDosis = ahora;
      duracionDosis = uint32_t(fminf(Cfg::dosisMs, disponibleMs));
      bomba = true;
    }
  }
};
