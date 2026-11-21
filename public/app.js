import { icon } from './icons.js';
import { materialArt } from './material-art.js';
import { categories, materials, modules } from './catalog.js';

const $ = (s) => document.querySelector(s),
  all = (s) => Array.from(document.querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const brand = window.PLUVIA.name;
document.title = brand + ' · Drenaje pluvial inteligente';
document.querySelector('[property="og:title"]').content = document.title;
all('[data-brand]').forEach((el) => (el.textContent = brand));
all('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));

const menu = $('.mobile-menu'),
  nav = $('#main-nav');
function menuState(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}
menu.onclick = () => menuState(!nav.classList.contains('open'));
nav.addEventListener('click', () => menuState(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    menuState(false);
    menu.focus();
  }
});
const navSections = all('#main-nav a').map((a) => [
  a,
  document.querySelector(a.hash),
]);
const trackNav = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        navSections.forEach(([a, s]) => {
          if (s === entry.target) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      }
  },
  { rootMargin: '-12% 0px -60%' },
);
navSections.forEach(([, section]) => trackNav.observe(section));

const picker = $('#component-picker'),
  category = $('#category'),
  view = $('#view'),
  layerButtons = all('[data-layer]');
Object.entries(modules).forEach(([id, m]) =>
  picker.add(new Option(m.code + ' · ' + m.name, id)),
);
categories.forEach((c) => category.add(new Option(c, c)));
const surfaceModules = new Set([
  'a1',
  'a2',
  'a3',
  'garden',
  'sprinkler',
  'base',
]);
const scenes = {},
  jobs = {},
  dead = new Set(),
  layerState = { points: true, exploded: false, cut: false, flow: false };
let selection = 'a1',
  material = materials[0],
  timer = 0,
  step = 0,
  running = false,
  lastPicked = 'a1';
const primaryMaterial = {
  a1: 1,
  a2: 2,
  a3: 2,
  control: 0,
  lcd: 5,
  motor: 9,
  gate: 10,
  p1: 11,
  collector: 26,
  filter: 28,
  tank: 29,
  irrigation: 12,
  garden: 31,
  sprinkler: 33,
  emergency: 30,
  base: 22,
};
function renderMaterial(row) {
  material = row;
  category.value = row.category;
  $('#material-art').innerHTML = materialArt(row);
  const list = $('#material-list');
  list.replaceChildren();
  for (const item of materials.filter((m) => m.category === row.category)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name;
    b.setAttribute('aria-pressed', String(item === row));
    b.onclick = () => {
      renderMaterial(item);
      list.querySelector('[aria-pressed=true]').focus({ preventScroll: true });
    };
    list.append(b);
  }
  $('#mat-name').textContent = row.name;
  $('#mat-what').textContent = row.definition;
  $('#mat-state').textContent = row.status;
  $('#mat-state').classList.toggle('pending', row.status !== 'Previsto');
  $('#mat-qty').textContent = row.quantity
    ? 'Cantidad · ' + row.quantity
    : 'Cantidad por definir';
  const listedModule = modules[row.module];
  const relatedPlace =
    row.id === 2
      ? 'Dentro de las cámaras A2 y A3, bajo las rejillas del bordillo'
      : row.id === 23
        ? 'Bajo las tres rejillas de la cuadra'
        : listedModule.place;
  $('#mat-spec').replaceChildren();
  for (const [title, content] of [
    ['Función', row.use],
    ['Ubicación', relatedPlace],
    ['Se relaciona con', row.related],
  ]) {
    const line = document.createElement('div'),
      dt = document.createElement('dt'),
      dd = document.createElement('dd');
    dt.textContent = title;
    dd.textContent = content;
    line.append(dt, dd);
    $('#mat-spec').append(line);
  }
}
renderMaterial(material);
category.onchange = () =>
  renderMaterial(materials.find((m) => m.category === category.value));
