// Maqueta de dos desagües. Seleccionar ESP32 Dev Module (WROOM clásico).
#include <Arduino.h>
#include <LiquidCrystal.h>
#include <ESP32Servo.h>
#include "Control.h"
#include "Conexion.h"
#include <esp_timer.h>
#include <esp_random.h>
#if !defined(CONFIG_IDF_TARGET_ESP32)
#error Este montaje requiere un ESP32 clasico.
#endif
LiquidCrystal lcd(Cfg::rs, Cfg::enable, Cfg::d4, Cfg::d5, Cfg::d6, Cfg::d7);
Servo puerta;
Control control;
float porcentaje[2] = {NAN, NAN};
uint8_t lecturasBuenas[2] = {};
uint32_t medidaMs[2] = {};
uint64_t tsSensor[2] = {};
char arranque[33];
int luzAdc = 0;
bool dia = false;

void medir(unsigned i) {
  const auto &s = Cfg::sensores[i];
  float nivel = NAN;
  if (s.fondoCm - Cfg::profundidadCm >= s.minimoCm) {
    digitalWrite(s.trig, HIGH);
    delayMicroseconds(20);
    digitalWrite(s.trig, LOW);
    const unsigned long eco = pulseIn(s.echo, HIGH, (s.fondoCm + 5) * 60 + 1000);
    const float distancia = eco * 0.01715f;
    if (eco && distancia >= s.minimoCm && distancia <= s.fondoCm + 1) {
      nivel = constrain(100.f * (s.fondoCm - distancia) / Cfg::profundidadCm, 0.f, 100.f);
    }
  }
  if (!isfinite(nivel)) lecturasBuenas[i] = 0;
  else if (lecturasBuenas[i] < 2) ++lecturasBuenas[i];
  porcentaje[i] = lecturasBuenas[i] == 2 ? nivel : NAN;
  medidaMs[i] = millis();
  tsSensor[i] = uint64_t(esp_timer_get_time()) / 1000;
}

void linea(int fila, const char *mensaje) {
  char buf[17];
  snprintf(buf, sizeof(buf), "%-16.16s", mensaje);
  lcd.setCursor(0, fila); lcd.print(buf);
}

void confirmar(uint32_t ahora) {
  if (control.confirmado) return;
  // Una V mayúscula en el monitor serie, o mantener BOOT un segundo.
  static bool habilitado = false, pulsando = false;
  static uint32_t inicio = 0;
  if (digitalRead(Cfg::botonBoot) == HIGH) { habilitado = true; pulsando = false; }
  else if (habilitado) {
    if (!pulsando) { pulsando = true; inicio = ahora; }
    if (ahora - inicio >= 1000) control.confirmarVacio(ahora);
  }
  if (Serial.available() && Serial.read() == 'V') control.confirmarVacio(ahora);
}

void setup() {
  Serial.begin(115200);
  pinMode(Cfg::motor, OUTPUT); digitalWrite(Cfg::motor, LOW);
  pinMode(Cfg::bomba, OUTPUT); digitalWrite(Cfg::bomba, LOW);
  for (const auto &s : Cfg::sensores) {
    pinMode(s.trig, OUTPUT); digitalWrite(s.trig, LOW); pinMode(s.echo, INPUT);
  }
  for (auto pin : {Cfg::verde, Cfg::amarillo, Cfg::rojo}) pinMode(pin, OUTPUT);
  pinMode(Cfg::botonBoot, INPUT_PULLUP);
  analogReadResolution(12);
  lcd.begin(16, 2);
  linea(0, "Deposito vacio?"); linea(1, "BOOT 1s o V USB");
  puerta.setPeriodHertz(50); puerta.attach(Cfg::servo, 500, 2400); puerta.write(Cfg::cerrado);
  Conexion::iniciar();
  // Usar una identidad de arranque diferente a la de capturas anteriores.
  uint8_t azar[16]; esp_fill_random(azar, sizeof(azar));
  for (unsigned i=0;i<sizeof(azar);++i) snprintf(arranque+2*i,3,"%02x",azar[i]);
  Serial.println("# PLUVIA DOS | Confirma deposito vacio con V o BOOT 1s tras el arranque.");
}

