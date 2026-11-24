#pragma once
#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <iomanip>
#include <initializer_list>
#include <sstream>
#include <string>
constexpr int HIGH=1, LOW=0, OUTPUT=1, INPUT=0, MSBFIRST=1;
inline uint32_t reloj=0;
inline int entradaAnalogica=500;
inline int pines[64]={};
inline unsigned long ecos[64]={};
inline uint32_t ultimoTimeout=0;
inline uint8_t registro595=0;
inline uint32_t millis(){return reloj;}
inline void digitalWrite(int p,int v){if(p>=0&&p<64)pines[p]=v;}
inline void pinMode(int,int){}
inline void delayMicroseconds(unsigned long){}
inline void delay(unsigned long){}
inline unsigned long pulseIn(int p,int,unsigned long timeout){ultimoTimeout=timeout;return ecos[p];}
inline int analogRead(int){return entradaAnalogica;}
inline void analogReadResolution(int){}
inline void shiftOut(int,int,int,uint8_t valor){registro595=valor;}
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
