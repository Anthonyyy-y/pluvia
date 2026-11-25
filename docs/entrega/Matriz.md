# Matriz de cumplimiento de Pluvia

**Revisión del 25 de noviembre de 2026.** Cada fila conserva el requisito de la ficha UTMACH. El estado describe la versión local entregada. Las validaciones de hardware, las aportaciones individuales y el despliegue de esta revisión se acreditan por separado.

**Cumple** indica que el componente o evidencia identificable cubre la fila. **Parcial** identifica lo implementado y la evidencia por completar. **Falta** indica que el material exigido aún se debe aportar.

## Indicaciones generales

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Propósito de la entrega · Publicar en Internet un sitio web informativo y de presentación comercial del proyecto, como si el prototipo fuera un producto tecnológico de una empresa ficticia. El sitio integra todo el trabajo del grupo: la idea y el problema que resuelve, el funcionamiento del prototipo, la simulación electrónica, los datos que envía el prototipo físico, las evidencias de construcción, el código (PSeInt, Java y electrónica) y el equipo. | Web local, modelo, monitor, simulación y código. [PENDIENTE: fotografías y validación física]. | Parcial |
| Entrega · Aunque el trabajo es grupal, todos los integrantes deben subir el documento completado en formato PDF en el EVEA. El documento contiene los datos y enlaces del equipo (sitio web, simulación y repositorio de GitHub) y el código QR; basta con los enlaces del líder del grupo. La página debe estar alojada en Internet con una URL pública funcional y tener un código QR para la Expoferia. | [PENDIENTE: presentación del PDF en EVEA por los ocho integrantes]. | Falta |
| Simulación electrónica · Puede realizarse en Wokwi, Tinkercad u otra herramienta similar, e incluso apoyarse en IA para armar las conexiones del circuito. Debe poder abrirse mediante un enlace y representar el funcionamiento del proyecto desarrollado. | /simulacion/ y proyecto Wokwi del equipo. [PENDIENTE: ejecución pública comprobada]. | Parcial |
| Código · El código se publica en un repositorio público de GitHub organizado en tres partes: PSeInt, Java y Electrónica. Todos los integrantes suben su aporte al repositorio; en este documento basta con el enlace del líder del grupo. | /tecnologia/ y repositorio del líder. [PENDIENTE: aportes y revisiones públicas]. | Parcial |
| Diseño y publicación · El diseño es libre, pero debe ser profesional, atractivo y coherente con el producto. Cada grupo elige la herramienta con la que construye el sitio y el servicio donde lo aloja, siempre que la URL sea pública y se vea correctamente desde computadoras y teléfonos celulares. | Sitio y QR públicos declarados. [PENDIENTE: despliegue y revisión en teléfonos]. | Parcial |
| Responsabilidad · La nota corresponde al equipo. Todos los integrantes deben poder explicar el sitio, la simulación, el código y el funcionamiento del prototipo ante el docente y ante los visitantes de la Expoferia. | [PENDIENTE: ensayo de exposición con todo el equipo]. | Falta |

## Ficha del equipo y enlaces

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Paralelo | C | Cumple |
| Grupo | 5 | Cumple |
| Líder del grupo (los enlaces de este documento son los suyos) | Anthony Jara | Cumple |
| Integrante 1 | Ricardo Sizalima | Cumple |
| Integrante 2 | Patrick Llanos | Cumple |
| Integrante 3 | Jesus Pauta | Cumple |
| Integrante 4 | Erick Changkuon | Cumple |
| Integrante 5 | Emily Quiñones | Cumple |
| Integrante 6 | Kleiner Toro | Cumple |
| Integrante 7 | Jalil Cuenca | Cumple |
| Integrante 8 | Anthony Jara (Lider) | Cumple |
| Nombre de la marca o empresa ficticia | Pluvia | Cumple |
| Nombre del producto | Pluvia | Cumple |
| Proyecto N.° y título (según la guía) | Proyecto 15. Prototipo de sistema de monitoreo y alerta temprana de obstrucciones en desagües pluviales mediante ESP32 y Java | Cumple |
| URL pública del sitio web | https://pluvia-mu.vercel.app/ | Cumple |
| Enlace de la simulación electrónica | https://wokwi.com/projects/481630393585899521 | Cumple |
| Enlace del repositorio público de GitHub (del líder del grupo) | https://github.com/Anthonyyy-y/pluvia | Cumple |
| Usuario de GitHub de cada integrante que subió su aporte | Anthony Jara: Anthonyyy-y Ricardo Sizalima: ricardosizalima08 Patrick Llanos: [PENDIENTE: usuario de GitHub] Jesus Pauta: jiv008 Erick Changkuon: ErickChangkuon Emily Quiñones: emipinargote08 Kleiner Toro: Kleiner1070 Jalil Cuenca: JFCL2008 | Parcial |
| Código QR del sitio (insertar la imagen aquí) | QR original en el Word y en /contacto/. [PENDIENTE: prueba de lectura en teléfono]. | Parcial |

