# API y almacenamiento de telemetría

Una instancia recibe datos de una placa configurada con `DEVICE_ID`. La placa inicia el envío HTTP y el navegador se suscribe a actualizaciones SSE del mismo servidor. El registro se confirma en SQLite antes de responder al emisor. La web y el panel se sirven desde `public/`.

## Arranque local

Desde `WEB/`, con Python 3.9 o superior:

```sh
cp .env.example .env
chmod 600 .env
python3 server/app.py
```

Copia el ejemplo solo en la primera instalación. En el equipo del expositor abre `http://127.0.0.1:8080/` o `http://127.0.0.1:8080/monitoreo`. El modo público funciona con los valores iniciales. El acceso al monitoreo real necesita una contraseña y la recepción desde la placa requiere un token. Para generar cada uno por separado se puede ejecutar `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`. Guárdalos en `.env` y reinicia el proceso después de cambiar opciones.

| Variable | Uso |
|---|---|
| `HOST`, `PORT` | Dirección de escucha y puerto de la exposición local. Para admitir la placa en la misma Wi-Fi, usa `HOST=0.0.0.0` y en la placa configura la IP LAN de la computadora. |
| `DEVICE_ID` | Identidad aceptada con el token. Valor inicial `pluvia-01`. |
| `DEVICE_TOKEN` | Secreto de la placa usado en el encabezado HTTP. Vacío deshabilita la recepción REAL. |
| `MONITOR_PASSWORD` | Secreto independiente de acceso al panel real. Vacío deshabilita el inicio de sesión. |
| `COOKIE_SECURE` | `true` para HTTPS público. En la exposición LAN HTTP usa `false` y una red de confianza. |
| `DATA_DIR` | Directorio privado persistente. Las rutas relativas se resuelven respecto a `WEB/`. |
| `DEMO_INTERVAL_SECONDS` | Segundos entre muestras sintéticas. Por defecto, 2. |
| `STALE_SECONDS`, `OFFLINE_SECONDS` | Sin una recepción nueva, las mediciones caducan a los 10 s y el servidor declara desconexión a los 30 s por defecto. Ajusta ambos plazos al intervalo real del ESP32. |

El arranque local usa WSGI de la biblioteca estándar. Para servir en Internet consulta [Despliegue público y exposición LAN](../docs/DESPLIEGUE.md). Sesiones de acceso, límite de solicitudes y simulaciones en ejecución comparten memoria de un proceso con varios hilos. Reserva hilos para las conexiones SSE abiertas.

## Contrato v1

`POST /api/v1/telemetry` admite un objeto JSON UTF-8 con `Content-Type: application/json` y `Content-Length`, hasta 16 KiB. El montaje físico envía `Authorization: Bearer <DEVICE_TOKEN>`. La autenticación de un navegador sirve para consultar la telemetría y reconocer incidentes. El simulador usa una cookie de demostración y un dispositivo virtual separado.

[Ejemplo JSON completo con depósito ausente](telemetria.ejemplo.json) · [Validador ejecutable](protocol.py)

| Campo | Interpretación |
|---|---|
| `version` | Entero `1`. |
| `device_id`, `boot_id` | Cadenas de 1 a 64 caracteres ASCII con letras, dígitos, guion o guion bajo. El arranque cambia con cada reinicio. |
| `source` | `REAL` para el emisor identificado. `SIMULACION` para las sesiones públicas, con `device_id=pluvia-demo`. |
| `seq` | Entero sin signo de 32 bits, creciente en el mismo arranque. Se admiten huecos. |
| `uptime_ms` | Milisegundos desde el arranque, entero de hasta 53 bits exactos en JSON/JavaScript. La fecha de recepción UTC la asigna el servidor. |
| `points` | Objeto con cuatro entradas obligatorias, `A1`, `A2`, `A3` y `DEPOSITO`. |
| `outputs` | Órdenes `motor`, `drain`, `irrigation` como booleanos, ángulo **ordenado** `gate_deg` de 0 a 180 y etapa `stage`. Un valor desconocido se expresa con `null`. |
| `tank` | `can_receive` indica permiso de recepción para evacuación y `can_irrigate` disponibilidad hidráulica para riego. La etapa y la luz también intervienen en las órdenes finales. A falta de una lectura válida ambos permisos son `false`. |
| `light` | `adc` entero entre 0 y 4095 y `daylight` booleano reportado por la lógica de iluminación. Se acepta `null` al faltar un dato. |
| `network` | `rssi_dbm` entero entre −127 y 0, o `null`. |

Cada punto contiene todos los campos siguientes.

