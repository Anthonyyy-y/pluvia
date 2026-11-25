// Serializa una captura de ensayo con el mismo código que usa el ESP32.
#include "../PluviaDos/Mediciones.h"
#include <cassert>
#include <iostream>
int main() {
  Datos::Par p{};
  const uint64_t tiempos[] = {3100, 3200};
  const float cm[] = {8.5, NAN};
  assert(Datos::codificar(p, "placa-prueba", "arranque-prueba", 1, 3250,
                          tiempos, cm, false, 4.5f, true, false, true, false));
  std::cout << p.paquete << '\n';
  assert(!Datos::codificar(p, "ID invalido", "arranque", 1, 3250,
                           tiempos, cm, false, NAN, false, false, false, false));
}
