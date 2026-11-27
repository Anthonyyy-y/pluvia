"""Servidor WSGI de Pluvia; ejecución local con python3 server/app.py."""
import hmac
import json
import logging
import os
import mimetypes
import re
import secrets
import time
from http import HTTPStatus
from http.cookies import CookieError, SimpleCookie
from pathlib import Path
from socketserver import ThreadingMixIn
from urllib.parse import parse_qs, urlsplit
from wsgiref.simple_server import WSGIServer, make_server

from protocol import Problem, keys, validate
from runtime import DEMO_ID, ROOT, Runtime, configuration, digest

API = "/api/v1/"
PUBLIC = ROOT / "public"
MAX_BODY = 16384


def same_secret(expected, provided):
    return bool(expected) and hmac.compare_digest(expected.encode(), provided.encode())


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def reply(status, value, headers=()):
    return status, [("Content-Type","application/json; charset=utf-8"), ("Cache-Control","no-store"), *headers], [json_bytes(value)]


def read_object(env):
    if env.get("CONTENT_TYPE","").partition(";")[0].strip().lower() != "application/json":
        raise Problem(415, "Se requiere application/json.")
    try:
        size = int(env.get("CONTENT_LENGTH") or "")
    except ValueError:
        raise Problem(411,"Envía Content-Length.") from None
    if not 0 < size <= MAX_BODY:
        raise Problem(413,"El cuerpo excede el tamaño permitido o está vacío.")
    def unique(pairs):
        result = dict(pairs)
        if len(result) != len(pairs):
            raise ValueError("clave duplicada")
        return result
    def nonfinite(_):
        raise ValueError("número no finito")
    try:
        body = json.loads(env["wsgi.input"].read(size).decode("utf-8"),object_pairs_hook=unique,parse_constant=nonfinite)
    except (ValueError, UnicodeError, RecursionError):
        raise Problem(400,"JSON inválido, no finito o con claves duplicadas.") from None
    if type(body) is not dict:
        raise Problem(422,"El cuerpo debe ser un objeto JSON.")
    return body


def read_cookies(env):
    jar = SimpleCookie()
    try:
        jar.load(env.get("HTTP_COOKIE", ""))
    except CookieError:
        return {}
    return {key:m.value for key,m in jar.items()}


def cookie(key, value, secure=False, age=86400):
    parts = [f"{key}={value}", "Path=/api/v1/", "HttpOnly", "SameSite=Strict", f"Max-Age={age}"]
    if secure:
        parts.append("Secure")
    return ("Set-Cookie","; ".join(parts))


def sse(app, mode, scope, cookies):
    last_revision = None
    next_heartbeat = 0
    yield b"retry: 2000\n\n"
    while not app.closing.is_set():
        try:
            app.authorize(mode,cookies)
        except Problem:
            yield b'event: session-ended\ndata: {}\n\n'
            return
        data = app.snapshot(mode,scope)
        now = time.monotonic()
        if data["revision"] != last_revision or now >= next_heartbeat:
            last_revision = data["revision"]
            next_heartbeat = now+3
            yield b"event: snapshot\ndata: "+json_bytes(data)+b"\n\n"
        app.closing.wait(.5)


def static_file(path, head):
    if path.endswith("/"):
        path += "index.html"
    elif (PUBLIC/path.lstrip("/")).is_dir():
        path += "/index.html"
    target = (PUBLIC/path.lstrip("/")).resolve()
    if PUBLIC not in target.parents or any(p.startswith(".") for p in Path(path).parts) or not target.is_file():
        raise Problem(404,"Recurso no encontrado.")
    size = target.stat().st_size
    def chunks():
        with target.open("rb") as f:
            for chunk in iter(lambda:f.read(128*1024), b""):
                yield chunk
    mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return 200, [("Content-Type",mime),("Content-Length",str(size)),("Cache-Control","no-cache"),("X-Pluvia-API","1")], [] if head else chunks()


