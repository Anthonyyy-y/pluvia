import * as T from '../vendor/three/three.module.min.js';
import { buildAssembly, anchors, surfaceAnchors } from './assembly.js';
import { modules } from '../catalog.js';

export function createViewer(
  host,
  { hero = false, onSelect = () => {}, onCameraReset = () => {} } = {},
) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)').matches;
  // Detectar la disponibilidad antes del constructor permite mostrar los planos
  // directamente en navegadores que tienen desactivada la aceleración gráfica.
  const canvas = document.createElement('canvas');
  const options = {
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  };
  const context = canvas.getContext('webgl2', options);
  if (!context) throw new Error('WebGL 2 no está disponible');
  const renderer = new T.WebGLRenderer({ canvas, context, ...options });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.35 : 1.7));
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'group');
  canvas.setAttribute(
    'aria-label',
    'Maqueta de la cuadra. Gira con las flechas, acerca o aleja con los signos más y menos. Inicio restablece la cámara.',
  );
  host.prepend(canvas);
  const scene = new T.Scene(),
    camera = new T.OrthographicCamera(-55, 55, 36, -36, 0.5, 530);
  // Un entorno de estudio pequeño genera reflejos estables en el agua y el metal.
  const sky = document.createElement('canvas');
  sky.width = 256;
  sky.height = 128;
  const sc = sky.getContext('2d');
  const grd = sc.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#97b5b9');
  grd.addColorStop(0.43, '#c5d1c3');
  grd.addColorStop(0.55, '#435c59');
  grd.addColorStop(1, '#263c34');
  sc.fillStyle = grd;
  sc.fillRect(0, 0, 256, 128);
  sc.fillStyle = '#f9f8ed';
  sc.fillRect(19, 19, 75, 24);
  sc.fillRect(151, 33, 49, 9);
  const environment = new T.CanvasTexture(sky);
  environment.mapping = T.EquirectangularReflectionMapping;
  environment.colorSpace = T.SRGBColorSpace;
  scene.environment = environment;
  scene.environmentIntensity = 0.72;
  const assembly = buildAssembly({ compact, brand: window.PLUVIA.name });
  scene.add(assembly.root);
  scene.add(new T.HemisphereLight(0xeaf7ff, 0x718275, 1.72));
  const softbox = new T.DirectionalLight(0xfff2dc, 2.45);
  softbox.position.set(-48, 100, 63);
  softbox.castShadow = true;
  Object.assign(softbox.shadow.camera, {
    left: -62,
    right: 62,
    top: 62,
    bottom: -62,
    near: 1,
    far: 230,
  });
  softbox.shadow.mapSize.set(1024, 1024);
  softbox.shadow.radius = 2;
  softbox.shadow.bias = -0.0005;
  softbox.shadow.normalBias = 0.08;
  scene.add(softbox);
  const rim = new T.DirectionalLight(0xc1eae2, 1.5);
  rim.position.set(64, 47, -63);
  scene.add(rim);
  const floor = new T.Mesh(
    new T.PlaneGeometry(280, 250),
    new T.ShadowMaterial({ opacity: hero ? 0.19 : 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.87;
  floor.receiveShadow = true;
  scene.add(floor);
  const normal = { az: 0.43, el: 0.68, zoom: 1 },
    target = new T.Vector3(0, 12, 0),
    look = target.clone();
  let az = normal.az,
    el = normal.el,
    zoom = 1,
    goal = { ...normal },
    exploded = 0,
    explodeTo = 0,
    selection = null,
    cutOpen = false,
    cameraMode = 'general',
    isolatedPortrait = false;
  let flowing = false,
    visible = true,
    dirty = true,
    frame = 0,
    last = 0,
    clock = 0,
    pointsOn = !hero,
    disposed = false;
  const ray = new T.Raycaster(),
    mouse = new T.Vector2(),
    pins = new Map();
  const pinLayer = document.createElement('div');
  pinLayer.className = 'pins';
  host.append(pinLayer);
  const named = hero ? [] : Object.keys(anchors).filter((id) => modules[id]);
  const tooltip = document.createElement('span');
  tooltip.className = 'model-tooltip';
  tooltip.hidden = true;
  host.append(tooltip);
  let hovered = null;
  function hover(id, clientX, clientY) {
    if (!id) {
      tooltip.hidden = true;
    } else {
      tooltip.textContent = modules[id].name;
      tooltip.hidden = false;
      const rect = host.getBoundingClientRect();
      const left = Math.max(5, Math.min(rect.width - tooltip.offsetWidth - 5, clientX - rect.left + 10));
      tooltip.style.left = left + 'px';
      tooltip.style.top = Math.max(4, Math.min(rect.height - 34, clientY - rect.top - 33)) + 'px';
    }
    if (hovered === id) return;
    hovered = id;
    assembly.highlight(hovered || selection);
    change();
  }
  named.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pin';
    b.dataset.component = id;
    b.textContent = modules[id].code;
    b.title = modules[id].name;
    b.setAttribute('aria-label', modules[id].name);
    b.addEventListener('click', () => { hover(null); onSelect(id); });
    b.addEventListener('pointerenter', e => hover(id, e.clientX, e.clientY));
    b.addEventListener('pointerleave', () => hover(null));
    b.addEventListener('focus', () => {
      const r = b.getBoundingClientRect();
      hover(id, r.left + r.width/2, r.top);
    });
    b.addEventListener('blur', () => hover(null));
    pins.set(id, b);
    pinLayer.append(b);
  });
  const byId = Object.values(assembly.groups);
  function currentAnchor(id) {
    if (cutOpen && id === 'garden') return null;
    return (cutOpen ? anchors : surfaceAnchors)[id];
  }
  function visibleHit(object) {
    for (let node = object; node; node = node.parent) {
      if (!node.visible) return false;
    }
    return true;
  }
  function change() {
    dirty = true;
    if (visible && !disposed && !frame) frame = requestAnimationFrame(draw);
  }
  function draw(now) {
    frame = 0;
    if (!visible || disposed) return;
    const dt = Math.min((now - last) / 1000 || 0.016, 0.08);
    last = now;
    const k = reduced.matches ? 1 : 1 - Math.exp(-dt * 11);
    const moving =
      Math.abs(az - goal.az) +
        Math.abs(el - goal.el) +
        Math.abs(zoom - goal.zoom) +
        Math.abs(exploded - explodeTo) +
        look.distanceTo(target) >
      0.004;
    const animateFlow = flowing && !reduced.matches;
    if (!dirty && !moving && !animateFlow) return;
    dirty = false;
    az += (goal.az - az) * k;
    el += (goal.el - el) * k;
    zoom += (goal.zoom - zoom) * k;
    exploded += (explodeTo - exploded) * k;
    look.lerp(target, k);
    const w = Math.max(host.clientWidth, 1),
      h = Math.max(host.clientHeight, 1),
      aspect = w / h;
    // Proyecta la huella y la altura de la cuadra en los ejes de cámara.
    // Una altura fija cortaría las esquinas al girar la calle en un lienzo ancho.
    const cosAz = Math.abs(Math.cos(az)),
      sinAz = Math.abs(Math.sin(az));
    const streetWidth = 80 * cosAz + 60 * sinAz;
    const streetDepth = 80 * sinAz + 60 * cosAz;
    const streetHeight = streetDepth * Math.sin(el) + 28 * Math.cos(el);
    const fittedSpan = 1.085 * Math.max(streetWidth / aspect, streetHeight);
    const span =
      (isolatedPortrait ? Math.max(105 / aspect, 58) : fittedSpan) / zoom;
    camera.left = (-span * aspect) / 2;
    camera.right = -camera.left;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.position.set(
      look.x + 158 * Math.sin(az) * Math.cos(el),
      look.y + 158 * Math.sin(el),
      look.z + 158 * Math.cos(az) * Math.cos(el),
    );
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    assembly.explode(exploded);
    if (animateFlow) clock += dt;
    assembly.flow(flowing, clock);
    const v = new T.Vector3();
    const occupied = [];
    pins.forEach((b, id) => {
      const anchor = currentAnchor(id);
      b.hidden =
        !pointsOn ||
        !anchor ||
        (zoom > 1.4 && id !== selection);
      if (b.hidden) return;
      v.fromArray(anchor).add(assembly.groups[id].position);
      v.y += id === 'sprinkler' ? 4.5 : 1.5;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w,
        tipY = (0.5 - v.y * 0.5) * h;
      let y = tipY;
      b.hidden = x < 8 || x > w - 8 || y < 8 || y > h - 4;
      if (b.hidden) return;
      const left = Math.max(18, Math.min(w - 18, x));
      for (let step = 0; step < 12; step++) {
        const offset = Math.ceil(step / 2) * 29 * (step % 2 ? -1 : 1);
        const candidate = Math.max(25, Math.min(h - 8, tipY + offset));
        if (!occupied.some(p => Math.abs(p.x - left) < 38 && Math.abs(p.y - candidate) < 27)) {
          y = candidate;
          break;
        }
      }
      occupied.push({ x: left, y });
      b.style.setProperty('--leader', Math.max(0, tipY - y) + 'px');
      b.style.transform =
        'translate(' + left + 'px,' + y + 'px) translate(-50%,-100%)';
      b.classList.toggle('active', selection === id);
    });
    renderer.render(scene, camera);
    if (moving || animateFlow) frame = requestAnimationFrame(draw);
  }
  function size() {
    if (!host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    change();
  }
  const sizes = new ResizeObserver(size);
  sizes.observe(host);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) change();
  });
  observer.observe(host);
  reduced.addEventListener('change', change);
  const limit = (v, a, b) => Math.max(a, Math.min(b, v));
  const zoomBy = (factor) => {
    manualCamera = true;
    goal.zoom = limit(goal.zoom * factor, 0.72, 3.9);
    change();
  };
  let pointer = null,
    manualCamera = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    manualCamera = true;
    pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ax: goal.az,
      ay: goal.el,
      max: 0,
    };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointer) {
      if (!hero && e.pointerType === 'mouse') hover(hitComponent(e), e.clientX, e.clientY);
      return;
    }
    if (pointer.id !== e.pointerId) return;
    hover(null);
    const dx = e.clientX - pointer.x,
      dy = e.clientY - pointer.y;
    pointer.max = Math.max(pointer.max, Math.hypot(dx, dy));
    if (pointer.max > 4) {
      goal.az = pointer.ax - dx * 0.009;
      goal.el = limit(pointer.ay + dy * 0.007, 0.12, 1.54);
      change();
    }
  });
  canvas.addEventListener('pointercancel', () => {
    pointer = null;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    const click = pointer.max < 5;
    pointer = null;
    if (!click) return;
    const id = hitComponent(e);
    if (id) onSelect(id);
  });
  function hitComponent(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((e.clientY - rect.top) / rect.height) * 2,
    );
    ray.setFromCamera(mouse, camera);
    const hit = ray
      .intersectObjects(byId, true)
      .find(({ object }) => visibleHit(object));
    let group = hit?.object;
    while (group && !group.userData.module) group = group.parent;
    return group?.userData.module;
  }
  canvas.addEventListener('pointerleave', () => hover(null));
  function reset() {
    cameraMode = 'general';
    goal = {
      ...normal,
      el: cutOpen ? 0.55 : normal.el,
      zoom: explodeTo ? 0.9 : 1,
    };
    target.set(0, (cutOpen ? 9.5 : 12) + explodeTo * 4, 0);
    change();
  }
  function preset(mode) {
    if (!['pipes', 'front', 'covered'].includes(mode)) return;
    cameraMode = mode;
    cutOpen = mode !== 'covered';
    assembly.cut(cutOpen);
    hover(null);
    goal = { az: 0, el: mode === 'front' ? .075 : 1.567, zoom: 1 };
    target.set(0, mode === 'front' ? 10.8 : 11, 0);
    change();
  }
  function select(id, focus = false) {
    const anchor = currentAnchor(id);
    if (!anchor) return;
    selection = id;
    assembly.highlight(hovered || id);
    if (focus) {
      cameraMode = 'detail';
      target.fromArray(anchor).add(assembly.groups[id].position);
      goal.zoom = id === 'base' ? 1 : id === 'sprinkler' ? 2.75 : 2.1;
      goal.el = cutOpen ? 0.58 : 0.76;
    }
    change();
  }
  function cut(on) {
    if (cutOpen === on) return;
    cutOpen = on;
    assembly.cut(on);
    if (cameraMode === 'detail' && currentAnchor(selection))
      select(selection, true);
    else reset();
  }
  canvas.addEventListener('keydown', (e) => {
    manualCamera = true;
    const changes = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, 0.1],
      ArrowDown: [0, -0.1],
    };
    if (changes[e.key]) {
      e.preventDefault();
      goal.az += changes[e.key][0];
      goal.el = limit(goal.el + changes[e.key][1], 0.12, 1.54);
      change();
    } else if (e.key === '+' || e.key === '=') zoomBy(1.15);
    else if (e.key === '-') zoomBy(1 / 1.15);
    else if (e.key === 'Home') {
      e.preventDefault();
      reset();
      onCameraReset();
    }
  });
  // El desplazamiento de página sigue siendo nativo. El gesto de pinza ajusta el zoom.
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY * 0.015));
      }
    },
    { passive: false },
  );
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    disposed = true;
    host.classList.remove('ready');
    host.classList.add('unavailable');
    host.dispatchEvent(new CustomEvent('viewer-lost', { bubbles: true }));
  });
  size();
  draw(performance.now());
  host.classList.add('ready');
  return {
    reset,
    zoomBy,
    preset,
    select,
    cut,
    scrollView(progress) {
      if (!manualCamera && !reduced.matches && cameraMode === 'general') {
        goal.az = normal.az + progress * 0.15;
        goal.el = (cutOpen ? 0.55 : normal.el) + progress * 0.045;
        change();
      }
    },
    exploded(on) {
      if (explodeTo === Number(on)) return;
      explodeTo = Number(on);
      reset();
    },
    flow(on) {
      flowing = on;
      change();
    },
    points(on) {
      pointsOn = on;
      change();
    },
    // Los detalles se componen de los mismos grupos que utiliza el modelo interactivo.
    portrait(
      id = null,
      { cut: open = Boolean(id && !['garden', 'sprinkler'].includes(id)) } = {},
    ) {
      for (const group of byId) group.visible = true;
      cutOpen = open;
      assembly.cut(open);
      pointsOn = false;
      isolatedPortrait = Boolean(id);
      if (!id) {
        reset();
        return;
      }
      const related = {
        a: ['motor', 'sensorA'],
        b: ['sensorB'],
        filter: ['tank', 'pump', 'junction', 'gate', 'pipe'],
        garden: ['sprinkler'],
        sprinkler: ['garden'],
      };
      const subject = new Set([id, ...(related[id] || [])]);
      for (const [name, group] of Object.entries(assembly.groups)) {
        if (!subject.has(name)) group.visible = false;
      }
      const anchor = currentAnchor(id);
      if (!anchor) return;
      target.fromArray(anchor);
      if (id === 'a' || id === 'b') target.setY(13.2);
      goal = {
        az: 0.43,
        el: open ? 0.55 : 0.62,
        zoom:
          { a: 2.18, b: 2.35, filter: 2.15, garden: 2.35, sprinkler: 3.05 }[id] || 2.55,
      };
      cameraMode = 'detail';
      change();
    },
  };
}