## 1. Inicio

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Nombre de la marca o empresa ficticia | `/` · La portada presenta la marca Pluvia. | Cumple |
| Logotipo | `/` · El logotipo identifica el sitio en la cabecera. | Cumple |
| Eslogan | `/` · El eslogan «Drenaje inteligente» acompaña la identidad. | Cumple |
| Nombre del producto | `/` · Pluvia da nombre al producto y al sitio. | Cumple |
| Imagen principal del prototipo | `/` · El modelo y su imagen de respaldo muestran la maqueta. [PENDIENTE: fotografía real del prototipo]. | Parcial |
| Breve descripción del producto | `/` · La introducción presenta la vigilancia del drenaje y el riego demostrativo. | Cumple |

## 2. Sobre nosotros y el proyecto

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Cómo surgió la idea del proyecto | `/proyecto/` · El equipo explica su motivación ante el fenómeno de El Niño. | Cumple |
| Qué problema busca solucionar | `/proyecto/` · El proyecto identifica la acumulación de agua en los drenajes. | Cumple |
| Cuál es su propósito | `/proyecto/` · El propósito es vigilar niveles y orientar la inspección. | Cumple |
| Qué necesidad o situación motivó su desarrollo | `/proyecto/` · El proyecto sitúa la necesidad en el contexto urbano de Machala. | Cumple |

## 3. Nuestro producto

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Nombre y descripción | `/producto/` · La ficha presenta Pluvia y la maqueta de dos desagües. | Cumple |
| Características principales | `/producto/` · Explorador y catálogo describen sensores, control, filtro, estanque y bomba. | Cumple |
| Funcionalidades | `/producto/` · Las vistas del modelo muestran la captación, el desvío y el riego. | Cumple |
| Beneficios para el usuario | `/producto/` · La consulta de niveles sirve para priorizar inspecciones y explicar el reúso. | Cumple |
| Problema que resuelve y ventajas frente a una solución convencional | `/producto/` · Se expone el aporte de las lecturas y alertas frente a la sola inspección visual. | Cumple |

## 4. Cómo funciona

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Descripción del proceso de operación | `/funcionamiento/` · El recorrido sigue el tubo A–B, la T central y la línea de riego. | Cumple |
| Componentes electrónicos utilizados | `/funcionamiento/` · El montaje identifica los sensores, ESP32, motor, servo y bomba. | Cumple |
| Función de cada componente | `/funcionamiento/` · Las fichas de componentes del producto complementan el recorrido. | Cumple |
| Flujo de funcionamiento desde la lectura de los sensores hasta la respuesta del sistema | `/funcionamiento/` · El flujo relaciona eco, nivel, ESP32, señalización, actuación y panel. | Cumple |
| Diagrama o esquema de funcionamiento | `/funcionamiento/` · Las vistas y planos ilustran superficie, tuberías y corte frontal. | Cumple |

## 5. Simulación del proyecto

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Una explicación breve de la simulación | `/simulacion/` · La página distingue la electrónica virtual de las pruebas con agua. | Cumple |
| Imagen o vista previa del circuito | `/simulacion/` · La vista del circuito identifica los dos puntos y las salidas simuladas. | Cumple |
| Enlace funcional para acceder a la simulación electrónica | `/simulacion/` · El enlace del equipo responde con el proyecto PLUVIA, sketch.ino y diagram.json para D1/D2. [PENDIENTE: sesión pública de simulación en marcha]. | Cumple |
| Identificación de los componentes y conexiones utilizados | `/simulacion/` · El esquema y el archivo de Wokwi identifican sensores, LCD, servo y LED. | Cumple |

