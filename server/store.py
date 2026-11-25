"""Persistencia SQLite. Las muestras y los incidentes se actualizan en una transacción."""
import csv
import io
import json
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timezone

from protocol import POINTS, Problem

SCHEMA = """
CREATE TABLE IF NOT EXISTS scopes(
 scope TEXT PRIMARY KEY, latest INTEGER, revision INTEGER NOT NULL DEFAULT 0,
 connection TEXT NOT NULL DEFAULT 'waiting', touched REAL NOT NULL);
CREATE TABLE IF NOT EXISTS readings(
 id INTEGER PRIMARY KEY, scope TEXT NOT NULL REFERENCES scopes ON DELETE CASCADE,
 boot TEXT NOT NULL, seq INTEGER NOT NULL, received REAL NOT NULL, body TEXT NOT NULL,
 UNIQUE(scope, boot, seq));
CREATE INDEX IF NOT EXISTS readings_time ON readings(scope, received);
CREATE TABLE IF NOT EXISTS incidents(
 id INTEGER PRIMARY KEY, scope TEXT NOT NULL REFERENCES scopes ON DELETE CASCADE, key TEXT NOT NULL,
 origin TEXT NOT NULL, severity TEXT NOT NULL, description TEXT NOT NULL,
 opened REAL NOT NULL, ack REAL, resolved REAL);
CREATE UNIQUE INDEX IF NOT EXISTS open_incidents ON incidents(scope, key) WHERE resolved IS NULL;
CREATE INDEX IF NOT EXISTS incidents_time ON incidents(scope, opened);
CREATE TABLE IF NOT EXISTS transitions(
 incident INTEGER NOT NULL REFERENCES incidents ON DELETE CASCADE, at REAL NOT NULL, type TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS transition_incident ON transitions(incident, at);
"""


