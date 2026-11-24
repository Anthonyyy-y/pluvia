/*
  Maqueta: tres alcantarillas, mecanismos solo en A1 y riego compartido.
  ESP32 CLASICO WROOM: JSN-SR04T en A1, HC-SR04 en A2/A3.
  LCD 16x2 PARALELA (sin I2C) y LDR comun + 10k. Deposito opcional.
  Wokwi: los LED representan el motor y las dos bombas; no simula agua.
  Nivel alto persistente = POSIBLE atasco, no confirmacion de obstruccion.
*/
#include <Arduino.h>
#include <LiquidCrystal.h>
#include <ESP32Servo.h>
#include <math.h>
#if defined(ARDUINO_ARCH_ESP32) && !defined(CONFIG_IDF_TARGET_ESP32)
#error "Selecciona ESP32 clasico WROOM; este pinout no sirve para ESP32-C3/S3."
#endif

#include "Configuracion.h"
using namespace Config;

// RW de la LCD conectado a GND: se usa exclusivamente en escritura.
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);
Servo compuerta;
int anguloOrdenado = ANGULO_CERRADO; // Orden enviada, sin sensor de posición.

struct Lectura {
  float distancia = NAN;
  float alturaCm = NAN;
  float nivel = NAN;
  const char *detalle = "SIN_ECO";
  uint8_t buenas = 0;
  bool valida = false;
  bool muestreada = false; // Distingue la primera adquisición del reinicio de millis().
  uint32_t instante = 0;
};
Lectura sensores[4];
bool nivelAlto[3] = {false, false, false};
bool contandoAlto[3] = {false, false, false};
uint32_t inicioAlto[3] = {0, 0, 0};
bool salida[3] = {false, false, false};
bool hayLuz = false, depositoDisponible = false, depositoLleno = false;
bool regando = false, relojRiegoArmado = false;
uint32_t inicioRiego = 0, referenciaRiego = 0;
int lecturaLdr = 0;

enum class Etapa { REPOSO, LIMPIANDO, VERIFICANDO, COMPUERTA, DRENANDO, REVISAR, ERROR_SENSOR };
Etapa etapa = Etapa::REPOSO;
uint32_t inicioEtapa = 0;
bool cicloEjecutado = false;
bool contandoRecuperacion = false;
uint32_t inicioRecuperacion = 0;

bool transcurrio(uint32_t ahora, uint32_t desde, uint32_t plazo) {
  return uint32_t(ahora - desde) >= plazo;
}

bool sensorOK(uint8_t i, uint32_t ahora) {
  return SENSORES[i].instalado && sensores[i].valida &&
         !transcurrio(ahora, sensores[i].instante, SENSOR_FRESCO_MS);
}

void avisar(const char *mensaje) {
  (void)mensaje; // Los estados se muestran en LCD y, opcionalmente, PIS2S.
  // No mezclar texto libre con PIS1: la aplicacion Java valida siete campos.
}

void activar(uint8_t canal, bool encendido) {
  salida[canal] = encendido;
  digitalWrite(SALIDAS[canal], encendido == ACTIVO_HIGH[canal] ? HIGH : LOW);
}

// Una lectura por turno; el tiempo de espera se calcula para cada sensor.
// No hay delay de segundos/minutos. El eco tiene un limite breve y explicito.
bool geometriaValida(uint8_t i) {
  const Sensor &s = SENSORES[i];
  return isfinite(s.minimoCm) && isfinite(s.maximoCm) && isfinite(s.vacioCm) &&
         isfinite(s.llenoCm) && s.minimoCm > 0 && s.maximoCm > s.minimoCm &&
         s.vacioCm <= s.maximoCm && s.llenoCm >= s.minimoCm && s.vacioCm > s.llenoCm;
}

