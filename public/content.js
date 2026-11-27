// Contenido público editable. Las rutas de fotografías son relativas a la raíz del sitio.
window.PLUVIA_CONTENT = {
  "routes": [
    {
      "slug": "",
      "title": "Inicio"
    },
    {
      "slug": "proyecto",
      "title": "Sobre nosotros y el proyecto"
    },
    {
      "slug": "producto",
      "title": "Nuestro producto"
    },
    {
      "slug": "funcionamiento",
      "title": "¿Cómo funciona?"
    },
    {
      "slug": "simulacion",
      "title": "Simulación del proyecto"
    },
    {
      "slug": "monitoreo",
      "title": "Monitoreo y datos en tiempo real"
    },
    {
      "slug": "proceso",
      "title": "Proceso de desarrollo"
    },
    {
      "slug": "tecnologia",
      "title": "Desarrollo tecnológico y código"
    },
    {
      "slug": "resultados",
      "title": "Resultados y aplicaciones"
    },
    {
      "slug": "equipo",
      "title": "Nuestro equipo"
    },
    {
      "slug": "contacto",
      "title": "Contacto"
    }
  ],
  "links": {
    "site": "https://pluvia-mu.vercel.app/",
    "github": "https://github.com/Anthonyyy-y/pluvia",
    "wokwi": "https://wokwi.com/projects/481630393585899521"
  },
  "contactEmail": "",
  "socialLinks": [],
  "monitor": {
    "cloudUrl": ""
  },
  "team": [
  {
    "name": "Anthony Jara",
    "role": "Líder del grupo · Integración del sistema y sitio web",
    "photo": "/assets/equipo/anthony.webp",
    "github": "Anthonyyy-y"
  },
  {
    "name": "Ricardo Sizalima",
    "role": "Programación en Java y validación de entradas",
    "photo": "/assets/equipo/ricardo.webp",
    "github": "ricardosizalima08"
  },
  {
    "name": "Patrick Llanos",
    "role": "Montaje de la maqueta y circuito hidráulico",
    "photo": "/assets/equipo/patrick.webp",
    "github": "patrickllanos"
  },
  {
    "name": "Jesus Pauta",
    "role": "Electrónica y conexiones del ESP32",
    "photo": "/assets/equipo/jesus.webp",
    "github": "jiv008"
  },
  {
    "name": "Erick Changkuon",
    "role": "Sensores y calibración de niveles",
    "photo": "/assets/equipo/erick.webp",
    "github": "ErickChangkuon"
  },
  {
    "name": "Emily Quiñones",
    "role": "Documentación técnica y presentación del proyecto",
    "photo": "/assets/equipo/emily.webp",
    "github": "emipinargote08"
  },
  {
    "name": "Kleiner Toro",
    "role": "Diseño de la maqueta y catálogo de materiales",
    "photo": "/assets/equipo/kleiner.webp",
    "github": "Kleiner1070"
  },
  {
    "name": "Jalil Cuenca",
    "role": "Simulación electrónica y pruebas del controlador",
    "photo": "/assets/equipo/jalil.webp",
    "github": "JFCL2008"
  }
],
  "teachers": [
    {
        "name": "Ing. Carlos Vargas",
        "course": "Técnicas de Programación",
        "photo": "/assets/docentes/carlos-vargas.jpeg"
    },
    {
        "name": "Ing. Richard Sucuy",
        "course": "Lógica Matemática",
        "photo": "/assets/docentes/richard-sucuy.jpeg"
    },
    {
        "name": "Mgtr. Elmer Gallardo",
        "course": "Lenguaje y Comunicación",
        "photo": "/assets/docentes/elmer-gallardo.jpeg"
    }
],
  "media": {
  "components": "",
  "assembly": "/assets/evidencias/montaje-electronico.webp",
  "tests": "",
  "prototype": "",
  "observations": "",
  "construction": [
    {
      "photo": "/assets/evidencias/construccion-superior.webp",
      "caption": "Construcción de la maqueta. Vista superior de las dos cámaras conectadas por el tubo y la derivación central."
    },
    {
      "photo": "/assets/evidencias/construccion-frontal.webp",
      "caption": "Construcción de la maqueta. Soportes de las cámaras y unión en T antes de completar el ramal de filtrado y riego."
    }
  ]
},
  "results": {
    "measurement": "",
    "method": "",
    "date": ""
  },
  "titles": {
    "proyecto": [
      "Sobre nosotros y el proyecto",
      "Cuando la calle se inunda.",
      "La acumulación de agua en las calles de Machala motivó a nuestro equipo a observar lo que ocurre bajo las rejillas. Pluvia nace de esa pregunta."
    ],
    "producto": [
      "Nuestro producto",
      "Debajo de la calle.",
      "Explora el prototipo de Pluvia. Abre la calzada para identificar los sensores, el filtro y el circuito de riego."
    ],
    "funcionamiento": [
      "¿Cómo funciona?",
      "Del desagüe al riego.",
      "Sigue el recorrido del agua desde las dos rejillas hasta el dispersor de la zona verde."
    ],
    "simulacion": [
      "Simulación del proyecto",
      "Ensaya los niveles.",
      "Cambia la altura de agua en cada desagüe y observa qué umbral alcanza. En Wokwi puedes recorrer el programa completo y sus conexiones."
    ],
    "proceso": [
      "Proceso de desarrollo",
      "Del boceto al montaje.",
      "El trazado de los dos desagües guía las decisiones de construcción, cableado y programación."
    ],
    "tecnologia": [
      "Desarrollo tecnológico y código",
      "Del sensor al navegador.",
      "Consulta el algoritmo, la implementación en Java y el programa del ESP32 que adquiere las lecturas y controla la maqueta."
    ],
    "resultados": [
      "Resultados y aplicaciones",
      "Lo que se pudo comprobar.",
      "Los ensayos de software validan decisiones del controlador. La precisión del nivel y el caudal del riego siguen pendientes de contrastar en la maqueta."
    ],
    "equipo": [
      "Nuestro equipo",
      "Las personas detrás de Pluvia.",
      "Grupo 5 · Paralelo C · Nivelación de Tecnologías de la Información · Universidad Técnica de Machala."
    ],
    "contacto": [
      "Contacto",
      "Conoce el prototipo.",
      "Escríbenos sobre la maqueta, su funcionamiento o una demostración para la Expoferia."
    ]
  },
  "sections": {
    hero: `<section class="hero" aria-labelledby="titulo">
        <div class="hero-grid" aria-hidden="true"></div>
        <div class="wrap hero-layout">
          <div class="hero-copy">
            <p class="kicker hero-kicker">
              <span class="signal"></span> Prototipo de drenaje urbano
            </p>
            <h1 id="titulo">Drenaje<br /><em>inteligente.</em></h1>
            <p class="hero-intro">
              Dos rejillas recogen la lluvia junto al bordillo. Bajo la calle,
              el sistema vigila el nivel y conduce el agua filtrada hasta un
              dispersor entre las plantas de la vereda.
            </p>
            <div class="hero-actions">
              <a class="btn btn-lime" href="/producto/#explorador"
                ><i data-icon="cube"></i>Explorar el sistema</a
              ><a class="btn btn-outline" href="/monitoreo/"
                ><i data-icon="wave"></i>Ver monitoreo</a
              >
            </div>
          </div>
          <figure class="hero-product">
            <div class="model-meta">
              <span class="mini-line"></span>
              <span data-section-label>Vista de superficie</span>
            </div>
            <div class="model-surface hero-surface" id="hero-model">
              <img
                class="model-poster"
                src="/assets/maqueta.webp"
                alt="Una cuadra con dos rejillas junto al bordillo y un pequeño parterre con dispersor en la vereda."
              /><span class="loading-model" role="status"
                >Preparando vista 3D…</span
              >
            </div>
            <figcaption>
              <span
                ><i data-icon="hand"></i
                ><span id="gesture-hint">Arrastra para girar</span></span
              ><span class="camera-buttons"
                ><button
                  type="button"
                  class="hero-cut"
                  data-hero="cut"
                  aria-pressed="false"
                  aria-controls="hero-model"
                >
                  <i data-icon="layers"></i><span>Ver subsuelo</span></button
                ><button
                  class="icon-button"
                  data-hero="out"
                  aria-label="Alejar maqueta"
                >
                  <i data-icon="minus"></i></button
                ><button
                  class="icon-button"
                  data-hero="in"
                  aria-label="Acercar maqueta"
                >
                  <i data-icon="plus"></i></button
                ><button
                  class="icon-button"
                  data-hero="reset"
                  aria-label="Restablecer cámara"
                >
                  <i data-icon="rotate"></i></button
              ></span>
            </figcaption>
          </figure>
        </div>
        <div class="wrap hero-foot">
          <span><b></b> Circunvalación Sur · Cuadra ilustrativa</span
          ><span
            >Modelo ilustrativo <span class="foot-sep">/</span> Dos desagües</span
          >
        </div>
      </section>`,
    story: `<section id="sistema" class="section wrap">
        <div class="section-lead">
          <div>
            <p class="kicker"><span class="dash"></span> El sistema</p>
            <h2>Del desagüe al riego.</h2>
          </div>
          <p>
            En esta cuadra, la lluvia corre por la cuneta hasta dos desagües.
            Si el nivel sube dentro de una alcantarilla, el aviso ayuda a
            decidir cuándo revisarla.
          </p>
        </div>
        <div class="story-grid">
          <article class="story">
            <div class="story-visual">
              <img
                src="/assets/estacion.webp"
                loading="lazy"
                alt="Detalle de la entrada D1 junto al bordillo y de la cámara de medición al abrir el corte"
              /><span>D1 · D2</span>
            </div>
            <h3>Medición en dos puntos</h3>
            <p>
              Bajo cada rejilla, un sensor mide la distancia hasta el agua. D1 incorpora el mecanismo de limpieza. D2 vigila el nivel en el extremo opuesto del tubo común.
            </p>
          </article>
          <article class="story">
            <div class="story-visual">
              <img
                src="/assets/filtro.webp"
                loading="lazy"
                alt="Detalle del filtro que descarga en el depósito bajo la calle"
              /><span>Filtro y depósito</span>
            </div>
            <h3>Limpieza y filtrado bajo la calle</h3>
            <p>
              Las paletas actúan en D1. La derivación central del tubo D1–D2 conduce el agua al filtro y al estanque nuevo. La compuerta regula el desvío.
            </p>
          </article>
          <article class="story">
            <div class="story-visual">
              <img
                src="/assets/riego.webp"
                loading="lazy"
                alt="Parterre de la vereda con plantas ornamentales y un dispersor conectado al riego subterráneo"
              /><span>Parterre de la vereda</span>
            </div>
            <h3>Riego del parterre cercano</h3>
            <p>
              Desde el estanque, la bomba de riego alimenta una tubería
              enterrada. Solo el cabezal del dispersor asoma entre las plantas
              ornamentales.
            </p>
          </article>
        </div>
      </section>`,
    explorer: `<section id="explorador" class="explorer section">
        <div class="wrap">
          <div class="section-lead">
            <div>
              <p class="kicker"><span class="dash"></span> Explorador 3D</p>
              <h2>Debajo de la calle.</h2>
            </div>
            <p>
              Empieza por las dos rejillas de la cuneta. Abre el corte del
              subsuelo para ver las cámaras, el depósito y la tubería que sube
              al parterre.
            </p>
          </div>
          <div class="explore-shell">
            <div class="explore-board">
              <div class="board-head">
                <span
                  ><i data-icon="cube"></i>
                  <span id="board-view-label" data-section-label
                    >Vista de superficie</span
                  ></span
                ><button id="tour" class="small-btn" aria-pressed="false">
                  <i data-icon="play"></i><span>Recorrido guiado</span>
                </button>
              </div>
              <div id="detail-model" class="model-surface explore-surface">
                <img
                  class="model-poster"
                  src="/assets/maqueta.webp"
                  alt="Cuadra ilustrativa de Circunvalación Sur con dos desagües en la calzada y un parterre en la vereda."
                /><span class="loading-model" role="status"
                  >Preparando vista 3D…</span
                >
              </div>
              <div id="explore-status" class="sr" role="status"></div>
              <div class="board-controls">
                <label class="camera-select"
                  ><i data-icon="view"></i
                  ><span class="sr">Vista de cámara</span
                  ><select id="view">
                    <option value="general">Vista general</option>
                    <option value="pipes">Superior (tuberías)</option>
                    <option value="front">Frontal</option>
                    <option value="covered">Superior cubierta</option>
                    <option value="detail">Vista de detalle</option>
                  </select></label
                ><span class="camera-buttons"
                  ><button
                    class="icon-button"
                    data-zoom="out"
                    aria-label="Alejar vista"
                  >
                    <i data-icon="minus"></i></button
                  ><button
                    class="icon-button"
                    data-zoom="in"
                    aria-label="Acercar vista"
                  >
                    <i data-icon="plus"></i></button
                  ><button
                    class="icon-button"
                    data-zoom="reset"
                    aria-label="Restablecer la vista general"
                  >
                    <i data-icon="rotate"></i></button
                ></span>
              </div>
            </div>
            <aside class="component">
              <label class="field-label" for="component-picker"
                >Componente seleccionado</label
              ><select id="component-picker"></select>
              <div class="component-info" aria-live="polite">
                <div class="module-icon" id="module-icon"></div>
                <p id="module-short" class="kicker"></p>
                <h3 id="module-name"></h3>
                <p id="module-description"></p><p id="module-spec"></p>
              </div>
              <p class="location">
                <b>Ubicación</b><span id="module-place"></span>
              </p>
              <a href="#materiales" class="text-link" id="open-material"
                ><i data-icon="book"></i>Consultar materiales</a
              >
            </aside>
          </div>
          <div class="viewer-options" aria-label="Capas de la maqueta">
            <button data-layer="points" aria-pressed="true">
              <i data-icon="view"></i>Puntos interactivos</button
            ><button data-layer="exploded" aria-pressed="false">
              <i data-icon="layers"></i>Vista explotada</button
            ><button data-layer="cut" aria-pressed="false">
              <i data-icon="layers"></i>Corte del subsuelo</button
            ><button data-layer="flow" aria-pressed="false">
              <i data-icon="droplet"></i>Recorrido del agua
            </button>
          </div>
          <p class="flow-key" id="flow-key" hidden>
            <span>Filtrado y riego</span><span>Colector D1–D2</span>
          </p>
          <p class="viewer-note">
            Cuadra ilustrativa. Las profundidades se han esquematizado para
            mostrar las conexiones. La animación explica los recorridos
            previstos.
          </p>
        </div>
      </section>`,
    materials: `<section id="materiales" class="section wrap">
        <div class="section-lead">
          <div>
            <p class="kicker"><span class="dash"></span> Materiales</p>
            <h2>Pieza por pieza.</h2>
          </div>
          <p>
            Consulta el inventario de montaje y localiza cada elemento en la
            maqueta. Los estados indican qué está previsto y qué queda por
            confirmar.
          </p>
        </div>
        <div class="catalog">
          <div class="catalog-list">
            <label class="field-label" for="category">Categoría</label
            ><select id="category"></select>
            <div
              id="material-list"
              role="group"
              aria-label="Materiales de la categoría"
            ></div>
          </div>
          <article class="material-detail" aria-live="polite">
            <div class="material-head">
              <span id="mat-state" class="status-chip"></span
              ><span id="mat-qty"></span>
            </div>
            <div id="material-art"></div>
            <h3 id="mat-name"></h3>
            <p id="mat-what"></p>
            <dl id="mat-spec"></dl>
            <a href="#explorador" class="text-link" id="locate-material"
              ><i data-icon="view"></i>Localizar en la maqueta</a
            >
          </article>
        </div>
      </section>`,
    preview: `<section class="monitor-preview">
        <div class="wrap monitor-layout">
          <div>
            <p class="kicker"><span class="dash"></span> Monitoreo</p>
            <h2>Una vista de todo<br />el sistema.</h2>
            <p>
              Consulta lecturas, estados reportados e incidentes. El panel
              conserva el historial y permite descargarlo en CSV.
            </p>
            <a class="btn btn-lime" href="/monitoreo/"
              ><i data-icon="monitor"></i>Abrir el panel</a
            >
          </div>
          <div class="preview-console">
            <div class="console-head">
              <span class="console-title"
                ><i data-icon="wave"></i> Niveles de agua</span
              ><span>cm</span>
            </div>
            <p class="demo-stamp">Dato de demostración</p>
            <div class="sample-row">
              <b>D1</b><span class="track"><i style="width: 48%"></i></span
              ><span>4,8 cm</span>
            </div>
            <div class="sample-row">
              <b>D2</b><span class="track"><i style="width: 25%"></i></span
              ><span>2,5 cm</span>
            </div>

            <p class="console-note">
              Ejemplo de lecturas de altura en dos puntos.
            </p>
          </div>
        </div>
      </section>`,
    tech: `<section id="tecnica" class="section wrap tech">
        <div>
          <p class="kicker"><span class="dash"></span> Información técnica</p>
          <h2>Del sensor <br />al navegador.</h2>
          <a
            class="text-link"
            href="/assets/guia-urbana.pdf"
            target="_blank"
            rel="noopener"
            ><i data-icon="book"></i>Guía de la maqueta urbana (PDF)</a
          >
        </div>
        <div class="tech-list">
          <details open>
            <summary>Arquitectura de comunicación</summary>
            <p>
              El ESP32 toma las lecturas y envía paquetes autenticados por Wi-Fi
              a la API HTTPS de Pluvia. El almacenamiento local utiliza SQLite y la publicación en Vercel utiliza PostgreSQL. También puedes consultar la placa desde el navegador por USB o por HTTP en la red local.
            </p>
          </details>
          <details>
            <summary>Alcance del prototipo</summary>
            <p>
              D1 incorpora mecanismos de intervención. D2 supervisa el nivel. Una altura elevada justifica inspeccionar el punto y puede
              tener distintas causas. La plataforma registra las salidas
              ordenadas por el controlador.
            </p>
          </details>
          <details>
            <summary>Calibración y protecciones</summary>
            <p>
              La altura útil ocupada requiere calibrar cada recipiente. El estanque carece de sensor. La reserva se estima en segundos de riego y requiere confirmar el vacío tras el arranque. La LCD, las señales y las
              protecciones funcionan localmente.
            </p>
          </details>
          <details>
            <summary>Planos de la cuadra</summary>
            <div class="plan-links">
              <a href="/assets/urbano-planta.svg" target="_blank" rel="noopener"
                >Planta de la calle</a
              ><a href="/assets/urbano-corte.svg" target="_blank" rel="noopener"
                >Corte y recorrido del agua</a
              >
            </div>
          </details>
          <details>
            <summary>Próxima validación física</summary>
            <p>
              Queda por medir la geometría final, contrastar la reserva del estanque y comprobar las lecturas, las cargas y el enlace Wi-Fi
              con el ESP32 montado. La realimentación de movimiento y las
              notificaciones en segundo plano son posibles ampliaciones.
            </p>
          </details>
        </div>
      </section>`,
    contact: `<section id="contacto" class="contact-strip">
        <div class="wrap">
          <div>
            <p class="kicker"><span class="dash"></span> Contacto</p>
            <h2>Conoce el prototipo.</h2>
          </div>
          <button class="btn btn-dark" id="contact-open">
            Solicitar una demostración
          </button>
        </div>
      </section>`,
    dialog: `<dialog id="contact-dialog" aria-labelledby="contact-heading">
      <form id="contact-form">
        <div class="dialog-head">
          <p class="kicker">Contacto</p>
          <button
            type="button"
            class="icon-button"
            aria-label="Cerrar formulario"
            id="contact-close"
          >
            <i data-icon="close"></i>
          </button>
        </div>
        <h2 id="contact-heading">Solicita una demostración.</h2>
        <p>Deja tus datos y cuéntanos qué te gustaría conocer del prototipo.</p>
        <label
          >Nombre<input
            required
            name="name"
            maxlength="100"
            autocomplete="name" /></label
        ><label
          >Correo electrónico<input
            required
            name="email"
            maxlength="254"
            type="email"
            autocomplete="email" /></label
        ><label
          >Mensaje<textarea
            required
            name="message"
            rows="3"
            maxlength="3000"
          ></textarea></label
        ><button class="btn btn-dark" type="submit">Registrar solicitud</button>
        <p id="form-result" role="status"></p>
      </form>
    </dialog>`,
  }
};
// Fichas de la maqueta. Cada clave coincide con un conjunto seleccionable en el visor.
Object.assign(window.PLUVIA_CONTENT, {
  modules: {
    a: {code:'A', name:'Desagüe A · D1', short:'Captación e intervención', icon:'droplet', place:'Extremo izquierdo de la cuneta', description:'Recoge lluvia y aloja el sensor principal y el motor con paletas. El ESP32 responde al nivel de esta cámara.', spec:'Altura útil de agua de diseño: 10 cm. La rejilla se desmonta para acceder al interior.'},
    b: {code:'B', name:'Desagüe B · D2', short:'Punto de supervisión', icon:'droplet', place:'Extremo derecho de la cuneta', description:'Su sensor mide el nivel del segundo desagüe y permite solicitar el desvío central. El motor de limpieza pertenece a A.', spec:'Altura útil de diseño: 10 cm. Las barras dibujadas en el frontal se representan como piezas pasivas pendientes de confirmar.'},
    sensorA: {code:'S·A', name:'Sensor ultrasónico de A', short:'Medición de nivel', icon:'sensor', place:'En el soporte sobre el agua de A', description:'Mide por eco la distancia desde la sonda hasta la superficie del agua.', spec:'JSN-SR04T en modo TRIG/ECHO. GPIO 13/34. Fondo nominal a 40 cm de la sonda.'},
    sensorB: {code:'S·B', name:'Sensor ultrasónico de B', short:'Medición de nivel', icon:'sensor', place:'Bajo la rejilla de B', description:'Mide la distancia al agua y permite comparar el estado de ambos extremos del tubo.', spec:'HC-SR04; TRIG/ECHO en GPIO 14/35. Fondo nominal a 14 cm del sensor.'},
    motor: {code:'M', name:'Motor y paletas de A', short:'Limpieza demostrativa', icon:'rotate', place:'Junto al sensor de A', description:'El eje mueve paletas que representan la intervención local frente a residuos simulados.', spec:'Motor DC, mando GPIO27. A partir de 8 cm estables durante 1 s, pulso de hasta 4 s según las protecciones.'},
    pipe: {code:'AB', name:'Tubo entre A y B', short:'Conexión principal', icon:'layers', place:'En línea recta entre las dos cámaras', description:'Une ambos desagües y conduce el agua hacia la unión central.', spec:'Tramo horizontal con uniones en ambos extremos. Longitud y diámetro definitivos por medir.'},
    junction: {code:'T', name:'Derivación central', short:'Reparto del caudal', icon:'layers', place:'A mitad del tubo A–B', description:'La conexión en T permite desviar agua hacia el filtro común.', spec:'Entrada lateral al ramal de filtrado. Se conserva la salida normal por gravedad.'},
    gate: {code:'G', name:'Compuerta y servo', short:'Control del desvío', icon:'rotate', place:'Sobre el ramal de la T, antes del filtro', description:'El servo abre el paso al filtro cuando sube el nivel en A o B y hay espacio estimado en el estanque.', spec:'GPIO23. Posiciones de mando de 0° y 90°. Apertura desde 5 cm y cierre con ambos niveles por debajo de 4 cm.'},
    filter: {code:'F', name:'Filtro de malla y esponja', short:'Filtración pasiva', icon:'layers', place:'Entre la derivación y el estanque', description:'Retiene residuos simulados antes de que el agua entre en la reserva para riego.', spec:'Cartucho extraíble con malla y medio poroso lavable. Funciona por gravedad.'},
    tank: {code:'EF', name:'Estanque de agua filtrada', short:'Reserva de riego', icon:'droplet', place:'Después del filtro, bajo la zona verde', description:'Recibe el agua del filtro y alimenta la única bomba de riego.', spec:'La reserva se estima por tiempo tras confirmar que está vacío. El prototipo de dos desagües carece de sensor de nivel en el estanque.'},
    pump: {code:'P', name:'Bomba de riego', short:'Impulsión', icon:'rotate', place:'En la salida del estanque', description:'Impulsa el agua filtrada al dispersor cuando hay iluminación, saldo estimado y permiso del control.', spec:'Minibomba de 5 V, mando GPIO17. Dosis nominal máxima de 5 s, limitada por el saldo disponible.'},
    irrigation: {code:'R', name:'Tubería de riego', short:'Conducción presurizada', icon:'droplet', place:'De la bomba al dispersor de la vereda', description:'Transporta el agua impulsada por la bomba y sube al cabezal del jardín.', spec:'Manguera con montante final. El caudal debe calibrarse con la conducción instalada.'},
    sprinkler: {code:'ASP', name:'Dispersor', short:'Salida del riego', icon:'droplet', place:'En el parterre de la vereda', description:'Distribuye el agua hacia las plantas de la zona verde.', spec:'Boquilla de riego conectada a la montante. El alcance ilustrado requiere medición.'},
    garden: {code:'ZV', name:'Zona verde', short:'Destino del agua', icon:'leaf', place:'Parterre central, detrás de las dos rejillas', description:'Las plantas ornamentales reciben el agua filtrada que impulsa el circuito de riego.', spec:'Parterre rectangular en la vereda; cubierta desmontable para acceder al circuito.'},
    control: {code:'C', name:'ESP32 y caja seca', short:'Control electrónico', icon:'control', place:'Compartimento seco bajo la vereda', description:'Lee los sensores, determina las órdenes de motor, compuerta y bomba, y actualiza los indicadores.', spec:'ESP32 clásico WROOM; dos entradas de eco con adaptación de tensión.'},
    lcd: {code:'LCD', name:'Pantalla LCD', short:'Lectura local', icon:'monitor', place:'Frente del compartimento seco', description:'Muestra los niveles de los dos desagües y el estado local del sistema.', spec:'LCD paralela 16 × 2. RS/E en GPIO21/22 y D4–D7 en GPIO25/26/33/4.'},
    leds: {code:'LED', name:'Indicadores luminosos', short:'Estado local', icon:'monitor', place:'Junto a la pantalla LCD', description:'Permiten reconocer visualmente el estado informado por el controlador.', spec:'Tres LED: verde, amarillo y rojo. GPIO2, GPIO5 y GPIO15 con resistencias.'},
    ldr: {code:'L', name:'Fotoresistencia', short:'Permiso de riego', icon:'sensor', place:'En una abertura iluminada de la caja seca', description:'Detecta la iluminación disponible para autorizar el riego.', spec:'LDR con divisor resistivo en GPIO32, entrada ADC1 del ESP32.'},
    driver: {code:'H', name:'Controlador de potencia', short:'Accionamiento', icon:'control', place:'En la caja seca, al lado del ESP32', description:'Conmuta la alimentación del motor y la minibomba a partir de las órdenes de la placa.', spec:'Puente L298N: ENA/ENB habilitan los dos canales. Alimentación de cargas y tierra común según el montaje.'},
    base: {code:'BAS', name:'Base de la maqueta', short:'Estructura', icon:'layers', place:'Bajo el conjunto', description:'Sostiene la calle, la vereda y el circuito hidráulico y permite acceder al subsuelo.', spec:'Base ilustrativa de 80 × 60 cm. Las alturas se ajustan para hacer visibles las conexiones.'}
  },
  catalogCategories: ['Control y sensores','Interfaz local','Mecanismos','Montaje eléctrico','Estructura e hidráulica'],
  // Categoría, ilustración, conjunto 3D, pieza del inventario, cantidad.
  catalogRows: [
    [0,0,'control','ESP32 WROOM','1'],[0,1,'sensorA','Sonda JSN-SR04T','1'],[0,2,'sensorB','Sensor HC-SR04','1'],[0,4,'ldr','Fotoresistencia LDR','1'],
    [1,5,'lcd','LCD paralela 16 × 2','1'],[1,6,'leds','LED verde, amarillo y rojo','3'],
    [2,9,'motor','Motor DC y paletas','1 conjunto'],[2,10,'gate','Servomotor de compuerta','1'],[2,12,'pump','Minibomba de riego','1'],[2,13,'driver','Módulo L298N','1'],
    [3,14,'leds','Resistencias de los LED','3','Limitan la corriente de los indicadores.'],[3,15,'ldr','Resistencia de la LDR','1','Forma el divisor de la entrada analógica.'],
    [3,16,'sensorB','Divisores de las señales ECHO','2','Adaptan a 3,3 V los ecos de A y B que entregan 5 V.'],
    [3,18,'lcd','Potenciómetro de contraste','1','Ajusta el contraste de la LCD.'],[3,19,'driver','Fuente de las cargas','1','Suministra energía al servo, al motor y a la bomba. La corriente de arranque requiere medición.'],
    [3,20,'control','Conectores y cableado','','Distribuyen las señales y las alimentaciones entre los módulos.'],
    [4,22,'base','Base urbana desmontable','1'],[4,23,'a','Cámara de A','1'],[4,36,'b','Cámara de B','1'],
    [4,24,'a','Rejillas de captación','2','Cubren las entradas de A y B junto al bordillo.'],
    [4,26,'pipe','Tubo A–B','1 tramo'],[4,34,'junction','Unión en T y ramal','1 conjunto'],
    [4,28,'filter','Filtro de malla y esponja','1 conjunto'],[4,29,'tank','Estanque de agua filtrada','1'],
    [4,27,'irrigation','Conducción de riego','1 tramo'],[4,31,'garden','Parterre','1 zona'],[4,33,'sprinkler','Dispersor de riego','1'],
    [4,32,'control','Caja seca de electrónica','1','Aísla las conexiones del recorrido del agua y facilita el acceso a la placa.']
  ]
});

