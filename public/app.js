import './editorial.js';
import { icon } from './icons.js';
import { materialArt } from './material-art.js';
import { categories, materials, modules } from './catalog.js';

const $ = (s) => document.querySelector(s),
  all = (s) => Array.from(document.querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const brand = window.PLUVIA.name;
all('[data-brand]').forEach(el => el.textContent = brand);
all('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));

const picker = $('#component-picker');
const category = $('#category');
const view = $('#view');
const layerButtons = all('[data-layer]');
const surfaceModules = new Set(['a', 'b', 'garden', 'sprinkler', 'base']);
const layerState = { points: true, exploded: false, cut: false, flow: false };
const hosts = {hero: $('#hero-model'), detail: $('#detail-model')};
const scenes = {}, jobs = {}, dead = new Set();
let selection = 'a', material = materials[0], timer = 0, step = 0;

function renderMaterial(row) {
  if (!category || !row) return;
  material = row;
  category.value = row.category;
  $('#material-art').innerHTML = materialArt(row);
  const list = $('#material-list');
  list.replaceChildren();
  for (const item of materials.filter(m => m.category === row.category)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name;
    b.setAttribute('aria-pressed', String(item === row));
    b.onclick = () => {
      renderMaterial(item);
      list.querySelector('[aria-pressed=true]').focus({preventScroll:true});
    };
    list.append(b);
  }
  $('#mat-name').textContent = row.name;
  $('#mat-what').textContent = row.definition;
  $('#mat-state').textContent = row.status;
  $('#mat-qty').textContent = row.quantity ? 'Cantidad · ' + row.quantity : 'Cantidad por definir';
  const spec = $('#mat-spec');
  spec.replaceChildren();
  for (const [title, content] of [['Ubicación', modules[row.module].place], ['Conjunto', modules[row.module].name], ['Especificación del conjunto', row.spec]]) {
    const line = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = title; dd.textContent = content; line.append(dt, dd); spec.append(line);
  }
}
if (category) {
  categories.forEach(c => category.add(new Option(c,c)));
  renderMaterial(material);
  category.onchange = () => renderMaterial(materials.find(m => m.category === category.value));
  $('#open-material').onclick = () => renderMaterial(materials.find(row => row.module === selection) || material);
  $('#locate-material').onclick = () => choose(material.module);
}
function fillComponent(id) {
  if (!picker || !modules[id]) return;
  selection = id; picker.value = id;
  const m = modules[id];
  $('#module-name').textContent = m.name;
  $('#module-short').textContent = m.short;
  $('#module-description').textContent = m.description;
  $('#module-place').textContent = m.place;
  if ($('#module-spec')) $('#module-spec').textContent = m.spec;
  $('#module-icon').innerHTML = icon(m.icon);
}
if (picker) {
  Object.entries(modules).forEach(([id,m]) => picker.add(new Option(m.code + ' · ' + m.name, id)));
  fillComponent(selection);
  picker.onchange = () => choose(picker.value);
}
const plans = {
  covered: ['urbano-planta.svg','Planta de la calle con dos rejillas frente al parterre central.'],
  pipes: ['superior-tuberias.svg','Vista superior con el tubo A–B, la T central y el ramal hacia el filtro, el estanque y la bomba.'],
  front: ['frontal.svg','Corte frontal con los sensores sobre ambas cámaras y el motor en A.'],
  cut: ['urbano-corte.svg','Recorrido desde los dos desagües por el filtro hasta el estanque y el riego.']
};
function updatePlan(which) {
  const mode = which === 'detail' ? view?.value : null;
  const plan = plans[mode] || plans[layerState.cut ? 'cut' : 'covered'];
  const img = hosts[which].querySelector('img');
  img.src = '/assets/' + plan[0];
  img.alt = plan[1];
}
function fallback(which) {
  dead.add(which);
  delete scenes[which];
  const host = hosts[which];
  host.classList.remove('ready');
  host.classList.add('unavailable');
  const loading = host.querySelector('.loading-model');
  if (loading) loading.textContent = '';
  updatePlan(which);
  if (which === 'hero') {
    if ($('#gesture-hint')) $('#gesture-hint').textContent = 'Plano ilustrativo de la cuadra';
    all('[data-hero]:not([data-hero="cut"])').forEach(b => b.disabled = true);
  } else {
    for (const key of ['points','exploded','flow']) setLayer(key,false);
    layerButtons.filter(b => b.dataset.layer !== 'cut').forEach(b => b.disabled = true);
    all('[data-zoom]').forEach(b => b.disabled = true);
    const status = $('#explore-status');
    status.classList.remove('sr');
    status.textContent = 'Planos accesibles. Elige una vista o consulta las fichas de las piezas.';
  }
}
function load(which) {
  const host = hosts[which];
  if (!host || dead.has(which)) return Promise.resolve(null);
  if (jobs[which]) return jobs[which];
  const hero = which === 'hero';
  jobs[which] = import('./model/viewer.js').then(({createViewer}) => {
    const v = createViewer(host,{
      hero, onSelect(id) {
        if (hero) { location.assign('/producto/?pieza=' + encodeURIComponent(id) + '#explorador'); return; }
        choose(id);
      },
      onCameraReset() { if (!hero) { view.value = 'general'; tourState(false); } }
    });
    scenes[which] = v; v.cut(layerState.cut);
    if (!hero) {
      v.points(layerState.points); v.exploded(layerState.exploded); v.flow(layerState.flow);
      v.select(selection, view.value === 'detail');
      if (['covered','pipes','front'].includes(view.value)) v.preset(view.value);
    }
    return v;
  }).catch(() => { fallback(which); return null; });
  host.addEventListener('viewer-lost', () => fallback(which), {once:true});
  return jobs[which];
}
Object.entries(hosts).forEach(([which, host]) => {
  if (!host) return;
  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { observer.disconnect(); load(which); }
  },{rootMargin:'180px'});
  observer.observe(host);
});
all('[data-hero]').forEach(b => b.onclick = async () => {
  if (b.dataset.hero === 'cut') { setSection(!layerState.cut); await load('hero'); return; }
  const v = await load('hero');
  if (!v) return;
  if (b.dataset.hero === 'reset') v.reset();
  else v.zoomBy(b.dataset.hero === 'in' ? 1.2 : 1/1.2);
});
if (hosts.hero) {
  let queued = false;
  const heroSection = hosts.hero.closest('section') || hosts.hero;
  window.addEventListener('scroll', () => {
    if (!scenes.hero || queued || reduced.matches || scrollY > heroSection.offsetHeight) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false; scenes.hero?.scrollView(Math.min(1, scrollY/heroSection.offsetHeight));
    });
  }, {passive:true});
}
function tourState(play) {
  clearInterval(timer); timer = 0;
  const b = $('#tour');
  if (!b) return;
  b.setAttribute('aria-pressed', String(play));
  b.innerHTML = icon(play ? 'pause' : 'play') + '<span>'+(play ? 'Pausar recorrido' : 'Recorrido guiado')+'</span>';
}
function choose(id,{section,fromTour=false}={}) {
  if (!picker || !modules[id]) return;
  if (!fromTour) tourState(false);
  if (section !== undefined) setSection(section);
  else if (id === 'garden') setSection(false);
  else if (!surfaceModules.has(id)) setSection(true);
  fillComponent(id); view.value = 'detail';
  if (dead.has('detail')) updatePlan('detail');
  load('detail').then(v => { if (selection === id && view.value === 'detail') v?.select(id,true); });
}
const tourSteps = [['a',false],['b',false],['sensorA',true],['sensorB',true],['motor',true],['pipe',true],['junction',true],['gate',true],['filter',true],['tank',true],['pump',true],['irrigation',true],['sprinkler',false]];
const tour = $('#tour');
if (tour) {
  tour.onclick = () => {
    if (timer) { tourState(false); return; }
    if (step >= tourSteps.length) step = 0;
    tourState(true);
    function next() {
      if (step === tourSteps.length) { step=0; tourState(false); return; }
      const [id,section] = tourSteps[step++]; choose(id,{section,fromTour:true});
    }
    next(); timer = setInterval(next,6500);
  };
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && timer) tourState(false); }).observe($('#explorador'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden && timer)tourState(false);});
}
if (view) view.onchange = async () => {
  tourState(false);
  const mode = view.value;
  if (['covered','pipes','front'].includes(mode)) {
    setLayer('exploded',false); setLayer('flow',false);
    setSection(mode !== 'covered'); view.value = mode; refreshSectionControls();
  }
  if (dead.has('detail')) updatePlan('detail');
  const v = await load('detail'); if (!v || view.value !== mode) return;
  if (mode === 'detail') v.select(selection,true);
  else if (mode === 'general') v.reset();
  else v.preset(mode);
};
all('[data-zoom]').forEach(b => b.onclick = async () => {
  tourState(false); const v = await load('detail'); if (!v) return;
  if (b.dataset.zoom === 'reset') { view.value = 'general'; v.reset(); refreshSectionControls(); }
  else v.zoomBy(b.dataset.zoom === 'in' ? 1.2 : 1/1.2);
});
function setLayer(key,on) {
  layerState[key]=on;
  const b = layerButtons.find(b => b.dataset.layer === key);
  b?.setAttribute('aria-pressed',String(on)); scenes.detail?.[key](on);
  if (key === 'flow' && $('#flow-key')) $('#flow-key').hidden = !on;
}
function refreshSectionControls() {
  const cut = layerState.cut;
  for (const host of Object.values(hosts)) if(host) host.dataset.section = cut ? 'subsuelo':'superficie';
  const button = $('[data-hero="cut"]');
  if (button) {
    button.setAttribute('aria-pressed',String(cut));
    button.querySelector('span').textContent = cut?'Ver superficie':'Ver subsuelo';
  }
  all('[data-section-label]').forEach(el => el.textContent = (view?.selectedOptions?.[0] && ['covered','pipes','front'].includes(view.value)) ? view.selectedOptions[0].textContent : cut?'Corte del subsuelo':'Vista de superficie');
  for (const which of dead) updatePlan(which);
}
function setSection(on) {
  if (!on) {
    if (layerState.exploded) setLayer('exploded',false);
    if (layerState.flow) setLayer('flow',false);
    if (!surfaceModules.has(selection)) { fillComponent('a'); if(view) view.value='general'; }
  } else if(selection === 'garden') fillComponent('sprinkler');
  setLayer('cut',on); scenes.hero?.cut(on); refreshSectionControls();
}
refreshSectionControls();
layerButtons.forEach(b => b.onclick = async () => {
  tourState(false);
  const key = b.dataset.layer;
  if (key === 'cut') { view.value='general'; setSection(!layerState.cut); await load('detail'); }
  else {
    const v=await load('detail'); if (!v) return;
    const on=!layerState[key];
    if (on && (key === 'exploded' || key === 'flow')) {
      const other=key==='exploded'?'flow':'exploded';
      if(layerState[other])setLayer(other,false);
      view.value='general'; setSection(true); v.reset();
    }
    setLayer(key,on);
  }
  $('#explore-status').textContent = b.textContent.trim() + (layerState[key] ? ' activado.' : ' desactivado.');
});
if (picker) {
  const linked = new URLSearchParams(location.search).get('pieza');
  if (linked && modules[linked]) choose(linked);
}

const dialog = $('#contact-dialog'),
  form = $('#contact-form'),
  result = $('#form-result');
if (dialog && form) {
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
    if (!location.hostname.endsWith('.vercel.app')) {
      const head = await fetch(location.pathname, {method:'HEAD'});
      if (head.headers.get('X-Pluvia-API') !== '1') {
        const request = Array.from(new FormData(form), ([k,v])=>k+' — '+v).join('\n');
        const url = URL.createObjectURL(new Blob([request],{type:'text/plain;charset=utf-8'}));
        const a = document.createElement('a');
        a.href=url; a.download='Solicitud-Pluvia.txt'; a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        result.textContent='Solicitud guardada en tu equipo. Para enviarla, utiliza el formulario del sitio publicado.';
        return;
      }
    }
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

}
