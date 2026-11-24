#pragma once
#include <stdint.h>

// Verificar por separado cada recipiente antes de cambiar su valor.
namespace RedConfig {
constexpr bool CALIBRACION_CONFIRMADA[4] = {false, false, false, false};
constexpr uint32_t INTERVALO_ENVIO_MS = 3000;
constexpr uint32_t REINTENTO_WIFI_MS = 12000;
constexpr uint32_t REINTENTO_MAXIMO_MS = 30000;
constexpr int32_t TIMEOUT_CONEXION_MS = 3500;
constexpr uint16_t TIMEOUT_RESPUESTA_MS = 4000;
constexpr uint32_t TIMEOUT_TLS_S = 5;
static_assert(INTERVALO_ENVIO_MS >= 1000, "Configurar al menos un segundo entre muestras");
static_assert(TIMEOUT_CONEXION_MS > 0 && TIMEOUT_RESPUESTA_MS > 0 && TIMEOUT_TLS_S > 0,
              "Los limites de espera deben ser positivos");
}

#if __has_include("Secretos.h")
#include "Secretos.h"
#else
#include "SecretosEjemplo.h"  // Sin claves, el control local funciona por sí solo.
#endif