## 6. Monitoreo y datos en tiempo real

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Estado de conexión del dispositivo: conectado o desconectado | `/monitoreo/` · El monitor informa conexión y pérdida de señal. [PENDIENTE: captura de conexión con la placa]. | Parcial |
| Lecturas de los sensores o estados del sistema | `/monitoreo/` · El panel interpreta las lecturas de A y B. [PENDIENTE: registro real de la maqueta]. | Parcial |
| Indicadores visuales de los valores recibidos | `/monitoreo/` · Los indicadores representan niveles, alertas y órdenes. [PENDIENTE: captura con sensores físicos]. | Parcial |
| Fecha y hora de la última actualización | `/monitoreo/` · Se muestra el tiempo de actualización. [PENDIENTE: fecha de una recepción física]. | Parcial |
| Gráfico o historial de las mediciones, cuando corresponda | `/monitoreo/` · El panel permite consultar la serie. [PENDIENTE: histórico obtenido durante un ensayo con agua]. | Parcial |
| Mecanismo de comunicación implementado entre el prototipo y la página (explicar cómo llegan los datos) | `/monitoreo/` · El firmware comunica JSON por USB o Wi-Fi. [PENDIENTE: validación integrada desde el ESP32]. | Parcial |

## 7. Proceso de desarrollo

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Fotografías de los componentes | `/proceso/` · [PENDIENTE: fotos propias de los componentes]. | Falta |
| Fotografías del montaje electrónico | `/proceso/` · [PENDIENTE: fotos propias del cableado y montaje electrónico]. | Falta |
| Etapas de construcción y programación | `/proceso/` · Se describen las etapas de diseño, programación y pruebas. [PENDIENTE: fotos fechadas de construcción]. | Parcial |
| Fotografías del prototipo durante las pruebas | `/proceso/` · [PENDIENTE: fotos durante los ensayos con agua]. | Falta |
| Evidencias del producto terminado | `/proceso/` · [PENDIENTE: evidencias propias del prototipo físico terminado]. | Falta |

## 8. Desarrollo tecnológico y código

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| PSeInt: algoritmo y pseudocódigo del proyecto | `/tecnologia/` · Hay algoritmo y guías del equipo. [PENDIENTE: ejecución de la versión final en PSeInt y correspondencia con GitHub]. | Parcial |
| Java: traducción del algoritmo a lenguaje Java | `/tecnologia/` · El código Java local compila y pasa 15 verificaciones. [PENDIENTE: confirmación de la revisión publicada en GitHub]. | Parcial |
| Electrónica: código utilizado para programar el ESP32, Arduino u otro controlador | `/tecnologia/` · Se entrega el sketch PluviaDos. [PENDIENTE: confirmación de la revisión publicada en GitHub]. | Parcial |
| Enlace al repositorio público de GitHub | `/tecnologia/` · La sección enlaza el repositorio del líder del grupo. | Cumple |

## 9. Resultados y aplicaciones

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Qué se logró con el prototipo | `/resultados/` · Se documentan el modelo, el control y el monitor. [PENDIENTE: demostración física de extremo a extremo]. | Parcial |
| Pruebas realizadas y resultados observados | `/resultados/` · Las pruebas lógicas cuentan con resultados reproducibles. [PENDIENTE: resultados físicos con medidas de referencia]. | Parcial |
| Aplicaciones prácticas del producto | `/resultados/` · Se identifican supervisión de puntos críticos y riego de demostración. | Cumple |
| Limitaciones identificadas | `/resultados/` · Se describen la calibración y el carácter estimado del saldo. | Cumple |
| Posibles mejoras o funcionalidades futuras | `/resultados/` · Se plantea medir el estanque y comprobar el caudal real. | Cumple |

## 10. Nuestro equipo

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Fotografía individual de cada integrante | `/equipo/` · [PENDIENTE: ocho retratos individuales autorizados]. | Falta |
| Nombres y apellidos | `/equipo/` · La sección incluye los ocho nombres consignados en la ficha. | Cumple |
| Responsabilidad o función desempeñada en el proyecto | `/equipo/` · Se identifica a Anthony Jara como líder. [PENDIENTE: roles de los otros siete integrantes]. | Parcial |

## 11. Contacto

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Nombre de la marca o empresa ficticia | `/contacto/` · La sección identifica la marca Pluvia. | Cumple |
| Correo electrónico de contacto (puede ser ficticio) | `/contacto/` · [PENDIENTE: correo de contacto autorizado por el equipo]. | Falta |
| Redes sociales o enlaces de presentación del proyecto | `/contacto/` · Se incluyen los enlaces de presentación del sitio y del repositorio. | Cumple |
| Formulario visual de contacto, si lo consideran necesario | `/contacto/` · La sección conserva el formulario visual de contacto. | Cumple |

