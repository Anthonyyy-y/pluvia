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

// MEDIDAS DE EJEMPLO: reemplazar por las de la maqueta.
// A1: JSN-SR04T en modo TRIG/ECHO, como el firmware original.
// Su version exacta NO esta verificada. 25 cm es un limite provisional
// conservador, NO una especificacion confirmada de la unidad del usuario.
// Mantener el agua por debajo de la cara del sensor; nunca ponerlo en 4 cm.
constexpr Sensor SENSORES[4] = {
  {13, 34, 25.0f, 600.0f, 60.0f, 30.0f, true}, // A1 JSN-SR04T
  {14, 35,  2.0f, 400.0f, 20.0f,  4.0f, true}, // A2 HC-SR04
  {18, 36,  2.0f, 400.0f, 20.0f,  4.0f, true}, // A3 HC-SR04
  {19, 39,  2.0f, 400.0f, 25.0f,  5.0f, SENSOR_DEPOSITO_INSTALADO}
}; // La ultima fila prepara un HC-SR04 OPCIONAL, aun no confirmado.

constexpr uint8_t PIN_MOTOR = 27, PIN_DRENAJE = 16, PIN_RIEGO = 17;
constexpr uint8_t PIN_SERVO = 23, PIN_LDR = 32;
constexpr uint8_t LCD_RS = 21, LCD_EN = 22;
constexpr uint8_t LCD_D4 = 25, LCD_D5 = 26, LCD_D6 = 33, LCD_D7 = 4;
constexpr uint8_t SALIDAS[3] = {PIN_MOTOR, PIN_DRENAJE, PIN_RIEGO};
// true = controlador activo HIGH. Para un rele activo LOW usar false.
constexpr bool ACTIVO_HIGH[3] = {true, true, true};
constexpr int ANGULO_CERRADO = 0, ANGULO_ABIERTO = 90;

// Los indicadores antiguos se conservan como opcion, sin reasignarlos sobre
// las salidas nuevas. -1 significa no instalado. Ver guia sobre GPIO libres.
constexpr int LED_VERDE = -1, LED_AMARILLO = -1, LED_ROJO = -1;
constexpr int PIN_BUZZER = -1; // MH-FMD activo LOW, si se habilita.
// Conserva los 3 LED y el buzzer mediante UN 74HC595 a 3,3 V.
// Los GPIO de arranque solo van a ENTRADAS CMOS del registro, nunca a LED.
// /OE lleva pull-up 10k a 3V3: salidas deshabilitadas durante el arranque.
constexpr bool USAR_74HC595 = true;
constexpr int SR_DATOS = 2, SR_RELOJ = 5, SR_LATCH = 15, SR_OE = 0;
// Q0=verde, Q1=amarillo, Q2=rojo, Q3=buzzer (HIGH = silencio).

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
                        LED_VERDE,LED_AMARILLO,LED_ROJO,PIN_BUZZER,
                        USAR_74HC595 ? SR_DATOS : -1, USAR_74HC595 ? SR_RELOJ : -1,
                        USAR_74HC595 ? SR_LATCH : -1, USAR_74HC595 ? SR_OE : -1};
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
  if (USAR_74HC595) {
    const int registro[] = {SR_DATOS,SR_RELOJ,SR_LATCH,SR_OE};
    for (int p : registro)
      if (!(salidaPermitida(p) || p == 0 || p == 2 || p == 5 || p == 15)) return false;
  }
  return (PIN_LDR == 32 || PIN_LDR == 33 || PIN_LDR == 34 || PIN_LDR == 35 ||
          PIN_LDR == 36 || PIN_LDR == 39) &&
         (LED_VERDE < 0 || salidaPermitida(LED_VERDE)) &&
         (LED_AMARILLO < 0 || salidaPermitida(LED_AMARILLO)) &&
         (LED_ROJO < 0 || salidaPermitida(LED_ROJO)) &&
         (PIN_BUZZER < 0 || salidaPermitida(PIN_BUZZER));
}
static_assert(pinesValidos(), "GPIO repetidos o indicadores en GPIO no permitidos");
static_assert(NIVEL_RECUPERADO < NIVEL_ALTO, "Revisar histeresis del nivel");
static_assert(DEPOSITO_MINIMO < DEPOSITO_REINICIO, "Revisar deposito minimo");
}
