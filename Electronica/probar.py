#!/usr/bin/env python3
"""Ejecuta la suite local del proyecto y valida el JSON de la misma copia que se flashea."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

raiz = Path(__file__).resolve().parent
base = raiz / "tests"
sys.path.insert(0, str(raiz.parent / "server"))
from protocol import validate

perfiles = (
    ("sin_deposito", False, True, False),
    ("con_deposito", True, True, False),
    ("montaje_activo_low", True, False, False),
    ("simulacion_usb", True, True, True),
)
with tempfile.TemporaryDirectory(prefix="pluvia-pruebas-") as temporal:
    for nombre, deposito, demo, extendida in perfiles:
        print("Perfil", nombre, flush=True)
        sketch = Path(temporal) / nombre
        shutil.copytree(raiz / "MonitoreoAgua", sketch, ignore=shutil.ignore_patterns("Secretos.h"))
        cfg = sketch / "Configuracion.h"
        contenido = cfg.read_text()
        if deposito:
            contenido = contenido.replace("SENSOR_DEPOSITO_INSTALADO = false", "SENSOR_DEPOSITO_INSTALADO = true")
        if not demo:
            contenido = contenido.replace("MODO_DEMO = true", "MODO_DEMO = false")
            contenido = contenido.replace("{true, true, true}", "{false, false, false}")
        if extendida:
            contenido = contenido.replace("TELEMETRIA_EXTENDIDA = false", "TELEMETRIA_EXTENDIDA = true")
            contenido = contenido.replace("SIMULACION_WOKWI = false", "SIMULACION_WOKWI = true")
        cfg.write_text(contenido)
        if deposito:
            cal = sketch / "RedConfig.h"
            cal.write_text(cal.read_text().replace("{false, false, false, false}", "{true, true, true, true}"))
        compilador = ["c++", "-std=c++17", "-Wall", "-Wextra", "-Werror", "-fsanitize=address,undefined",
                      "-fno-omit-frame-pointer", "-I" + str(base / "stubs"),
                      '-DPIS_SKETCH="' + str(sketch / "MonitoreoAgua.ino") + '"']
        sistema = sketch / "control"
        subprocess.run([*compilador, str(base / "test_sistema.cpp"), "-o", str(sistema)], check=True)
        subprocess.run([str(sistema)], check=True)
        fuente = raiz / "prueba_contrato.cpp"
        contrato = sketch / "contrato"
        subprocess.run([*compilador, str(fuente), str(sketch / "Contrato.cpp"), "-o", str(contrato)], check=True)
        paquetes = subprocess.check_output([str(contrato)], text=True).splitlines()
        inicial, valido, fallo, caducado = [validate(json.loads(s)) for s in paquetes]
        assert inicial["points"]["A1"]["age_ms"] is None
        assert valido["points"]["A1"]["state"] == "PRECAUCION"
        assert valido["points"]["A1"]["height_cm"] == 15
        assert valido["points"]["A1"]["height_pct"] == (50 if deposito else None)
        assert valido["points"]["A1"]["age_ms"] == 75
        assert valido["points"]["DEPOSITO"]["installed"] == deposito
        if not deposito:
            assert not any(valido["tank"].values())
            assert not valido["outputs"]["drain"] and not valido["outputs"]["irrigation"]
        assert fallo["points"]["A1"]["reason"] == "OBJETO_DEMASIADO_CERCA"
        assert fallo["points"]["A1"]["distance_cm"] == 6 and fallo["points"]["A1"]["height_cm"] is None
        assert caducado["points"]["A1"]["reason"] == "CADUCADA"
        assert caducado["points"]["A1"]["distance_cm"] is None
print("Cuatro perfiles correctos. El validador de la API aceptó dieciséis mensajes de la integración.")