## Requisitos generales de desarrollo y presentación

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| Diseño visual · Libre, pero debe ser profesional, atractivo y coherente con el producto. | Once páginas con navegación común, identidad y recursos locales. | Cumple |
| Identidad comercial · Debe tener marca, logotipo, eslogan, nombre del producto y colores representativos. | Marca, producto, logotipo y eslogan de Pluvia. | Cumple |
| Publicación · La página debe estar alojada en Internet y contar con una URL pública funcional. | URL declarada en la ficha. [PENDIENTE: despliegue público de esta revisión]. | Parcial |
| Accesibilidad · Debe visualizarse correctamente desde computadoras y teléfonos celulares. | Diseño adaptable y vistas alternativas. [PENDIENTE: comprobación en un teléfono del equipo]. | Parcial |
| GitHub · Cada grupo debe tener un repositorio público con los códigos PSeInt, Java y electrónico. | La ficha identifica el repositorio y sus tres áreas. [PENDIENTE: publicación de revisiones y verificación de aportes individuales]. | Parcial |
| Simulación · Debe existir una simulación electrónica funcional y accesible mediante un enlace. | El proyecto de Wokwi y su circuito D1/D2 son accesibles. [PENDIENTE: ensayo de ejecución pública en Wokwi]. | Parcial |
| Monitoreo · Debe mostrar información real enviada por el prototipo físico. | Recepción y visualización implementadas. [PENDIENTE: mediciones del prototipo físico]. | Parcial |
| Evidencias · Debe incluir fotografías reales del proceso de construcción y del prototipo terminado. | [PENDIENTE: fotografías propias del proceso y del prototipo terminado]. | Falta |
| Expoferia · La página debe tener un código QR que permita a los visitantes ingresar directamente. | El QR de la ficha apunta al sitio declarado. [PENDIENTE: escaneo con un teléfono del equipo]. | Parcial |

## Organización del repositorio

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| README.md | Descripción y enlaces del repositorio del líder. | Cumple |
| PSeInt/ | Carpeta pública y algoritmo didáctico local. [PENDIENTE: verificar ejecución y revisión final del .psc en GitHub]. | Parcial |
| Java/ | Carpeta pública y traducción local para dos desagües, con 15 verificaciones aprobadas. [PENDIENTE: confirmar revisión publicada]. | Parcial |
| Electronica/ | Carpeta pública y firmware actualizado en la entrega. [PENDIENTE: confirmar revisión publicada]. | Parcial |

## Revisión antes de entregar

| Requisito de la ficha | Componente o evidencia | Estado |
| --- | --- | --- |
| 1. La URL pública abre sin errores y el sitio se ve correctamente desde computadora y desde teléfono celular. | URL de la ficha y sitio actualizado en la entrega. [PENDIENTE: verificar despliegue y acceso móvil]. | Parcial |
| 2. Las once secciones obligatorias están presentes y completas. | Se prepararon las once rutas. [PENDIENTE: fotografías, roles y datos físicos para completar su contenido]. | Parcial |
| 3. El sitio tiene marca, logotipo, eslogan, nombre del producto y colores representativos. | Marca, logo, eslogan, producto y paleta identificados en la web. | Cumple |
| 4. La simulación electrónica abre desde el enlace y representa el funcionamiento del proyecto. | El proyecto de Wokwi es público e identifica D1 y D2. [PENDIENTE: ensayo de ejecución pública]. | Parcial |
| 5. La sección de monitoreo muestra el estado de conexión, las lecturas, la fecha y hora de la última actualización y el historial, con datos enviados por el prototipo físico (no generados solo por la página). | Monitor con fuentes diferenciadas. [PENDIENTE: registro procedente de la placa física]. | Parcial |
| 6. Las fotografías del proceso de construcción y del prototipo terminado son reales; no se usan solo imágenes ilustrativas generadas por IA. | [PENDIENTE: fotografías propias del montaje, ensayos y producto terminado]. | Falta |
| 7. El repositorio de GitHub es público y está organizado en PSeInt, Java y Electrónica. | El equipo aporta la URL y tres áreas de código. [PENDIENTE: comprobar las últimas revisiones publicadas]. | Parcial |
| 8. Todos los integrantes subieron su aporte al repositorio y el enlace del líder está en este documento. | Líder y siete usuarios de GitHub identificados. [PENDIENTE: usuario de Patrick Llanos y aportes de los ocho integrantes]. | Parcial |
| 9. Todos los integrantes aparecen con fotografía individual, nombres y apellidos, y responsabilidad. | Ocho nombres y líder identificados. [PENDIENTE: fotografías y funciones individuales restantes]. | Parcial |
| 10. El código QR lleva directamente a la página y fue probado con un teléfono celular. | El QR original figura en la ficha. [PENDIENTE: ensayo de lectura con teléfono]. | Parcial |
| 11. Los enlaces de la simulación, GitHub y redes sociales funcionan y son de acceso público. | Wokwi y GitHub respondieron HTTP 200. Las páginas identificaron el proyecto y sus carpetas PSeInt, Java y Electronica. | Cumple |
| 12. El equipo puede explicar el sitio, la simulación, el código y el funcionamiento del prototipo, y demostrarlo en la Expoferia. | [PENDIENTE: ensayo de exposición y demostración con el equipo]. | Falta |
| 13. Cada integrante subió el documento en formato PDF a la tarea del EVEA. | [PENDIENTE: comprobantes de entrega de cada estudiante en EVEA]. | Falta |

