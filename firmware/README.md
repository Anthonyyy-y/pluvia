# Conectar el ESP32 a Pluvia

El ESP32 WROOM toma las lecturas de A1, A2 y A3 y envía una muestra cada tres segundos por Wi-Fi a la página publicada de Pluvia. Cada muestra incluye el estado del depósito, la luz, las órdenes del motor, la compuerta y las bombas, y la intensidad de la señal Wi-Fi. La LCD y el control de la maqueta siguen funcionando si se pierde la conexión.

## Preparar la conexión al sitio publicado

1. Abre `MonitoreoAgua/MonitoreoAgua.ino` en Arduino IDE. En la pestaña **Secretos.h**, escribe el nombre de una red Wi-Fi de **2,4 GHz** con salida a Internet en `WIFI_SSID` y su contraseña en `WIFI_CLAVE`.
2. La copia privada preparada en el equipo ya contiene el token de la placa, el identificador `pluvia-01` y la dirección `https://pluvia-mu.vercel.app/api/v1/telemetry`. En una copia nueva del repositorio, duplica `SecretosEjemplo.h` con el nombre `Secretos.h` en la misma carpeta y completa también `TOKEN_DISPOSITIVO` con el `DEVICE_TOKEN` de la publicación. Mantén las credenciales y el binario configurado en privado.
3. Conserva `PERMITIR_HTTP_EN_LAN = false` y `CA_PEM` vacío para el sitio publicado. El ESP32 sincroniza su reloj mediante NTP y verifica el nombre, la cadena y la vigencia del certificado con el almacén de confianza de Espressif. Si usas otro servidor con una autoridad privada, escribe su certificado raíz en formato PEM en `CA_PEM`.
4. Tras cargar el programa, abre el monitor en modo real e ingresa con la contraseña del panel (`MONITOR_PASSWORD`). Al llegar la primera muestra verás el dispositivo `pluvia-01` y la hora de recepción. [Abrir el monitor real de Pluvia](https://pluvia-mu.vercel.app/monitoreo?modo=real)

## Medida actual: desagüe de10cm

La profundidad confirmada es10cm:5cm de agua representan50%. Se configura con
`PROFUNDIDAD_DESAGUE_CM`. El usuario confirmó también10cm desde la cara de cada
sensor hasta el fondo. Esta ubicación no es compatible con el JSN de A1, que
informará error hasta elevarlo. En A2/A3 los HC pueden leer5cm/50%, pero dejan
de medir por debajo de2cm de separación del agua (más de8cm de llenado).
Para medir hasta el borde deben elevarse y actualizar `DISTANCIA_FONDO_CM`.
La página mostrará errores de rango, nunca los transformará en nivel normal.
La copia de montaje vigente está también en `../../avance nuevo/esp32/MonitoreoAgua`.
Ambas copias conservan LED directos y eliminan buzzer/74HC595.

## Revisar el montaje y la calibración

Antes de aplicar alimentación a las cargas, consulta el cableado, las adaptaciones ECHO y las fuentes en [la guía de montaje del proyecto](GUIA_MONTAJE.txt). Este firmware conserva el pinout del ESP32 WROOM y la LCD paralela. Las mangueras, el filtro y la salida independiente de emergencia se verifican en el montaje.

En `Configuracion.h`, mide para cada punto la distancia del sensor al fondo y al nivel máximo útil. Actualiza `vacioCm`, `llenoCm` y los límites admisibles de la unidad instalada. Contrasta varias lecturas con una regla. Después marca en `RedConfig.h` únicamente las entradas correspondientes de `CALIBRACION_CONFIRMADA`, en el orden A1, A2, A3 y depósito. La geometría actual conserva los10cm de profundidad y distancia al fondo confirmados por el usuario; A1 aún requiere corregir el montaje. El servidor recibe la altura y la geometría de referencia. El porcentaje de altura útil se habilita por punto al confirmar la calibración.

`SENSOR_DEPOSITO_INSTALADO` empieza en `false`. Ambas bombas quedan bloqueadas. Para habilitar la medición hacen falta un sensor identificado, instalación compatible y calibración del recipiente. La placa calcula las dos condiciones hidráulicas con las mismas histéresis que usa para controlar las cargas. El riego requiere además iluminación y temporización. Motor, bombas y ángulo del servo representan **órdenes eléctricas**. La maqueta carece de realimentación que confirme el movimiento del agua o de la compuerta.

## Compilar y cargar

1. Instala en el gestor de placas de Arduino IDE el paquete **esp32 by Espressif Systems**. La versión comprobada es 3.3.12. Instala **LiquidCrystal 1.0.7** y **ESP32Servo 3.2.1** desde el gestor de bibliotecas. Wi-Fi, HTTP y TLS forman parte del núcleo.
2. Abre `firmware/MonitoreoAgua/MonitoreoAgua.ino` con los demás archivos de esa carpeta. Selecciona **ESP32 Dev Module**, puerto USB de la placa y una partición de aplicación suficiente para el tamaño informado al verificar. Pulsa **Verificar**.
3. Una vez revisado el montaje, carga desde el IDE. La pestaña **Monitor serie**, a 115200 baudios, permite comprobar la adquisición con PIS1. La ampliación PIS2/PIS2S sigue siendo opcional en `Configuracion.h`. Para ver también el estado del envío, activa `DIAGNOSTICO_RED_USB` en `RedConfig.h` antes de cargar la placa. En el Monitor serie aparecerá `RED,HTTP,201` cuando el servidor acepte la primera muestra nueva. Se informa de los cambios de estado. El diagnóstico de red está habilitado para comprobar la conexión; puede desactivarse para conservar únicamente PIS1.
4. En el monitor real, compara el ID recibido, la hora de recepción, la antigüedad y estados con el montaje y la LCD. El panel real arranca en espera mientras no haya recibido paquetes del dispositivo.
5. Para comprobar la desconexión, interrumpe la Wi-Fi durante un intervalo superior a `OFFLINE_SECONDS`. Comprueba el estado de caducidad previo, la desconexión y la continuidad de la pantalla local. Restablece la red y comprueba que llega una muestra nueva y se registra la recuperación. Verifica después el comportamiento del sensor ausente y los fallos de eco en condiciones controladas.

Si utilizas Arduino CLI con las mismas dependencias instaladas, desde `WEB` puedes verificar el sketch con el siguiente comando.

```sh
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/MonitoreoAgua
```

## Transporte y diagnósticos

La tarea FreeRTOS de red se ejecuta separada del ciclo Arduino. La cola de longitud uno conserva la captura más reciente. Si el envío tarda o no hay red, las capturas siguientes reemplazan las que todavía esperan. El servidor recibe una serie con huecos durante las desconexiones. Al reconectar, la placa descarta las capturas vencidas y envía una reciente. Dos mediciones del mismo arranque se distinguen por su número de secuencia. El ID de arranque se genera de nuevo al reiniciar.

`RedConfig.h` reúne el intervalo de envío, reintentos Wi-Fi, límites TCP/HTTP/TLS y espera máxima entre fallos. Adecúa `STALE_SECONDS` y `OFFLINE_SECONDS` del backend al intervalo elegido. La antigüedad de cada lectura se mide a partir del intento de adquisición e incluye la espera antes de iniciar la petición. `uptime_ms` es tiempo monotónico de actividad de 64 bits. El servidor fecha la recepción con su propio reloj.

| Síntoma | Comprobación |
| --- | --- |
| Sigue esperando datos | Verifica IP o dominio, puerto, SSID, token e ID en ambos extremos. En LAN, revisa cortafuegos y permiso HTTP. |
| La API devuelve 401 o 403 | Compara la credencial privada y el ID del dispositivo con la configuración del servidor. |
| La API devuelve 422 | El backend registra una inconsistencia de contrato. Comprueba la versión de la copia cargada. |
| HTTPS no recibe lecturas | Comprueba resolución DNS, acceso al servidor horario, cadena de confianza y vigencia del certificado del dominio. |
| Hay niveles y faltan porcentajes | La medición debe ser válida y su geometría debe haberse confirmado individualmente. |
| El depósito informa SIN_SENSOR | Con la configuración de montaje actual es el estado previsto. Deben aparecer bloqueadas las dos bombas. |

`MODO_DEMO` del firmware ajusta el intervalo de riego del montaje. Con sensores físicos, el origen sigue siendo REAL. El perfil `SIMULACION_WOKWI` deshabilita el envío a la API real y conserva el diagnóstico serial de simulación. El panel de demostración utiliza el simulador del servidor y su propio historial.

## Opción para una exposición en red local

Para utilizar un servidor local en lugar del sitio publicado, crea un token de ensayo para `DEVICE_TOKEN` en `WEB/.env`. Usa ese mismo valor en `TOKEN_DISPOSITIVO` de una copia local del sketch. Configura también una contraseña de acceso al panel en `MONITOR_PASSWORD`.

1. Conecta el ordenador y la placa a la misma red Wi-Fi. Configura `HOST=0.0.0.0`, `PORT=8080` y `COOKIE_SECURE=false` en el archivo privado `WEB/.env`. Inicia el servicio desde `WEB` con `python3 server/app.py` y permite su puerto en el cortafuegos de esa red. Desactiva el aislamiento entre clientes del punto de acceso si impide la comunicación.
2. Consulta en los ajustes de red la dirección IPv4 de la computadora. Si utiliza macOS y su Wi-Fi está en `en0`, también puedes obtenerla con `ipconfig getifaddr en0`.
3. Escribe en `URL_TELEMETRIA` la URL completa de esa dirección. Por ejemplo, para un servidor en el puerto 8080 y una computadora con IP 192.168.1.50, utiliza `http://192.168.1.50:8080/api/v1/telemetry`. La dirección `localhost` de la placa pertenece a la propia placa.
4. Para una exposición por HTTP en una red privada controlada, establece `PERMITIR_HTTP_EN_LAN = true`. La excepción admite únicamente una IPv4 privada de los rangos 10/8, 172.16/12 o 192.168/16. El token viaja en claro en esta modalidad. En una red compartida, usa el servidor público HTTPS de Pluvia.
5. Abre la web desde otro equipo o teléfono conectado a la misma Wi-Fi para comprobar que el servidor está accesible. La API de recepción requiere POST con el token de la placa.

## Verificación reproducible

Desde `WEB`, ejecuta lo siguiente con Python 3 y un compilador C++17 con sanitizadores en el entorno de desarrollo.

```sh
python3 firmware/probar.py
```

La prueba emplea los sustitutos de hardware y la suite de regresión en `firmware/tests`, compila la copia de este sketch en cuatro perfiles y valida con el mismo contrato Python del servidor veinte mensajes y tres capturas del montaje actual a10cm del serializador C++. Comprueba la captura inicial, la geometría confirmada y provisional, la edad de muestra, el depósito ausente, la distancia de diagnóstico tras un eco fuera de rango y una medición caducada. La conexión Wi-Fi de una placa, los tiempos del circuito, la precisión, los mecanismos y la hidráulica requieren comprobación física.

El perfil Wi-Fi/HTTPS se compiló para **ESP32 Dev Module** con Arduino CLI 1.5.1, el núcleo 3.3.12, la partición predeterminada y credenciales de ensayo. El binario incluye la autoridad raíz utilizada por el dominio de Pluvia.

También se enviaron por HTTP a un servidor local cuatro capturas generadas por el sketch con sensores de prueba. El servidor aceptó las cuatro con HTTP 201, reconoció cada reenvío con HTTP 200 y devolvió las mismas lecturas en la consulta del panel real. El CSV contuvo 16 filas, una por punto y captura. En la publicación se comprobó el token y el identificador con una solicitud sin mediciones que la API descartó antes de guardarla. La puesta en marcha con sensores físicos se comprueba al cargar la placa.
