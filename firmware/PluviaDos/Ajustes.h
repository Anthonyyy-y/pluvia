#pragma once
#include <stdint.h>

namespace Cfg {
constexpr bool simulacion = false; // true para Wokwi. Bloquea el envío a la nube real.
constexpr uint32_t periodoDatosMs = 3000;
struct Sensor { uint8_t trig, echo; float fondoCm, minimoCm; };
// Montar a estas distancias o sustituirlas por las medidas reales con una regla.
// Para dos HC-SR04, poner en D1 el fondo medido y minimoCm = 2.
constexpr Sensor sensores[] = {{13, 34, 40.0f, 25.0f}, {14, 35, 14.0f, 2.0f}};
constexpr float profundidadCm = 10;
constexpr uint8_t motor = 27, bomba = 17, servo = 23, ldr = 32;
constexpr uint8_t verde = 2, amarillo = 5, rojo = 15;
constexpr uint8_t rs = 21, enable = 22, d4 = 25, d5 = 26, d6 = 33, d7 = 4;
constexpr uint8_t botonBoot = 0;  // Pulsar solo DESPUÉS del arranque.
constexpr int cerrado = 0, abierto = 90;
constexpr int adcDia = 1400, adcOscuro = 2000;
constexpr uint32_t viajeServoMs = 400, motorMs = 4000, confirmarMs = 1000;
constexpr uint32_t dosisMs = 5000, capacidadMs = 20000;
// Medir mL/s que entran por el filtro y dividir por mL/s que salen por la bomba.
constexpr float relacionCaudal = 1.0f;
static_assert(relacionCaudal > 0 && capacidadMs >= dosisMs, "Revisar tiempos y caudales");
}