// Textos y piezas de cada página. Cambia media, team y results arriba al incorporar evidencias.
(() => {
  const c = window.PLUVIA_CONTENT;
  const { sections: s, links } = c;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const link = (url, text) => `<a class="text-link field-link" href="${escape(url)}">${escape(text)} <span aria-hidden="true">↗</span></a>`;
  const shot = (src, caption, extra='') => `<figure class="project-figure ${extra}"><img src="${escape(src)}" alt="${escape(caption)}" loading="lazy"><figcaption>${escape(caption)}</figcaption></figure>`;
  const evidence = (key, name) => c.media[key] ? shot(c.media[key],name) :
    `<figure class="photo-pending"><div class="photo-field"><span aria-hidden="true">▧</span><span>TEMPORAL – reemplazar</span></div><figcaption>${escape(name)}</figcaption></figure>`;
  const title = key => {
    const [label, heading, intro] = c.titles[key];
    return `<section class="page-opening wrap"><p class="kicker"><span class="dash"></span>${label}</p><h1>${heading}</h1><p class="page-intro">${intro}</p></section>`;
  };
  const story = (heading, body, art) => `<section class="narrative wrap"><div class="pinned"><h2>${heading}</h2><p>${body}</p></div><div class="narrative-art">${art}</div></section>`;
  const item = (heading, text, action='') => `<article class="fact"><h3>${heading}</h3><p>${text}</p>${action}</article>`;
  const grid = (...rows) => `<div class="wrap facts-grid">${rows.join('')}</div>`;
  const titleIn = text => `<div class="wrap belt"><h2>${text}</h2></div>`;
  const demoBadge = '<span class="demo-chip">Dato de demostración</span>';
  c.labels = {menu:'Secciones', currently:'Estás en', monitor:'Monitoreo', next:'Siguiente', footer:'Sistema de drenaje pluvial inteligente'};
  const feature = (eyebrow, heading, copy, url, label, src) => `<section class="feature wrap"><div class="feature-art"><img src="${src}" alt="" loading="lazy"></div><div><p class="kicker"><span class="dash"></span>${eyebrow}</p><h2>${heading}</h2><p>${copy}</p>${link(url,label)}</div></section>`;
  c.pages = {
    inicio: () => '<div class="hero-sequence">'+s.hero+'</div>' + feature('Nuestro producto','Una cuadra por dentro.','Abre la maqueta para seguir el tubo que conecta D1 y D2. La derivación central recoge el agua para el riego.','/producto/','Explorar la maqueta','/assets/filtro.webp')
      + s.preview + '<div class="wrap evidence-home">' + evidence('prototype','Fotografía del prototipo terminado') + '</div>',
    proyecto: () => title('proyecto') + '<div class="counts wrap" aria-label="Configuración del proyecto"><div><b data-count="2">2</b><span>Desagües</span></div><div><b data-count="1">1</b><span>Estanque de riego</span></div><div><b data-count="8">8</b><span>Integrantes</span></div></div>' + story('El origen de la idea.','El equipo tomó como punto de partida los efectos de las lluvias asociadas a El Niño. En Circunvalación Sur, una cuadra ilustrativa sirve para estudiar cómo vigilar un desagüe cuando aumenta el nivel del agua.',shot('/assets/maqueta.webp','Representación de la cuadra de Circunvalación Sur.'))
      + grid(item('El problema','Una rejilla puede verse despejada desde la superficie mientras el nivel sube en la cámara. Esa subida es un motivo para inspeccionar el punto.'),item('Nuestro propósito','Medir el nivel, avisar al equipo y conducir parte de la escorrentía filtrada hacia un parterre cercano.'),item('El alcance','El proyecto integra electrónica, software y una maqueta de drenaje. Su aplicación en una calle real requeriría un estudio hidráulico y validación en campo.',link('/resultados/','Ver las aplicaciones'))),
    producto: () => s.explorer.replace('<h2>Debajo de la calle.</h2>','<h1>Debajo de la calle.</h1>') + s.materials,
    funcionamiento: () => s.story.replace('<h2>Del desagüe al riego.</h2>','<h1>Del desagüe al riego.</h1>') +
      story('La derivación central.','El tubo enlaza las dos cámaras. En su punto medio, la compuerta habilita el ramal que conduce al filtro. Desde el estanque nuevo, una bomba alimenta el dispersor.',shot('/assets/superior-tuberias.svg','Vista superior de las tuberías y de la derivación en T.')) +
      grid(item('Lectura','D1 utiliza un JSN-SR04T y D2 un HC-SR04. El controlador calcula la altura del agua a partir de la distancia al fondo configurada para cada punto.'),item('Respuesta','Con lecturas válidas y espacio estimado, cualquiera de los puntos puede solicitar el desvío. Solo D1 acciona el mecanismo de limpieza.'),item('Seguimiento','La LCD muestra los niveles. El monitor conserva la hora, los valores, las alertas y la orden de la bomba.',link('/monitoreo/','Abrir monitoreo'))),
    simulacion: () => title('simulacion') + `<section class="bench wrap"><div class="bench-controls">${demoBadge}<h2>Dos desagües.</h2><p>Desliza cada nivel para explorar los umbrales configurados. El ensayo completo de actuadores, luz y tiempos está en el circuito de Wokwi.</p><label for="sim-a">D1 · Desagüe A <output for="sim-a" id="val-a"></output></label><input id="sim-a" type="range" min="0" max="10" step=".5" value="3"><label for="sim-b">D2 · Desagüe B <output for="sim-b" id="val-b"></output></label><input id="sim-b" type="range" min="0" max="10" step=".5" value="2"><p class="sim-state" role="status" id="sim-state"></p></div><div class="sim-tanks"><div><i id="water-a"></i><b>D1</b></div><span></span><div><i id="water-b"></i><b>D2</b></div></div></section>` +
       story('El circuito en Wokwi.','El ESP32 recibe dos ecos ultrasónicos. El HC-SR04 virtual de D1 representa al JSN-SR04T del montaje. La LCD, el servo y la LDR participan en el ensayo. Los LED de carga representan el motor y la bomba. '+link(links.wokwi,'Iniciar Wokwi en línea'),shot('/descargas/circuito-wokwi.svg','Vista funcional de las conexiones de la simulación electrónica.')) +
       grid(item('Reproducir el ensayo','Inicia la simulación, confirma el depósito vacío con V y modifica la distancia de un sensor. Compara las indicaciones de la LCD y los LED de salida.'),item('Archivos del circuito','La descarga contiene el programa de simulación, diagram.json, las bibliotecas y las instrucciones.',link('/descargas/Wokwi_Pluvia.zip','Descargar proyecto Wokwi') + ' · ' + link('/descargas/diagram.json','Ver diagram.json'))),
    proceso: () => title('proceso') + story('Diseñar el recorrido.','Los planos digitales reúnen la planta de tuberías, el alzado frontal y la calle cubierta. La derivación a mitad del tubo A–B fija la posición del filtro y del estanque.', '<div class="digital-views">'+shot('/assets/superior-tuberias.svg','Vista superior de las tuberías y la derivación central.')+shot('/assets/frontal.svg','Vista frontal de los dos desagües.')+shot('/assets/urbano-planta.svg','Vista superior cubierta y zona verde.')+'</div>' ) +
        grid(item('Construcción','Preparar las dos cámaras y el tubo común, comprobar la derivación hacia el filtro y situar la salida de riego en la zona verde.'),item('Montaje electrónico','Adaptar las señales de eco, revisar las alimentaciones y conectar primero la placa y los sensores.',link('/descargas/Conexiones_Dos_Desagues.pdf','Consultar el cableado') + ' · ' + link('/descargas/alimentacion.png','Ver las fuentes de alimentación')),item('Programación y prueba','Comparar distancias con una regla, registrar el nivel de cada cámara y contrastar las órdenes del programa con el movimiento observado.')) +
        titleIn('Construcción de la maqueta.') + '<div class="wrap construction-gallery">'+c.media.construction.map(m=>shot(m.photo,m.caption)).join('')+'</div>' + titleIn('Registro del montaje.') + '<div class="wrap evidence-grid">'+[['components','Componentes físicos'],['assembly','Montaje electrónico'],['tests','Prueba con agua y regla'],['prototype','Producto terminado']].map(([k,n])=>evidence(k,k==='assembly'?'Montaje electrónico en proceso con protoboards, cableado y pantalla LCD.':n)).join('')+'</div>',
    tecnologia: () => title('tecnologia') + grid(item('PSeInt','El algoritmo didáctico del avance trabaja con un punto de monitoreo y valida las entradas antes de clasificar el nivel.',link('/descargas/MonitoreoPluvia.psc','Descargar pseudocódigo')),item('Java','La versión final procesa D1 y D2, valida entradas y prueba las reglas del controlador en consola.',link('/descargas/MonitoreoPluvia.java','Descargar código Java')),item('ESP32','El sketch de dos desagües integra sensores, compuerta, motor, riego y comunicaciones. Incluye las cabeceras de configuración.',link('/descargas/PluviaDos.zip','Descargar sketch de Arduino'))) +
        s.tech.replace('<h2>Del sensor <br />al navegador.</h2>','<h2>La arquitectura.</h2>') + '<div class="wrap resource-foot">'+link(links.github,'Ver el repositorio del equipo')+'</div>',
    resultados: () => title('resultados')+grid(item('Control de la maqueta','Las pruebas del controlador verifican las órdenes de la compuerta, el motor y el riego con entradas de ensayo.'),item('Software Java','La suite del avance final registra 15 comprobaciones de control y cuatro escenarios de consola. Son resultados de pruebas de software.'),item('Prueba física','El 23 de noviembre se observaron reinicios de la placa por baja tensión. La comprobación de ese día encontró el monitor real a la espera de su primera muestra.'))+
      story('Contrastar con el agua.',c.results.measurement?escape(c.results.measurement)+' '+escape(c.results.method)+' '+escape(c.results.date):'TEMPORAL – reemplazar · Faltan las series de nivel contrastadas con regla, la fecha, el montaje utilizado y las mediciones de caudal.',evidence('observations','Registro de resultados físicos')) +
      grid(item('Aplicaciones','Supervisión de puntos críticos de drenaje, orientación de inspecciones y riego demostrativo de áreas verdes.'),item('Limitaciones','Una altura elevada puede tener varias causas. La reserva se estima por tiempo de riego. Falta medir cuánta agua entra y sale en la instalación.'),item('Mejoras previstas','Incorporar realimentación del movimiento, medir directamente el estanque y evaluar notificaciones en segundo plano.')),
    equipo: () => title('equipo') + '<p class="wrap role-note">Distribución de responsabilidades propuesta para la presentación del proyecto.</p>' + '<section class="wrap team-grid">'+c.team.map(m=>`<article class="member">${m.photo?'<img class="portrait" alt="'+escape(m.name)+'" src="'+escape(m.photo)+'">':'<div class="portrait missing"><span class="initials" aria-hidden="true">'+escape(m.name.split(' ').map(w=>w[0]).join(''))+'</span><small>TEMPORAL – reemplazar</small></div>'}<h2>${escape(m.name)}</h2><p>${escape(m.role||'TEMPORAL – reemplazar · Función en el proyecto')}</p>${m.github?'<small>GitHub · '+escape(m.github)+'</small>':''}</article>`).join('')+'</section>'
      + '<section class="wrap faculty" aria-labelledby="faculty-heading">'
      + '<h2 id="faculty-heading">Docentes Responsables</h2>'
      + '<div class="faculty-grid">'
      + c.teachers.map(teacher => `
          <article class="faculty-card">
            <img class="portrait" src="${escape(teacher.photo)}" alt="${escape(teacher.name)}" loading="lazy">
            <h3>${escape(teacher.name)}</h3>
            <p>${escape(teacher.course)}</p>
          </article>`).join('')
      + '</div></section>',
    contacto: () => title('contacto')+s.contact.replace('<h2>Conoce el prototipo.</h2>','<h2>Solicita una demostración.</h2>')+s.dialog+
      '<section class="wrap contact-directory"><div><h2>Pluvia.</h2><p>Correo de contacto</p>'+ (c.contactEmail?link('mailto:'+c.contactEmail,c.contactEmail):'<span>Utiliza el formulario para contactar con Pluvia.</span>')+'<p>Enlaces del proyecto</p>'+[link(links.github,'Repositorio del equipo'),link(links.wokwi,'Simulación electrónica'),link('/solicitudes/','Bandeja privada del equipo'),...c.socialLinks.map(x=>link(x.url,x.label))].join(' ')+'</div>'+shot('/descargas/qr-pluvia.png','Escanea el QR para abrir el sitio público.','qr-figure')+'</section>'
  };
})();