def route(app, env):
    method = env["REQUEST_METHOD"]
    path = env.get("PATH_INFO", "")
    if not path.startswith("/api/"):
        if method not in ("GET","HEAD"):
            raise Problem(405,"Método no disponible.")
        return static_file(path,method=="HEAD")
    if not path.startswith(API):
        raise Problem(404,"Versión de API no disponible.")
    action = path[len(API):]
    args = parse_qs(env.get("QUERY_STRING",""), max_num_fields=12)
    mode = args.get("mode",["demo"])[0]
    cookies = read_cookies(env)
    peer = env.get("REMOTE_ADDR","local")
    if method == "POST":
        origin = env.get("HTTP_ORIGIN")
        public_contact = action == "contact" and origin == os.environ.get("PUBLIC_WEB_ORIGIN")
        if origin and not public_contact and urlsplit(origin).netloc != env.get("HTTP_HOST"):
            raise Problem(403,"Origen web no autorizado.")
        data = read_object(env)
        if action == "telemetry":
            is_real = data.get("source") == "REAL"
            if is_real:
                auth = env.get("HTTP_AUTHORIZATION","")
                if not auth.startswith("Bearer ") or not same_secret(app.token,auth[7:]):
                    raise Problem(401,"Credenciales del dispositivo incorrectas.")
                if data.get("device_id") != app.device:
                    raise Problem(403,"Identificador de dispositivo no autorizado.")
                store,scope = app.stores["real"],app.device
            else:
                if env.get("HTTP_AUTHORIZATION"):
                    raise Problem(403,"La credencial física está reservada al origen REAL.")
                scope = app.authorize("demo",cookies)
                if data.get("device_id") != DEMO_ID or data.get("source") != "SIMULACION":
                    raise Problem(422,"Origen o dispositivo de demostración incorrecto.")
                with app.lock:
                    run = app.live.get(scope)
                    if not run or not run["manual"]:
                        raise Problem(409,"Inicia una sesión de simulador manual.")
                app.limited(("samples",scope),180,60)
                store = app.stores["demo"]
            fresh = store.ingest(scope,validate(data))
            return reply(201 if fresh else 200,{"accepted":True,"duplicate":not fresh})
        if action == "demo/start":
            if set(data) - {"manual"} or type(data.get("manual",False)) is not bool:
                raise Problem(422,"Inicio de demostración inválido.")
            scope,token = app.start(cookies.get("pluvia_demo",""),data.get("manual",False),peer)
            return reply(200,app.snapshot("demo",scope),[cookie("pluvia_demo",token,app.secure)])
        if action == "demo/scenario":
            keys(data,"scenario","escenario")
            scope = app.authorize("demo",cookies)
            app.limited(("scenarios",scope),90,60)
            app.scenario(scope,data["scenario"])
            return reply(200,app.snapshot("demo",scope))
        if action == "login":
            keys(data,"password","acceso")
            if not app.password:
                raise Problem(503,"Configura MONITOR_PASSWORD en el servidor para habilitar el acceso.")
            app.limited(("login",peer),12,60)
            if type(data["password"]) is not str or not same_secret(app.password,data["password"]):
                raise Problem(401,"Contraseña incorrecta.")
            token = secrets.token_urlsafe(32)
            with app.lock:
                app.logins[digest(token)] = app.clock()+8*3600
            return reply(200,{"authenticated":True},[cookie("pluvia_monitor",token,app.secure,8*3600)])
        if action == "logout":
            keys(data,"","salida")
            with app.lock:
                app.logins.pop(digest(cookies.get("pluvia_monitor","")),None)
            return reply(200,{"authenticated":False},[cookie("pluvia_monitor","",app.secure,0)])
        request_action = re.fullmatch(r"contacts/([a-f0-9]{16})/read", action)
        if request_action:
            app.authorize("real", cookies)
            keys(data, "", "solicitud")
            from contacts import read
            read(app.stores["real"], request_action.group(1))
            return reply(200, {"accepted": True})
        if action == "contact":
            keys(data,"name email message","solicitud")
            if not all(type(v) is str for v in data.values()):
                raise Problem(422,"Revisa los campos de la solicitud.")
            data = {k:v.strip() for k,v in data.items()}
            if not (1 <= len(data["name"]) <= 100 and 1 <= len(data["message"]) <= 3000
                    and len(data["email"]) <= 254 and re.fullmatch(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+",data["email"])):
                raise Problem(422,"Introduce un nombre, un correo válido y un mensaje de hasta 3000 caracteres.")
            app.limited(("contact",peer),5,3600)
            ref = secrets.token_hex(8)
            app.stores["real"].contact(ref,data)
            return reply(201,{"id":ref})
        match = re.fullmatch(r"events/([1-9][0-9]{0,15})/ack",action)
        if match:
            keys(data,"","reconocimiento")
            scope = app.authorize(mode,cookies)
            app.stores[mode].acknowledge(scope,int(match.group(1)))
            return reply(200,{"acknowledged":True})
    elif method == "GET":
        if action == "contacts":
            app.authorize("real", cookies)
            from contacts import listing
            result = listing(app.stores["real"], args.get("before", [None])[0])
            return reply(200, result)
        if action not in ("snapshot","stream","history","events","export.csv"):
            raise Problem(404,"Ruta de API desconocida.")
        scope = app.authorize(mode,cookies)
        store = app.stores[mode]
        if action == "snapshot":
            return reply(200,app.snapshot(mode,scope))
        if action == "events":
            return reply(200,store.events(scope))
        if action == "stream":
            return 200,[("Content-Type","text/event-stream; charset=utf-8"),("Cache-Control","no-store"),
                        ("X-Accel-Buffering","no")],sse(app,mode,scope,cookies)
        hours = args.get("hours",["1"])[0]
        if hours not in ("1","6","24","168"):
            raise Problem(422,"Elige una ventana de 1, 6, 24 o 168 horas.")
        if action == "history":
            return reply(200,store.history(scope,int(hours)))
        return 200,[("Content-Type","text/csv; charset=utf-8"),("Cache-Control","no-store"),
                    ("Content-Disposition",f'attachment; filename="telemetria-{mode}-{hours}h.csv"')],store.export(scope,int(hours))
    else:
        raise Problem(405,"Método no disponible.")
    raise Problem(404,"Ruta de API desconocida.")


class Application:
    def __init__(self, env):
        self.state = Runtime(env)

    def __call__(self, env, start):
        try:
            status,headers,body = route(self.state,env)
        except Problem as error:
            status,headers,body = reply(error.status,{"error":str(error)})
        except (ValueError,UnicodeError):
            status,headers,body = reply(400,{"error":"Solicitud mal formada."})
        except Exception:
            logging.exception("Error al procesar la solicitud")
            status,headers,body = reply(500,{"error":"El servidor no pudo procesar la solicitud."})
        if isinstance(body,list) and not any(k=="Content-Length" for k,v in headers):
            headers.append(("Content-Length",str(sum(map(len,body)))))
        headers.extend([("X-Content-Type-Options","nosniff"),("Referrer-Policy","strict-origin-when-cross-origin"),
                        ("X-Frame-Options","SAMEORIGIN")])
        start(f"{status} {HTTPStatus(status).phrase}",headers)
        return body


class ThreadedServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True
    # El navegador solicita estilos, módulos y texturas a la vez al cambiar de página.
    request_queue_size = 128


def create_application():
    return Application(configuration())


if __name__ == "__main__":
    settings = configuration()
    app = Application(settings)
    host = settings.get("HOST","127.0.0.1")
    port = int(settings.get("PORT",8080))
    try:
        with make_server(host,port,app,server_class=ThreadedServer) as server:
            print(f"Plataforma disponible en http://{host}:{server.server_port}",flush=True)
            server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        app.state.close()