void registrarDistancia(uint8_t i, float distancia, uint32_t ahora) {
  Lectura &r = sensores[i];
  const Sensor &s = SENSORES[i];
  r.instante = ahora;
  r.muestreada = true;
  r.distancia = distancia;
  r.valida = false;
  r.alturaCm = NAN;
  r.nivel = NAN;
  if (!s.instalado) r.detalle = "SIN_SENSOR";
  else if (!geometriaValida(i)) r.detalle = "REVISAR_ALTURA_Y_LIMITES";
  else if (!isfinite(distancia)) r.detalle = "SIN_ECO";
  else if (distancia < s.minimoCm) r.detalle = "OBJETO_DEMASIADO_CERCA";
  else if (distancia > s.maximoCm) r.detalle = "FUERA_RANGO_SENSOR";
  else if (distancia > s.vacioCm + 1.0f) r.detalle = "DISTANCIA_MAYOR_QUE_ALTURA";
  else {
    r.alturaCm = fmaxf(0.0f, s.vacioCm - distancia);
    r.nivel = constrain(100.0f * r.alturaCm / (s.vacioCm - s.llenoCm), 0.0f, 100.0f);
    if (r.buenas < LECTURAS_PARA_RECUPERAR) ++r.buenas;
    r.valida = r.buenas >= LECTURAS_PARA_RECUPERAR;
    r.detalle = r.valida ? "OK" : "SIN_ECO";
    return;
  }
  r.buenas = 0; // Un fallo detiene las cargas; recuperacion exige lecturas buenas.
}

void actualizarSensores(uint32_t ahora) {
  static uint32_t ultima = 0;
  static uint8_t siguiente = 0;
  if (!transcurrio(ahora, ultima, ENTRE_SENSORES_MS)) return;
  ultima = ahora;
  uint8_t i = siguiente;
  siguiente = (siguiente + 1) % 4;
  const Sensor &s = SENSORES[i];
  if (!s.instalado || !geometriaValida(i)) {
    registrarDistancia(i, NAN, ahora);
    return;
  }
  digitalWrite(s.trig, LOW);
  delayMicroseconds(3);
  digitalWrite(s.trig, HIGH);
  delayMicroseconds(20); // Conserva el pulso utilizado por el JSN original.
  digitalWrite(s.trig, LOW);
  // Basta esperar hasta la altura del montaje + margen, no siempre 6 metros.
  uint32_t timeoutUs = uint32_t((s.vacioCm + 10.0f) / 0.01715f) + 3000;
  unsigned long pulso = pulseIn(s.echo, HIGH, timeoutUs);
  registrarDistancia(i, pulso ? pulso * 0.01715f : NAN, millis());
}

void actualizarAlarmas(uint32_t ahora) {
  for (uint8_t i = 0; i < 3; i++) {
    if (!sensorOK(i, ahora)) {
      contandoAlto[i] = false;
      nivelAlto[i] = false;
      continue;
    }
    if (sensores[i].nivel <= NIVEL_RECUPERADO) {

      nivelAlto[i] = false;
      contandoAlto[i] = false;
    } else if (!nivelAlto[i]) {
      if (sensores[i].nivel < NIVEL_ALTO) {
        contandoAlto[i] = false;
      } else if (!contandoAlto[i]) {
        contandoAlto[i] = true;
        inicioAlto[i] = ahora;
      } else if (transcurrio(ahora, inicioAlto[i], CONFIRMAR_ALTO_MS)) {
        nivelAlto[i] = true;

      }
    }
  }
}

void actualizarDeposito(uint32_t ahora) {
  if (!sensorOK(3, ahora)) {
    depositoDisponible = false;
    depositoLleno = true; // Impide tanto regar como bombear al deposito sin lectura.
    return;
  }
  float nivel = sensores[3].nivel;
  if (nivel <= DEPOSITO_MINIMO) depositoDisponible = false;
  else if (nivel >= DEPOSITO_REINICIO) depositoDisponible = true;
  if (nivel >= DEPOSITO_MAXIMO) depositoLleno = true;
  else if (nivel <= DEPOSITO_LIBERADO) depositoLleno = false;
}

void cambiarEtapa(Etapa nueva, uint32_t ahora) {
  etapa = nueva;
  inicioEtapa = ahora;
}

