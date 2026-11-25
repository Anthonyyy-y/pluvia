#pragma once
#include <array>
#include <cassert>
#include <string>
class LiquidCrystal {
 public:
  std::array<std::string,2> lineas={std::string(16,' '),std::string(16,' ')};
  int x=0,y=0;
  LiquidCrystal(int,int,int,int,int,int){}
  void begin(int,int){}
  void setCursor(int columna,int fila){x=columna;y=fila;}
  void print(char c){assert(x>=0&&x<16&&y>=0&&y<2);lineas[y][x++]=c;}
};
