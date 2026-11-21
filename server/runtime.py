"""Ciclo de simulación independiente por visitante y vigilancia de conectividad."""
import hashlib
import logging
import math
import os
import secrets
import threading
import time
from collections import deque
from pathlib import Path

from demo import SCENARIOS, make_packet
from protocol import ID, Problem, validate
from store import Store

ROOT = Path(__file__).resolve().parents[1]
DEMO_ID = "pluvia-demo"


def configuration():
    settings = {}
    envfile = ROOT / ".env"
    if envfile.exists():
        for line in envfile.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.lstrip().startswith("#"):
                key, separator, value = line.partition("=")
                if not separator:
                    raise ValueError("Una línea de WEB/.env no tiene el formato CLAVE=valor.")
                settings[key.strip()] = value.strip()
    settings.update(os.environ)
    return settings


def digest(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class Runtime:
    clock = staticmethod(time.monotonic)

    def __init__(self, env, stores=None):
        self.device = env.get("DEVICE_ID", "pluvia-01")
        if not ID.fullmatch(self.device):
            raise ValueError("DEVICE_ID debe usar entre 1 y 64 letras ASCII, números, guiones o guiones bajos.")
        self.token = env.get("DEVICE_TOKEN", "")
        self.password = env.get("MONITOR_PASSWORD", "")
        self.secure = env.get("COOKIE_SECURE", "false").lower() == "true"
        self.stale = float(env.get("STALE_SECONDS", 10))
        self.offline = float(env.get("OFFLINE_SECONDS", 30))
        self.period = float(env.get("DEMO_INTERVAL_SECONDS", 2))
        if not (math.isfinite(self.offline) and 0 < self.period < self.stale < self.offline):
            raise ValueError("Se requiere 0 < intervalo de demo < caducidad < desconexión.")
        if stores is None:
            directory = ROOT / env.get("DATA_DIR", "data")
            directory.mkdir(mode=0o700, parents=True, exist_ok=True)
            stores = {"real":Store(directory/"real.sqlite3","REAL"), "demo":Store(directory/"demo.sqlite3","SIMULACION")}
        self.stores = stores
        self.stores["real"].create_scope(self.device)
        self.lock = threading.RLock()
        self.live = {}
        self.logins = {}
        self.limits = {}
        self.closing = threading.Event()
        self.watch = threading.Thread(target=self.run, name="Vigilancia", daemon=True)
        if type(self) is Runtime:
            self.watch.start()

    def limited(self, key, maximum, period):
        now = self.clock()
        with self.lock:
            times = self.limits.setdefault(key, deque())
            while times and times[0] < now-period:
                times.popleft()
            if len(times) >= maximum:
                raise Problem(429,"Demasiadas solicitudes. Vuelve a intentarlo más tarde.")
            times.append(now)

    def login(self, token):
        if not token:
            return False
        with self.lock:
            return self.logins.get(digest(token),0) > self.clock()

    def authorize(self, mode, cookies):
        if mode == "real":
            if not self.login(cookies.get("pluvia_monitor", "")):
                raise Problem(401, "Inicia sesión para consultar el monitoreo real.")
            return self.device
        if mode != "demo":
            raise Problem(400, "Selecciona mode=real o mode=demo.")
        token = cookies.get("pluvia_demo", "")
        scope = digest(token)
        if not token or not self.stores["demo"].exists(scope):
            raise Problem(401, "Inicia una sesión de demostración.")
        with self.lock:
            if scope in self.live:
                self.live[scope]["touched"] = self.clock()
        return scope

    def start(self, token, manual, ip):
        store = self.stores["demo"]
        scope = digest(token)
        with self.lock:
            if not token or not store.exists(scope):
                self.limited(("newdemo",ip),60,60)
                token = secrets.token_urlsafe(32)
                scope = digest(token)
                store.create_scope(scope)
            if scope not in self.live:
                now = self.clock()
                self.live[scope] = {"boot":secrets.token_hex(12),"start":now,"selected":now,"seq":0,"last":0,
                                    "scenario":"normal","touched":now,"manual":manual}
                if not manual:
                    self.emit(scope, now)
            self.live[scope]["touched"] = self.clock()
        return scope,token

    def emit(self, scope, now):
        run = self.live[scope]
        packet = make_packet(DEMO_ID, run["boot"], run["seq"], max(0,(now-run["start"])*1000),
                             run["scenario"], max(0,now-run["selected"]))
        self.stores["demo"].ingest(scope, validate(packet))
        run["seq"] += 1
        run["last"] = now

    def scenario(self, scope, selected):
        if selected not in SCENARIOS:
            raise Problem(422,"Escenario de demostración desconocido.")
        with self.lock:
            run = self.live.get(scope)
            if not run:
                raise Problem(409,"Vuelve a abrir la demostración para continuar.")
            now = self.clock()
            run.update(scenario=selected,selected=now,manual=False,touched=now)
            if selected != "offline":
                self.emit(scope, now)

    def snapshot(self, mode, scope):
        with self.lock:
            run = self.live.get(scope) if mode == "demo" else None
            scenario = run["scenario"] if run and not run["manual"] else None
        snapshot = self.stores[mode].snapshot(scope, self.device if mode == "real" else DEMO_ID, scenario)
        snapshot.update(stale_after_s=self.stale, disconnect_after_s=self.offline)
        return snapshot

    def run(self):
        next_cleanup = 0
        while not self.closing.is_set():
            try:
                now = self.clock()
                with self.lock:
                    for scope, run in list(self.live.items()):
                        if now-run["touched"] > 90:
                            del self.live[scope]
                        elif not run["manual"] and run["scenario"] != "offline" and now-run["last"] >= self.period:
                            self.emit(scope,now)
                    for store in self.stores.values():
                        store.watchdog(self.stale,self.offline)
                    if now >= next_cleanup:
                        self.logins = {k:v for k,v in self.logins.items() if v > now}
                        self.limits = {k:v for k,v in self.limits.items() if v and v[-1] > now-3600}
                        self.stores["demo"].prune(time.time()-2*86400,self.live)
                        next_cleanup = now+300
            except Exception:
                logging.exception("Fallo durante la vigilancia de telemetría")
            self.closing.wait(min(.5,self.period))

    def close(self):
        self.closing.set()
        self.watch.join(timeout=5)