void controlarAlcantarilla1(uint32_t ahora) {
  if (!sensorOK(0, ahora)) {
    contandoRecuperacion = false;
    cambiarEtapa(Etapa::ERROR_SENSOR, ahora);
  } else if (etapa == Etapa::ERROR_SENSOR) {
    cambiarEtapa(cicloEjecutado ? Etapa::REVISAR : Etapa::REPOSO, ahora);
  }
  if (sensorOK(0, ahora) && sensores[0].nivel <= NIVEL_RECUPERADO) {
    // Apagar las cargas de inmediato; rearmar solo tras una bajada estable.
    if (!contandoRecuperacion) {
      contandoRecuperacion = true;
      inicioRecuperacion = ahora;
    }
    cambiarEtapa(Etapa::REPOSO, ahora);
    if (transcurrio(ahora, inicioRecuperacion, CONFIRMAR_RECUPERACION_MS))
      cicloEjecutado = false;
  } else {
    contandoRecuperacion = false;
  }

  switch (etapa) {
    case Etapa::REPOSO:
      if (nivelAlto[0] && !cicloEjecutado) {
        cicloEjecutado = true;
        avisar("A1: iniciando limpieza simulada");
        cambiarEtapa(Etapa::LIMPIANDO, ahora);
      } else if (cicloEjecutado && nivelAlto[0]) {
        cambiarEtapa(Etapa::REVISAR, ahora);
      }
      break;
    case Etapa::LIMPIANDO:
      if (transcurrio(ahora, inicioEtapa, LIMPIEZA_MS))
        cambiarEtapa(Etapa::VERIFICANDO, ahora);
      break;
    case Etapa::VERIFICANDO:
      if (transcurrio(ahora, inicioEtapa, VERIFICACION_MS)) {
        avisar("A1: abriendo salida auxiliar");
        cambiarEtapa(Etapa::COMPUERTA, ahora);
      }
      break;
    case Etapa::COMPUERTA:
      if (transcurrio(ahora, inicioEtapa, ESPERA_COMPUERTA_MS)) {
        if (!sensorOK(3, ahora) || depositoLleno) {
          avisar("A1: drenaje inhibido; revisar deposito");
          cambiarEtapa(Etapa::REVISAR, ahora);
        } else {
          avisar("A1: bomba de evacuacion encendida");
          cambiarEtapa(Etapa::DRENANDO, ahora);
        }
      }
      break;
    case Etapa::DRENANDO:
      if (!sensorOK(3, ahora) || depositoLleno ||
          transcurrio(ahora, inicioEtapa, MAX_DRENAJE_MS)) {
        avisar("A1: bomba detenida; revision manual si persiste nivel alto");
        cambiarEtapa(Etapa::REVISAR, ahora);
      }
      break;
    case Etapa::REVISAR:
    case Etapa::ERROR_SENSOR:
      break; // No repite indefinidamente. Se rearma al bajar al 55%.
  }
  activar(0, etapa == Etapa::LIMPIANDO);
  activar(1, etapa == Etapa::DRENANDO);
  bool abierta = etapa == Etapa::COMPUERTA || etapa == Etapa::DRENANDO || etapa == Etapa::REVISAR;
  anguloOrdenado = abierta ? ANGULO_ABIERTO : ANGULO_CERRADO;
  compuerta.write(anguloOrdenado);
}

void actualizarLuz(uint32_t ahora) {
  static uint32_t ultima = 0;
  static uint8_t consecutivas = 0;
  if (!transcurrio(ahora, ultima, 200)) return;
  ultima = ahora;
  lecturaLdr = analogRead(PIN_LDR);
  int luzNormalizada = LDR_MENOR_ES_MAS_LUZ ? lecturaLdr : 4095 - lecturaLdr;
  bool cambiar = hayLuz ? luzNormalizada > LDR_APAGA_DIA : luzNormalizada < LDR_ENCIENDE_DIA;
  if (!cambiar) consecutivas = 0;
  else if (++consecutivas >= 5) { // 1 segundo de estabilidad.
    hayLuz = !hayLuz;
    consecutivas = 0;
    avisar(hayLuz ? "LDR: luz suficiente" : "LDR: poca luz, riego suspendido");
  }
}

