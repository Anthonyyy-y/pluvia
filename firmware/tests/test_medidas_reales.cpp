#include <cassert>
#include <cmath>
#include <iostream>
#include PIS_SKETCH

void mostrar(uint32_t t) {
  auto m=capturarSistema(t,t,t/100);
  char json[2600];
  assert(Telemetria::codificar(m,"ensayo","montaje-real",-55,0,json,sizeof(json)));
  std::cout<<json<<'\n';
}
int main() {
  setup();
  assert(PROFUNDIDAD_DESAGUE_CM==10);
  assert(!geometriaValida(0)); // No inventar que el JSN lee a10cm.
  assert(geometriaValida(1)&&geometriaValida(2));
  registrarDistancia(0,5,100);registrarDistancia(0,5,500);
  assert(!sensorOK(0,500));
  registrarDistancia(1,5,100);registrarDistancia(1,5,500);
  registrarDistancia(2,5,100);registrarDistancia(2,5,500);
  assert(sensorOK(1,500)&&sensores[1].alturaCm==5&&sensores[1].nivel==50);
  actualizarDeposito(500);controlarAlcantarilla1(500);controlarRiego(500);
  assert(!salida[0]&&!salida[1]&&!salida[2]);
  mostrar(500);
  registrarDistancia(1,2,600);registrarDistancia(1,2,1000);
  assert(sensorOK(1,1000)&&sensores[1].alturaCm==8&&sensores[1].nivel==80);
  mostrar(1000);
  registrarDistancia(1,1,1100);
  assert(!sensorOK(1,1100)&&std::isnan(sensores[1].nivel));
  mostrar(1100);
}
