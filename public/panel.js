'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.PluviaDatos;
  // El HTML de la ruta sirve también como respaldo si falta el contenido editorial.
  const editorial = window.PLUVIA_CONTENT?.monitor?.html;
  if (editorial) $('principal').innerHTML = editorial;
  const date = new Intl.DateTimeFormat('es-EC', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const hora = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const numero = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString('es-EC', { maximumFractionDigits: 2 })
      : '—';
  const onoff = (v) =>
    typeof v === 'boolean' ? (v ? 'Activada' : 'Apagada') : '—';
  const crea = (tag, text) => {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  };
  const MAX = 2400;
  let sesion,
    relojDemo = 0;
  const guardados = new Map();
  function vigente(s) {
    return s === sesion && !s.abort.signal.aborted;
  }
  function mensaje(t) {
    $('message').textContent = t;
  }
  function reciente(s) {
    return s.last && Date.now() - s.last < 10000;
  }
  function guardar(s) {
    if (!s.key || s.mode === 'demo' || s.mode === 'nube' || !s.rows.length)
      return;
    const data = { rows: s.rows, events: s.events };
    guardados.set(s.key, data);
    try {
      localStorage.setItem(s.key, JSON.stringify(data));
    } catch {
      /* La sesión abierta conserva sus datos. */
    }
  }
  function restaurar(s, key) {
    s.key = 'pluvia.v2.' + key;
    try {
      const a =
        guardados.get(s.key) ||
        JSON.parse(localStorage.getItem(s.key) || 'null');
      if (a && Array.isArray(a.rows) && Array.isArray(a.events)) {
        s.rows = a.rows
          .slice(-MAX)
          .filter((r) => Number.isFinite(r.t) && D.ids.includes(r.sensor));
        s.events = a.events.slice(0, 100);
      }
    } catch {
      /* Un historial anterior ilegible no interrumpe la captura. */
    }
  }
  function nueva(mode) {
    const old = sesion;
    if (old) {
      guardar(old);
      old.abort.abort();
      if (old.reader) old.reader.cancel().catch(() => {});
    }
    const s = (sesion = {
      mode,
      abort: new AbortController(),
      rows: [],
      current: {},
      events: [],
      states: {},
      last: 0,
      status: 'En espera',
      open: false,
    });
    document
      .querySelectorAll('[data-mode]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(mode === b.dataset.mode)),
      );
    for (const key of ['demo', 'usb', 'wifi', 'nube'])
      $(key + '-actions').hidden = key !== mode;
    $('disconnect').hidden = true;
    $('password').value = '';
    $('logout').hidden = true;
    $('login').hidden = true;
    $('cloud-message').textContent = '';
    $('legacy').hidden = true;
    mensaje('');
    const url = new URL(location.href);
    url.searchParams.set('modo', mode === 'nube' ? 'real' : mode);
    try {
      history.replaceState(null, '', url);
    } catch {}
    if (mode === 'demo') {
      s.open = true;
      s.status = 'Simulación local';
      pasoDemo(s);
    }
    if (mode === 'usb') {
      $('serial-connect').disabled =
        !window.isSecureContext || !navigator.serial;
      if ($('serial-connect').disabled)
        mensaje(
          'Web Serial requiere un navegador compatible y HTTPS o localhost. También puedes conectar por Wi-Fi local.',
        );
    }
    if (mode === 'nube') prepararNube(s);
    dibujar();
    return s;
  }
  async function prepararNube(s) {
    let api = location.hostname.endsWith('.vercel.app');
    const base = window.PLUVIA_CONTENT?.monitor?.cloudUrl;
    if (base) {
      try {
        const backend = new URL(base, location.href);
        if (backend.origin !== location.origin) {
          const a = crea('a', 'Abrir monitor del servidor ↗');
          a.href = new URL('/monitoreo/?modo=real', backend).href;
          $('cloud-message').replaceChildren(a);
          return;
        }
        api = true;
      } catch {}
    }
    if (!api && ['http:', 'https:'].includes(location.protocol)) {
      try {
        const r = await fetch(location.pathname, {
          method: 'HEAD',
          signal: s.abort.signal,
        });
        api = r.headers.get('X-Pluvia-API') === '1';
      } catch {}
    }
    if (!vigente(s)) return;
    $('login').hidden = !api;
    $('legacy').hidden = !api;
    if (!api)
      $('cloud-message').textContent =
        'Este alojamiento es estático. USB, Wi-Fi local y demostración están disponibles aquí. El acceso a la nube requiere el servidor de Pluvia.';
    else
      $('cloud-message').textContent =
        'Acceso protegido al dispositivo registrado.';
  }
  function acotar(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function recibir(s, registros, t = Date.now()) {
    if (!vigente(s)) return;
    if (!registros.length) return;
    if (s.storageBase) {
      const origen = registros[0].source;
      if (registros.some((r) => r.source !== origen))
        throw Error('Orígenes mezclados.');
      if (s.origin !== origen) {
        guardar(s);
        s.rows = [];
        s.events = [];
        s.states = {};
        s.current = {};
        restaurar(s, s.storageBase + '.' + origen);
        s.origin = origen;
      }
    }
    for (const r of registros) {
      if (!D.ids.includes(r.sensor)) continue;
      const estado = r.legacyState || D.estado(r.valor)[0];
      if (s.states[r.sensor] !== estado) {
        const anterior = s.states[r.sensor];
        if (estado !== 'Normal' || anterior) {
          s.events.unshift({
            t,
            desc: r.sensor + ' · ' + estado,
            source: r.source,
          });
          s.events.length = Math.min(100, s.events.length);
        }
        s.states[r.sensor] = estado;
      }
      s.current[r.sensor] = { ...r, t };
      s.rows.push({ ...r, t });
    }
    acotar(s.rows, MAX);
    s.last = t;
    s.open = true;
    dibujar();
  }
  function pasoDemo(s) {
    if (!vigente(s)) return;
    if ($('scenario').value === 'offline') {
      s.status = 'Envíos en pausa';
      dibujar();
      return;
    }
    s.status = 'Simulación local';
    recibir(s, D.demo($('scenario').value, ++relojDemo));
  }
  // La tabla conserva el origen de cada muestra. Cada hueco interrumpe la línea.
  function ventana(s) {
    const inicio = Date.now() - Number($('period').value) * 3600000;
    return s.rows.filter((r) => r.t >= inicio);
  }
  function grafica(rows) {
    const c = $('chart'),
      box = c.getBoundingClientRect(),
      w = Math.max(240, Math.floor(box.width || 700)),
      h = 195,
      dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const validos = rows.filter((r) => Number.isFinite(r.valor));
    $('empty-chart').hidden = !!validos.length;
    if (!validos.length) return;
    const max = Math.max(10, ...validos.map((r) => r.valor));
    const izq = 36,
      der = w - 30,
      top = 15,
      bot = h - 26;
    const inicio = rows[0].t,
      fin = rows[rows.length - 1].t;
    const x = (t) =>
      inicio === fin
        ? (izq + der) / 2
        : izq + ((t - inicio) * (der - izq)) / (fin - inicio);
    const y = (v) => bot - (v * (bot - top)) / max;
    ctx.font = '11px system-ui';
    ctx.fillStyle = '#506459';
    for (let i = 0; i <= 4; i++) {
      const v = (i * max) / 4;
      ctx.strokeStyle = '#d8e2d9';
      ctx.beginPath();
      ctx.moveTo(izq, y(v));
      ctx.lineTo(der, y(v));
      ctx.stroke();
      ctx.fillText(numero(v), 0, y(v) + 3);
    }
    ctx.textAlign = 'left';
    ctx.fillText(hora.format(inicio), izq, h - 5);
    if (fin !== inicio) {
      ctx.textAlign = 'right';
      ctx.fillText(hora.format(fin), der, h - 5);
    }
    ctx.textAlign = 'left';
    for (const [i, id] of D.ids.entries()) {
      ctx.strokeStyle = ctx.fillStyle = i ? '#27798f' : '#26785b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let anterior = null;
      const gap =
        sesion.mode === 'nube'
          ? Math.max(30000, (Number($('period').value) * 3600000) / 240)
          : 30000;
      for (const r of rows) {
        if (r.sensor !== id) continue;
        if (r.valor === null) {
          anterior = null;
          continue;
        }
        if (anterior !== null && r.t - anterior < gap)
          ctx.lineTo(x(r.t), y(r.valor));
        else ctx.moveTo(x(r.t), y(r.valor));
        anterior = r.t;
        if (rows.length < 20) ctx.fillRect(x(r.t) - 2, y(r.valor) - 2, 4, 4);
      }
      ctx.stroke();
    }
  }
  function dibujar() {
    const s = sesion;
    if (!s) return;
    const fresh = reciente(s) && s.open;
    const sim =
      s.mode === 'demo' ||
      Object.values(s.current).some((r) => r.source === 'SIMULACION');
    $('connection').textContent =
      s.status + (s.open && s.last && !fresh ? ' · Sin datos recientes' : '');
    const isDemo = s.mode === 'demo';
    let badge = $('sample-badge');
    if (!badge) {
      badge = crea('span', 'Dato de demostración');
      badge.id = 'sample-badge';
      badge.className = 'badge demo-badge';
      $('received').before(badge);
    }
    badge.hidden = !sim;
    $('received').textContent = s.last
      ? 'Última recepción · ' + date.format(s.last)
      : 'Esperando datos';
    for (const id of D.ids) {
      const r = s.current[id],
        estado = r
          ? r.legacyState
            ? [r.legacyState, '']
            : D.estado(r.valor)
          : ['Sin lectura', 'missing'];
      $('label-' + id).textContent = s.legacy
        ? 'Perfil anterior · ' + (id === 'D1' ? 'A1' : 'A2')
        : 'Desagüe ' + (id === 'D1' ? 'A · D1' : 'B · D2');
      $('val-' + id).textContent = numero(r?.valor);
      $('bar-' + id).style.width =
        Math.min(100, Math.max(0, r?.valor || 0) * 10) + '%';
      $('state-' + id).textContent =
        (r && (!fresh || Date.now() - r.t >= 10000)
          ? 'Última lectura · '
          : '') + estado[0];
      $('state-' + id).className = 'state ' + estado[1];
    }
    const orden = Object.values(s.current).sort((a, b) => b.t - a.t)[0];
    $('physical-tank').textContent = Number.isFinite(orden?.nivelEstanque)
      ? numero(orden.nivelEstanque) + ' cm'
      : orden
        ? 'Sin medición'
        : '—';
    $('pump').textContent = onoff(orden?.bombaEstado);
    $('motor').textContent = onoff(orden?.motorEstado);
    $('gate').textContent =
      typeof orden?.compuertaAbierta === 'boolean'
        ? orden.compuertaAbierta
          ? 'Abierta'
          : 'Cerrada'
        : '—';
    $('tank').textContent = Number.isFinite(orden?.reservaEstimadaS)
      ? numero(orden.reservaEstimadaS) + ' s'
      : 'Sin estimación';
    const rows = ventana(s);
    grafica(rows);
    const groups = new Map();
    for (const r of rows.slice(-100)) {
      if (!groups.has(r.t)) groups.set(r.t, {});
      groups.get(r.t)[r.sensor] = r.valor;
    }
    $('history').replaceChildren(
      ...[...groups]
        .reverse()
        .slice(0, 36)
        .map(([t, v]) => {
          const tr = crea('tr', '');
          tr.append(
            crea('td', hora.format(t)),
            crea('td', numero(v.D1)),
            crea('td', numero(v.D2)),
          );
          return tr;
        }),
    );
    $('history-info').textContent =
      s.mode === 'nube'
        ? 'Intervalos del servidor. El CSV conserva cada muestra.'
        : rows.length +
          ' lecturas disponibles · últimas ' +
          MAX +
          ' por fuente. ' +
          (isDemo ? 'Dato de demostración.' : '');
    $('csv').disabled = !rows.length && !(s.mode === 'nube' && s.auth);
    $('alert-count').textContent = s.events.length
      ? 'Últimos ' + Math.min(100, s.events.length)
      : '';
    $('alerts').replaceChildren(
      ...(s.events.length
        ? s.events.slice(0, 100).map((ev) => {
            const li = crea('li', ev.desc);
            li.append(
              crea(
                'small',
                date.format(ev.t) +
                  (ev.source === 'SIMULACION' ? ' · Dato de demostración' : ''),
              ),
            );
            if (s.mode === 'nube' && ev.id && !ev.ack && !ev.resolved) {
              const b = crea('button', 'Reconocer');
              b.className = 'outline-btn';
              b.onclick = () => reconocer(s, ev.id);
              li.append(b);
            }
            return li;
          })
        : [crea('li', 'Sin alertas registradas en esta fuente.')]),
    );
  }
  document.querySelectorAll('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.mode !== sesion.mode) nueva(b.dataset.mode);
      }),
  );
  $('scenario').onchange = () => pasoDemo(sesion);
  $('disconnect').onclick = () => {
    const s = sesion,
      mode = s.mode;
    const n = nueva(mode);
    n.rows = s.rows;
    n.events = s.events;
    n.current = s.current;
    n.last = s.last;
    n.status = 'Desconectado';
    dibujar();
  };
  $('period').onchange = () => {
    if (sesion.auth) cicloNube(sesion);
    else dibujar();
  };
  $('serial-connect').onclick = async () => {
    const s = sesion;
    if (s.busy || !navigator.serial) return;
    s.busy = true;
    $('serial-connect').disabled = true;
    let port, reader;
    try {
      port = await navigator.serial.requestPort();
      if (!vigente(s)) return;
      await port.open({ baudRate: 115200 });
      if (!vigente(s)) return;
      s.storageBase = 'usb';
      s.open = true;
      s.status = 'USB abierto';
      $('disconnect').hidden = false;
      mensaje('Esperando líneas JSON de PluviaDos.');
      dibujar();
      reader = port.readable.getReader();
      s.reader = reader;
      const decoder = new TextDecoder();
      let buffer = '',
        descartar = false;
      while (vigente(s)) {
        const { value, done } = await reader.read();
        if (done || !vigente(s)) break;
        const trozos = (buffer + decoder.decode(value, { stream: true })).split(
          '\n',
        );
        buffer = trozos.pop();
        for (const line of trozos) {
          if (descartar) {
            descartar = false;
            continue;
          }
          const txt = line.trim();
          if (txt.startsWith('PIS1,') || txt.startsWith('D1='))
            mensaje(
              'Se detectó un firmware anterior. Carga PluviaDos para recibir los dos sensores en JSON.',
            );
          if (!txt.startsWith('{') || txt.length > 4096) continue;
          try {
            recibir(s, D.paquete(JSON.parse(txt)));
            mensaje('');
          } catch {
            mensaje('Se descartó una línea JSON incompatible.');
          }
        }
        if (buffer.length > 4096) {
          buffer = '';
          descartar = true;
        }
      }
    } catch (err) {
      if (vigente(s))
        mensaje(
          err.name === 'NotFoundError'
            ? 'Selección de puerto cancelada.'
            : 'No se pudo leer el puerto. Comprueba el cable y cierra otras aplicaciones que lo estén usando.',
        );
    } finally {
      reader?.releaseLock();
      if (port?.readable || port?.writable) {
        try {
          await port.close();
        } catch {}
      }
      if (vigente(s)) {
        s.busy = false;
        s.open = false;
        s.status = 'USB desconectado';
        $('serial-connect').disabled = false;
        $('disconnect').hidden = true;
        guardar(s);
        dibujar();
      }
    }
  };
  $('wifi-actions').onsubmit = (e) => {
    e.preventDefault();
    let url;
    try {
      url = new URL($('device-url').value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw Error();
      if (url.pathname === '/') url.pathname = '/api/v1/lecturas';
    } catch {
      mensaje('Escribe la URL HTTP o HTTPS indicada por la placa.');
      return;
    }
    if (location.protocol === 'https:' && url.protocol === 'http:') {
      mensaje(
        'Esta página HTTPS no puede consultar la placa HTTP. Abre Pluvia desde un servidor HTTP local, usa un proxy HTTPS de confianza o selecciona USB.',
      );
      return;
    }
    const s = nueva('wifi');
    s.url = url.href;
    s.storageBase = 'wifi.' + url.href;
    $('disconnect').hidden = false;
    sondear(s);
  };
  async function obtener(url, s, options = {}) {
    const ac = new AbortController(),
      stop = () => ac.abort();
    s.abort.signal.addEventListener('abort', stop, { once: true });
    const timeout = setTimeout(stop, 7000);
    try {
      const r = await fetch(url, {
        cache: 'no-store',
        ...options,
        signal: ac.signal,
      });
      if (!r.ok) {
        const err = Error('HTTP ' + r.status);
        err.status = r.status;
        throw err;
      }
      return await r.json();
    } finally {
      clearTimeout(timeout);
      s.abort.signal.removeEventListener('abort', stop);
    }
  }
  async function sondear(s) {
    try {
      const data = await obtener(s.url, s, {
        credentials: 'omit',
        redirect: 'error',
      });
      if (!vigente(s)) return;
      const regs = D.paquete(data),
        key =
          data.boot_id + '-' + (data.seq ?? regs.map((r) => r.ts).join('/'));
      s.status = 'Wi-Fi conectado';
      s.open = true;
      if (s.lastKey !== key) {
        s.lastKey = key;
        recibir(s, regs);
      }
      mensaje('');
      dibujar();
    } catch {
      if (vigente(s)) {
        s.open = false;
        s.status = 'Sin conexión Wi-Fi';
        mensaje(
          'Revisa la IP, el acceso a la red local y el firmware. Se reintentará automáticamente.',
        );
        dibujar();
      }
    }
    if (vigente(s)) setTimeout(() => sondear(s), 2000);
  }
  const api = (path, s, body) =>
    obtener(
      '/api/v1/' + path,
      s,
      body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {},
    );
  $('login').onsubmit = async (e) => {
    e.preventDefault();
    const s = sesion;
    if (s.busy) return;
    s.busy = true;
    try {
      await api('login', s, { password: $('password').value });
      if (!vigente(s)) return;
      $('password').value = '';
      $('login').hidden = true;
      $('logout').hidden = false;
      s.auth = true;
      mensaje('');
      await cicloNube(s);
    } catch (err) {
      if (vigente(s))
        mensaje(
          err.status === 401
            ? 'Contraseña incorrecta.'
            : 'El servicio de monitoreo no está disponible.',
        );
    } finally {
      s.busy = false;
    }
  };
  $('logout').onclick = async () => {
    const s = sesion;
    try {
      await api('logout', s, {});
      if (vigente(s)) nueva('nube');
    } catch {
      if (vigente(s)) mensaje('No se pudo cerrar la sesión en el servidor.');
    }
  };
  async function reconocer(s, id) {
    try {
      await api('events/' + id + '/ack?mode=real', s, {});
      if (vigente(s)) cicloNube(s);
    } catch {
      if (vigente(s)) mensaje('No se pudo reconocer la alerta.');
    }
  }
  async function cicloNube(s) {
    if (!vigente(s) || !s.auth || s.poll) return;
    s.poll = true;
    const hours = $('period').value;
    try {
      const [snap, hist, ev] = await Promise.all([
        api('snapshot?mode=real', s),
        api('history?mode=real&hours=' + hours, s),
        api('events?mode=real', s),
      ]);
      if (!vigente(s) || !s.auth) return;
      s.current = {};
      s.last = Date.parse(snap.received_at) || 0;
      s.open = snap.connection === 'connected';
      s.legacy = snap.packet?.version === 1;
      if (snap.packet?.source === 'REAL') {
        if (snap.packet.version === 2)
          for (const r of D.paquete(snap.packet))
            s.current[r.sensor] = { ...r, t: s.last };
        else if (s.legacy) {
          const p = snap.packet;
          for (const [k, id] of D.ids.entries()) {
            const a = p.points['A' + (k + 1)];
            s.current[id] = {
              t: s.last,
              valor: a.valid ? a.height_cm : null,
              bombaEstado: p.outputs.irrigation,
              motorEstado: p.outputs.motor,
              compuertaAbierta:
                p.outputs.gate_deg === null ? null : p.outputs.gate_deg > 0,
              nivelEstanque: null,
              source: 'REAL',
              legacyState: a.state,
            };
          }
        }
      }
      s.status =
        {
          waiting: 'Esperando placa',
          connected: 'Nube conectada',
          stale: 'Lectura caducada',
          disconnected: 'Dispositivo desconectado',
        }[snap.connection] || 'En espera';
      s.rows = hist.rows.flatMap((row) =>
        D.ids.flatMap((id, i) => {
          const key = s.legacy ? 'A' + (i + 1) : id;
          return Object.hasOwn(row, key)
            ? [
                {
                  t: Date.parse(row.received_at),
                  sensor: id,
                  valor: row[key],
                  source: 'REAL',
                },
              ]
            : [];
        }),
      );
      s.events = ev.events.map((x) => ({
        id: x.id,
        t: Date.parse(x.opened_at),
        desc: x.description,
        source: x.source,
        ack: x.ack_at,
        resolved: x.resolved_at,
      }));
      mensaje(
        s.legacy
          ? 'Último paquete del montaje anterior (A1/A2). Su historial completo está disponible en el CSV.'
          : '',
      );
      dibujar();
    } catch (err) {
      if (vigente(s)) {
        if (err.status === 401) {
          s.auth = false;
          nueva('nube');
          mensaje('La sesión caducó. Ingresa nuevamente.');
          return;
        }
        s.open = false;
        s.status = 'Servidor sin conexión';
        mensaje('No se pudo actualizar la supervisión.');
        dibujar();
      }
    } finally {
      s.poll = false;
      if (vigente(s) && s.auth && hours !== $('period').value) cicloNube(s);
    }
  }
  $('csv').onclick = () => {
    const s = sesion;
    if (s.mode === 'nube') {
      location.assign(
        '/api/v1/export.csv?mode=real&hours=' + $('period').value,
      );
      return;
    }
    const a = document.createElement('a'),
      url = URL.createObjectURL(
        new Blob([D.csv(ventana(s), s.mode)], {
          type: 'text/csv;charset=utf-8',
        }),
      );
    a.href = url;
    a.download = 'pluvia-' + s.mode + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  window.addEventListener('resize', () => grafica(ventana(sesion)));
  window.addEventListener('pagehide', () => guardar(sesion));
  setInterval(() => {
    const s = sesion;
    if (s.mode === 'demo') pasoDemo(s);
    else if (s.auth) cicloNube(s);
    else dibujar();
  }, 2000);
  setInterval(() => guardar(sesion), 15000);
  const mode = new URLSearchParams(location.search).get('modo');
  nueva(
    mode === 'real'
      ? 'nube'
      : ['usb', 'wifi', 'nube'].includes(mode)
        ? mode
        : 'demo',
  );
})();
