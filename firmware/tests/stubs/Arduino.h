#pragma once
#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <iomanip>
#include <initializer_list>
#include <sstream>
#include <string>
constexpr int HIGH=1, LOW=0, OUTPUT=1, INPUT=0;
inline uint32_t reloj=0;
inline int entradaAnalogica=500;
inline int pines[64]={};
struct EstadoGPIO {
  bool registrado = false;
  int primerNivelSalida = -1;
};
inline EstadoGPIO estadoGPIO[64];
inline unsigned long ecos[64]={};
inline uint32_t ultimoTimeout=0;
inline bool escritos[64]={};
inline uint32_t millis(){return reloj;}
inline void digitalWrite(int pin, int nivel) {
  if (pin >= 0 && pin < 64 && estadoGPIO[pin].registrado) {pines[pin] = nivel; escritos[pin]=true;}
}
inline void pinMode(int pin, int modo) {
  if (pin < 0 || pin >= 64) return;
  EstadoGPIO &estado = estadoGPIO[pin];
  estado.registrado = true;
  if (modo == OUTPUT && estado.primerNivelSalida < 0) estado.primerNivelSalida = pines[pin];
}
inline void delayMicroseconds(unsigned long){}
inline void delay(unsigned long){}
inline unsigned long pulseIn(int p,int,unsigned long timeout){ultimoTimeout=timeout;return ecos[p];}
inline int analogRead(int){return entradaAnalogica;}
inline void analogReadResolution(int){}
template<class T>T constrain(T v,T a,T b){return std::min(b,std::max(a,v));}
struct SerialMock {
  std::ostringstream buffer;
  void begin(int){}
  template<class T>void print(T v){buffer<<v;}
  void print(float v,int n){buffer<<std::fixed<<std::setprecision(n)<<v;}
  void println(){buffer<<'\n';}
  template<class T>void println(T v){print(v);println();}
  void clear(){buffer.str("");buffer.clear();}
};
inline SerialMock Serial;
