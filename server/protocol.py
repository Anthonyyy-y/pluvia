"""Contrato de telemetría 1. La clasificación siempre procede del emisor."""
import math
import re

POINTS = ("A1", "A2", "A3", "DEPOSITO")
STAGES = ("REPOSO", "LIMPIANDO", "VERIFICANDO", "COMPUERTA", "DRENANDO", "REVISAR", "ERROR_SENSOR")
FAULTS = {"SIN_SENSOR", "SIN_ECO", "OBJETO_DEMASIADO_CERCA", "FUERA_RANGO_SENSOR",
          "DISTANCIA_MAYOR_QUE_ALTURA", "REVISAR_ALTURA_Y_LIMITES", "CADUCADA"}
ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
UINT32 = 2**32 - 1


class Problem(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def require(condition, message):
    if not condition:
        raise Problem(422, message)


def keys(value, fields, name):
    require(type(value) is dict and set(value) == set(fields.split()), f"Campos incorrectos en {name}.")


def number(value, low, high, name, *, nullable=False, integer=False):
    if value is None and nullable:
        return
    allowed = (int,) if integer else (int, float)
    require(type(value) in allowed and low <= value <= high and math.isfinite(value),
            f"Valor fuera de rango o tipo incorrecto en {name}.")


def flag(value, name, nullable=False):
    require(isinstance(value, bool) or (nullable and value is None), f"Indicador inválido en {name}.")


def point(p, name):
    keys(p, "installed valid state reason distance_cm height_cm height_pct age_ms calibration", name)
    for key in ("installed", "valid"):
        flag(p[key], name + "." + key)
    number(p["distance_cm"], 0, 100000, name + ".distance_cm", nullable=True)
    number(p["height_cm"], 0, 100000, name + ".height_cm", nullable=True)
    number(p["height_pct"], 0, 100, name + ".height_pct", nullable=True)
    number(p["age_ms"], 0, UINT32, name + ".age_ms", nullable=True, integer=True)
    c = p["calibration"]
    keys(c, "confirmed empty_cm full_cm", name + ".calibration")
    flag(c["confirmed"], name + ".calibration.confirmed")
    for key in ("empty_cm", "full_cm"):
        number(c[key], 0, 100000, name + "." + key, nullable=True)
    require((c["empty_cm"] is None) == (c["full_cm"] is None), f"Geometría incompleta en {name}.")
    if c["empty_cm"] is not None:
        require(c["empty_cm"] > c["full_cm"], f"Geometría inválida en {name}.")
    if c["confirmed"]:
        require(p["installed"] and c["empty_cm"] is not None, f"Falta calibración en {name}.")
    if not p["installed"]:
        require(not p["valid"] and p["reason"] == "SIN_SENSOR" and p["distance_cm"] is None
                and p["age_ms"] is None, f"Sensor ausente inconsistente en {name}.")
    if p["valid"]:
        require(p["installed"] and p["state"] in ("NORMAL", "PRECAUCION", "ALERTA") and p["reason"] is None
                and p["distance_cm"] is not None and p["age_ms"] is not None, f"Lectura válida incompleta en {name}.")
        if p["height_cm"] is not None:
            require(c["empty_cm"] is not None, f"Altura sin geometría en {name}.")
        if p["height_pct"] is not None:
            require(c["confirmed"] and p["height_cm"] is not None, f"Porcentaje sin calibración en {name}.")
    else:
        require(p["state"] == "ERROR" and type(p["reason"]) is str and p["reason"] in FAULTS
                and p["height_cm"] is None and p["height_pct"] is None,
                f"Lectura inválida inconsistente en {name}.")
        require(p["reason"] != "SIN_SENSOR" or not p["installed"], f"Instalación contradictoria en {name}.")


def validate(data):
    keys(data, "version device_id source boot_id seq uptime_ms points outputs tank light network", "telemetría")
    require(type(data["version"]) is int and data["version"] == 1, "Versión de protocolo incompatible.")
    for key in ("device_id", "boot_id"):
        require(type(data[key]) is str and ID.fullmatch(data[key]), f"Identificador incorrecto en {key}.")
    require(data["source"] in ("REAL", "SIMULACION"), "Origen desconocido.")
    number(data["seq"], 0, UINT32, "seq", integer=True)
    number(data["uptime_ms"], 0, 2**53-1, "uptime_ms", integer=True)
    keys(data["points"], " ".join(POINTS), "points")
    for name in POINTS:
        point(data["points"][name], name)
    o, t, light, net = (data[k] for k in ("outputs", "tank", "light", "network"))
    keys(o, "motor gate_deg drain irrigation stage", "outputs")
    for name in ("motor", "drain", "irrigation"):
        flag(o[name], "outputs." + name, nullable=True)
    number(o["gate_deg"], 0, 180, "gate_deg", nullable=True)
    require(o["stage"] is None or o["stage"] in STAGES, "Etapa del ciclo desconocida.")
    keys(t, "can_receive can_irrigate", "tank")
    for key in ("can_receive", "can_irrigate"):
        flag(t[key], key, nullable=True)
    if not data["points"]["DEPOSITO"]["valid"]:
        require(t["can_receive"] is False and t["can_irrigate"] is False,
                "El depósito sin lectura válida debe informar ambos bloqueos.")
    for output, eligible in (("drain", "can_receive"), ("irrigation", "can_irrigate")):
        require(o[output] is not True or t[eligible] is True, "Salida incompatible con el bloqueo del depósito.")
    keys(light, "adc daylight", "light")
    number(light["adc"], 0, 4095, "adc", nullable=True, integer=True)
    flag(light["daylight"], "daylight", nullable=True)
    keys(net, "rssi_dbm", "network")
    number(net["rssi_dbm"], -127, 0, "rssi_dbm", nullable=True, integer=True)
    return data
