// Compilación para ordenador con los stubs del proyecto. No incluye red ni credenciales.
#include <cassert>
#include <iostream>
#include PIS_SKETCH

void emitir(uint32_t tiempo, uint32_t secuencia) {
  actualizarDeposito(tiempo);
  controlarAlcantarilla1(tiempo);
  controlarRiego(tiempo);
  auto muestra = capturarSistema(tiempo, uint64_t(tiempo) + 4294967296ULL, secuencia);
  char json[2600];
  assert(Telemetria::codificar(muestra, "ensayo", "boot-1", -54, 25, json, sizeof(json)));
  std::cout << json << '\n';
  assert(!Telemetria::codificar(muestra, "ensayo", "boot-1", -54, 25, json, 32));
  assert(!Telemetria::codificar(muestra, "id/con/caracter/invalido", "boot-1", -54, 25, json, sizeof(json)));
}

int main() {
  setup();
  emitir(0, 0);
  const float distancias[] = {45, 18, 18, 15};
  for (int i = 0; i < 4; ++i) {
    registrarDistancia(i, distancias[i], 500);
    registrarDistancia(i, distancias[i], 1000);
  }
  emitir(1050, 1);
  registrarDistancia(0, 6, 1100);
  emitir(1100, 2);
  emitir(1100 + SENSOR_FRESCO_MS, 3);
}
