# Conectar un ESP32 a Pluvia

El sketch **MonitoreoAgua** está preparado para un ESP32 clásico WROOM. Incluye el control local de las tres alcantarillas, la pantalla, los indicadores, el buzzer y las protecciones del proyecto. La telemetría se incorpora al final del ciclo de control. La aplicación web se ejecuta en una computadora o servidor.

## 1. Preparar la computadora y las claves

Desde la carpeta `WEB`, completa la configuración del servidor descrita en [la guía de la plataforma](../README.md). Configura el mismo `DEVICE_ID` en servidor y placa. Genera dos secretos independientes para `DEVICE_TOKEN` y `MONITOR_PASSWORD`. El primero autentica los paquetes de la placa. El segundo permite ingresar al panel real.

Para generar un valor aleatorio ejecuta el comando una vez por secreto.

```sh
python3 -c 'import secrets; print(secrets.token_urlsafe(32))'
```

Copia el archivo de ejemplo dentro de la carpeta del sketch.

```sh
cp firmware/MonitoreoAgua/SecretosEjemplo.h firmware/MonitoreoAgua/Secretos.h
```

Edita la nueva copia. Escribe la red en `WIFI_SSID`, su clave en `WIFI_CLAVE`, el ID en `ID_DISPOSITIVO` y el token del dispositivo en `TOKEN_DISPOSITIVO`. Los archivos privados del servidor y la placa están fuera de la carpeta pública. El archivo de ejemplo contiene valores vacíos, por lo que la placa ejecuta su control local hasta que se configure el envío. El binario de una compilación configurada contiene sus credenciales y debe custodiarse junto con la placa.

## 2A. Exposición local

1. Conecta el ordenador y la placa a la misma red Wi-Fi. Configura `HOST=0.0.0.0`, `PORT=8080` y `COOKIE_SECURE=false` en el archivo privado `WEB/.env`. Inicia el servicio desde `WEB` con `python3 server/app.py` y permite su puerto en el cortafuegos de esa red. Desactiva el aislamiento entre clientes del punto de acceso si impide la comunicación.
2. Consulta en los ajustes de red la dirección IPv4 de la computadora. Si utiliza macOS y su Wi-Fi está en `en0`, también puedes obtenerla con `ipconfig getifaddr en0`.
3. Escribe en `URL_TELEMETRIA` la URL completa de esa dirección. Por ejemplo, para un servidor en el puerto 8080 y una computadora con IP 192.168.1.50, utiliza `http://192.168.1.50:8080/api/v1/telemetry`. La dirección `localhost` de la placa pertenece a la propia placa.
4. Para una exposición por HTTP en una red privada controlada, establece `PERMITIR_HTTP_EN_LAN = true`. La excepción admite únicamente una IPv4 privada de los rangos 10/8, 172.16/12 o 192.168/16. El token viaja en claro en esta modalidad. En una red compartida, usa la configuración HTTPS del siguiente apartado.
5. Abre la web desde otro equipo o teléfono conectado a la misma Wi-Fi para comprobar que el servidor está accesible. La API de recepción requiere POST con el token de la placa.

## 2B. Servidor público

1. Publica el backend detrás de un proxy HTTPS, con su nombre DNS y una cadena de certificados completa. Usa el mismo origen para la web, el panel, la API y SSE. La guía de la plataforma incluye la configuración de despliegue.
2. Usa `https://tu-dominio.example/api/v1/telemetry` con el nombre real del servidor y conserva `PERMITIR_HTTP_EN_LAN = false`. El ESP32 inicia conexiones salientes al servidor.
3. Obtén el certificado raíz público de la autoridad emisora por su canal oficial y copia el PEM completo en `CA_PEM`. Incluye los delimitadores y conserva los saltos de línea. La forma de la cadena C++ es `R"PEM(…contenido del PEM…)PEM"`. Un cambio de autoridad raíz exige actualizar la CA de la placa.
4. Configura `SERVIDOR_HORA` con un servidor NTP alcanzable desde esa red. La tarea espera a tener hora de calendario, valida cadena, nombre del servidor y vigencia antes de enviar el token. Un fallo de certificado, reloj o DNS mantiene la supervisión local activa. El enlace físico, la negociación con tu dominio y la rotación real de certificados se comprueban en el montaje.

## 3. Revisar el montaje y la calibración