void loop() {
  static uint32_t ultimoEco = 0, ultimaVista = 0;
  static unsigned turno = 0;
  if (millis() - ultimoEco >= 100) {
    ultimoEco = millis(); medir(turno); turno ^= 1;
    luzAdc = analogRead(Cfg::ldr);
    if (luzAdc <= Cfg::adcDia) dia = true;
    if (luzAdc >= Cfg::adcOscuro) dia = false;
  }
  uint32_t ahora = millis();
  confirmar(ahora);
  for (unsigned i = 0; i < 2; ++i)
    if (ahora - medidaMs[i] > 800) porcentaje[i] = NAN;
  const bool abiertaAntes = control.compuerta;
  control.paso(ahora, porcentaje[0], porcentaje[1], dia);
  // Apagar cargas antes de mover el servo o arrancar el otro canal.
  if (!control.bomba) digitalWrite(Cfg::bomba, LOW);
  if (!control.motor) digitalWrite(Cfg::motor, LOW);
  if (abiertaAntes != control.compuerta) puerta.write(control.compuerta ? Cfg::abierto : Cfg::cerrado);
  if (control.motor) digitalWrite(Cfg::motor, HIGH);
  if (control.bomba) digitalWrite(Cfg::bomba, HIGH);
  bool fallo = !isfinite(porcentaje[0]) || !isfinite(porcentaje[1]);
  float maximo = fmaxf(porcentaje[0], porcentaje[1]);
  digitalWrite(Cfg::rojo, (fallo || maximo >= 80) ? LOW : HIGH);
  digitalWrite(Cfg::amarillo, (!fallo && maximo >= 50 && maximo < 80) ? LOW : HIGH);
  digitalWrite(Cfg::verde, (!fallo && maximo < 50) ? HIGH : LOW);
  if (ahora - ultimaVista >= 400) {
    ultimaVista = ahora;
    char nivel[2][6], fila[30];
    for (unsigned i = 0; i < 2; ++i) {
      if (isfinite(porcentaje[i])) snprintf(nivel[i], sizeof(nivel[i]), "%.0f%%", porcentaje[i]);
      else strcpy(nivel[i], "ERR");
    }
    snprintf(fila, sizeof(fila), "D1:%s D2:%s", nivel[0], nivel[1]); linea(0, fila);
    if (!control.confirmado) linea(1, "Vacio? BOOT 1s");
    else {
      snprintf(fila, sizeof(fila), "Est:%4.1fs %s", control.disponibleMs/1000.f,
               control.motor ? "MOTOR" : control.bomba ? "RIEGO" : control.compuerta ? "FILTRO" : "ESPERA");
      linea(1, fila);
    }
  }
  static uint32_t ultimaPublicacion = 0, secuencia = 0;
  if (ahora - ultimaPublicacion >= Cfg::periodoDatosMs) {
    ultimaPublicacion = ahora;
    Datos::Par par;
    float cm[2] = {porcentaje[0] * Cfg::profundidadCm / 100, porcentaje[1] * Cfg::profundidadCm / 100};
    // Sin confirmación manual no hay una estimación válida de reserva.
    const float reserva = control.confirmado ? control.disponibleMs / 1000.f : NAN;
    const char *id = Datos::idValido(Red::dispositivo) ? Red::dispositivo : "pluvia-local";
    if (Datos::codificar(par, id, arranque, ++secuencia, uint64_t(esp_timer_get_time())/1000,
                         tsSensor, cm, control.bomba, reserva, control.motor, control.compuerta, dia, Cfg::simulacion)) {
      Serial.printf("%s\n%s\n", par.linea[0], par.linea[1]);
      Conexion::publicar(par);
    }
  }
  delay(1);
}
