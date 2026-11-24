#pragma once

// Copiar como Secretos.h en esta misma carpeta. Mantener la copia en privado.
namespace Credenciales {
constexpr char WIFI_SSID[] = "";
constexpr char WIFI_CLAVE[] = "";
constexpr char ID_DISPOSITIVO[] = "pluvia-01";
constexpr char TOKEN_DISPOSITIVO[] = "";
constexpr char URL_TELEMETRIA[] = ""; // URL completa que termina en /api/v1/telemetry.
constexpr bool PERMITIR_HTTP_EN_LAN = false;
// En HTTPS, usar la CA que firma la cadena del servidor, en formato PEM completo.
// En la exposición LAN con HTTP se puede dejar este valor vacío.
constexpr char CA_PEM[] = "";
constexpr char SERVIDOR_HORA[] = "pool.ntp.org";
}