void controlarRiego(uint32_t ahora) {
  if (!hayLuz) {
    regando = false;
    relojRiegoArmado = false;
  } else {
    if (!relojRiegoArmado) {
      relojRiegoArmado = true;
      referenciaRiego = ahora; // Al amanecer espera un intervalo completo.
    }
    if (regando) {
      if (!sensorOK(3, ahora) || !depositoDisponible ||
          transcurrio(ahora, inicioRiego, DURACION_RIEGO_MS)) {
        regando = false;
        referenciaRiego = ahora;
        avisar("Riego detenido");
      }
    } else if (transcurrio(ahora, referenciaRiego, INTERVALO_RIEGO_MS)) {
      referenciaRiego = ahora; // Si no hay agua omite este turno.
      if (sensorOK(3, ahora) && depositoDisponible) {
        regando = true;
        inicioRiego = ahora;
        avisar("Riego encendido");
      } else avisar("Riego omitido: deposito sin agua o sensor invalido");
    }
  }
  activar(2, regando);
}

void imprimirLinea(uint8_t fila, const char *texto) {
  lcd.setCursor(0, fila);
  for (uint8_t i = 0; i < 16; i++) {
    if (*texto) lcd.print(*texto++);
    else lcd.print(' ');
  }
}

const char *estadoMedicion(uint8_t i, uint32_t ahora) {
  if (!sensorOK(i, ahora)) return "ERROR";
  if (sensores[i].nivel >= NIVEL_ALTO) return "ALERTA";
  if (sensores[i].nivel >= NIVEL_PRECAUCION) return "PRECAUCION";
  return "NORMAL";
}

void imprimirNumero(float valor) {
  if (isfinite(valor)) Serial.print(valor, 2);
  else Serial.print("NA");
}

void imprimirCamposSensor(uint8_t i, uint32_t ahora) {
  const Lectura &r = sensores[i];
  imprimirNumero(r.distancia);
  Serial.print(',');
  imprimirNumero(sensorOK(i, ahora) ? r.alturaCm : NAN);
  Serial.print(',');
  Serial.print(estadoMedicion(i, ahora));
  Serial.print(',');
  Serial.print(sensorOK(i, ahora) ? "OK" :
               transcurrio(ahora, r.instante, SENSOR_FRESCO_MS) ? "SIN_ECO" : r.detalle);
}

void actualizarSerial(uint32_t ahora) {
  static uint32_t ultima = 0;
  if (!transcurrio(ahora, ultima, SERIAL_MS)) return;
  ultima = ahora;
  // CONTRATO ORIGINAL: exactamente siete campos y mismas unidades (cm).
  // Solo A1 se publica como PIS1, para no mezclar sensores en Java antiguo.
  Serial.print("PIS1,"); Serial.print(ahora); Serial.print(',');
  Serial.print(SIMULACION_WOKWI ? "SIMULACION," : "REAL,");
  imprimirCamposSensor(0, ahora);
  Serial.println();
  if (!TELEMETRIA_EXTENDIDA) return;
  // PIS2: version,ms,modo,punto,distancia_cm,nivel_cm,estado,detalle.
  for (uint8_t i=0; i<4; ++i) {
    Serial.print("PIS2,"); Serial.print(ahora); Serial.print(',');
    Serial.print(SIMULACION_WOKWI ? "SIMULACION," : "REAL,");
    if (i < 3) { Serial.print('A'); Serial.print(int(i+1)); }
    else Serial.print("DEPOSITO");
    Serial.print(','); imprimirCamposSensor(i, ahora); Serial.println();
  }
  Serial.print("PIS2S,"); Serial.print(ahora); Serial.print(',');
  Serial.print(int(etapa)); Serial.print(',');
  Serial.print(salida[0] ? 1 : 0); Serial.print(',');
  Serial.print(compuerta.read()); Serial.print(',');
  Serial.print(salida[1] ? 1 : 0); Serial.print(',');
  Serial.print(salida[2] ? 1 : 0); Serial.print(',');
  Serial.print(hayLuz ? 1 : 0); Serial.print(',');
  Serial.println(lecturaLdr);
}