def iso(epoch):
    return None if epoch is None else datetime.fromtimestamp(epoch, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class Store:
    def __init__(self, path, source):
        self.path, self.source = path, source
        with self.db() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript(SCHEMA)
            if source == "REAL":
                db.execute("CREATE TABLE IF NOT EXISTS contact_requests(id TEXT PRIMARY KEY, received REAL, name TEXT, email TEXT, message TEXT)")

    @contextmanager
    def db(self, write=False):
        db = sqlite3.connect(str(self.path), timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            if write:
                db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def create_scope(self, scope):
        with self.db(True) as db:
            db.execute("INSERT OR IGNORE INTO scopes(scope,touched) VALUES(?,?)", (scope,time.time()))

    def exists(self, scope):
        with self.db() as db:
            return db.execute("SELECT 1 FROM scopes WHERE scope=?", (scope,)).fetchone() is not None

    def prune(self, before, active):
        with self.db(True) as db:
            for row in db.execute("SELECT scope FROM scopes WHERE touched < ?", (before,)).fetchall():
                if row["scope"] not in active:
                    db.execute("DELETE FROM scopes WHERE scope=?", (row["scope"],))

    def _condition(self, db, scope, key, origin, severity, description, active, now):
        current = db.execute("SELECT id FROM incidents WHERE scope=? AND key=? AND resolved IS NULL", (scope,key)).fetchone()
        if active and current is None:
            event = db.execute("""INSERT INTO incidents(scope,key,origin,severity,description,opened)
                VALUES(?,?,?,?,?,?)""",(scope,key,origin,severity,description,now)).lastrowid
            db.execute("INSERT INTO transitions VALUES(?,?,?)",(event,now,"opened"))
        elif not active and current is not None:
            db.execute("UPDATE incidents SET resolved=? WHERE id=?", (now,current["id"]))
            db.execute("INSERT INTO transitions VALUES(?,?,?)",(current["id"],now,"resolved"))

    def _connection(self, db, scope, previous, new, now):
        if previous == new:
            return
        self._condition(db, scope, "stale", "Conexión", "warning",
                        "Las mediciones han caducado por falta de paquetes recientes.",
                        new in ("stale","disconnected"), now)
        self._condition(db, scope, "offline", "Conexión", "critical",
                        "Se perdió la conexión con el dispositivo.", new == "disconnected", now)
        db.execute("UPDATE scopes SET connection=?,revision=revision+1 WHERE scope=?", (new,scope))

    def ingest(self, scope, data):
        body = json.dumps(data, ensure_ascii=False, sort_keys=True, allow_nan=False, separators=(",",":"))
        boot, seq = data["boot_id"], data["seq"]
        with self.db(True) as db:
            now = time.time()
            previous = db.execute("""SELECT s.connection,r.boot,r.seq,r.body FROM scopes s
                LEFT JOIN readings r ON r.id=s.latest WHERE s.scope=?""",(scope,)).fetchone()
            if previous is None:
                raise Problem(401,"La sesión ha caducado.")
            past = db.execute("SELECT body FROM readings WHERE scope=? AND boot=? AND seq=?", (scope,boot,seq)).fetchone()
            if past is not None:
                if past["body"] == body:
                    return False
                raise Problem(409,"La misma secuencia ya contiene otra muestra.")
            last_packet = json.loads(previous["body"]) if previous["body"] else None
            if previous["boot"] == boot:
                if seq <= previous["seq"] or data["uptime_ms"] < last_packet["uptime_ms"]:
                    raise Problem(409,"Muestra atrasada del mismo arranque.")
            elif db.execute("SELECT 1 FROM readings WHERE scope=? AND boot=? LIMIT 1", (scope,boot)).fetchone():
                raise Problem(409,"Paquete procedente de un arranque anterior.")
            row = db.execute("INSERT INTO readings(scope,boot,seq,received,body) VALUES(?,?,?,?,?)",
                             (scope,boot,seq,now,body)).lastrowid
            db.execute("UPDATE scopes SET latest=?,revision=revision+1,touched=? WHERE scope=?", (row,now,scope))
            self._connection(db,scope,previous["connection"],"connected",now)
            if last_packet and last_packet["version"] != data["version"]:
                # Las incidencias del montaje retirado pasan al archivo con su hora de cierre.
                abiertos = db.execute("""SELECT id FROM incidents WHERE scope=? AND resolved IS NULL
                    AND key NOT IN ('stale','offline')""", (scope,)).fetchall()
                for incidente in abiertos:
                    db.execute("UPDATE incidents SET resolved=? WHERE id=?", (now, incidente["id"]))
                    db.execute("INSERT INTO transitions VALUES(?,?,?)", (incidente["id"], now, "resolved"))
            if data["version"] == 2:
                for lectura in data["lecturas"]:
                    sensor, nivel = lectura["sensor"], lectura["valor"]
                    for key, active, severity, descripcion in (
                        ("fault", nivel is None, "critical", "sin eco válido"),
                        ("warning", nivel is not None and 5 <= nivel < 8, "warning", "nivel en precaución"),
                        ("high", nivel is not None and nivel >= 8, "critical", "nivel en alerta"),
                    ):
                        self._condition(db, scope, sensor + "_" + key, sensor, severity,
                                        f"{sensor}: {descripcion}.", active, now)
                return True
            for name in POINTS:
                p = data["points"][name]
                self._condition(db,scope,name+"_fault",name,"critical",
                                f"{name} informa un fallo de sensor ({p['reason']}).",(name != "DEPOSITO" or p["installed"]) and not p["valid"], now)
                if p["valid"]:
                    self._condition(db,scope,name+"_high",name,"warning",
                                    f"{name} informa nivel alto.",p["state"] == "ALERTA",now)
            tank = data["points"]["DEPOSITO"]
            self._condition(db,scope,"tank_missing","Depósito","warning",
                            "Medición del depósito no disponible. Ambas bombas están bloqueadas.",not tank["valid"],now)
            for key, label in (("can_receive","evacuación"),("can_irrigate","riego")):
                self._condition(db,scope,"block_"+key,"Depósito","warning",
                                f"El depósito bloquea la bomba de {label}.",tank["valid"] and data["tank"][key] is False,now)
        return True

    def watchdog(self, stale, offline, scope=None):
        now = time.time()
        with self.db(True) as db:
            for row in db.execute("""SELECT s.scope,s.connection,r.received FROM scopes s
                                JOIN readings r ON s.latest=r.id WHERE s.connection!='disconnected' AND r.received<=?""" + (" AND s.scope=?" if scope else ""),
                                  (now-stale, scope) if scope else (now-stale,)).fetchall():
                status = "disconnected" if now-row["received"] >= offline else "stale"
                self._connection(db,row["scope"],row["connection"],status,now)

    def snapshot(self, scope, device, scenario=None):
        with self.db() as db:
            row = db.execute("""SELECT s.connection,s.revision,r.received,r.body FROM scopes s
                LEFT JOIN readings r ON r.id=s.latest WHERE s.scope=?""",(scope,)).fetchone()
        if row is None:
            raise Problem(401,"Sesión inexistente o caducada.")
        received = row["received"]
        return {"source":self.source,"device_id":device,"connection":row["connection"],
                "received_at":iso(received),"age_s":None if received is None else round(max(0,time.time()-received),1),
                "packet":json.loads(row["body"]) if received is not None else None,
                "scenario":scenario,"revision":row["revision"]}

    def history(self, scope, hours):
        now = time.time()
        start = now-hours*3600
        # La última observación por intervalo conserva los nulos de la muestra original.
        with self.db() as db:
            rows = db.execute("""WITH bins AS (SELECT MAX(id) AS id FROM readings
                    WHERE scope=? AND received BETWEEN ? AND ?
                    GROUP BY CAST((received-?)/? AS INTEGER))
                    SELECT received,body FROM readings JOIN bins USING(id) ORDER BY received""",
                              (scope,start,now,start,hours*3600/720)).fetchall()
        def entry(row):
            packet = json.loads(row["body"])
            if packet["version"] == 2:
                return dict(received_at=iso(row["received"]), **{r["sensor"]: r["valor"] for r in packet["lecturas"]})
            points = packet["points"]
            return dict(received_at=iso(row["received"]), **{k:points[k]["height_cm"] for k in POINTS})
        return {"rows":[entry(r) for r in rows], "units":"cm", "hours":hours, "max_bins":720}

    def events(self, scope):
        with self.db() as db:
            rows = db.execute("""SELECT * FROM incidents WHERE scope=?
                ORDER BY (resolved IS NULL) DESC, opened DESC,id DESC LIMIT 250""",(scope,)).fetchall()
            events = []
            for row in rows:
                transitions = db.execute("SELECT at,type FROM transitions WHERE incident=? ORDER BY at,rowid",(row["id"],))
                events.append({**{k:row[k] for k in ("id","key","origin","severity","description")},
                               "source":self.source,"opened_at":iso(row["opened"]),"ack_at":iso(row["ack"]),
                               "resolved_at":iso(row["resolved"]),
                               "transitions":[{"at":iso(t["at"]),"type":t["type"]} for t in transitions]})
        return {"events":events}

    def acknowledge(self, scope, incident):
        with self.db(True) as db:
            row = db.execute("SELECT ack FROM incidents WHERE scope=? AND id=?", (scope,incident)).fetchone()
            if row is None:
                raise Problem(404,"Incidente no encontrado.")
            if row["ack"] is None:
                now = time.time()
                db.execute("UPDATE incidents SET ack=? WHERE id=?", (now,incident))
                db.execute("INSERT INTO transitions VALUES(?,?,?)",(incident,now,"acknowledged"))
                db.execute("UPDATE scopes SET revision=revision+1 WHERE scope=?", (scope,))

    def export(self, scope, hours):
        # Generador en ventanas cortas: no mantiene una transacción de lectura durante el envío al cliente.
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["recepcion_utc","origen","dispositivo","arranque","secuencia","uptime_ms","punto",
                         "instalado","valido","estado","fallo","distancia_cm","altura_cm","altura_util_pct","edad_ms",
                         "calibracion_confirmada","vacio_cm","lleno_cm","motor_orden","compuerta_orden_grados",
                         "evacuacion_orden","riego_orden","etapa","deposito_admite_agua","deposito_permite_riego",
                         "ldr_adc","luz_suficiente","rssi_dbm","reserva_estimada_s","muestra_ts_ms","compuerta_abierta"])
        yield ("\ufeff"+out.getvalue()).encode("utf-8")
        end = time.time()
        after = 0
        while True:
            with self.db() as db:
                rows = db.execute("""SELECT id,received,body FROM readings WHERE scope=? AND id>? AND received BETWEEN ? AND ?
                                     ORDER BY id LIMIT 128""",(scope,after,end-hours*3600,end)).fetchall()
            if not rows:
                break
            out.seek(0)
            out.truncate(0)
            for row in rows:
                d = json.loads(row["body"])
                base = [iso(row["received"]),d["source"],d["device_id"],d["boot_id"],d["seq"],d["uptime_ms"]]
                if d["version"] == 2:
                    for r in d["lecturas"]:
                        v = r["valor"]
                        status = "ERROR" if v is None else "ALERTA" if v >= 8 else "PRECAUCION" if v >= 5 else "NORMAL"
                        fields = [r["sensor"], True, v is not None, status, "SIN_ECO" if v is None else None,
                                  None, v, None, d["uptime_ms"]-r["ts"], None, None, None]
                        outputs = [r["motorEstado"], None, None, r["bombaEstado"], None, None, None, None,
                                   r["luz"], None, r["reservaEstimadaS"], r["ts"], r["compuertaAbierta"]]
                        writer.writerow([("'" + v if isinstance(v,str) and v.startswith(("-","=","+","@")) else v)
                                         for v in base + fields + outputs])
                    continue
                o,t,l = d["outputs"],d["tank"],d["light"]
                tail = [o["motor"],o["gate_deg"],o["drain"],o["irrigation"],o["stage"],t["can_receive"],t["can_irrigate"],
                        l["adc"],l["daylight"],d["network"]["rssi_dbm"]]
                for name,p in d["points"].items():
                    fields = [name]+[p[k] for k in ("installed","valid","state","reason","distance_cm","height_cm","height_pct","age_ms")]
                    fields.extend(p["calibration"][k] for k in ("confirmed","empty_cm","full_cm"))
                    writer.writerow([("'" + v if isinstance(v,str) and v.startswith(("-","=","+","@")) else v)
                                     for v in base+fields+tail+[None,None,None]])
            after = rows[-1]["id"]
            yield out.getvalue().encode("utf-8")

    def contact(self, ref, data):
        with self.db(True) as db:
            db.execute("INSERT INTO contact_requests VALUES(?,?,?,?,?)",
                       (ref,time.time(),data["name"],data["email"],data["message"]))
