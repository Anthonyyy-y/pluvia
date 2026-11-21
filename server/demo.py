"""Guion ilustrativo. Los porcentajes describen altura sobre geometría virtual."""
import math

SCENARIOS = ("normal", "a1_rise", "intervention", "a2_alert", "a3_alert", "sensor_error",
             "tank_missing", "tank_full", "offline", "recovery")
GEOMETRY = {"A1": (60, 30), "A2": (20, 4), "A3": (20, 4), "DEPOSITO": (25, 5)}


def sample(name, percent, installed=True, fault=None):
    empty, full = GEOMETRY[name]
    valid = installed and fault is None
    height = round((empty - full) * percent / 100, 2) if valid else None
    return {
        "installed": installed, "valid": valid,
        "state": ("ERROR" if not valid else "ALERTA" if percent >= 75 else "PRECAUCION" if percent >= 50 else "NORMAL"),
        "reason": ("SIN_SENSOR" if not installed else fault),
        "distance_cm": round(empty-height, 2) if valid else None, "height_cm": height,
        "height_pct": round(percent, 2) if valid else None, "age_ms": 110 if installed else None,
        "calibration": {"confirmed": installed, "empty_cm": empty if installed else None,
                        "full_cm": full if installed else None},
    }


def make_packet(device, boot, seq, uptime_ms, scenario="normal", elapsed=0):
    wave = math.sin(uptime_ms / 19000)
    levels = {"A1": 32 + 3*wave, "A2": 21 + 2*wave, "A3": 27 - 2*wave, "DEPOSITO": 56 + wave}
    stage = "REPOSO"
    if scenario == "a1_rise":
        levels["A1"] = min(86, 47 + 3*elapsed)
    if scenario == "intervention":
        stage = next((value for end, value in [(4, "LIMPIANDO"), (7, "VERIFICANDO"), (11, "COMPUERTA"),
                                               (19, "DRENANDO"), (23, "REVISAR")] if elapsed < end), "REPOSO")
        levels["A1"] = 83 if elapsed < 23 else 31
    if scenario in ("a2_alert", "a3_alert"):
        levels["A2" if scenario == "a2_alert" else "A3"] = 84 + wave
    if scenario == "tank_full":
        levels["DEPOSITO"] = 95
    absent = scenario == "tank_missing"
    points = {name: sample(name, level, installed=not (name == "DEPOSITO" and absent),
                           fault="SIN_ECO" if name == "A2" and scenario == "sensor_error" else None)
              for name, level in levels.items()}
    return {
        "version": 1, "device_id": device, "source": "SIMULACION", "boot_id": boot,
        "seq": seq, "uptime_ms": int(uptime_ms), "points": points,
        "outputs": {"motor": stage == "LIMPIANDO", "gate_deg": 90 if stage in ("COMPUERTA","DRENANDO","REVISAR") else 0,
                    "drain": stage == "DRENANDO", "irrigation": False, "stage": stage},
        "tank": {"can_receive": not absent and scenario != "tank_full", "can_irrigate": not absent},
        "light": {"adc": int(1070+55*wave), "daylight": True}, "network": {"rssi_dbm": -52+int(2*wave)},
    }