// Contenido editorial del monitor. Conserva los id para sus controles y lecturas.
window.PLUVIA_CONTENT.monitor.html = `
      <div class="monitor-heading">
        <div>
          <p class="overline">Supervisión del prototipo</p>
          <h1>Monitoreo del sistema</h1>
          <p>
            Altura del agua en los dos desagües y órdenes de riego de la placa.
          </p>
        </div>
        <a class="outline-btn" href="/descargas/PluviaDos.zip" download
          >Descargar firmware ↓</a
        >
      </div>
      <section class="monitor-controls" aria-label="Origen de los datos">
        <div class="monitor-toolbar">
          <div class="source-tabs" role="group" aria-label="Seleccionar fuente">
            <button type="button" data-mode="demo" aria-pressed="true">
              Demostración
            </button>
            <button type="button" data-mode="usb" aria-pressed="false">
              USB</button
            ><button type="button" data-mode="wifi" aria-pressed="false">
              Wi-Fi local</button
            ><button type="button" data-mode="nube" aria-pressed="false">
              Nube
            </button>
          </div>
          <span id="connection" class="badge" role="status">En espera</span>
        </div>
        <div class="source-actions" id="demo-actions">
          <span class="badge demo-badge">Dato de demostración</span
          ><label for="scenario">Escenario</label
          ><select id="scenario">
            <option value="normal">Caudal normal</option>
            <option value="d1">Nivel alto en D1</option>
            <option value="d2">Nivel alto en D2</option>
            <option value="fallo">Fallo de sensor</option>
            <option value="riego">Riego en marcha</option>
            <option value="offline">Interrupción de lecturas</option>
          </select>
        </div>
        <div class="source-actions" id="usb-actions" hidden>
          <button class="action-btn" id="serial-connect">
            Conectar por USB</button
          ><span
            >Cierra el Monitor Serie de Arduino antes de abrir el puerto.</span
          >
        </div>
        <form class="source-actions" id="wifi-actions" hidden>
          <label for="device-url">URL de la placa</label
          ><input
            id="device-url"
            type="url"
            placeholder="http://IP-de-la-placa/api/v1/lecturas"
            required
          /><button class="action-btn">Conectar</button>
        </form>
        <div class="source-actions" id="nube-actions" hidden>
          <form id="login">
            <label for="password">Contraseña de supervisión</label>
            <input
              type="password"
              id="password"
              autocomplete="current-password"
              required
              maxlength="512"
            />
            <button class="action-btn">Ingresar</button>
          </form>
          <button id="logout" class="outline-btn" hidden>Cerrar sesión</button
          ><span id="cloud-message"></span
          ><a
            id="legacy"
            class="outline-btn"
            href="/monitoreo/anterior/index.html"
            hidden
            >Archivo del montaje anterior ↗</a
          >
        </div>
        <button id="disconnect" class="outline-btn" hidden>Desconectar</button>
        <p id="message" class="feedback" role="status" aria-live="polite"></p>
      </section>
      <div class="monitor-section-title">
        <h2>Lecturas actuales</h2>
        <span id="received">Esperando datos</span>
      </div>
      <section class="monitor-cards" aria-label="Lecturas actuales">
        <article class="sensor-card">
          <span class="overline" id="label-D1">Desagüe A · D1</span>
          <h3>Altura de agua</h3>
          <p class="readout">
            <strong id="val-D1">—</strong> <small>cm</small>
          </p>
          <div class="level-track"><i id="bar-D1"></i></div>
          <span class="state" id="state-D1">Sin lectura</span>
        </article>
        <article class="sensor-card">
          <span class="overline" id="label-D2">Desagüe B · D2</span>
          <h3>Altura de agua</h3>
          <p class="readout">
            <strong id="val-D2">—</strong> <small>cm</small>
          </p>
          <div class="level-track"><i id="bar-D2"></i></div>
          <span class="state" id="state-D2">Sin lectura</span>
        </article>
        <article class="equipment-card">
          <span class="overline">Controlador</span>
          <h3>Estado del riego</h3>
          <dl>
            <div>
              <dt>Bomba de riego</dt>
              <dd id="pump">—</dd>
            </div>
            <div>
              <dt>Nivel del estanque</dt>
              <dd id="physical-tank">—</dd>
            </div>
            <div>
              <dt>Reserva estimada</dt>
              <dd id="tank">—</dd>
            </div>
            <div>
              <dt>Motor de limpieza</dt>
              <dd id="motor">—</dd>
            </div>
            <div>
              <dt>Compuerta</dt>
              <dd id="gate">—</dd>
            </div>
          </dl>
        </article>
      </section>
      <section class="monitor-sheet">
        <div class="monitor-section-title">
          <div>
            <h2>Evolución del nivel</h2>
            <p>Altura en centímetros por hora de recepción.</p>
          </div>
          <div class="legend"><span>D1</span><span>D2</span></div>
        </div>
        <canvas
          id="chart"
          role="img"
          aria-label="Gráfica de altura de los dos desagües. Las lecturas están disponibles en la tabla histórica."
        ></canvas>
        <p id="empty-chart">Aún no hay lecturas para graficar.</p>
      </section>
      <div class="monitor-lower">
        <section class="monitor-sheet">
          <div class="monitor-section-title">
            <h2>Histórico</h2>
            <button class="outline-btn" id="csv">Exportar CSV ↓</button>
          </div>
          <label for="period">Periodo</label>
          <select id="period">
            <option value="1">Última hora</option>
            <option value="6">6 horas</option>
            <option value="24">24 horas</option>
            <option value="168">7 días</option>
          </select>
          <p id="history-info"></p>
          <div class="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Hora local</th>
                  <th>D1 (cm)</th>
                  <th>D2 (cm)</th>
                </tr>
              </thead>
              <tbody id="history"></tbody>
            </table>
          </div>
        </section>
        <section class="monitor-sheet">
          <div class="monitor-section-title">
            <h2>Alertas</h2>
            <span id="alert-count"></span>
          </div>
          <p>
            Precaución desde 5 cm y alerta desde 8 cm en el perfil de dos
            desagües.
          </p>
          <ul id="alerts"></ul>
        </section>
      </div>
      <details class="monitor-sheet instructions">
        <summary>Cómo conectar la placa</summary>
        <p>
          <b>USB.</b> Carga PluviaDos, abre esta página mediante HTTPS o
          localhost en un navegador con Web Serial y selecciona el puerto a
          115200 baudios. El monitor sólo lee el puerto.
        </p>
        <p>
          <b>Wi-Fi local.</b> Configura la red en el sketch. La placa imprime su
          URL en el Monitor Serie. Conecta el equipo a la misma red y abre el
          sitio desde un servidor HTTP local. Un sitio HTTPS puede bloquear una
          placa HTTP por contenido mixto. Para conservar HTTPS, usa USB, la nube
          o un proxy HTTPS de confianza que reenvíe a la IP privada de la placa.
        </p>
        <p>
          <b>Estanque.</b> El firmware informa segundos estimados de riego
          disponible. La reserva se habilita tras confirmar el depósito vacío en
          la placa. El campo <code>nivelEstanque</code> es
          <code>null</code> porque el depósito carece de sensor. La estimación
          independiente se publica como <code>reservaEstimadaS</code>.
        </p>
      </details>
    `;
