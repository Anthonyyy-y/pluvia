'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const brand = window.PLUVIA?.name || 'Pluvia';
  document.querySelectorAll('[data-brand]').forEach((node) => {
    node.textContent = brand;
  });
  document.title = 'Monitoreo · ' + brand;
  const points = ['A1', 'A2', 'A3', 'DEPOSITO'];
  const series = {
    A1: { label: 'A1', color: '#20674b' },
    A2: { label: 'A2', color: '#186d95' },
    A3: { label: 'A3', color: '#9a5419' },
    DEPOSITO: { label: 'Depósito', color: '#805c99' },
  };
  const shown = new Set(points);
  const states = {
    NORMAL: ['good', '✓ NORMAL'],
    PRECAUCION: ['warning', '△ PRECAUCIÓN'],
    ALERTA: ['danger', '! ALERTA'],
    ERROR: ['danger', '× ERROR'],
  };
  const connections = {
    connected: ['good', '● Conectado'],
    stale: ['warning', '◷ Sin datos recientes'],
    disconnected: ['danger', '× Desconectado'],
    waiting: ['neutral', '◌ En espera'],
  };
  const reasons = {
    SIN_SENSOR: 'Sensor no instalado',
    SIN_ECO: 'Sin eco recibido',
    CADUCADA: 'Medición caducada',
    OBJETO_DEMASIADO_CERCA: 'Objeto demasiado cerca',
    FUERA_RANGO_SENSOR: 'Distancia fuera del rango del sensor',
    DISTANCIA_MAYOR_QUE_ALTURA: 'Distancia superior a la altura configurada',
    REVISAR_ALTURA_Y_LIMITES: 'Revisar altura y límites configurados',
  };
  const stages = {
    REPOSO: 'Reposo',
    LIMPIANDO: 'Limpieza',
    VERIFICANDO: 'Verificación',
    COMPUERTA: 'Apertura de compuerta',
    DRENANDO: 'Evacuación',
    REVISAR: 'Revisión',
    ERROR_SENSOR: 'Error de sensor',
  };
  const transitionNames = {
    opened: 'Apertura',
    acknowledged: 'Reconocimiento',
    resolved: 'Recuperación',
  };
  const severity = {
    info: ['neutral', 'ⓘ Información'],
    warning: ['warning', '△ Aviso'],
    critical: ['danger', '! Crítico'],
  };
  const number = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
  const dates = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const times = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const seconds = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const days = new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
  });
  let session;
  let historyRows = [];
  let eventStamp;
  let notified;
  let notificationsOn = false;
  const stationNodes = new Map();

  function el(tag, className, txt) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }
  const formatted = (n, suffix = '') =>
    Number.isFinite(n) ? number.format(n) + suffix : '—';
  function datetime(iso) {
    const d = iso && new Date(iso);
    return d && Number.isFinite(d.getTime()) ? dates.format(d) : '—';
  }
  function duration(seconds) {
    if (!Number.isFinite(seconds)) return '—';
    const s = Math.max(0, Math.floor(seconds));
    if (s < 60) return s + ' s';
    if (s < 3600) return Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
    if (s < 86400)
      return (
        Math.floor(s / 3600) + ' h ' + Math.floor((s % 3600) / 60) + ' min'
      );
    return (
      Math.floor(s / 86400) + ' d ' + Math.floor((s % 86400) / 3600) + ' h'
    );
  }
  function setBadge(node, pair) {
    node.className = 'badge ' + pair[0];
    node.textContent = pair[1];
  }
  function addRow(dl, field, value = '—') {
    const div = el('div'),
      dd = el('dd', '', value);
    div.append(el('dt', '', field), dd);
    dl.append(div);
    return dd;
  }
  for (const id of points.slice(0, 3)) {
    const card = el('article', 'station'),
      head = el('div', 'station-head');
    const badge = el('span', 'badge neutral', '◌ En espera');
    head.append(el('h3', '', 'Alcantarilla ' + id), badge);
    const level = el('div', 'level'),
      value = el('span', '', '—');
    level.append(value, el('small', '', 'cm'));
    const track = el('div', 'level-track'),
      fill = el('div', 'level-fill');
    track.append(fill);
    const details = el('dl', 'list');
    const meta = el('p', 'station-meta', id === 'A1' ? 'JSN-SR04T' : 'HC-SR04');
    const issue = el('p', 'station-issue');
    issue.hidden = true;
    stationNodes.set(id, {
      badge,
      value,
      fill,
      track,
      distance: addRow(details, 'Distancia medida'),
      percent: addRow(details, 'Altura útil ocupada'),
      age: addRow(details, 'Antigüedad de lectura'),
      issue,
    });
    card.append(head, meta, level, track, details, issue);
    $('stations').append(card);
  }
  for (const id of points) {
    const button = el('button'),
      swatch = el('span', 'swatch');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'true');
    swatch.style.backgroundColor = series[id].color;
    swatch.setAttribute('aria-hidden', 'true');
    button.append(swatch, document.createTextNode(series[id].label));
    button.addEventListener('click', () => {
      if (shown.has(id)) shown.delete(id);
      else shown.add(id);
      button.setAttribute('aria-pressed', String(shown.has(id)));
      drawHistory();
    });
    $('series').append(button);
  }
  function link(path, ctx = session, extra = {}) {
    const params = new URLSearchParams({ mode: ctx.mode, ...extra });
    return '/api/v1/' + path + '?' + params;
  }
  async function request(url, ctx, body) {
    const options = {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: ctx.controller.signal,
    };
    if (body !== undefined)
      Object.assign(options, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    let res;
    try {
      res = await fetch(url, options);
    } catch (error) {
      if (ctx.controller.signal.aborted) throw error;
      throw new Error('No se pudo contactar con el servidor.');
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const err = new Error(json.error || 'La solicitud no pudo completarse.');
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  function showMessage(message, retry = false) {
    const box = $('message');
    box.hidden = !message;
    box.replaceChildren();
    if (!message) return;
    box.append(document.createTextNode(message));
    if (retry) {
      const b = el('button', 'text-button', 'Reintentar');
      b.type = 'button';
      b.onclick = () => openMode(session.mode);
      box.append(b);
    }
  }
  function authRequired(ctx) {
    if (ctx !== session) return;
    ctx.stream?.close();
    ctx.auth = false;
    ctx.live = false;
    ctx.snapshot = null;
    historyRows = [];
    drawHistory();
    renderEvents([]);
    renderSnapshot();
    $('auth').hidden = false;
    $('dashboard').hidden = true;
    $('stream-state').textContent = 'Se requiere acceso';
    showMessage('');
  }
  function startSession(mode) {
    session?.stream?.close();
    session?.controller.abort();
    const ctx = {
      mode,
      controller: new AbortController(),
      snapshot: null,
      live: false,
      auth: false,
      starting: true,
      stream: null,
      lastPull: 0,
      graphTicket: 0,
      eventTicket: 0,
    };
    session = ctx;
    eventStamp = '';
    notified = null;
    historyRows = [];
    $('history-details').open = false;
    $('history-rows').replaceChildren();
    $('events').replaceChildren();
    $('events-empty').hidden = false;
    $('events-empty').textContent = 'Aún no se han registrado eventos.';
    $('login-error').textContent = '';
    $('password').value = '';
    $('scenario').value = 'normal';
    $('scenario').disabled = true;
    $('scenario-note').textContent = '';
    $('mode-demo').setAttribute('aria-pressed', String(mode === 'demo'));
    $('mode-real').setAttribute('aria-pressed', String(mode === 'real'));
    $('source-strip').className = 'source-strip ' + mode;
    $('source-label').textContent =
      mode === 'demo'
        ? 'Modo demostración — datos simulados'
        : 'Modo real — telemetría del ESP32';
    $('scenarios').hidden = mode !== 'demo';
    $('real-tools').hidden = mode !== 'real';
    $('auth').hidden = true;
    $('dashboard').hidden = mode === 'real';
    $('stream-state').textContent = 'Iniciando conexión…';
    showMessage('');
    drawHistory();
    renderSnapshot();
    return ctx;
  }
  async function openMode(mode) {
    const ctx = startSession(mode);
    try {
      const snap =
        mode === 'demo'
          ? await request('/api/v1/demo/start', ctx, {})
          : await request(link('snapshot', ctx), ctx);
      if (ctx !== session) return;
      ctx.auth = true;
      ctx.live = true;
      $('dashboard').hidden = false;
      $('scenario').disabled = false;
      applySnapshot(ctx, snap);
      subscribe(ctx);
    } catch (err) {
      if (ctx !== session) return;
      if (mode === 'real' && err.status === 401) return authRequired(ctx);
      ctx.live = false;
      $('stream-state').textContent = 'Servidor no disponible';
      showMessage(err.message, true);
      renderSnapshot();
    } finally {
      ctx.starting = false;
    }
  }
  function subscribe(ctx) {
    if (location.hostname.endsWith('.vercel.app') || !window.EventSource) {
      $('stream-state').textContent = 'Actualización periódica';
      return;
    }
    const stream = new EventSource(link('stream', ctx));
    ctx.stream = stream;
    stream.addEventListener('snapshot', (event) => {
      if (ctx !== session) return;
      try {
        applySnapshot(ctx, JSON.parse(event.data));
      } catch {
        ctx.live = false;
        $('stream-state').textContent = 'Respuesta inválida del servidor';
        renderSnapshot();
      }
    });
    stream.addEventListener('session-ended', () => {
      if (ctx !== session) return;
      stream.close();
      if (ctx.mode === 'real') authRequired(ctx);
      else openMode('demo');
    });
    stream.onopen = () => {
      if (ctx === session) $('stream-state').textContent = 'Canal en línea';
    };
    stream.onerror = () => {
      if (ctx !== session) return;
      ctx.live = false;
      $('stream-state').textContent = 'Reconectando con el servidor…';
      renderSnapshot();
      pollSnapshot(ctx);
    };
  }
  async function pollSnapshot(ctx) {
    if (!ctx.auth || ctx !== session || ctx.polling) return;
    ctx.polling = true;
    try {
      const snap = await request(link('snapshot', ctx), ctx);
      applySnapshot(ctx, snap);
    } catch (err) {
      if (ctx !== session) return;
      if (err.status === 401 && ctx.mode === 'real') return authRequired(ctx);
      ctx.live = false;
      $('stream-state').textContent = 'Sin conexión al servidor';
      renderSnapshot();
    } finally {
      ctx.polling = false;
    }
  }
  function applySnapshot(ctx, snap) {
    if (ctx !== session) return;
    const source = ctx.mode === 'demo' ? 'SIMULACION' : 'REAL';
    if (
      snap.source !== source ||
      (snap.packet && snap.packet.source !== source)
    )
      throw new Error('Origen de telemetría inesperado.');
    const prev = ctx.snapshot;
    if (prev && snap.revision < prev.revision) return;
    const changed = !prev || snap.revision !== prev.revision;
    ctx.snapshot = snap;
    ctx.live = true;
    ctx.lastPull = performance.now();
    $('stream-state').textContent =
      ctx.stream && ctx.stream.readyState === 1
        ? 'Canal en línea'
        : 'Conexión al servidor';
    if (ctx.mode === 'demo') {
      if (document.activeElement !== $('scenario'))
        $('scenario').value = snap.scenario || 'manual';
      $('scenario-note').textContent =
        snap.scenario === 'offline'
          ? Number.isFinite(snap.disconnect_after_s)
            ? 'Envíos en pausa. Caducidad a los ' +
              snap.stale_after_s +
              ' s y desconexión a los ' +
              snap.disconnect_after_s +
              ' s.'
            : 'Envíos en pausa. El servidor espera antes de marcar la desconexión.'
          : '';
    }
    renderSnapshot();
    if (changed) {
      refreshHistory(ctx);
      refreshEvents(ctx);
    }
  }
  function currentAge() {
    const ctx = session,
      age = ctx.snapshot?.age_s;
    return Number.isFinite(age)
      ? age + (performance.now() - ctx.lastPull) / 1000
      : null;
  }
  function displayedConnection() {
    const snap = session.snapshot;
    if (!snap?.packet) return snap?.connection || 'waiting';
    const age = currentAge();
    if (Number.isFinite(age)) {
      if (
        age >= snap.disconnect_after_s &&
        Number.isFinite(snap.disconnect_after_s)
      )
        return 'disconnected';
      if (
        snap.connection === 'connected' &&
        age >= snap.stale_after_s &&
        Number.isFinite(snap.stale_after_s)
      )
        return 'stale';
    }
    return snap.connection;
  }
  function updateAges() {
    const age = currentAge();
    $('age').textContent = duration(age);
    for (const [id, n] of stationNodes) {
      const measured = session.snapshot?.packet?.points?.[id]?.age_ms;
      n.age.textContent =
        Number.isFinite(age) && Number.isFinite(measured)
          ? duration(age + measured / 1000)
          : '—';
    }
  }
  const orderLabel = (v) =>
    typeof v === 'boolean'
      ? v
        ? 'Salida activada'
        : 'Salida desactivada'
      : 'Sin dato';
  function renderSnapshot() {
    const ctx = session,
      s = ctx.snapshot,
      p = s?.packet;
    const connection = displayedConnection();
    ctx.displayedConnection = connection;
    const isCurrent = !!(p && ctx.live && connection === 'connected');
    let notice = '';
    if (!ctx.live && s)
      notice =
        'Se interrumpió la comunicación con el servidor. Las últimas lecturas se muestran como desactualizadas.';
    else if (s && connection === 'waiting')
      notice = 'Esperando datos del dispositivo';
    else if (connection === 'stale')
      notice =
        'Mediciones caducadas. Se conserva la última telemetría recibida.';
    else if (connection === 'disconnected')
      notice =
        'Dispositivo desconectado. Las lecturas y las salidas corresponden a la última recepción.';
    const condition = $('condition');
    if (condition.textContent !== notice) condition.textContent = notice;
    condition.hidden = !notice;
    $('origin').textContent = ctx.mode === 'demo' ? 'SIMULACIÓN' : 'REAL';
    $('connection-title').textContent = s?.device_id || 'Sin datos';
    setBadge(
      $('connection-badge'),
      !ctx.live && s
        ? ['neutral', '◌ Sin verificar']
        : connections[connection] || connections.waiting,
    );
    $('received').textContent = datetime(s?.received_at);
    $('rssi').textContent = formatted(p?.network.rssi_dbm, ' dBm');
    $('scheme-note').textContent =
      p && !isCurrent
        ? 'Esquema de la última recepción. Las lecturas están desactualizadas.'
        : 'El relleno representa la altura útil cuando se dispone de calibración.';
    for (const id of points) {
      const pt = p?.points[id],
        pct = pt?.valid && pt.calibration.confirmed ? pt.height_pct : null;
      const status = !p
        ? connections.waiting
        : !isCurrent
          ? ['neutral', '◷ Sin datos recientes']
          : states[pt.state] || connections.waiting;
      const g = document.querySelector('[data-scheme="' + id + '"]'),
        rect = g.querySelector('.water');
      const h = Number.isFinite(pct)
        ? Math.max(0, Math.min(100, pct)) * 0.32
        : 0;
      g.setAttribute(
        'class',
        'vessel ' + (isCurrent && Number.isFinite(pct) ? status[0] : 'unknown'),
      );
      rect.setAttribute('height', h);
      rect.setAttribute('y', 40 - h);
      if (id === 'DEPOSITO') continue;
      const n = stationNodes.get(id);
      setBadge(n.badge, status);
      n.value.textContent = formatted(pt?.valid ? pt.height_cm : null);
      n.distance.textContent = formatted(pt?.distance_cm, ' cm');
      n.percent.textContent = Number.isFinite(pct)
        ? formatted(pct, ' %')
        : pt?.valid && !pt.calibration.confirmed
          ? 'Calibración pendiente'
          : '—';
      n.track.hidden = !Number.isFinite(pct);
      n.fill.className = 'level-fill ' + status[0];
      n.fill.style.width = h / 0.32 + '%';
      n.issue.textContent = pt?.reason ? reasons[pt.reason] || pt.reason : '';
      n.issue.hidden = !n.issue.textContent;
    }
    updateAges();
    const o = p?.outputs,
      t = p?.points.DEPOSITO,
      light = p?.light;
    const title =
      p && !isCurrent
        ? 'Últimas órdenes recibidas, desactualizadas.'
        : 'Órdenes eléctricas del ESP32, sin confirmación de movimiento.';
    document.querySelector('.box-note').textContent = title;
    const a = $('actuators');
    a.replaceChildren();
    addRow(a, 'Etapa del ciclo', stages[o?.stage] || '—');
    addRow(a, 'Motor de limpieza', orderLabel(o?.motor));
    addRow(a, 'Compuerta · ángulo ordenado', formatted(o?.gate_deg, '°'));
    addRow(a, 'Bomba de evacuación', orderLabel(o?.drain));
    addRow(a, 'Bomba de riego', orderLabel(o?.irrigation));
    addRow(a, 'LDR · lectura ADC', formatted(light?.adc));
    addRow(
      a,
      'Iluminación',
      typeof light?.daylight === 'boolean'
        ? light.daylight
          ? 'Iluminación detectada'
          : 'Iluminación insuficiente'
        : 'Sin dato',
    );
    const r = $('reservoir');
    r.replaceChildren();
    addRow(
      r,
      'Sensor',
      !t
        ? 'Sin dato'
        : !t.installed
          ? 'No instalado'
          : t.valid
            ? 'Instalado'
            : 'Con error',
    );
    if (t?.reason && t.installed)
      addRow(r, 'Fallo', reasons[t.reason] || t.reason);
    addRow(
      r,
      'Altura de agua',
      formatted(t?.valid ? t.height_cm : null, ' cm'),
    );
    addRow(
      r,
      'Altura útil ocupada',
      formatted(
        t?.valid && t.calibration.confirmed ? t.height_pct : null,
        ' %',
      ),
    );
    const permission = (flag) =>
      typeof flag === 'boolean'
        ? flag
          ? 'Permitida por nivel'
          : 'Bloqueada por nivel'
        : 'Sin dato';
    addRow(r, 'Evacuación hacia el depósito', permission(p?.tank.can_receive));
    addRow(r, 'Riego desde el depósito', permission(p?.tank.can_irrigate));
    if (t && !t.valid) addRow(r, 'Protección local', 'Ambas bombas bloqueadas');
    if (t && !isCurrent) addRow(r, 'Vigencia', 'Datos desactualizados');
  }
  async function refreshHistory(ctx) {
    const ticket = ++ctx.graphTicket,
      hours = $('period').value;
    try {
      const result = await request(link('history', ctx, { hours }), ctx);
      if (ctx !== session || ticket !== ctx.graphTicket) return;
      historyRows = result.rows;
      drawHistory();
    } catch (err) {
      if (ctx !== session || ticket !== ctx.graphTicket) return;
      if (err.status === 401 && ctx.mode === 'real') return authRequired(ctx);
      historyRows = [];
      drawHistory();
      $('history-empty').textContent = 'No se pudo cargar el historial.';
    }
  }
  function svgElement(tag, attrs, txt) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs))
      node.setAttribute(key, value);
    if (txt !== undefined) node.textContent = txt;
    return node;
  }
  function drawTable() {
    const rowGroup = document.createDocumentFragment();
    for (let i = historyRows.length - 1; i >= 0; i--) {
      const row = historyRows[i],
        tr = el('tr');
      tr.append(
        el('td', '', datetime(row.received_at)),
        ...points.map((id) => el('td', '', formatted(row[id]))),
      );
      rowGroup.append(tr);
    }
    $('history-rows').replaceChildren(rowGroup);
  }
  function drawHistory() {
    $('csv').href = link('export.csv', session, { hours: $('period').value });
    const chart = $('chart'),
      items = historyRows,
      selected = Array.from(shown);
    const values = items.flatMap((r) =>
      selected.map((id) => r[id]).filter(Number.isFinite),
    );
    $('history-empty').hidden = !!values.length;
    $('history-empty').textContent = !selected.length
      ? 'Selecciona una serie para ver su evolución.'
      : !items.length
        ? 'Aún no hay lecturas en este periodo.'
        : 'Las series seleccionadas no tienen mediciones válidas en este periodo.';
    $('history-details').hidden = !items.length;
    chart.toggleAttribute('hidden', !values.length);
    if ($('history-details').open) drawTable();
    if (!values.length) {
      chart.replaceChildren();
      return;
    }
    const width = Math.max(240, chart.clientWidth || 800),
      height = 203,
      left = 36,
      right = 12,
      top = 21,
      bottom = 27;
    const ceiling = Math.max(1, Math.ceil(Math.max(...values) / 4) * 4);
    const first = Date.parse(items[0].received_at),
      last = Date.parse(items[items.length - 1].received_at);
    const x = (t) =>
      last === first
        ? (left + width - right) / 2
        : left + ((width - left - right) * (t - first)) / (last - first);
    const y = (n) => height - bottom - ((height - top - bottom) * n) / ceiling;
    const nodes = [
      svgElement(
        'title',
        {},
        'Altura de agua en centímetros a la hora de recepción',
      ),
    ];
    chart.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    nodes.push(svgElement('text', { x: 0, y: 11 }, 'cm'));
    for (let i = 0; i <= 4; i++) {
      const value = (i * ceiling) / 4,
        py = y(value);
      nodes.push(
        svgElement('line', {
          class: 'grid',
          x1: left,
          x2: width - right,
          y1: py,
          y2: py,
        }),
        svgElement(
          'text',
          { x: left - 6, y: py + 4, 'text-anchor': 'end' },
          number.format(value),
        ),
      );
    }
    const labels = last === first ? 1 : width < 400 ? 3 : 5,
      tf =
        last - first > 86400000
          ? days
          : last - first < 300000
            ? seconds
            : times;
    for (let i = 0; i < labels; i++) {
      const at =
        labels === 1 ? first : first + ((last - first) * i) / (labels - 1);
      nodes.push(
        svgElement(
          'text',
          {
            x: x(at),
            y: height - 5,
            'text-anchor':
              labels === 1
                ? 'middle'
                : i === 0
                  ? 'start'
                  : i === labels - 1
                    ? 'end'
                    : 'middle',
          },
          tf.format(at),
        ),
      );
    }
    const selectedHours = Number($('period').value);
    // El servidor puede entregar una lectura por intervalo en ventanas largas.
    const maxGap = Math.max(
      ((selectedHours * 3600000) / 720) * 3,
      session.snapshot?.disconnect_after_s * 1000 || 60000,
    );
    for (const id of selected) {
      let segment = [],
        previousTime;
      const color = series[id].color;
      const finish = () => {
        if (segment.length > 1)
          nodes.push(
            svgElement('polyline', {
              points: segment.map((p) => p.join(',')).join(' '),
              stroke: color,
              'stroke-width': 2,
              fill: 'none',
              'stroke-linejoin': 'round',
            }),
          );
        if (segment.length && (segment.length === 1 || items.length < 9)) {
          for (const [cx, cy] of segment)
            nodes.push(svgElement('circle', { cx, cy, r: 2.8, fill: color }));
        }
        segment = [];
      };
      for (const row of items) {
        const t = Date.parse(row.received_at);
        if (!Number.isFinite(row[id])) {
          finish();
          previousTime = undefined;
          continue;
        }
        if (previousTime !== undefined && t - previousTime > maxGap) finish();
        segment.push([x(t), y(row[id])]);
        previousTime = t;
      }
      finish();
    }
    chart.replaceChildren(...nodes);
  }
  async function refreshEvents(ctx) {
    const ticket = ++ctx.eventTicket;
    try {
      const result = await request(link('events', ctx), ctx);
      if (ctx !== session || ticket !== ctx.eventTicket) return;
      const stamp = JSON.stringify(result.events);
      if (stamp === eventStamp) return;
      eventStamp = stamp;
      renderEvents(result.events);
      if (
        notified &&
        notificationsOn &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        for (const e of result.events) {
          if (notified.has(e.id) || e.resolved_at) continue;
          try {
            new Notification(
              brand +
                ' · ' +
                (ctx.mode === 'demo' ? 'Simulación' : 'Dispositivo real'),
              { body: e.description, tag: ctx.mode + '-' + e.id },
            );
          } catch {
            notificationsOn = false;
            updateNotificationButton();
            break;
          }
        }
      }
      notified = new Set(result.events.map((e) => e.id));
    } catch (err) {
      if (ctx !== session || ticket !== ctx.eventTicket) return;
      if (err.status === 401 && ctx.mode === 'real') return authRequired(ctx);
      $('events-empty').hidden = false;
      $('events-empty').textContent =
        'El registro de eventos no se pudo actualizar.';
      eventStamp = '';
    }
  }
  function renderEvents(events) {
    const ctx = session,
      container = $('events');
    const open = new Set(
      Array.from(
        container.querySelectorAll('details[open]'),
        (x) => x.dataset.event,
      ),
    );
    const focusId = container.contains(document.activeElement)
      ? document.activeElement.dataset.eventFocus
      : null;
    const nodes = document.createDocumentFragment();
    $('events-empty').hidden = !!events.length;
    $('events-empty').textContent = 'Aún no se han registrado eventos.';
    for (const e of events) {
      const article = el('article', 'event'),
        head = el('div', 'event-head'),
        badge = el('span');
      setBadge(badge, severity[e.severity] || severity.info);
      const body = el('div', 'event-body');
      body.append(el('h3', '', e.description));
      const classification = [
        e.origin,
        e.source === 'SIMULACION' ? 'SIMULACIÓN' : 'REAL',
        datetime(e.opened_at),
        e.resolved_at ? 'Resuelto' : 'Activo',
        e.ack_at ? 'Reconocido' : 'Pendiente de reconocimiento',
      ];
      body.append(el('p', '', classification.join(' · ')));
      head.append(badge, body);
      if (!e.ack_at) {
        const button = el('button', 'secondary', 'Reconocer');
        button.type = 'button';
        button.dataset.eventFocus = 'ack-' + e.id;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await request(
              link('events/' + encodeURIComponent(e.id) + '/ack', ctx),
              ctx,
              {},
            );
            if (ctx !== session) return;
            showMessage(
              'Reconocimiento guardado. El ESP32 mantiene las protecciones locales.',
            );
            await refreshEvents(ctx);
          } catch (err) {
            if (ctx !== session) return;
            if (err.status === 401 && ctx.mode === 'real')
              return authRequired(ctx);
            showMessage(err.message);
            button.disabled = false;
          }
        });
        head.append(button);
      }
      const d = el('details'),
        summary = el('summary', '', 'Transiciones del incidente'),
        list = el('ul', 'event-log');
      d.dataset.event = String(e.id);
      d.open = open.has(String(e.id));
      summary.dataset.eventFocus = 'log-' + e.id;
      for (const t of e.transitions)
        list.append(
          el(
            'li',
            '',
            datetime(t.at) + ' · ' + (transitionNames[t.type] || t.type),
          ),
        );
      d.append(summary, list);
      body.append(d);
      article.append(head);
      nodes.append(article);
    }
    container.replaceChildren(nodes);
    if (focusId) {
      const target = Array.from(
        container.querySelectorAll('[data-event-focus]'),
      ).find(
        (n) =>
          n.dataset.eventFocus === focusId ||
          n.dataset.eventFocus === focusId.replace('ack-', 'log-'),
      );
      target?.focus({ preventScroll: true });
    }
  }
  function updateNotificationButton() {
    const b = $('notify');
    if (!window.isSecureContext || !('Notification' in window)) {
      b.disabled = true;
      b.textContent = 'Notificaciones no disponibles';
      return;
    }
    if (Notification.permission === 'denied') {
      b.disabled = true;
      b.textContent = 'Notificaciones bloqueadas';
      return;
    }
    b.disabled = false;
    b.textContent = notificationsOn
      ? 'Desactivar notificaciones'
      : 'Activar notificaciones';
    b.setAttribute('aria-pressed', String(notificationsOn));
  }
  $('notify').addEventListener('click', async () => {
    try {
      notificationsOn = notificationsOn
        ? false
        : (await Notification.requestPermission()) === 'granted';
    } catch {
      showMessage('Este navegador no permite notificaciones en esta sesión.');
    }
    updateNotificationButton();
  });
  $('scenario').addEventListener('change', async () => {
    const ctx = session,
      select = $('scenario');
    select.disabled = true;
    showMessage('');
    try {
      const snap = await request('/api/v1/demo/scenario', ctx, {
        scenario: select.value,
      });
      applySnapshot(ctx, snap);
    } catch (err) {
      if (ctx !== session) return;
      showMessage(err.message);
      select.value = ctx.snapshot?.scenario || 'manual';
    } finally {
      if (ctx === session) select.disabled = false;
    }
  });
  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ctx = session,
      submit = e.currentTarget.querySelector('button');
    submit.disabled = true;
    $('login-error').textContent = 'Verificando acceso…';
    try {
      await request('/api/v1/login', ctx, { password: $('password').value });
      if (ctx === session) await openMode('real');
    } catch (err) {
      if (ctx !== session) return;
      $('login-error').textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });
  $('logout').addEventListener('click', async () => {
    const ctx = session;
    try {
      await request('/api/v1/logout', ctx, {});
      if (ctx === session) await openMode('real');
    } catch (err) {
      if (ctx === session) showMessage(err.message);
    }
  });
  function changeMode(mode) {
    if (session?.mode === mode) return;
    const url = new URL(location.href);
    url.searchParams.set('modo', mode === 'real' ? 'real' : 'demo');
    window.history.replaceState(null, '', url);
    openMode(mode);
  }
  $('mode-demo').onclick = () => changeMode('demo');
  $('mode-real').onclick = () => changeMode('real');
  $('period').onchange = () => {
    historyRows = [];
    drawHistory();
    if (session.auth) refreshHistory(session);
  };
  $('history-details').ontoggle = () => {
    if ($('history-details').open) drawTable();
  };
  if ('ResizeObserver' in window)
    new ResizeObserver(() => {
      if (historyRows.length) drawHistory();
    }).observe(document.querySelector('.history-box'));
  window.addEventListener('online', () => pollSnapshot(session));
  window.addEventListener('offline', () => {
    session.live = false;
    $('stream-state').textContent = 'Sin conexión al servidor';
    renderSnapshot();
  });
  setInterval(() => {
    const ctx = session;
    if (ctx.displayedConnection !== displayedConnection()) renderSnapshot();
    else updateAges();
    if (ctx.auth && performance.now() - ctx.lastPull > 6000) pollSnapshot(ctx);
  }, 1000);
  updateNotificationButton();
  const params = new URLSearchParams(location.search);
  openMode(
    params.get('modo') === 'real' || params.get('mode') === 'real'
      ? 'real'
      : 'demo',
  );
})();
