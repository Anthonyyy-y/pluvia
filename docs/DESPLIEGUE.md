# Ejecutar y publicar Pluvia

Pluvia sirve once páginas, el explorador de dos desagües y el monitor. La placa PluviaDos ofrece tres vías de lectura: USB, Wi-Fi en la red local y envío HTTPS a la nube. En la fuente Nube, el navegador consulta periódicamente la API del mismo origen. El backend local también mantiene SSE para clientes anteriores. [Páginas, firmware y fuentes de datos](../README.md)

## Exposición en una red local

1. Entra en `WEB`. Con Python 3.9 o superior puedes ejecutar la exposición sin instalar paquetes adicionales. Para tu primera configuración, crea el archivo privado con `umask 077` y `cp .env.example .env`. Si ya tienes un archivo configurado, edítalo directamente.
2. Configura `HOST=0.0.0.0`, `PORT=8080`, `COOKIE_SECURE=false` y `DEVICE_ID=pluvia-01`. Asigna valores independientes a `DEVICE_TOKEN` y `MONITOR_PASSWORD`. Para generar cada uno, ejecuta `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'`. Un secreto vacío deja deshabilitado el acceso correspondiente. El modo público de demostración se puede usar desde el primer arranque.
3. Arranca el backend con `python3 server/app.py`. Abre `http://127.0.0.1:8080/` en el ordenador. El mismo servicio sirve los archivos de `public/`, atiende la API y crea las bases en `WEB/data/`. Puedes detenerlo con Ctrl+C. Para una exposición únicamente en el ordenador, conserva `HOST=127.0.0.1`.
4. Desde otro equipo de esa Wi-Fi, abre la IP LAN de la computadora con el mismo puerto, por ejemplo `http://192.168.1.50:8080/monitoreo`. Permite el tráfico entrante a ese puerto en la interfaz LAN. Si la red aísla sus clientes, usa una red donde la placa pueda alcanzar al equipo.
5. Para **Wi-Fi local**, configura el SSID y la clave en la copia privada de `RedEjemplo.h` llamada `Secretos.h` dentro de PluviaDos. La placa anuncia por USB su propia IP, por ejemplo `http://192.168.1.80/api/v1/lecturas`. Selecciona **Wi-Fi local** en el monitor e introduce esa URL. El navegador debe tener acceso a la placa. Desde una página HTTPS, el navegador puede bloquear una conexión HTTP a la LAN. La exposición local por HTTP, el modo USB y la fuente Nube permiten probar las vías correspondientes. [Guía de la placa](../firmware/PluviaDos/LEEME.txt)
6. Para **Nube**, configura una URL HTTPS completa que termine en `/api/v1/telemetry` y el mismo dispositivo y token en placa y servidor. Para **USB**, cierra el monitor serie del IDE y selecciona el puerto mediante el botón del panel en un navegador compatible con Web Serial. La demostración del panel usa datos ilustrativos del navegador.

### Configuración del backend

El proceso acepta variables de entorno o el archivo privado `WEB/.env`, con una línea `CLAVE=valor` por ajuste y valores sin comillas. Las variables del proceso tienen prioridad. Reinicia el servicio después de cambiar la configuración.

| Variable | Configuración inicial y efecto |
| --- | --- |
| `HOST`, `PORT` | `127.0.0.1` y `8080` para `server/app.py`. Con un servidor WSGI externo, el comando de ese servidor selecciona la dirección. |
| `DEVICE_ID` | `pluvia-01`. Se admite una identidad física configurada. Utiliza de 1 a 64 letras ASCII, dígitos, guiones o guiones bajos. |
| `DEVICE_TOKEN` | Secreto del envío de la placa en la cabecera `Authorization: Bearer …`. |
| `MONITOR_PASSWORD` | Contraseña independiente para la sesión de supervisión. |
| `COOKIE_SECURE` | `false` para HTTP local. En HTTPS público se configura `true`. |
| `DATA_DIR` | `data`, relativo a `WEB`, o una ruta absoluta de almacenamiento persistente. |
| `DEMO_INTERVAL_SECONDS` | `2`. Intervalo de emisión automática por visitante de demostración. |
| `STALE_SECONDS`, `OFFLINE_SECONDS` | `10` y `30`. Tiempo del backend desde la última recepción hasta declarar caducidad y desconexión. |

Se requiere `0 < DEMO_INTERVAL_SECONDS < STALE_SECONDS < OFFLINE_SECONDS`. Para la placa, elige un tiempo de caducidad que deje margen sobre su intervalo efectivo de envío. El firmware parte de tres segundos. Estos plazos solo determinan la frescura de los datos y la conexión. El perfil v2 envía alturas en cm, órdenes de control y una reserva estimada en segundos.

## Servidor propio con almacenamiento SQLite

Esta configuración usa un servidor Linux con disco persistente, un dominio público, Caddy y un proceso WSGI Waitress. Los ejemplos sitúan el contenido de `WEB` en `/opt/pluvia`. La cuenta de servicio `pluvia` debe poder leer el programa y escribir el directorio de datos. Los cambios de dominio, DNS y certificados se realizan en el alojamiento elegido.

