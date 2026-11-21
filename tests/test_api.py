"""Pruebas por HTTP con bases efímeras. Ninguna fila de prueba entra en los datos de uso."""
import csv
import http.cookiejar
import io
import json
import secrets
import sqlite3
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from wsgiref.simple_server import WSGIRequestHandler, make_server

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"server"))
from app import Application, ThreadedServer
from demo import make_packet
from runtime import DEMO_ID
from simulator import Simulator


class Quiet(WSGIRequestHandler):
    def log_message(self,*args):
        pass


class API(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.env = {"DATA_DIR":self.directory.name,"MONITOR_PASSWORD":secrets.token_hex(16),
                    "DEVICE_TOKEN":secrets.token_hex(24),"DEVICE_ID":"placa-prueba",
                    "STALE_SECONDS":"5","OFFLINE_SECONDS":"12","DEMO_INTERVAL_SECONDS":".08"}
        if self._testMethodName == "test_timeout_persistencia_y_frescura":
            self.env.update(STALE_SECONDS=".55",OFFLINE_SECONDS="1.55")
        self.start_server()
        self.client = self.browser()

    def start_server(self):
        self.app = Application(self.env)
        self.http = make_server("127.0.0.1",0,self.app,server_class=ThreadedServer,handler_class=Quiet)
        self.worker = threading.Thread(target=self.http.serve_forever,daemon=True)
        self.worker.start()
        self.url = f"http://127.0.0.1:{self.http.server_port}/api/v1/"

    def stop_server(self):
        self.app.state.close()
        self.http.shutdown()
        self.http.server_close()
        self.worker.join()

    def tearDown(self):
        self.stop_server()
        self.directory.cleanup()

    @staticmethod
    def browser():
        return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def api(self,path,body=None,expect=200,client=None,token=None,extra=None):
        headers = {"Content-Type":"application/json"}
        if token:
            headers["Authorization"]="Bearer "+token
        headers.update(extra or {})
        raw = body if type(body) is bytes else json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.url+path,data=raw,headers=headers)
        try:
            res = (client or self.client).open(req,timeout=4)
        except urllib.error.HTTPError as error:
            res = error
        with res:
            text = res.read().decode("utf-8-sig")
            self.assertEqual(expect,res.status,(path,text))
            return json.loads(text) if "json" in res.headers.get("Content-Type","") else text

    def packet(self,seq,scenario="normal",boot="uno"):
        d = make_packet(self.env["DEVICE_ID"],boot,seq,seq*1000,scenario,9)
        d["source"]="REAL"
        return d

    def post(self,data,expect=201):
        return self.api("telemetry",data,expect,token=self.env["DEVICE_TOKEN"])

    def login(self):
        self.api("login",{"password":self.env["MONITOR_PASSWORD"]})

    def test_validacion_idempotencia_y_arranque(self):
        d = self.packet(1)
        self.api("telemetry",d,401,token="clave-erronea")
        wrong = dict(d,device_id="otra-unidad")
        self.post(wrong,403)
        self.post(d)
        self.assertTrue(self.post(d,200)["duplicate"])
        self.post(dict(d,uptime_ms=1150),409)
        self.post(self.packet(0),409)
        self.post(self.packet(0,boot="dos"))
        self.post(self.packet(2),409)
        mutations = [
            lambda v: v.update(version=True), lambda v:v.update(seq=10.25),lambda v:v.update(bogus="dato"),
            lambda v:v["points"]["A1"].update(height_pct=101),lambda v:v["points"]["A1"].update(valid=False),
            lambda v:v["points"]["A1"]["calibration"].update(confirmed=False),
            lambda v:v["points"]["A2"].update(reason="OK"),lambda v:v["light"].update(adc=-1),
            lambda v:v["network"].update(rssi_dbm="–58"),lambda v:v["points"]["A1"].update(age_ms=-1),
        ]
        for mutation in mutations:
            item = self.packet(3,boot="dos")
            mutation(item)
            self.post(item,422)
        for raw in (b'{"seq":1,"seq":2}',b'{"seq":NaN}',b'{'):
            self.api("telemetry",raw,400)
        self.api("login",{"password":self.env["MONITOR_PASSWORD"]},403,extra={"Origin":"https://otro.example"})

    def test_separacion_entre_visitantes_monitoreo_y_csv(self):
        self.api("snapshot?mode=real",expect=401)
        self.api("login",{"password":"incorrecta"},401)
        self.login()
        self.assertEqual("waiting",self.api("snapshot?mode=real")["connection"])
        self.assertIsNone(self.api("snapshot?mode=real")["packet"])
        self.api("demo/start",{})
        initial = self.api("demo/scenario",{"scenario":"tank_missing"})
        tank = initial["packet"]["points"]["DEPOSITO"]
        self.assertFalse(tank["installed"])
        self.assertIsNone(tank["height_cm"])
        self.assertEqual({"can_receive":False,"can_irrigate":False},initial["packet"]["tank"])
        self.assertFalse(initial["packet"]["outputs"]["drain"])
        self.assertFalse(initial["packet"]["outputs"]["irrigation"])
        second = self.browser()
        self.assertEqual("normal",self.api("demo/start",{},client=second)["scenario"])
        self.assertEqual([],self.api("events?mode=demo",client=second)["events"])
        self.assertTrue(self.api("events?mode=demo")["events"])
        self.assertEqual([],self.api("events?mode=real")["events"])
        self.assertEqual([],self.api("history?mode=real&hours=24")["rows"])
        csv_text = self.api("export.csv?mode=demo&hours=1")
        rows = list(csv.DictReader(io.StringIO(csv_text)))
        self.assertTrue(any(r["punto"]=="DEPOSITO" and r["altura_cm"]=="" for r in rows))
        self.assertEqual({"SIMULACION"},{r["origen"] for r in rows})
        self.assertEqual([],list(csv.DictReader(io.StringIO(self.api("export.csv?mode=real")))))
        self.api("logout",{})
        self.api("events?mode=real",expect=401)

    def test_incidentes_sse_reconocimiento_y_recuperacion(self):
        self.login()
        self.post(self.packet(1,"a2_alert"))
        self.post(self.packet(2,"a2_alert"))
        events = self.api("events?mode=real")["events"]
        self.assertEqual(["A2_high"],[e["key"] for e in events])
        idx = events[0]["id"]
        self.api(f"events/{idx}/ack?mode=real",{})
        self.api(f"events/{idx}/ack?mode=real",{})
        event = self.api("events?mode=real")["events"][0]
        self.assertIsNotNone(event["ack_at"])
        self.assertIsNone(event["resolved_at"])
        self.post(self.packet(3,"sensor_error"))
        self.assertTrue(any(e["key"]=="A2_fault" for e in self.api("events?mode=real")["events"]))
        self.post(self.packet(4))
        with self.client.open(self.url+"stream?mode=real",timeout=4) as stream:
            self.assertIn("text/event-stream",stream.headers["Content-Type"])
            def next_snapshot():
                for _ in range(36):
                    line = stream.readline()
                    if line.startswith(b"data: "):
                        return json.loads(line[6:])
                self.fail("No se recibió una instantánea SSE.")
            self.assertEqual(4,next_snapshot()["packet"]["seq"])
            self.post(self.packet(5,"a3_alert"))
            self.assertEqual(5,next_snapshot()["packet"]["seq"])
        event = next(e for e in self.api("events?mode=real")["events"] if e["id"]==idx)
        self.assertEqual(["opened","acknowledged","resolved"],[t["type"] for t in event["transitions"]])

    def test_timeout_persistencia_y_frescura(self):
        self.login()
        d = self.packet(1,"tank_missing")
        self.post(d)
        for status in ("stale","disconnected"):
            deadline = time.monotonic()+4
            while time.monotonic()<deadline:
                snap = self.api("snapshot?mode=real")
                if snap["connection"]==status:
                    break
                time.sleep(.04)
            self.assertEqual(status,snap["connection"])
            self.assertEqual(1,snap["packet"]["seq"])
        self.post(d,200)  # El reintento antiguo no renueva la recepción.
        self.assertEqual("disconnected",self.api("snapshot?mode=real")["connection"])
        self.post(self.packet(2))
        events = self.api("events?mode=real")["events"]
        for key in ("stale","offline","tank_missing"):
            e = next(e for e in events if e["key"]==key)
            self.assertIsNotNone(e["resolved_at"])
        self.stop_server()
        self.start_server()
        self.login()
        self.assertEqual(2,self.api("snapshot?mode=real")["packet"]["seq"])
        persisted = {e["id"]:e for e in self.api("events?mode=real")["events"]}
        for event in events:
            self.assertEqual(event,persisted[event["id"]])
        self.assertTrue(self.api("history?mode=real&hours=168")["rows"])

    def test_simulador_http_y_escenarios(self):
        sim = Simulator(self.url.removesuffix("/api/v1/"))
        sim.start()
        p = make_packet(DEMO_ID,"prueba",1,1000,"tank_missing")
        self.assertEqual(201,sim.send(p)[0])
        self.assertEqual(p,sim.call("snapshot?mode=demo")[1]["packet"])
        self.assertTrue(sim.call("events?mode=demo")[1]["events"])
        self.assertTrue(sim.call("history?mode=demo")[1]["rows"])
        self.api("telemetry",p,403,token=self.env["DEVICE_TOKEN"])
        self.api("demo/start",{})
        for scenario in ("normal","a1_rise","intervention","a2_alert","a3_alert","sensor_error","tank_missing","tank_full","offline","recovery"):
            snap = self.api("demo/scenario",{"scenario":scenario})
            self.assertEqual(scenario,snap["scenario"])
        bad = self.packet(1,"tank_missing")
        bad["outputs"]["drain"]=True
        self.post(bad,422)
        for dt,stage in [(0,"LIMPIANDO"),(5,"VERIFICANDO"),(8,"COMPUERTA"),(12,"DRENANDO"),(21,"REVISAR"),(25,"REPOSO")]:
            self.assertEqual(stage,make_packet(DEMO_ID,"ciclo",1,1000,"intervention",dt)["outputs"]["stage"])

    def test_solicitud_contacto_persistida(self):
        self.api("contact",{"name":"Un visitante","email":"invalido","message":"Seguimiento"},422)
        answer = self.api("contact",{"name":"Exposición","email":"ejemplo@example.org","message":"Quisiera una demostración."},201)
        with sqlite3.connect(str(Path(self.directory.name)/"real.sqlite3")) as db:
            self.assertEqual(("Exposición",),db.execute("SELECT name FROM contact_requests WHERE id=?",(answer["id"],)).fetchone())


if __name__ == "__main__":
    unittest.main(verbosity=2)