void escribirIndicadores(uint8_t bits) {
  static int anterior = -1;
  if (!USAR_74HC595 || anterior == bits) return;
  digitalWrite(SR_LATCH, LOW);
  shiftOut(SR_DATOS, SR_RELOJ, MSBFIRST, bits);
  digitalWrite(SR_LATCH, HIGH);
  anterior = bits;
}

void actualizarIndicadores(uint32_t ahora) {
  bool fallo = false, alto = false, precaucion = false;
  for (uint8_t i=0; i<3; ++i) {
    fallo |= !sensorOK(i, ahora);
    alto |= sensorOK(i, ahora) && sensores[i].nivel >= NIVEL_ALTO;
    precaucion |= sensorOK(i, ahora) && sensores[i].nivel >= NIVEL_PRECAUCION;
  }
  bool parpadeo = (ahora / 250UL) % 2 == 0;
  bool verde = fallo ? parpadeo : !alto && !precaucion;
  bool amarillo = fallo ? parpadeo : !alto && precaucion;
  bool rojo = alto || (fallo && parpadeo);
  bool sonar = alto && (ahora/500UL)%2 == 0;
  if (USAR_74HC595) {
    uint8_t bits = (verde ? 1 : 0) | (amarillo ? 2 : 0) |
                   (rojo ? 4 : 0) | (sonar ? 0 : 8);
    escribirIndicadores(bits);
  }
  if (LED_VERDE >= 0) digitalWrite(LED_VERDE, verde);
  if (LED_AMARILLO >= 0) digitalWrite(LED_AMARILLO, amarillo);
  if (LED_ROJO >= 0) digitalWrite(LED_ROJO, rojo);
  if (PIN_BUZZER >= 0) digitalWrite(PIN_BUZZER, sonar ? LOW : HIGH);
}

const char *nombreEtapa() {
  switch (etapa) {
    case Etapa::LIMPIANDO: return "LIMPIANDO";
    case Etapa::VERIFICANDO: return "VERIFICANDO";
    case Etapa::COMPUERTA: return "SALIDA ABIERTA";
    case Etapa::DRENANDO: return "EVACUANDO";
    case Etapa::REVISAR: return "REVISAR A1";
    case Etapa::ERROR_SENSOR: return "ERROR SENSOR A1";
    default: return "";
  }
}

void actualizarLCD(uint32_t ahora) {
  static uint32_t ultima = 0;
  if (!transcurrio(ahora, ultima, LCD_MS)) return;
  ultima = ahora;
  uint8_t pagina = (ahora / PAGINA_LCD_MS) % 5;
  char linea[40];
  if (pagina < 3) {
    if (!sensorOK(pagina, ahora)) {
      snprintf(linea, sizeof(linea), "A%u: ERROR SENSOR", pagina + 1);
      imprimirLinea(0, linea);
      imprimirLinea(1, "Revisar conexion");
    } else {
      snprintf(linea, sizeof(linea), "A%u NIVEL: %3d%%", pagina + 1, int(sensores[pagina].nivel));
      imprimirLinea(0, linea);
      const char *estado = nivelAlto[pagina] ? "POSIBLE ATASCO" : "MONITOREANDO";
      if (pagina == 0 && etapa != Etapa::REPOSO) estado = nombreEtapa();
      imprimirLinea(1, estado);
    }
  } else if (pagina == 3) {
    if (!SENSORES[3].instalado) {
      imprimirLinea(0, "DEP: SIN SENSOR");
      imprimirLinea(1, "BOMBAS BLOQUEADAS");
      return;
    }
    if (sensorOK(3, ahora)) snprintf(linea, sizeof(linea), "DEPOSITO: %3d%%", int(sensores[3].nivel));
    else snprintf(linea, sizeof(linea), "DEPOSITO: ERROR");
    imprimirLinea(0, linea);
    imprimirLinea(1, regando ? "REGANDO" : !hayLuz ? "RIEGO: POCA LUZ" :
                   !depositoDisponible ? "RIEGO: SIN AGUA" : "RIEGO: ESPERANDO");
  } else {
    snprintf(linea, sizeof(linea), "LDR:%4d %s", lecturaLdr, hayLuz ? "LUZ" : "OSCURO");
    imprimirLinea(0, linea);
    imprimirLinea(1, regando ? "REGANDO" : !hayLuz ? "RIEGO: POCA LUZ" :
                   !depositoDisponible ? "RIEGO: SIN AGUA" : "RIEGO: ESPERANDO");
  }
}