| Campo | Interpretación |
|---|---|
| `installed`, `valid` | Estado de instalación y validez comunicados por el emisor. |
| `state`, `reason` | Clasificación del firmware: `NORMAL`, `PRECAUCION`, `ALERTA` o `ERROR`. La lectura válida lleva `reason:null`; el error lleva el código de fallo. |
| `distance_cm` | Distancia ultrasónica en centímetros o `null`. Una lectura fuera de rango puede conservar el eco diagnóstico aun con `valid:false`. |
| `height_cm` | Altura sobre el fondo, calculada por el firmware desde su geometría configurada, o `null`. Si la geometría es provisional, el panel indica esa referencia. |
| `height_pct` | Porcentaje de la **altura útil** de 0 a 100. Se exige lectura válida y calibración confirmada para aceptar un número. |
| `age_ms` | Antigüedad de la medición al preparar el envío (incluye espera de transmisión conocida), o `null`. El panel añade la antigüedad de recepción. |
| `calibration` | `confirmed` booleano. `empty_cm` y `full_cm` son distancias al fondo y al máximo nivel útil. Si existen, `empty_cm > full_cm`; si se desconocen, ambos son `null`. |

Los motivos admitidos son `SIN_SENSOR`, `SIN_ECO`, `OBJETO_DEMASIADO_CERCA`, `FUERA_RANGO_SENSOR`, `DISTANCIA_MAYOR_QUE_ALTURA`, `REVISAR_ALTURA_Y_LIMITES` y `CADUCADA`. Se aceptan las siete etapas del firmware, desde `REPOSO` hasta `ERROR_SENSOR`, enumeradas en el validador. El servidor conserva el estado recibido. Con un fallo, altura y porcentaje deben ser `null`. El depósito ausente requiere `installed:false`, `valid:false`, `state:"ERROR"`, `reason:"SIN_SENSOR"`, medidas y antigüedad nulas y ambas bombas inhibidas.

La geometría viaja en cada muestra: el panel no fija una altura de desagüe.
Con `empty_cm - full_cm = 10`, 5 cm de agua representan el 50 % y 10 cm el
100 %. El validador comprueba que altura, distancia y porcentaje concuerden,
con tolerancia para el redondeo del firmware. Una altura que sobrepasa la útil
puede conservar su medida en centímetros y presentar un porcentaje limitado
al 100 %. Una distancia ligeramente mayor que el fondo puede producir altura
cero. `full_cm = 0` es una referencia lógica admisible; no significa que el
sensor pueda medir a distancia cero. Si el firmware informa una zona ciega,
el panel recibe `ERROR` y valores no disponibles en vez de inventar el 100 %.
La demostración usa desagües virtuales de 10 cm con sensores elevados; esas
distancias ilustrativas no reemplazan la calibración física del montaje.

Para una muestra nueva la respuesta es HTTP 201. Un reintento idéntico con igual dispositivo, arranque y secuencia recibe HTTP 200 y `duplicate:true`; conserva la primera fecha. Una colisión, un paquete atrasado o una muestra inédita de un arranque ya sustituido recibe 409. Se rechazan JSON mal formado, claves repetidas y números no finitos con 400, identidad no autorizada con 401/403 y campos incoherentes con 422. Los errores incluyen `{"error":"descripción"}`.

## Lectura, eventos y sesiones

| Solicitud | Resultado |
|---|---|
| `POST /api/v1/login` con `{"password":"…"}` | Cookie de acceso real HttpOnly, SameSite=Strict, de ocho horas. |
| `POST /api/v1/logout` con `{}` | Revoca la sesión del navegador. |
| `POST /api/v1/demo/start` con `{}` | Crea o reutiliza la sesión pública y devuelve su instantánea. `{"manual":true}` inicia una nueva sesión destinada a un emisor CLI. |
| `POST /api/v1/demo/scenario` con `{"scenario":"tank_missing"}` | Cambia el ejemplo para ese visitante y devuelve el estado resultante. |
| `GET /api/v1/snapshot?mode=real` | Último paquete, fuente, dispositivo, fecha, antigüedad, revisión, plazos y estado de conexión. Antes de la primera recepción devuelve `packet:null` y `connection:"waiting"`. |
| `GET /api/v1/stream?mode=real` | Flujo SSE con eventos `snapshot` e instantánea completa. Tras una reconexión entrega el estado vigente. Los incidentes e historia permanecen consultables en SQLite. |
| `GET /api/v1/history?mode=real&hours=1` | Alturas en cm de los cuatro puntos. Devuelve la última muestra de cada uno de hasta 720 intervalos para dibujar la gráfica; conserva los valores ausentes. |
| `GET /api/v1/events?mode=real` | Hasta 250 incidentes, con prioridad para los abiertos, descripción, origen, severidad y fechas UTC de cada transición. |
| `POST /api/v1/events/{id}/ack?mode=real` con `{}` | Registra el reconocimiento del operador una vez. La condición se resuelve por recuperación comunicada o recepción de un nuevo paquete, según el incidente. |
| `GET /api/v1/export.csv?mode=real&hours=24` | Descarga las muestras originales de la ventana, una fila por punto y paquete, con unidades, origen y órdenes. |
| `POST /api/v1/contact` con `{"name":"…","email":"…","message":"…"}` | Guarda la solicitud. HTTP 201 incluye la referencia `id`. El equipo puede consultar el registro local. |

