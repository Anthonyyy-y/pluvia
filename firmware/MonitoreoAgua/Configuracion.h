#pragma once
#include <stdint.h>

// Placa objetivo: ESP32 clasico con WROOM (no C3/S3 ni WROVER).
namespace Config {
constexpr bool MODO_DEMO = true;
constexpr bool SIMULACION_WOKWI = false; // Cambiar SOLO en el proyecto simulado.
constexpr bool TELEMETRIA_EXTENDIDA = false; // false conserva salida solo PIS1.

// Solo se han confirmado los tres sensores de las alcantarillas.
// Habilitar cuando se instale y calibre el sensor del deposito. Sin el,
// ni riego ni evacuacion hacia ese deposito pueden activarse.
constexpr bool SENSOR_DEPOSITO_INSTALADO = false;

struct Sensor {
  uint8_t trig;
  uint8_t echo;
  float minimoCm;
  float maximoCm;
  float vacioCm; // Distancia desde la cara del sensor al fondo.
  float llenoCm; // Distancia desde la cara del sensor al nivel maximo util.
  bool instalado;
};

// Profundidad del desague confirmada por el usuario: 10 cm = 100%.
constexpr float PROFUNDIDAD_DESAGUE_CM = 10.0f;
// Distancia desde la CARA DEL SENSOR al fondo vacio, confirmada: 10 cm.
// Al elevar un sensor hay que actualizar SOLO su distancia en esta lista.
// No cambiar la profundidad del desague cuando se eleva el soporte.
constexpr float DISTANCIA_FONDO_CM[3] = {10.0f, 10.0f, 10.0f};
// A1: esta altura de montaje es incompatible con el limite provisional JSN
// de 25 cm. Se informa ERROR y se inhiben sus cargas hasta elevarlo y medirlo.
// Para cubrir 10 cm de agua con margen, un montaje ilustrativo es 40/30 cm.
// A2/A3: con fondo a10cm, por encima de8cm de agua quedan fuera del rango HC.
// Para cubrir hasta el borde, elevarlos y volver a medir (ejemplo14/4cm).
constexpr Sensor SENSORES[4] = {
  {13, 34, 25.0f, 600.0f, DISTANCIA_FONDO_CM[0], DISTANCIA_FONDO_CM[0]-PROFUNDIDAD_DESAGUE_CM, true},
  {14, 35,  2.0f, 400.0f, DISTANCIA_FONDO_CM[1], DISTANCIA_FONDO_CM[1]-PROFUNDIDAD_DESAGUE_CM, true},
  {18, 36,  2.0f, 400.0f, DISTANCIA_FONDO_CM[2], DISTANCIA_FONDO_CM[2]-PROFUNDIDAD_DESAGUE_CM, true},
  {19, 39,  2.0f, 400.0f, 25.0f, 5.0f, SENSOR_DEPOSITO_INSTALADO}
}; // El deposito tiene geometria independiente; su sensor sigue pendiente.

constexpr uint8_t PIN_MOTOR = 27, PIN_DRENAJE = 16, PIN_RIEGO = 17;
constexpr uint8_t PIN_SERVO = 23, PIN_LDR = 32;
constexpr uint8_t LCD_RS = 21, LCD_EN = 22;
constexpr uint8_t LCD_D4 = 25, LCD_D5 = 26, LCD_D6 = 33, LCD_D7 = 4;
constexpr uint8_t SALIDAS[3] = {PIN_MOTOR, PIN_DRENAJE, PIN_RIEGO};
// true = controlador activo HIGH. Para un rele activo LOW usar false.
constexpr bool ACTIVO_HIGH[3] = {true, true, true};
constexpr int ANGULO_CERRADO = 0, ANGULO_ABIERTO = 90;

// Revision 23 NOV: sin buzzer y sin 74HC595. Los 3 LED van directos.
// Verde: GPIO2 -> resistencia 1k -> anodo; catodo -> GND (activo HIGH).
// Amarillo: 3V3 -> resistencia 1k -> anodo; catodo -> GPIO5 (activo LOW).
// Rojo: 3V3 -> resistencia 1k -> anodo; catodo -> GPIO15 (activo LOW).
// Esta orientacion respeta GPIO2 bajo y GPIO5/15 altos al arrancar.
// No invertirlos ni usar 5V; GPIO0 queda sin conexion externa.
constexpr uint8_t LED_VERDE = 2, LED_AMARILLO = 5, LED_ROJO = 15;
constexpr uint8_t LEDS[3] = {LED_VERDE, LED_AMARILLO, LED_ROJO};
constexpr bool LED_ACTIVO_HIGH[3] = {true, false, false};

constexpr uint32_t INTERVALO_RIEGO_MS = MODO_DEMO ? 15000UL : 600000UL;
constexpr uint32_t DURACION_RIEGO_MS = 5000;
constexpr uint32_t CONFIRMAR_ALTO_MS = 4000, CONFIRMAR_RECUPERACION_MS = 1200;
constexpr uint32_t LIMPIEZA_MS = 4000, VERIFICACION_MS = 3000;
constexpr uint32_t ESPERA_COMPUERTA_MS = 4000, MAX_DRENAJE_MS = 8000;
constexpr uint32_t ENTRE_SENSORES_MS = 100, SENSOR_FRESCO_MS = 1800;
constexpr uint32_t SERIAL_MS = 500, LCD_MS = 250, PAGINA_LCD_MS = 2500;
constexpr uint8_t LECTURAS_PARA_RECUPERAR = 2;

constexpr float NIVEL_PRECAUCION = 50, NIVEL_ALTO = 75, NIVEL_RECUPERADO = 55;
constexpr float DEPOSITO_MINIMO = 15, DEPOSITO_REINICIO = 25;
constexpr float DEPOSITO_MAXIMO = 90, DEPOSITO_LIBERADO = 80;
// 3V3 -> resistencia 10k -> GPIO32 -> LDR -> GND (mas luz = menor ADC).
constexpr bool LDR_MENOR_ES_MAS_LUZ = true;
constexpr int LDR_ENCIENDE_DIA = 1400, LDR_APAGA_DIA = 2000;

// Comprobacion en compilacion: solo GPIO disponibles para este diseno.
constexpr bool salidaPermitida(int p) {
  return p == 4 || (p >= 13 && p <= 14) || (p >= 16 && p <= 19) ||
         (p >= 21 && p <= 23) || (p >= 25 && p <= 27) || p == 32 || p == 33;
}
constexpr int PINES[] = {SENSORES[0].trig,SENSORES[0].echo,SENSORES[1].trig,SENSORES[1].echo,
                        SENSORES[2].trig,SENSORES[2].echo,SENSORES[3].trig,SENSORES[3].echo,
                        PIN_MOTOR,PIN_DRENAJE,PIN_RIEGO,PIN_SERVO,PIN_LDR,
                        LCD_RS,LCD_EN,LCD_D4,LCD_D5,LCD_D6,LCD_D7,
                        LED_VERDE,LED_AMARILLO,LED_ROJO};
constexpr bool pinesValidos() {
  for (unsigned i=0; i<sizeof(PINES)/sizeof(PINES[0]); ++i) {
    if (PINES[i] < 0) continue;
    for (unsigned j=i+1; j<sizeof(PINES)/sizeof(PINES[0]); ++j)
      if (PINES[i] == PINES[j]) return false;
  }
  for (const Sensor &s : SENSORES)
    if (!salidaPermitida(s.trig) || !(salidaPermitida(s.echo) ||
        s.echo == 34 || s.echo == 35 || s.echo == 36 || s.echo == 39)) return false;
  const int salidas[] = {PIN_MOTOR,PIN_DRENAJE,PIN_RIEGO,PIN_SERVO,
                        LCD_RS,LCD_EN,LCD_D4,LCD_D5,LCD_D6,LCD_D7};
  for (int p : salidas) if (!salidaPermitida(p)) return false;
  for (unsigned i=0; i<3; ++i) {
    int p=LEDS[i];
    bool permitido=salidaPermitida(p) || (p==2 && LED_ACTIVO_HIGH[i]) ||
                   ((p==5 || p==15) && !LED_ACTIVO_HIGH[i]);
    if (!permitido) return false;
  }
  return PIN_LDR == 32 || PIN_LDR == 33 || PIN_LDR == 34 || PIN_LDR == 35 ||
         PIN_LDR == 36 || PIN_LDR == 39;
}
static_assert(pinesValidos(), "GPIO repetidos o indicadores en GPIO no permitidos");
static_assert(NIVEL_RECUPERADO < NIVEL_ALTO, "Revisar histeresis del nivel");
static_assert(DEPOSITO_MINIMO < DEPOSITO_REINICIO, "Revisar deposito minimo");
}
