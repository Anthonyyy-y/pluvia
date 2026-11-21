#pragma once
class Servo {
 public:
  int angulo=0;
  void setPeriodHertz(int){}
  int attach(int,int,int){return 1;}
  void write(int a){angulo=a;}
  int read(){return angulo;}
};
