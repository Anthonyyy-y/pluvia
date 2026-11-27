"""Bandeja privada. Las solicitudes originales se conservan sin alteraciones."""
from protocol import Problem
from store import iso
import time


def initialize(db):
    db.execute("""CREATE TABLE IF NOT EXISTS contact_read(
        id TEXT PRIMARY KEY, read_at DOUBLE PRECISION NOT NULL)""")


def listing(store, before=None):
    with store.db() as db:
        params = ()
        where = ""
        if before:
            cursor = db.execute("SELECT received,id FROM contact_requests WHERE id=?", (before,)).fetchone()
            if cursor is None:
                raise Problem(400, "Página de solicitudes incorrecta.")
            where = "WHERE c.received < ? OR (c.received = ? AND c.id < ?)"
            params = (cursor["received"], cursor["received"], cursor["id"])
        rows = db.execute("""SELECT c.*,r.read_at
            FROM contact_requests c LEFT JOIN contact_read r ON c.id=r.id
            """ + where + " ORDER BY c.received DESC,c.id DESC LIMIT 51", params).fetchall()
        unread = db.execute("""SELECT COUNT(*) AS total FROM contact_requests c
            LEFT JOIN contact_read r ON c.id=r.id WHERE r.read_at IS NULL""").fetchone()["total"]
    return {"items": [
        {"id": r["id"], "received_at": iso(r["received"]), "name": r["name"],
         "email": r["email"], "message": r["message"], "read_at": iso(r["read_at"])}
        for r in rows[:50]],
        "next": rows[49]["id"] if len(rows) > 50 else None, "unread": unread}


def read(store, ref):
    with store.db(True) as db:
        if not db.execute("SELECT id FROM contact_requests WHERE id=?", (ref,)).fetchone():
            raise Problem(404, "Solicitud desconocida.")
        db.execute("""INSERT INTO contact_read(id,read_at) VALUES(?,?)
            ON CONFLICT(id) DO NOTHING""", (ref, time.time()))