Antes de aplicar alimentación a las cargas, consulta el cableado, las adaptaciones ECHO y las fuentes en [la guía de montaje del proyecto](GUIA_MONTAJE.txt). Este firmware conserva el pinout del ESP32 WROOM y la LCD paralela. Las mangueras, el filtro y la salida independiente de emergencia se verifican en el montaje.

En `Configuracion.h`, mide para cada punto la distancia del sensor al fondo y al nivel máximo útil. Actualiza `vacioCm`, `llenoCm` y los límites admisibles de la unidad instalada. Contrasta varias lecturas con una regla. Después marca en `RedConfig.h` únicamente las entradas correspondientes de `CALIBRACION_CONFIRMADA`, en el orden A1, A2, A3 y depósito. La geometría inicial del proyecto es orientativa. El servidor recibe la altura y la geometría de referencia. El porcentaje de altura útil se habilita por punto al confirmar la calibración.

`SENSOR_DEPOSITO_INSTALADO` empieza en `false`. Ambas bombas quedan bloqueadas. Para habilitar la medición hacen falta un sensor identificado, instalación compatible y calibración del recipiente. La placa calcula las dos condiciones hidráulicas con las mismas histéresis que usa para controlar las cargas. El riego requiere además iluminación y temporización. Motor, bombas y ángulo del servo representan **órdenes eléctricas**. La maqueta carece de realimentación que confirme el movimiento del agua o de la compuerta.

## 4. Compilar y cargar

1. Instala en el gestor de placas de Arduino IDE el paquete **esp32 by Espressif Systems**. La versión comprobada es 3.3.12. Instala **LiquidCrystal 1.0.7** y **ESP32Servo 3.2.1** desde el gestor de bibliotecas. Wi-Fi, HTTP y TLS forman parte del núcleo.
2. Abre `firmware/MonitoreoAgua/MonitoreoAgua.ino` con los demás archivos de esa carpeta. Selecciona **ESP32 Dev Module**, puerto USB de la placa y una partición de aplicación suficiente para el tamaño informado al verificar. Pulsa **Verificar**.
3. Una vez revisado el montaje, carga desde el IDE. La pestaña **Monitor serie**, a 115200 baudios, permite comprobar la adquisición con PIS1. La ampliación PIS2/PIS2S sigue siendo opcional en `Configuracion.h`. Los mensajes de depuración de red están separados de esas tramas.
4. Entra en `/monitoreo`, elige la fuente real y accede con la contraseña del panel. Compara el ID recibido, la hora de recepción, la antigüedad y estados con el montaje y la LCD. El panel real arranca en espera mientras no haya recibido paquetes del dispositivo.
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

`MODO_DEMO` del firmware ajusta el intervalo de riego del montaje. Con sensores físicos, el origen sigue siendo REAL. El perfil `SIMULACION_WOKWI` deshabilita el envío a la API real y conserva el diagnóstico serial de simulación. La exposición pública utiliza el simulador del servidor y su base de datos independiente.

## Verificación reproducible

Desde `WEB`, ejecuta lo siguiente con Python 3 y un compilador C++17 con sanitizadores en el entorno de desarrollo.

```sh
python3 firmware/probar.py
```

La prueba emplea los sustitutos de hardware y la suite de regresión en `firmware/tests`, compila la copia de este sketch en cuatro perfiles y valida con el mismo contrato Python del servidor dieciséis mensajes del serializador C++. Comprueba la captura inicial, la geometría confirmada y provisional, la edad de muestra, el depósito ausente, la distancia de diagnóstico tras un eco fuera de rango y una medición caducada. La conexión Wi-Fi de una placa, los tiempos del circuito, la precisión, los mecanismos y la hidráulica requieren comprobación física.

Con Arduino CLI 1.5.1 y las dependencias indicadas se compilaron dos perfiles para `esp32:esp32:esp32`. La compilación sin credenciales ocupó 378 039 bytes de programa. La compilación con HTTPS habilitado, una CA y credenciales ficticias ocupó 1 057 007 bytes de programa y 49 484 bytes de variables globales. El tamaño varía con la cadena de certificados y la configuración de placa.

También se pasó por HTTP local una serie de cuatro paquetes producidos por el código C++ con sensores sustituidos, un ID de ensayo y bases SQLite temporales. La API aceptó los cuatro con 201 y reconoció una repetición con 200. Una sesión autenticada recibió el último estado por SSE y exportó por CSV el eco fuera de rango y la lectura caducada. Esta prueba ejercitó el camino de recepción real en un entorno de ensayo aislado.