### Proceso de aplicación

Copia el contenido de `WEB` al servidor. Instala el runtime de producción en un entorno virtual. La versión indicada es la utilizada en el ensayo local de despliegue. [Waitress en PyPI](https://pypi.org/project/waitress/)

```sh
cd /opt/pluvia
python3 -m venv .venv
.venv/bin/python -m pip install waitress==3.0.2
```

Crea `/etc/pluvia.env` con acceso de lectura restringido. Copia los campos de `.env.example`, asigna tus secretos y configura `COOKIE_SECURE=true` y `DATA_DIR=/var/lib/pluvia`. El servicio carga el archivo con `EnvironmentFile`. Para un alojamiento que inyecta variables mediante un panel, introduce allí los mismos valores.

Ejemplo de unidad `/etc/systemd/system/pluvia.service` una vez creada la cuenta de servicio. `StateDirectory` prepara el directorio de datos con su propietario. [Configuración del servidor WSGI](https://docs.pylonsproject.org/projects/waitress/en/stable/runner.html)

```ini
[Unit]
Description=Plataforma de drenaje Pluvia
After=network.target

[Service]
User=pluvia
Group=pluvia
WorkingDirectory=/opt/pluvia/server
EnvironmentFile=/etc/pluvia.env
StateDirectory=pluvia
StateDirectoryMode=0700
UMask=0077
ExecStart=/opt/pluvia/.venv/bin/waitress-serve --listen=127.0.0.1:8080 --threads=32 --trusted-proxy=127.0.0.1 "--trusted-proxy-headers=x-forwarded-for x-forwarded-proto" --max-request-body-size=16384 --call app:create_application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Carga y arranca la unidad con `sudo systemctl daemon-reload` y `sudo systemctl enable --now pluvia`. Consulta sus diagnósticos con `journalctl -u pluvia`. La carpeta de trabajo permite importar `app` y su factoría. La opción de proxy limita a la interfaz local la confianza en las cabeceras de Caddy, de modo que los límites por IP se aplican a cada visitante. [Argumentos de Waitress](https://docs.pylonsproject.org/projects/waitress/en/stable/arguments.html)

Ejecuta **un único proceso de aplicación**. La autenticación, las sesiones activas de demostración y su reloj residen en memoria. Después de un reinicio se vuelve a iniciar sesión en el panel real. Las lecturas, los incidentes y sus reconocimientos persisten en disco. Cada flujo SSE abierto ocupa un hilo. Los 32 hilos son una configuración inicial para la exposición, ajustable según pruebas de concurrencia en el servidor.

### Proxy, dominio y certificado

Apunta los registros DNS del dominio a la máquina del proxy. Publica los puertos 80 y 443 de **esa máquina** y conserva el almacén de certificados de Caddy en disco persistente. Si el alojamiento proporciona un proxy HTTPS gestionado, debe conservar el `Host` público y soportar flujos SSE de larga duración. El navegador y el ESP32 utilizan el dominio público. [HTTPS automático de Caddy](https://caddyserver.com/docs/automatic-https)

En `/etc/caddy/Caddyfile`, sustituye el dominio reservado del ejemplo por el tuyo. Caddy entrega de inmediato las respuestas `text/event-stream`. El primer bloque limita las conexiones SSE al backend a 24 para reservar hilos para telemetría y otras peticiones. [Proxy inverso y tratamiento de SSE](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)

```caddyfile
pluvia.example {
    handle /api/v1/stream {
        reverse_proxy 127.0.0.1:8080 {
            transport http {
                versions 1.1
                max_conns_per_host 24
            }
        }
    }

    handle {
        reverse_proxy 127.0.0.1:8080
    }
}
```

Valida el archivo con `caddy validate --config /etc/caddy/Caddyfile`. Aplica la configuración al servicio Caddy y comprueba el certificado en `https://tu-dominio/`. Configura en PluviaDos la URL HTTPS del dominio. La red debe dar acceso a DNS y NTP. La placa comprueba la cadena con las autoridades del núcleo y verifica el certificado antes de transmitir el token. [Configuración de la placa](../firmware/PluviaDos/LEEME.txt)

### Comprobar el despliegue

- Abre la página en una ventana privada, explora la maqueta y entra en la demostración. Al cambiar de escenario, el panel debe actualizarse con la etiqueta de simulación.
- Abre **Monitoreo → Nube**, inicia sesión y revisa las peticiones de lectura, como `/api/v1/snapshot?mode=real`, en las herramientas de red. Una instalación sin lecturas válidas deja el panel en espera. Comprueba la versión, el origen real, la fecha de recepción y los dos puntos cuando la placa transmita. Los clientes históricos SSE del backend local pueden consultar `/api/v1/stream`.
- Para comprobar el contrato anterior v1 en una sesión de demostración del servidor, desde la carpeta `WEB` prueba el endpoint remoto con `python3 server/simulator.py --url https://tu-dominio --scenario normal --count 3`. Deben recibirse tres respuestas 201 en su propia sesión de demostración. Los datos del simulador pertenecen a esa sesión. La prueba física requiere conectar la placa.
- Envía una solicitud de prueba mediante el formulario. Conserva su identificador y verifica con la consulta siguiente que se almacenó con el mismo valor.
- Reinicia el proceso y consulta de nuevo el historial. Comprueba también que el proxy permite sesiones SSE largas y que los archivos sobreviven a una nueva versión del código.

## Datos, contactos y copias

`real.sqlite3` contiene las lecturas físicas, incidentes y solicitudes de contacto. `demo.sqlite3` guarda las demostraciones aisladas por sesión. El servidor limpia periódicamente las sesiones inactivas de demostración cuyos datos llevan más de dos días sin actualizarse. Los datos reales permanecen hasta que el operador decida su conservación. Revisa el espacio disponible conforme aumente la frecuencia de muestreo. Guarda configuración y bases fuera de `public/`.

En una instalación con SQLite, el servidor registra la solicitud antes de devolver su referencia. El operador puede consultarla localmente con permisos sobre la base. Este procedimiento es el canal de recepción implementado para el formulario. El envío de correos requiere una integración adicional.

```sh
sqlite3 -readonly -header -column /var/lib/pluvia/real.sqlite3 \
  "SELECT id, datetime(received, 'unixepoch') AS fecha_utc, name, email, message
   FROM contact_requests ORDER BY received DESC LIMIT 25"
```

Para copias coherentes mientras el servicio está en marcha, utiliza la API de respaldo de SQLite. Incluye en el respaldo las transacciones confirmadas que se encuentren en el diario WAL. Ejecuta el ejemplo con una cuenta autorizada a leer los datos y escribir en el destino de copias. Cambia ambas ubicaciones a las de tu instalación. [Copias en línea de SQLite](https://sqlite.org/backup.html)

```sh
python3 - <<'PY'
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
import sqlite3

datos = Path("/var/lib/pluvia")
marca = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
copia = Path("/var/backups/pluvia") / marca
copia.mkdir(mode=0o700, parents=True)
for archivo in ("real.sqlite3", "demo.sqlite3"):
    origen = (datos / archivo).resolve().as_uri() + "?mode=ro"
    with closing(sqlite3.connect(origen, uri=True)) as desde:
        with closing(sqlite3.connect(copia / archivo)) as hasta:
            desde.backup(hasta, pages=256, sleep=0.05)
            if hasta.execute("PRAGMA quick_check").fetchone() != ("ok",):
                raise RuntimeError(f"Comprobación fallida en {archivo}")
print(copia)
PY
```

Guarda las copias en almacenamiento privado y conserva una copia protegida de las credenciales por separado. Para restaurar, detén el servicio, conserva la carpeta de datos existente y coloca ambas bases verificadas en un directorio nuevo, con permisos para `pluvia`. Selecciónalo en `DATA_DIR` y reinicia el servicio. Así la restauración usa las bases de la copia y evita reutilizar diarios WAL de otra versión. Comprueba el historial, los reconocimientos y una solicitud de referencia antes de retirar la copia anterior.

Se ensayaron localmente el arranque de Waitress con estos parámetros, la protección del acceso real, una sesión de demo por SSE y la recuperación de una solicitud tras copiar las dos bases en línea. El alta del dominio, Caddy en el servidor público y la conexión del ESP32 físico quedan para el alojamiento y el montaje de destino.

## Publicación de Pluvia en Vercel

El proyecto publica los archivos de `public/` y reescribe `/api/v1/*` hacia la función Python. Configura en el entorno privado de Vercel `DATABASE_URL` para la conexión PostgreSQL, `DEVICE_ID` y `DEVICE_TOKEN` para la placa, y `MONITOR_PASSWORD` para el operador. El backend desplegado debe incluir el validador v2 de `server/protocol.py` y los módulos de persistencia que lo acompañan. [Configuración de rutas](../vercel.json) · [Función de entrada](../api/endpoint.py)

1. Comprueba que abren las once rutas y una URL directa como `/producto/`. Prueba los modelos, los planos y las descargas en escritorio y móvil.
2. Carga PluviaDos con el Wi-Fi del montaje, el mismo ID y token del receptor y el destino `https://pluvia-mu.vercel.app/api/v1/telemetry`. El envío a la nube requiere el perfil físico. La simulación de Wokwi se identifica como demostración.
3. Con los sensores montados, espera un diagnóstico de envío satisfactorio. Una inserción nueva responde HTTP 201. En la pestaña **Nube**, verifica D1 y D2, la hora de recepción y el estado de bomba. Contrasta las alturas con las de la LCD y una regla. La estimación del estanque se expresa en segundos de riego.
4. Revisa el CSV de esa sesión. En Vercel el backend persiste la telemetría y las solicitudes de contacto en PostgreSQL. Las copias del servicio se gestionan con las herramientas del proveedor de PostgreSQL.

La URL pública prevista por el equipo es [Pluvia](https://pluvia-mu.vercel.app/). La verificación de la publicación requiere abrir esas rutas en el dominio y comprobar una recepción física v2. [Configuración y carga del firmware actual](../firmware/PluviaDos/LEEME.txt)
