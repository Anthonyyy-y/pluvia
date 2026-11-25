#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include PIS_SKETCH

void reiniciar() {
  for (auto &s:sensores)s=Lectura{};
  for (int i=0;i<3;i++) {
    nivelAlto[i]=contandoAlto[i]=salida[i]=false;inicioAlto[i]=0;
  }
  hayLuz=depositoDisponible=depositoLleno=regando=relojRiegoArmado=false;
  inicioRiego=referenciaRiego=inicioEtapa=inicioRecuperacion=0;
  cicloEjecutado=contandoRecuperacion=false;
  etapa=Etapa::REPOSO;compuerta.write(0);Serial.clear();
}
void alimentar(uint32_t t,float a1=10,float a2=10,float a3=10,float deposito=50) {
  reloj=t;float porcentajes[]={a1,a2,a3,deposito};
  for(uint8_t i=0;i<4;i++) {
    const Sensor &cfg=SENSORES[i];
    float d=cfg.vacioCm-(cfg.vacioCm-cfg.llenoCm)*porcentajes[i]/100.0f;
    registrarDistancia(i,d,t);registrarDistancia(i,d,t);
  }
}
void paso(uint32_t t,float a1=10,float a2=10,float a3=10,float dep=50) {
  alimentar(t,a1,a2,a3,dep);
  actualizarAlarmas(t);actualizarDeposito(t);controlarAlcantarilla1(t);controlarRiego(t);
}
void comprobarLecturas() {
  reiniciar();registrarDistancia(0,45,100);
  assert(!sensorOK(0,100));registrarDistancia(0,45,500);
  assert(sensorOK(0,500)&&std::fabs(sensores[0].nivel-50)<0.01f);
  assert(std::fabs(sensores[0].alturaCm-15)<0.01f);
  registrarDistancia(0,6,900);assert(!sensorOK(0,900));
  assert(std::string(sensores[0].detalle)=="OBJETO_DEMASIADO_CERCA");
  registrarDistancia(1,6,900);registrarDistancia(1,6,1300);
  assert(sensorOK(1,1300)&&std::fabs(sensores[1].nivel-87.5f)<0.01f);
  registrarDistancia(1,NAN,1700);assert(!sensorOK(1,1700));
  registrarDistancia(1,6,2100);assert(!sensorOK(1,2100));
  registrarDistancia(1,6,2500);assert(sensorOK(1,2500));
  assert(!sensorOK(1,2500+SENSOR_FRESCO_MS));
  registrarDistancia(2,22,3000);assert(!sensorOK(2,3000));
  assert(std::string(sensores[2].detalle)=="DISTANCIA_MAYOR_QUE_ALTURA");
  std::cout<<"PASS: rangos distintos JSN/HC, recuperacion y datos caducados\n";
}
void comprobarSecuencia() {
  reiniciar();paso(100,90);paso(4099,90);assert(etapa==Etapa::REPOSO);
  paso(4100,90);assert(etapa==Etapa::LIMPIANDO&&salida[0]);
  paso(8100,90);assert(etapa==Etapa::VERIFICANDO&&!salida[0]);
  paso(11100,90);assert(etapa==Etapa::COMPUERTA&&compuerta.read()==90);
  paso(15100,90);
  assert(etapa==(SENSORES[3].instalado?Etapa::DRENANDO:Etapa::REVISAR));
  assert(salida[1]==SENSORES[3].instalado);
  paso(23100,90);assert(etapa==Etapa::REVISAR&&!salida[1]);
  paso(60000,90);assert(!salida[0]&&cicloEjecutado);
  paso(60100,10);assert(etapa==Etapa::REPOSO&&cicloEjecutado);
  paso(61300,10);assert(!cicloEjecutado&&compuerta.read()==0);
  paso(61400,90);paso(65400,90);assert(salida[0]);
  registrarDistancia(0,NAN,65401);actualizarAlarmas(65401);controlarAlcantarilla1(65401);
  assert(etapa==Etapa::ERROR_SENSOR&&!salida[0]&&!salida[1]);
  paso(66000,90);paso(70000,90);assert(!salida[0]&&etapa==Etapa::REVISAR);
  std::cout<<"PASS: secuencia A1, parada, rearme estable y sin reintentos por fallo\n";
}
void comprobarOtrosPuntos() {
  reiniciar();paso(100,10,90,90);paso(4100,10,90,90);
  assert(nivelAlto[1]&&nivelAlto[2]&&!salida[0]&&!salida[1]);
  actualizarIndicadores(4500);assert(registro595&4); // Alerta tambien de A2/A3.
  reiniciar();paso(100,90);paso(2000,60);paso(4100,90);assert(!nivelAlto[0]);
  std::cout<<"PASS: A2/A3 avisan sin activar A1 y los picos no disparan el ciclo\n";
}
void comprobarRiego() {
  reiniciar();hayLuz=true;paso(100);
  paso(100+INTERVALO_RIEGO_MS-1);assert(!regando);
  paso(100+INTERVALO_RIEGO_MS);
  if(!SENSORES[3].instalado) {
    assert(!regando&&!salida[2]&&!depositoDisponible&&depositoLleno);
    actualizarLCD(8000);assert(lcd.lineas[0].find("SIN SENSOR")!=std::string::npos);
    std::cout<<"PASS: sin sensor del deposito nunca se activan las bombas\n";
    return;
  }
  assert(regando&&salida[2]);
  uint32_t fin=100+INTERVALO_RIEGO_MS+DURACION_RIEGO_MS;
  paso(fin);assert(!regando);paso(fin+INTERVALO_RIEGO_MS);assert(regando);
  paso(fin+INTERVALO_RIEGO_MS+100,10,10,10,5);assert(!regando&&!salida[2]);
  actualizarDeposito(fin+INTERVALO_RIEGO_MS+100);assert(!depositoDisponible);
  paso(fin+INTERVALO_RIEGO_MS+200,10,10,10,20);assert(!depositoDisponible);
  paso(fin+INTERVALO_RIEGO_MS+300,10,10,10,30);assert(depositoDisponible&&!regando);
  uint32_t t=fin+2*INTERVALO_RIEGO_MS+100;paso(t);assert(regando);
  hayLuz=false;paso(t+100);assert(!regando&&!relojRiegoArmado);
  hayLuz=true;paso(t+200);paso(t+200+INTERVALO_RIEGO_MS-1);assert(!regando);
  paso(t+200+INTERVALO_RIEGO_MS);assert(regando);
  registrarDistancia(3,NAN,t+201+INTERVALO_RIEGO_MS);
  actualizarDeposito(t+201+INTERVALO_RIEGO_MS);controlarRiego(t+201+INTERVALO_RIEGO_MS);
  assert(!regando&&!salida[2]);
  std::cout<<"PASS: riego temporizado, noche, vacio, histeresis y error del deposito\n";
}
void comprobarDepositoLleno() {
  if(!SENSORES[3].instalado)return;
  reiniciar();paso(100,90,10,10,95);paso(4100,90,10,10,95);
  paso(8100,90,10,10,95);paso(11100,90,10,10,95);paso(15100,90,10,10,95);
  assert(etapa==Etapa::REVISAR&&!salida[1]);
  reiniciar();etapa=Etapa::DRENANDO;inicioEtapa=100;cicloEjecutado=true;
  paso(1000,90);assert(salida[1]);paso(1100,90,10,10,95);assert(!salida[1]);
  std::cout<<"PASS: deposito lleno inhibe y detiene evacuacion\n";
}
std::vector<std::string> dividir(const std::string &s,char separador) {
  std::vector<std::string> campos;std::istringstream in(s);std::string c;
  while(std::getline(in,c,separador))campos.push_back(c);return campos;
}
void comprobarSerialYLCD() {
  reiniciar();alimentar(1000,50);actualizarSerial(1000);
  auto lineas=dividir(Serial.buffer.str(),'\n');
  assert(lineas.size()==(TELEMETRIA_EXTENDIDA?6U:1U));
  auto c=dividir(lineas[0],',');assert(c.size()==7&&c[0]=="PIS1");
  assert(c[2]==(SIMULACION_WOKWI?"SIMULACION":"REAL"));
  assert(c[3]=="45.00"&&c[4]=="15.00"&&c[5]=="PRECAUCION"&&c[6]=="OK");
  if(TELEMETRIA_EXTENDIDA) {
    for(unsigned i=1;i<=4;i++){auto campos=dividir(lineas[i],',');assert(campos.size()==8&&campos[0]=="PIS2");}
    assert(dividir(lineas[5],',').size()==9);
  }
  Serial.clear();registrarDistancia(0,6,2000);actualizarSerial(2000);
  c=dividir(dividir(Serial.buffer.str(),'\n')[0],',');
  assert(c.size()==7&&c[3]=="6.00"&&c[4]=="NA"&&c[5]=="ERROR"&&c[6]=="OBJETO_DEMASIADO_CERCA");
  imprimirLinea(0,"A");assert(lcd.lineas[0]=="A               ");
  imprimirLinea(0,"Una linea que supera los dieciseis caracteres");
  assert(lcd.lineas[0].size()==16);
  assert(transcurrio(100U,UINT32_MAX-99U,200U));
  activar(0,true);assert(pines[PIN_MOTOR]==(ACTIVO_HIGH[0]?HIGH:LOW));
  activar(0,false);assert(pines[PIN_MOTOR]==(ACTIVO_HIGH[0]?LOW:HIGH));
  std::cout<<"PASS: PIS1 compatible, PIS2 opcional, LCD y polaridad de controladores\n";
}
void comprobarLuz() {
  reiniciar();entradaAnalogica=500;
  for(uint32_t t=200;t<=1000;t+=200)actualizarLuz(t);assert(hayLuz);
  entradaAnalogica=1700;actualizarLuz(1200);assert(hayLuz);
  entradaAnalogica=3000;
  for(uint32_t t=1400;t<=2200;t+=200)actualizarLuz(t);assert(!hayLuz);
  std::cout<<"PASS: LDR estable y zona de histeresis\n";
}
void comprobarAdquisicion() {
  reiniciar();
  for (uint8_t i=0;i<4;i++) {
    float distancia=i==0?55.0f:i==3?15.0f:18.0f;
    ecos[SENSORES[i].echo]=static_cast<unsigned long>(distancia/0.01715f);
  }
  for(uint32_t t=100;t<=800;t+=100){reloj=t;actualizarSensores(t);}
  assert(sensorOK(0,800)&&sensorOK(1,800)&&sensorOK(2,800));
  assert(std::fabs(sensores[0].distancia-55.0f)<0.03f);
  assert(std::fabs(sensores[1].nivel-12.5f)<0.2f);
  assert(sensorOK(3,800)==SENSORES[3].instalado);
  assert(ultimoTimeout<10000UL);
  for(uint8_t i=0;i<4;i++)ecos[SENSORES[i].echo]=0;
  for(uint32_t t=900;t<=1200;t+=100){reloj=t;actualizarSensores(t);}
  assert(!sensorOK(0,1200)&&!sensorOK(1,1200)&&!sensorOK(2,1200));
  std::cout<<"PASS: adquisicion secuencial, pines ECHO y ausencia de eco\n";
}
int main(){
  setup();assert(!salida[0]&&!salida[1]&&!salida[2]);
  assert((registro595&8)!=0&&pines[SR_OE]==LOW);
  comprobarLecturas();comprobarSecuencia();comprobarOtrosPuntos();
  comprobarRiego();comprobarDepositoLleno();comprobarSerialYLCD();comprobarLuz();
  comprobarAdquisicion();
}