Las rutas de consulta y reconocimiento también admiten `mode=demo` para los registros de esa cookie. Los filtros de tiempo admiten 1, 6, 24 y 168 horas. La tabla de eventos agrupa por condición, sensor y sesión. Una condición persistente genera una apertura, un reconocimiento opcional y un cierre al recuperarse. Una medición inválida de un sensor con nivel alto deja pendiente la resolución de su incidente de nivel hasta obtener una nueva lectura válida.

El navegador vuelve a suscribirse al flujo con `EventSource`. La vigilancia del servidor sigue registrando caducidad y desconexión real mientras el proceso está activo. Para conservar la trazabilidad tras una interrupción, al reiniciarse evalúa la antigüedad de las últimas muestras guardadas. Las notificaciones de la interfaz requieren permiso, página abierta y compatibilidad del navegador.

## Simulador por HTTP

Ejecuta el servidor y, en otra terminal situada en `WEB/`, ejecuta:

```sh
python3 server/simulator.py --scenario a2_alert --count 4 --interval 2 --session /tmp/pluvia-simulador.cookies
python3 server/simulator.py --scenario offline --count 18 --interval 2 --session /tmp/pluvia-simulador.cookies
python3 server/simulator.py --scenario recovery --count 2 --session /tmp/pluvia-simulador.cookies
```

`--url` elige el servidor, incluidos esquema y puerto. `--timeout` fija la espera por solicitud. La opción `--session` conserva una cookie privada para encadenar escenarios y consultar el mismo historial con otro cliente HTTP. Una ejecución de la CLI comienza un nuevo arranque del emisor ilustrativo. El primer ejemplo abre la alerta de A2. El segundo deja transcurrir 36 s sin enviar para activar caducidad y desconexión con los plazos iniciales. El tercero reanuda el envío y cierra ambos incidentes.

```sh
curl -b /tmp/pluvia-simulador.cookies 'http://127.0.0.1:8080/api/v1/events?mode=demo'
curl -b /tmp/pluvia-simulador.cookies 'http://127.0.0.1:8080/api/v1/export.csv?mode=demo&hours=1'
```

En el panel también puedes seleccionar `normal`, `a1_rise`, `intervention`, `a2_alert`, `a3_alert`, `sensor_error`, `tank_missing`, `tank_full`, `offline` y `recovery` mediante sus nombres en español. El guion web genera muestras en el servidor y usa el mismo validador y almacenamiento. La CLI atraviesa el endpoint HTTP de ingestión. La sesión del navegador y la sesión CLI siguen siendo independientes. El depósito de los escenarios con sensor es virtual; permite explicar la secuencia de bombeo.

## Archivos, retención y contacto

`DATA_DIR/real.sqlite3` almacena lecturas y eventos reales y una tabla independiente de solicitudes. `DATA_DIR/demo.sqlite3` separa las sesiones de demostración. El servidor conserva el historial real hasta que el responsable archive la base. Las demos dejan de emitir tras 90 s sin actividad del visitante y las sesiones de demostración inactivas por más de dos días se depuran periódicamente. El formulario registra localmente la petición; la atención posterior corresponde al responsable del proyecto.

Para consultar las solicitudes en la computadora que aloja la exposición:

```sh
sqlite3 -header -column data/real.sqlite3 'SELECT id, datetime(received,"unixepoch") AS UTC, name, email, message FROM contact_requests ORDER BY received DESC;'
```

Ajusta la ruta si cambiaste `DATA_DIR`. Para respaldos con el servidor activo, usa el comando `.backup` de SQLite en cada base y un directorio privado. El modo WAL puede tener cambios recientes en archivos auxiliares.

## Verificación reproducible

```sh
python3 -B -m unittest discover -s tests -v
```

Las pruebas arrancan un servidor HTTP de bucle local en puertos efímeros con dos bases temporales. Cubren la CLI de simulación por medio de su cliente HTTP, autenticación, aislamiento entre navegadores y fuentes, aceptación y rechazo de mensajes, reintentos, arranques, SSE, escenarios, campos nulos, registro y reconocimiento de incidentes, caducidad, recuperación, persistencia después de reiniciar, CSV y recepción de solicitudes. La comprobación con la placa, el certificado del dominio definitivo, su Wi-Fi y los sensores físicos se realiza durante la puesta en servicio.

## Dos desagües y telemetría v2

El mismo POST autenticado `/api/v1/telemetry` acepta v1 y v2. El firmware PluviaDos envía un sobre con `version=2`, `device_id`, `source`, `boot_id`, `seq`, `uptime_ms` y `lecturas` con D1 y D2 del mismo ciclo. Cada lectura contiene `ts` monotónico en ms, altura `valor` en cm, orden `bombaEstado`, `nivelEstanque` sin lectura (null), reserva estimada `reservaEstimadaS` en segundos, órdenes `motorEstado` y `compuertaAbierta`, estado de iluminación `luz` y `source`. Las lecturas inválidas y la reserva sin confirmar se expresan con null. Las rutas de histórico y CSV conservan datos anteriores y etiquetan sus sensores originales. El firmware sirve el mismo sobre por HTTP de sólo lectura en `/api/v1/lecturas` en la red local. El monitor estático puede leer este endpoint o Web Serial sin un backend.
