"""Envía muestras SIMULACION por HTTP al mismo endpoint usado por la placa."""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import sys
import time
import urllib.error
import urllib.request

from demo import SCENARIOS, make_packet
from runtime import DEMO_ID


class Simulator:
    def __init__(self, url, session=None, timeout=5):
        self.url = url.rstrip("/")
        self.timeout = timeout
        self.session = Path(session).expanduser() if session else None
        self.jar = http.cookiejar.MozillaCookieJar(str(self.session) if session else None)
        if self.session and self.session.exists():
            self.jar.load(ignore_discard=True)
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, path, body=None):
        data = None if body is None else json.dumps(body,allow_nan=False).encode()
        request = urllib.request.Request(self.url+"/api/v1/"+path, data=data,
                                         headers={"Content-Type":"application/json"} if data is not None else {})
        with self.client.open(request,timeout=self.timeout) as response:
            return response.status,json.load(response)

    def start(self):
        self.call("demo/start", {"manual": True})
        if self.session:
            fd = os.open(str(self.session),os.O_CREAT|os.O_APPEND,0o600)
            os.close(fd)
            self.jar.save(ignore_discard=True)

    def send(self, packet):
        for attempt in range(3):
            try:
                return self.call("telemetry",packet)
            except urllib.error.HTTPError as error:
                if error.code < 500 or attempt == 2:
                    raise
            except (urllib.error.URLError,TimeoutError):
                if attempt == 2:
                    raise
            time.sleep(2**attempt)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url",default="http://127.0.0.1:8080",help="Origen del servidor, incluido el esquema.")
    parser.add_argument("--scenario",choices=SCENARIOS,default="normal",help="Escenario ilustrativo.")
    parser.add_argument("--count",type=int,default=8,help="Número de muestras o intervalos sin envío.")
    parser.add_argument("--interval",type=float,default=2,help="Segundos entre muestras.")
    parser.add_argument("--timeout",type=float,default=5,help="Espera máxima por solicitud, en segundos.")
    parser.add_argument("--session",help="Ruta privada para reutilizar la misma sesión de simulación entre ejecuciones.")
    args = parser.parse_args()
    if args.count < 1 or args.interval <= 0 or args.timeout <= 0:
        parser.error("Revisa el número de muestras, el intervalo y el tiempo de espera.")
    simulator = Simulator(args.url,args.session,args.timeout)
    simulator.start()
    boot = secrets.token_hex(12)
    start = time.monotonic()
    print("Modo demostración — datos simulados")
    for seq in range(args.count):
        elapsed = time.monotonic()-start
        if args.scenario == "offline":
            time.sleep(args.interval)
        else:
            p = make_packet(DEMO_ID,boot,seq,int(elapsed*1000),args.scenario,elapsed)
            status,answer = simulator.send(p)
            print(f"Secuencia {seq} · HTTP {status} · {p['outputs']['stage']}",flush=True)
        if seq+1 < args.count and args.scenario != "offline":
            time.sleep(args.interval)
    _,snapshot = simulator.call("snapshot?mode=demo")
    print(f"Conexión {snapshot['connection']} · última recepción {snapshot['received_at']}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as error:
        print(f"HTTP {error.code}: {error.read().decode('utf-8',errors='replace')}",file=sys.stderr)
        sys.exit(1)
    except (OSError,ValueError) as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
