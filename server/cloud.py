"""Adaptador PostgreSQL para las funciones de Vercel. Una transacción por petición."""
import hashlib
import json
import time
from contextlib import contextmanager

from protocol import Problem
from runtime import Runtime, digest
from store import SCHEMA, Store


def initialize(conn):
    if conn.execute("SELECT to_regclass('public.pluvia_limits') AS table_name").fetchone()["table_name"]:
        return
    schema = SCHEMA.replace("id INTEGER PRIMARY KEY", "id BIGSERIAL PRIMARY KEY").replace(" REAL", " DOUBLE PRECISION")
    conn.execute(schema)
    conn.execute("ALTER TABLE scopes ADD COLUMN IF NOT EXISTS simulation TEXT")
    conn.execute("CREATE TABLE IF NOT EXISTS contact_requests(id TEXT PRIMARY KEY, received DOUBLE PRECISION, name TEXT, email TEXT, message TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS pluvia_sessions(id TEXT PRIMARY KEY, expires DOUBLE PRECISION)")
    conn.execute("CREATE TABLE IF NOT EXISTS pluvia_limits(id TEXT PRIMARY KEY, times TEXT, expires DOUBLE PRECISION)")


class Database:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, args=()):
        sql = sql.replace("?", "%s").replace("ORDER BY at,rowid", "ORDER BY at,type")
        if "INSERT OR IGNORE INTO scopes" in sql:
            sql = sql.replace("INSERT OR IGNORE", "INSERT") + " ON CONFLICT DO NOTHING"
        if "INSERT INTO incidents(" in sql or "INSERT INTO readings(" in sql:
            cursor = self.conn.execute(sql + " RETURNING id", args)
            self.lastrowid = cursor.fetchone()["id"]
            return self
        return self.conn.execute(sql, args)


class CloudStore(Store):
    def __init__(self, conn, source):
        self.conn = conn
        self.source = source

    @contextmanager
    def db(self, write=False):
        yield Database(self.conn)


class Sessions:
    def __init__(self, conn):
        self.conn = conn

    def get(self, key, default):
        row = self.conn.execute("SELECT expires FROM pluvia_sessions WHERE id=%s", (key,)).fetchone()
        return row["expires"] if row else default

    def __setitem__(self, key, value):
        self.conn.execute("INSERT INTO pluvia_sessions VALUES(%s,%s)", (key,value))

    def pop(self, key, default):
        self.conn.execute("DELETE FROM pluvia_sessions WHERE id=%s", (key,))


class CloudRuntime(Runtime):
    clock = staticmethod(time.time)

    def __init__(self, conn, env, cookies):
        self.conn = conn
        super().__init__(env, {"real": CloudStore(conn,"REAL"), "demo": CloudStore(conn,"SIMULACION")})
        self.logins = Sessions(conn)
        token = cookies.get("pluvia_demo")
        if token:
            scope = digest(token)
            row = conn.execute("SELECT simulation FROM scopes WHERE scope=%s", (scope,)).fetchone()
            if row and row["simulation"]:
                self.live[scope] = json.loads(row["simulation"])

    def limited(self, key, maximum, period):
        identifier = hashlib.sha256(repr(key).encode()).hexdigest()
        now = time.time()
        row = self.conn.execute("SELECT times FROM pluvia_limits WHERE id=%s", (identifier,)).fetchone()
        times = [t for t in json.loads(row["times"]) if t > now-period] if row else []
        if len(times) >= maximum:
            raise Problem(429,"Demasiadas solicitudes. Vuelve a intentarlo más tarde.")
        times.append(now)
        self.conn.execute("INSERT INTO pluvia_limits VALUES(%s,%s,%s) ON CONFLICT(id) DO UPDATE SET times=excluded.times,expires=excluded.expires",
                          (identifier,json.dumps(times),now+period))

    def snapshot(self, mode, scope):
        run = self.live.get(scope)
        now = time.time()
        if run and not run["manual"] and run["scenario"] != "offline" and now-run["last"] >= self.period:
            self.emit(scope, now)
        self.stores[mode].watchdog(self.stale,self.offline,scope)
        return super().snapshot(mode,scope)

    def finish(self):
        for scope, run in self.live.items():
            self.conn.execute("UPDATE scopes SET simulation=%s,touched=%s WHERE scope=%s", (json.dumps(run),time.time(),scope))
