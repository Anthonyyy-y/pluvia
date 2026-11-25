#pragma once
#include "Mediciones.h"
#if __has_include("Secretos.h")
#include "Secretos.h"
#else
#include "RedEjemplo.h"
#endif
namespace Conexion {
void iniciar();
void publicar(const Datos::Par &datos);
}