**Pruebas confirmadas.** La clase `PruebasPluvia` pasó 15 verificaciones de control. La prueba nativa `control.cpp` pasó la secuencia de arranque, depósito estimado, prioridad de motor, rearme y desbordamiento del contador. Los registros del avance Java incluyen cuatro escenarios de consola. Wokwi y GitHub respondieron con sus páginas públicas.

## Autoverificación de la actualización solicitada

| Criterio de la actualización | Prueba o evidencia local | Estado |
|---|---|---|
| Once páginas independientes y menú persistente | En hosting estático local se recorrieron las 11 rutas a 375, 900 y 1920 px. Cada página ofreció los 11 destinos, con su propia URL y título. | Cumple |
| Portada, recorrido visual y accesibilidad | Hero con modelo, tipografía grande, fijación y giro ligados al scroll; revelado, parallax y contadores. La preferencia de movimiento reducido desactiva estas animaciones. Capturas en `Verificacion/`. | Cumple |
| Identidad conservada y dependencias locales | Logo original, nombre Pluvia, Inter y Three.js. La navegación y la demostración funcionan servidas desde la raíz de un alojamiento estático. | Cumple |
| Dos desagües y circuito del boceto | D1 y D2 comparten un tubo con derivación central hacia el filtro, estanque y bomba de riego. El modelo, los planos y las páginas de funcionamiento, simulación y monitoreo usan ambos puntos. | Cumple |
| Visor e identificación | 20 grupos de componentes, hotspots, selección por lista, resaltado, fichas y despiece. Se probaron las vistas de tuberías, frontal y superior cubierta y los planos alternativos sin WebGL. | Cumple |
| Carga, consola y enlaces internos | La interfaz muestra un estado de carga del visor. En las 33 combinaciones de ruta y ancho de la revisión estática se comprobaron los enlaces y recursos locales sin errores de consola ni desbordes horizontales. | Cumple |
| Demo, exportación y archivo anterior | Demo con cifra identificada, escenarios y CSV. Se conserva el acceso al historial v1. | Cumple |
| Ingestión USB y Wi-Fi | Web Serial y HTTP local implementados y probados con una fuente de ensayo; se validó el JSON real del serializador. El nuevo backend acepta v2. [PENDIENTE: confirmar recepción continua con la placa en el montaje físico]. | Parcial |
| Comunicación HTTPS/HTTP y sensor ausente | La página y el sketch documentan hosting local, USB y proxy seguro. El nivel del estanque se publica como null; la reserva estimada usa segundos. | Cumple |
| Campos de sustitución | `WEB/public/content.js` centraliza las fichas, recursos, fotos, equipo, resultados y contenido editorial del monitor. Los faltantes están visibles en la web y registrados en `Pendientes.md`. | Cumple |
| Word y fuentes | Informe de 16 páginas renderizado y revisado. Paquete ZIP con las fuentes completas, ejemplos de configuración y documentación. | Cumple |
| Revisión publicada y datos de campo | El sitio de la ficha, Wokwi y GitHub respondieron por HTTPS. [PENDIENTE: desplegar esta revisión y confirmar en producción una medición fechada del nuevo montaje]. | Parcial |

La suite final contra el servidor Python recorrió las once páginas a 320, 375, 768 y 1920 px. Pasaron el formulario registrado en la base temporal, la alternativa sin WebGL y el ensayo del monitor con USB emulado, HTTP local, nube de ensayo, reconocimiento de alertas y exportación CSV. También pasaron las once pruebas HTTP del backend. Para reproducir esta comprobación, consulta la sección de verificación de `WEB/README.md`.