#include "Captura.h"
#if defined(ARDUINO_ARCH_ESP32)
#include <esp_timer.h>
#endif

void setup() {
  Serial.begin(115200);
  if (USAR_74HC595) {
    digitalWrite(SR_OE, HIGH);
    pinMode(SR_OE, OUTPUT);
    for (int pin : {SR_DATOS, SR_RELOJ, SR_LATCH}) {
      digitalWrite(pin, LOW);
      pinMode(pin, OUTPUT);
    }
    escribirIndicadores(8); // LED apagados y buzzer en silencio ANTES de habilitar.
    digitalWrite(SR_OE, LOW);
  }
  for (uint8_t i = 0; i < 3; i++) {
    digitalWrite(SALIDAS[i], ACTIVO_HIGH[i] ? LOW : HIGH);
    pinMode(SALIDAS[i], OUTPUT);
    activar(i, false);
  }
  for (uint8_t i = 0; i < 4; i++) {
    if (!SENSORES[i].instalado) continue;
    pinMode(SENSORES[i].trig, OUTPUT);
    digitalWrite(SENSORES[i].trig, LOW);
    pinMode(SENSORES[i].echo, INPUT);
  }
  const int indicadores[] = {LED_VERDE, LED_AMARILLO, LED_ROJO, PIN_BUZZER};
  for (int pin : indicadores) {
    if (pin < 0) continue;
    digitalWrite(pin, pin == PIN_BUZZER ? HIGH : LOW);
    pinMode(pin, OUTPUT);
  }
  pinMode(PIN_LDR, INPUT);
  analogReadResolution(12);
  lcd.begin(16, 2);
  imprimirLinea(0, "DRENAJE + RIEGO");
  imprimirLinea(1, MODO_DEMO ? "DEMO: 15 segundos" : "RIEGO: 10 minutos");
  compuerta.setPeriodHertz(50);
  compuerta.attach(PIN_SERVO, 500, 2400);
  compuerta.write(ANGULO_CERRADO);
  avisar("Inicio: salidas apagadas. Calibrar sensores antes de usar agua.");
#if defined(ARDUINO_ARCH_ESP32)
  if (!SIMULACION_WOKWI) Telemetria::iniciar();
#endif
}

void loop() {
  actualizarSensores(millis());
  uint32_t ahora = millis();
  actualizarAlarmas(ahora);
  actualizarDeposito(ahora);
  actualizarLuz(ahora);
  controlarAlcantarilla1(ahora);
  controlarRiego(ahora);
  actualizarLCD(ahora);
  actualizarIndicadores(ahora);
  actualizarSerial(ahora);
#if defined(ARDUINO_ARCH_ESP32)
  static uint32_t ultimaCaptura = 0, secuencia = 0;
  if (Telemetria::activa() && transcurrio(ahora, ultimaCaptura, RedConfig::INTERVALO_ENVIO_MS)) {
    ultimaCaptura = ahora;
    Telemetria::ofrecer(capturarSistema(ahora, esp_timer_get_time() / 1000, ++secuencia));
  }
#endif
  delay(1); // Cede tiempo al sistema; no implementa los temporizadores.
}
