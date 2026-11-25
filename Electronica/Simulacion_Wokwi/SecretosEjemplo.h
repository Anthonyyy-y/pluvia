#pragma once

// Si falta Secretos.h, copiar este archivo con ese nombre en la misma carpeta.
// Completar las credenciales en la copia privada.
namespace Credenciales {
// Wi-Fi de 2,4 GHz del montaje.
constexpr char WIFI_SSID[] = "";
constexpr char WIFI_CLAVE[] = "";
constexpr char ID_DISPOSITIVO[] = "pluvia-01";
constexpr char TOKEN_DISPOSITIVO[] = "";
constexpr char URL_TELEMETRIA[] = "https://pluvia-mu.vercel.app/api/v1/telemetry";
constexpr bool PERMITIR_HTTP_EN_LAN = false;
// Vacío usa las autoridades de confianza del núcleo ESP32. Para un servidor
// con una CA propia, colocar aquí su certificado raíz público en formato PEM.
constexpr char CA_PEM[] = "";
constexpr char SERVIDOR_HORA[] = "pool.ntp.org";
}
