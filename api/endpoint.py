import logging
import os
import secrets
import sys
import time
from http import HTTPStatus
from pathlib import Path
from urllib.parse import parse_qs

import psycopg
from psycopg.rows import dict_row

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "server"))
from app import read_cookies, reply, route
from cloud import CloudRuntime, initialize
from protocol import Problem


def app(env, start_response):
    args = parse_qs(env.get("QUERY_STRING", ""))
    if env.get("PATH_INFO", "").rstrip("/") == "/api/endpoint":
        env["PATH_INFO"] = "/api/v1/" + args.get("resource", [""])[0]
    if env.get("HTTP_X_VERCEL_FORWARDED_FOR"):
        env["REMOTE_ADDR"] = env["HTTP_X_VERCEL_FORWARDED_FOR"].split(",")[0].strip()
    try:
        with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row, connect_timeout=8, prepare_threshold=None) as conn:
            # El prototipo comparte una sola maqueta; serializar evita dobles lecturas y reconocimientos.
            conn.execute("SELECT pg_advisory_xact_lock(1780993216)")
            initialize(conn)
            runtime = CloudRuntime(conn, {**os.environ, "COOKIE_SECURE":"true"}, read_cookies(env))
            try:
                if env.get("PATH_INFO") == "/api/v1/stream":
                    raise Problem(409, "Utiliza la actualización periódica del panel.")
                status, headers, body = route(runtime, env)
                body = list(body)
            except Problem as error:
                status, headers, body = reply(error.status, {"error":str(error)})
            runtime.finish()
            if secrets.randbelow(100) == 0:
                now = time.time()
                conn.execute("DELETE FROM pluvia_limits WHERE expires<%s", (now,))
                conn.execute("DELETE FROM pluvia_sessions WHERE expires<%s", (now,))
                conn.execute("DELETE FROM scopes WHERE scope<>%s AND touched<%s", (runtime.device,now-172800))
    except Exception:
        logging.exception("Error al atender la solicitud de Pluvia")
        status, headers, body = reply(503, {"error":"El servicio de monitoreo no está disponible en este momento."})
    start_response(f"{status} {HTTPStatus(status).phrase}", headers + [("X-Content-Type-Options","nosniff")])
    return body
