'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let cursor = null, busy = false, generation = 0;
  const status = text => { $('inbox-status').textContent = text; };
  const format = new Intl.DateTimeFormat('es-EC', { dateStyle:'medium', timeStyle:'short' });
  function node(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function reset() {
    generation++;
    $('inbox').hidden = true;
    $('inbox-login').hidden = false;
    $('inbox-list').replaceChildren();
    cursor = null;
  }
  async function api(path, body) {
    const res = await fetch('/api/v1/' + path, {
      method: body === undefined ? 'GET' : 'POST', cache:'no-store',
      headers: body === undefined ? {} : {'Content-Type':'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.headers.get('Content-Type')?.includes('application/json')) {
      throw Error('La bandeja requiere el servidor de Pluvia o el sitio publicado.');
    }
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) reset();
      throw Error(data.error || 'No se pudo consultar el servidor.');
    }
    return data;
  }
  function card(item) {
    const el = node('article', '', 'request' + (item.read_at ? '' : ' unread'));
    el.append(node('h2', item.name));
    const time = node('time', format.format(new Date(item.received_at)));
    time.dateTime = item.received_at;
    const email = node('a', item.email);
    email.href = 'mailto:' + item.email;
    el.append(time, node('p', 'Referencia ' + item.id, 'reference'), email,
      node('p', item.message, 'request-message'));
    if (item.read_at) el.append(node('p', 'Leída', 'read-status'));
    else {
      const button = node('button','Marcar como leída','outline-btn');
      button.onclick = async () => {
        button.disabled = true;
        const current = generation;
        try {
          await api('contacts/' + item.id + '/read', {});
          if (current !== generation) return;
          el.classList.remove('unread');
          button.replaceWith(node('p','Leída','read-status'));
          const label = $('inbox-count');
          const remaining = Math.max(0, Number(label.dataset.unread)-1);
          label.dataset.unread = remaining;
          label.textContent = remaining + ' sin leer';
        } catch (e) { status(e.message); button.disabled = false; }
      };
      el.append(button);
    }
    return el;
  }
  async function load(more = false) {
    if (busy) return;
    busy = true;
    const current = generation;
    $('inbox-refresh').disabled = $('inbox-more').disabled = true;
    status('Consultando solicitudes…');
    try {
      const data = await api('contacts' + (more && cursor ? '?before=' + encodeURIComponent(cursor) : ''));
      if (current !== generation) return;
      if (!more) $('inbox-list').replaceChildren();
      data.items.forEach(item => $('inbox-list').append(card(item)));
      cursor = data.next;
      $('inbox-more').hidden = !cursor;
      $('inbox-login').hidden = true;
      $('inbox').hidden = false;
      $('inbox-count').dataset.unread = data.unread;
      $('inbox-count').textContent = data.unread + ' sin leer';
      status($('inbox-list').children.length ? '' : 'Todavía no hay solicitudes.');
    } catch (e) { status(e.message); }
    finally { busy = false; $('inbox-refresh').disabled = $('inbox-more').disabled = false; }
  }
  $('inbox-login').onsubmit = async e => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    button.disabled = true;
    try {
      await api('login', {password: $('inbox-password').value});
      $('inbox-password').value = '';
      await load();
    } catch (e) { status(e.message); }
    finally { button.disabled = false; }
  };
  $('inbox-refresh').onclick = () => load();
  $('inbox-more').onclick = () => load(true);
  $('inbox-logout').onclick = async () => {
    try { await api('logout', {}); reset(); status('Sesión cerrada.'); }
    catch (e) { status(e.message); }
  };
})();