$('#open-material').onclick = () => {
  lastPicked = selection;
  renderMaterial(materials[primaryMaterial[selection]]);
};
$('#locate-material').onclick = () => {
  const realModule =
    material.id === 2 && lastPicked === 'a3' ? 'a3' : material.module;
  const underground =
    !surfaceModules.has(realModule) || [1, 2, 23].includes(material.id);
  choose(realModule, { section: underground });
};
function fillComponent(id) {
  selection = id;
  picker.value = id;
  const m = modules[id];
  $('#module-name').textContent = m.name;
  $('#module-short').textContent = m.short;
  $('#module-description').textContent = m.description;
  $('#module-place').textContent = m.place;
  $('#module-icon').innerHTML = icon(m.icon);
}
fillComponent(selection);
function updatePlan(which) {
  const image = $(which === 'hero' ? '#hero-model img' : '#detail-model img');
  image.src = layerState.cut
    ? '/assets/urbano-corte.svg'
    : '/assets/urbano-planta.svg';
  image.alt = layerState.cut
    ? 'Corte de la cuadra con cámaras bajo las rejillas, depósito y tubería de riego hasta el dispersor.'
    : 'Plano de Circunvalación Sur con tres desagües junto al bordillo y un parterre con dispersor en la vereda.';
}
function fallback(which) {
  dead.add(which);
  delete scenes[which];
  const host = $(which === 'hero' ? '#hero-model' : '#detail-model');
  host.classList.add('unavailable');
  host.querySelector('.loading-model').textContent = '';
  updatePlan(which);
  if (which === 'hero') {
    $('#gesture-hint').textContent = 'Plano ilustrativo de la cuadra';
    all('[data-hero]:not([data-hero="cut"])').forEach(
      (b) => (b.disabled = true),
    );
  } else {
    for (const key of ['points', 'exploded', 'flow']) setLayer(key, false);
    layerButtons
      .filter((b) => b.dataset.layer !== 'cut')
      .forEach((b) => (b.disabled = true));
    all('[data-zoom]').forEach((b) => (b.disabled = true));
    view.disabled = true;
    $('#explore-status').classList.remove('sr');
    $('#explore-status').textContent =
      'Planos de la cuadra. Alterna superficie y subsuelo o selecciona un componente de la lista.';
  }
}
function load(which) {
  if (dead.has(which)) return Promise.resolve(null);
  if (jobs[which]) return jobs[which];
  const hero = which === 'hero',
    host = $(hero ? '#hero-model' : '#detail-model');
  jobs[which] = import('./model/viewer.js')
    .then(({ createViewer }) => {
      const v = createViewer(host, {
        hero,
        onSelect(id) {
          if (hero)
            $('#explorador').scrollIntoView({
              behavior: reduced.matches ? 'auto' : 'smooth',
            });
          choose(id);
        },
        onCameraReset() {
          if (!hero) {
            view.value = 'general';
            tourState(false);
          }
        },
      });
      scenes[which] = v;
      v.cut(layerState.cut);
      if (!hero) {
        v.points(layerState.points);
        v.exploded(layerState.exploded);
        v.flow(layerState.flow);
        v.select(selection, view.value === 'detail');
      }
      return v;
    })
    .catch((error) => {
      console.warn('Vista de planos disponible:', error.message);
      fallback(which);
      return null;
    });
  host.addEventListener('viewer-lost', () => fallback(which), { once: true });
  return jobs[which];
}
for (const [which, id] of [
  ['hero', '#hero-model'],
  ['detail', '#detail-model'],
]) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        load(which);
      }
    },
    { rootMargin: '120px' },
  );
  observer.observe($(id));
}
all('[data-hero]').forEach((b) => {
  b.onclick = async () => {
    if (b.dataset.hero === 'cut') {
      tourState(false);
      setSection(!layerState.cut);
      await load('hero');
      return;
    }
    const v = await load('hero');
    if (!v) return;
    if (b.dataset.hero === 'reset') v.reset();
    else v.zoomBy(b.dataset.hero === 'in' ? 1.2 : 1 / 1.2);
  };
});
let scrollQueued = false;
window.addEventListener(
  'scroll',
  () => {
    if (
      scrollQueued ||
      reduced.matches ||
      !scenes.hero ||
      scrollY > $('.hero').offsetHeight
    )
      return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      scenes.hero.scrollView(Math.min(1, scrollY / $('.hero').offsetHeight));
    });
  },
  { passive: true },
);
function tourState(play) {
  running = play;
  clearInterval(timer);
  timer = 0;
  const b = $('#tour');
  b.setAttribute('aria-pressed', String(play));
  b.innerHTML =
    icon(play ? 'pause' : 'play') +
    '<span>' +
    (play ? 'Pausar recorrido' : 'Recorrido guiado') +
    '</span>';
}
function choose(id, { section, fromTour = false } = {}) {
  if (!fromTour) tourState(false);
  // Los sensores y los mecanismos se inspeccionan en el corte de la calle.
  if (section !== undefined) setSection(section);
  else if (!surfaceModules.has(id)) setSection(true);
  fillComponent(id);
  view.value = 'detail';
  load('detail').then((v) => {
    if (selection === id && view.value === 'detail') v?.select(id, true);
  });
}
picker.onchange = () => choose(picker.value);
const tourSteps = [
  ['a1', false],
  ['a1', true],
  ['control', true],
  ['lcd', true],
  ['motor', true],
  ['gate', true],
  ['p1', true],
  ['filter', true],
  ['tank', true],
  ['irrigation', true],
  ['garden', false],
  ['sprinkler', false],
];
$('#tour').onclick = () => {
  if (running) {
    tourState(false);
    return;
  }
  tourState(true);
  const playStep = () => {
    if (step >= tourSteps.length) {
      step = 0;
      tourState(false);
      return;
    }
    const [id, section] = tourSteps[step++];
    choose(id, { section, fromTour: true });
  };
  playStep();
  timer = setInterval(playStep, 6500);
};
new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting && running) tourState(false);
}).observe($('#explorador'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) tourState(false);
});
view.onchange = async () => {
  tourState(false);
  const v = await load('detail');
  if (!v) return;
  if (view.value === 'top') v.top();
  else if (view.value === 'detail') v.select(selection, true);
  else v.reset();
};
all('[data-zoom]').forEach(
  (b) =>
    (b.onclick = async () => {
      tourState(false);
      const v = await load('detail');
      if (!v) return;
      if (b.dataset.zoom === 'reset') {
        view.value = 'general';
        v.reset();
      } else v.zoomBy(b.dataset.zoom === 'in' ? 1.2 : 1 / 1.2);
    }),
);
function setLayer(key, on) {
  layerState[key] = on;
  const b = layerButtons.find((b) => b.dataset.layer === key);
  b.setAttribute('aria-pressed', String(on));
  scenes.detail?.[key](on);
  if (key === 'flow') $('#flow-key').hidden = !on;
}
function refreshSectionControls() {
  const name = layerState.cut ? 'subsuelo' : 'superficie';
  $('#hero-model').dataset.section = name;
  $('#detail-model').dataset.section = name;
  const heroSwitch = $('[data-hero="cut"]');
  if (heroSwitch) {
    heroSwitch.setAttribute('aria-pressed', String(layerState.cut));
    heroSwitch.querySelector('span').textContent = layerState.cut
      ? 'Ver superficie'
      : 'Ver subsuelo';
  }
  all('[data-section-label]').forEach((el) => {
    el.textContent = layerState.cut
      ? 'Corte del subsuelo'
      : 'Vista de superficie';
  });
  for (const which of dead) updatePlan(which);
}
function setSection(on) {
  if (on === layerState.cut) return;
  if (!on) {
    if (layerState.exploded) setLayer('exploded', false);
    if (layerState.flow) setLayer('flow', false);
    if (!surfaceModules.has(selection)) {
      fillComponent('a1');
      view.value = 'general';
      scenes.detail?.reset();
    }
  }
  setLayer('cut', on);
  scenes.hero?.cut(on);
  scenes.detail?.select(selection, view.value === 'detail');
  refreshSectionControls();
}
refreshSectionControls();
layerButtons.forEach((b) => {
  b.onclick = async () => {
    tourState(false);
    const key = b.dataset.layer;
    if (key === 'cut') {
      setSection(!layerState.cut);
      await load('detail');
    } else {
      const v = await load('detail');
      if (!v) return;
      const on = !layerState[key];
      if (on && (key === 'exploded' || key === 'flow')) {
        setSection(true);
        const other = key === 'exploded' ? 'flow' : 'exploded';
        if (layerState[other]) setLayer(other, false);
        view.value = 'general';
        v.reset();
      }
      setLayer(key, on);
    }
    $('#explore-status').textContent =
      key === 'cut'
        ? layerState.cut
          ? 'Corte abierto: instalaciones bajo la calzada y la vereda.'
          : 'Vista de superficie: tres rejillas y un parterre con dispersor.'
        : b.textContent.trim() +
          (layerState[key] ? ' activado.' : ' desactivado.');
  };
});

const dialog = $('#contact-dialog'),
  form = $('#contact-form'),
  result = $('#form-result');
$('#contact-open').onclick = () => {
  result.textContent = '';
  dialog.showModal();
};
$('#contact-close').onclick = () => dialog.close();
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
form.onsubmit = async (e) => {
  e.preventDefault();
  const b = form.querySelector('[type=submit]');
  if (b.disabled) return;
  b.disabled = true;
  result.textContent = 'Registrando la solicitud…';
  try {
    const response = await fetch('/api/v1/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();
    if (!response.ok || !data.id)
      throw Error(data.error || 'El servidor no pudo registrar la solicitud.');
    result.textContent = 'Solicitud registrada. Referencia ' + data.id + '.';
    form.reset();
  } catch (error) {
    result.textContent =
      error instanceof TypeError
        ? 'No se pudo conectar. Tus datos siguen en el formulario.'
        : error.message;
  } finally {
    b.disabled = false;
  }
};
