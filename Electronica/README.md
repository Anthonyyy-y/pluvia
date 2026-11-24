# Electrónica de Pluvia

Código y recursos electrónicos organizados para su revisión académica.

## Firmware publicado

[MonitoreoAgua/MonitoreoAgua.ino](MonitoreoAgua/MonitoreoAgua.ino) y sus archivos auxiliares son una copia sin cambios del firmware que ya estaba publicado en `firmware/` antes de esta organización. [Guía de integración](Guia_integracion_ESP32.md) y [guía de montaje](GUIA_MONTAJE.txt).

Se conserva `firmware/` para mantener las referencias existentes. Esta organización no cambia el programa desplegado en la página ni actualiza la placa. El firmware publicado puede diferir de revisiones locales posteriores.

## Simulación electrónica

[Simulacion_Wokwi/](Simulacion_Wokwi/) contiene `diagram.json`, `sketch.ino`, bibliotecas y auxiliares del perfil local de simulación. Crear un proyecto ESP32 en Wokwi e importar estos archivos. La configuración lleva `SIMULACION_WOKWI = true`: emula el JSN con un HC-SR04, usa un depósito virtual y no envía datos a la API real. No equivale a una validación hidráulica o física.

Falta publicar el proyecto en Wokwi y registrar su enlace compartido. El enlace a esta carpeta de GitHub permite consultar los archivos, pero no ejecutar la simulación directamente.

## Alcance y pendientes

Los recursos corresponden al diseño de A1, A2 y A3. La propuesta posterior de dos desagües no está implementada aquí. Quedan pendientes la revisión del montaje, calibración y pruebas con el ESP32 físico. Ningún archivo `Secretos.h` se incluye; utilizar únicamente la plantilla de ejemplo y mantener las credenciales en privado.

Las pruebas `probar.py`, `prueba_contrato.cpp` y `tests/` se conservan con el firmware publicado. Las instrucciones originales de la guía siguen siendo válidas desde la carpeta raíz usando las rutas `firmware/`.
