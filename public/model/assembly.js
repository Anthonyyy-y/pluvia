import * as T from '../vendor/three/three.module.min.js';

// Sección urbana ilustrativa sobre la base de 80 × 60 cm. La calle corre en X.
// Las alturas distinguen niveles de montaje y no representan cotas de obra.
const ROAD = 19.8,
  WALK = 20.8;
const HEAD_X = 8,
  HEAD_Z = -12;
const undergroundTransform = new T.Matrix4().makeScale(1, 0.53, 0.68);
undergroundTransform.setPosition(0, 1.4, -9.2);
function below(x, y, z) {
  return new T.Vector3(x, y, z).applyMatrix4(undergroundTransform).toArray();
}
export const surfaceAnchors = {
  a1: [-25, ROAD, 1],
  a2: [0, ROAD, 1],
  a3: [25, ROAD, 1],
  garden: [0, WALK + 1.7, -15],
  sprinkler: [HEAD_X, WALK + 1.3, HEAD_Z],
  base: [0, ROAD, 20],
};
export const anchors = {
  base: [0, 2, 20],
  a1: below(-25, 22, 15),
  a2: below(0, 21, 15),
  a3: below(25, 21, 15),
  motor: below(-31, 25, 17),
  gate: below(-15, 19, 11),
  p1: below(-32, 14, 6),
  collector: below(1, 17.2, 0),
  filter: below(-26, 15, -8),
  tank: below(-26, 8, -18),
  garden: surfaceAnchors.garden,
  sprinkler: surfaceAnchors.sprinkler,
  irrigation: below(-14, 6, -17),
  emergency: below(34, 6, -1),
  lcd: below(26, 9.4, -9.5),
  control: below(26, 12, -18),
};
const displacements = {
  base: [0, 0, 0],
  a1: [-4, 7, 4],
  a2: [0, 7, 4],
  a3: [3, 7, 4],
  motor: [-7, 16, 5],
  gate: [1, 12, 1],
  p1: [-7, 7, -2],
  collector: [0, 5, -2],
  filter: [-5, 13, -5],
  tank: [-5, 4, -5],
  garden: [0, 4, -3],
  sprinkler: [2, 5, -3],
  irrigation: [-1, 9, -6],
  emergency: [6, 2, 0],
  lcd: [6, 9, -2],
  control: [6, 8, -5],
};
const flowLines = [
  [
    [25, 19.5, 8],
    [25, 19.2, 1],
    [25, 18.2, 0],
    [-26, 16.55, 0],
    [-26, 16.05, -7.6],
    [-26, 15.4, -7.6],
    [-26, 12.7, -10],
    [-26, 12.7, -13.4],
    [-26, 10.1, -13.4],
    [-26, 6, -16],
  ],
  [
    [-31, 14, 9],
    [-34, 15, 8],
    [-34, 16, -6],
    [-29, 16, -8],
    [-26, 14, -8],
  ],
  [
    [-21, 6, -15.5],
    [-14, 6, -15.5],
    [-12, 6, -15.5],
    [HEAD_X, 6, -15.5],
    [HEAD_X, 6, (HEAD_Z + 9.2) / 0.68],
    [HEAD_X, (WALK - 1.4) / 0.53, (HEAD_Z + 9.2) / 0.68],
  ],
  [
    [-17, 16, 13],
    [-15, 16, 9],
    [-13, 11, 4],
    [-11, 8, -1],
    [34, 6, -1],
    [34, 4, -1],
  ],
];
export function buildAssembly({ compact = false, brand = 'Pluvia' } = {}) {
  const root = new T.Group(),
    groups = {},
    batches = new Map(),
    materials = {};
  const colors = {
    deck: 0xc2c9bf,
    edge: 0xdfe5dc,
    white: 0xdbe2dc,
    pearl: 0xf3f0e5,
    ink: 0x253431,
    black: 0x131e1e,
    metal: 0xa5afae,
    steel: 0x7d9091,
    brass: 0xb28c50,
    water: 0x318e9d,
    waterTop: 0x60bbc0,
    hose: 0x638782,
    blue: 0x447b9a,
    moss: 0x586e3d,
    soil: 0x5d5341,
    pcb: 0x286253,
    green: 0x86b750,
    amber: 0xe6ae4c,
    orange: 0xd48752,
    red: 0xcb6d59,
    screen: 0x9cd3a5,
    vault: 0x9a9e93,
    excavation: 0x838e85,
    asphalt: 0x343c3d,
    gutter: 0x868b86,
    pavement: 0xbab7a9,
    curb: 0xc7c4b6,
    joint: 0x7e8075,
    roadbed: 0x5d625d,
    loam: 0x8a7358,
    subsoil: 0xa68a67,
    aggregate: 0xa89980,
    marking: 0xe4d5a4,
    cast: 0x303b3b,
    lidEdge: 0x465252,
    throat: 0x141d1c,
    bark: 0x635943,
    olive: 0x6c8150,
    leafDark: 0x4c6944,
    leafLight: 0x889e60,
    groundCover: 0x697d43,
    mulch: 0x75674b,
    grass: 0x88924f,
    bloom: 0xb7a6cd,
  };
  Object.entries(colors).forEach(([k, c]) => {
    materials[k] = new T.MeshStandardMaterial({
      color: c,
      roughness: ['steel', 'metal', 'brass', 'cast', 'lidEdge'].includes(k)
        ? 0.32
        : 0.63,
      metalness: ['steel', 'metal', 'cast', 'lidEdge'].includes(k)
        ? 0.46
        : 0.07,
    });
  });
  materials.glass = new T.MeshPhysicalMaterial({
    color: 0xc4ede6,
    roughness: 0.22,
    transparent: true,
    opacity: 0.21,
    depthWrite: false,
    side: T.DoubleSide,
  });
  materials.water = new T.MeshPhysicalMaterial({
    color: 0x377c87,
    transparent: true,
    opacity: 0.66,
    roughness: 0.16,
    metalness: 0.13,
    depthWrite: false,
  });
  const n = 96,
    pixels = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = (2 * Math.PI * x) / n,
        v = (2 * Math.PI * y) / n,
        k = 4 * (y * n + x);
      const ripple =
        Math.sin(3 * u + 2 * v + 0.9 * Math.sin(v)) * 0.55 +
        Math.sin(4 * v - u + 0.4 * Math.sin(2 * u)) * 0.27 +
        Math.sin(7 * u + 4 * v) * 0.18;
      pixels[k] = Math.round(126 + 42 * ripple);
      pixels[k + 1] = Math.round(128 + 35 * Math.cos(4 * v + u + Math.sin(u)));
      pixels[k + 2] = 250;
      pixels[k + 3] = 255;
    }
  const normals = new T.DataTexture(pixels, n, n, T.RGBAFormat);
  normals.wrapS = normals.wrapT = T.RepeatWrapping;
  normals.magFilter = normals.minFilter = T.LinearFilter;
  normals.needsUpdate = true;
  materials.waterTop = new T.MeshPhysicalMaterial({
    color: 0x489d9d,
    roughness: 0.25,
    metalness: 0.13,
    normalMap: normals,
    normalScale: new T.Vector2(0.44, 0.44),
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    transparent: true,
    opacity: 0.87,
    depthWrite: false,
  });
  const translucent = ['glass', 'water', 'waterTop'];
  const geometries = {
    box: new T.BoxGeometry(1, 1, 1),
    cylinder: new T.CylinderGeometry(1, 1, 1, compact ? 12 : 20),
    sphere: new T.SphereGeometry(1, compact ? 9 : 12, compact ? 5 : 8),
  };
  // Las tiradas de ruido son texturas procedurales locales y reproducibles.
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function grain(names, strength, repeatX, repeatY) {
    const size = 128,
      data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
      const value =
        255 - Math.round(strength * (0.55 * random() + 0.45 * random()));
      data.set([value, value, value, 255], i);
    }
    const texture = new T.DataTexture(data, size, size, T.RGBAFormat);
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    for (const name of names) {
      materials[name].map = texture;
      materials[name].roughness = 0.91;
    }
  }
  grain(['asphalt', 'roadbed'], 90, 5, 3);
  grain(['pavement', 'curb', 'gutter', 'vault', 'excavation'], 54, 3, 2);
  grain(['loam', 'subsoil', 'aggregate', 'mulch', 'groundCover'], 93, 4, 3);
  const helper = new T.Object3D(),
    up = new T.Vector3(0, 1, 0);
  for (const id of Object.keys(anchors)) {
    const group = (groups[id] = new T.Group());
    group.userData.module = id;
    root.add(group);
  }
  // Altura adicional de las piezas desmontables durante el despiece.
  let lift = 0;
  // Siempre: rejillas, jardín y dispersor. La cubierta y el interior se alternan en el corte.
  let layer = 'subsuelo',
    under = true;
  const sectional = [];
  const removable = [];
  function primitive(id, shape, color, pos, scale, quaternion) {
    const key = [id, shape, color, lift, layer, under].join(':');
    if (!batches.has(key))
      batches.set(key, { id, shape, color, lift, layer, transforms: [] });
    helper.position.set(...pos);
    helper.scale.set(...scale);
    helper.quaternion.identity();
    if (quaternion) helper.quaternion.copy(quaternion);
    helper.updateMatrix();
    const matrix = helper.matrix.clone();
    if (under) matrix.premultiply(undergroundTransform);
    batches.get(key).transforms.push(matrix);
  }
  const box = (id, color, x, y, z, w, h, d, q) =>
    primitive(id, 'box', color, [x, y, z], [w, h, d], q);
  const ell = (id, color, x, y, z, w, h, d, q) =>
    primitive(id, 'sphere', color, [x, y, z], [w, h, d], q);
  function rod(id, color, a, b, r) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      vec = end.clone().sub(start);
    const length = vec.length();
    if (!length) return;
    primitive(
      id,
      'cylinder',
      color,
      start.lerp(end, 0.5).toArray(),
      [r, length, r],
      new T.Quaternion().setFromUnitVectors(up, vec.normalize()),
    );
  }
  function pipe(id, color, points, r) {
    points.slice(1).forEach((v, i) => rod(id, color, points[i], v, r));
    points
      .slice(1, -1)
      .forEach(([x, y, z]) => ell(id, color, x, y, z, r, r, r));
  }
  function tray(
    id,
    x,
    z,
    w,
    d,
    bottom,
    height,
    water,
    frame = 'edge',
    walls = 'glass',
  ) {
    const chamber = ['a1', 'a2', 'a3', 'tank'].includes(id);
    if (chamber) frame = 'vault';
    box(id, frame, x, bottom, z, w, chamber ? 1.1 : 0.7, d);
    for (const side of [-1, 1]) {
      // Los muros de fondo e izquierda conservan material; las caras seccionadas
      // permiten leer la cámara, el haz del sensor y el nivel ilustrativo.
      const wall = chamber && side < 0 ? 'vault' : walls;
      const thickness = chamber && side < 0 ? 0.9 : 0.36;
      box(
        id,
        wall,
        x,
        bottom + height / 2,
        z + side * (d / 2 - 0.18),
        w,
        height,
        thickness,
      );
      box(
        id,
        wall,
        x + side * (w / 2 - 0.18),
        bottom + height / 2,
        z,
        thickness,
        height,
        d,
      );
      box(
        id,
        frame,
        x,
        bottom + height,
        z + (side * d) / 2,
        w + 0.48,
        0.44,
        0.55,
      );
      box(id, frame, x + (side * w) / 2, bottom + height, z, 0.55, 0.44, d);
      for (const s of [-1, 1])
        box(
          id,
          frame,
          x + (s * w) / 2,
          bottom + height / 2,
          z + (side * d) / 2,
          0.38,
          height,
          0.38,
        );
    }
    if (water) {
      for (let k = 2; k < height - 0.4; k += 1.1) {
        box(
          id,
          'steel',
          x - w / 2 + 1.1,
          bottom + k,
          z + d / 2 + 0.24,
          Math.round(k * 10) % 22 < 10 ? 1.15 : 0.72,
          0.075,
          0.06,
        );
      }
      box(
        id,
        'water',
        x,
        bottom + water / 2 + 0.2,
        z,
        w - 0.82,
        water,
        d - 0.82,
      );
      box(id, 'waterTop', x, bottom + water + 0.2, z, w - 0.83, 0.12, d - 0.83);
    }
  }
  function label(id, str, x, y, z, w, h, bg, fg, top = false) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = Math.max(55, Math.round((512 * h) / w));
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    ctx.font = '600 ' + Math.round(c.height * 0.65) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, 256, c.height * 0.52, 490);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex }),
    );
    mesh.position.set(x, y, z);
    if (top) mesh.rotation.x = -Math.PI / 2;
    if (under) mesh.applyMatrix4(undergroundTransform);
    sectional.push({ obj: mesh, layer });
    groups[id].add(mesh);
  }
  // Bandeja técnica que sostiene las cámaras por su base.
  for (const [x, w] of [
    [-25, 18],
    [0, 14],
    [25, 14],
  ]) {
    box('base', 'vault', x, 7.05, 15, w - 0.6, 9.7, 15);
    box('base', 'vault', x, 11.5, 15, w + 1, 1, 18);
  }
  // Cámaras de los tres desagües. El haz central queda libre bajo cada rejilla.
  for (const [id, x, w, d] of [
    ['a1', -25, 18, 17],
    ['a2', 0, 14, 14],
    ['a3', 25, 14, 14],
  ]) {
    const z = 15,
      b = 12,
      h = id === 'a1' ? 12.7 : 10.7;
    tray(id, x, z, w, d, b, h, id === 'a1' ? 5.2 : id === 'a2' ? 3.8 : 4.4);
    box(id, 'ink', x, 13.8, z + d / 2 + 0.5, 5.5, 2.45, 0.47);
    label(
      id,
      id.toUpperCase(),
      x,
      13.8,
      z + d / 2 + 0.747,
      4.3,
      1.87,
      '#273632',
      '#f2f5ef',
    );
    lift = 7; // Soporte y sensor forman un subconjunto.
    if (id === 'a1') {
      box(id, 'metal', x - 1, 22, 5.65, 1.1, 20.3, 0.95);
      box(id, 'steel', x - 1, 31.95, 10.75, 1.1, 1.05, 11.1);
      box(id, 'blue', x - 1, 31.25, 15.5, 2.95, 0.85, 2.8);
      rod(id, 'metal', [x - 1, 30.1, 15.5], [x - 1, 31.1, 15.5], 1.03);
      for (let k = 0; k < 4; k++)
        box(id, 'ink', x - 1, 24 + k * 1.9, 6.2, 0.36, 0.4, 0.13);
    } else {
      box(id, 'metal', x, 23.1, z - 4.3, 0.9, 4, 0.9);
      box(id, 'pcb', x, 25.1, z - 2.3, 4.9, 0.65, 5.2);
      box(id, 'ink', x, 25.54, z - 2.45, 1.3, 0.35, 1.2);
      for (let j = 0; j < 4; j++)
        box(id, 'brass', x - 1.4 + j * 0.9, 25.51, z - 4.1, 0.35, 0.2, 1);
      pipe(
        id,
        'ink',
        [
          [x + 1.8, 25.4, z - 4.2],
          [x + 2.8, 24.8, z - 5.3],
          [x + 2.8, 13, z - 5.3],
          [x + 2, 12, z - 8.9],
        ],
        0.15,
      );
      for (const side of [-1, 1]) {
        rod(
          id,
          'metal',
          [x + side * 1.3, 23.7, z - 1],
          [x + side * 1.3, 24.9, z - 1],
          0.88,
        );
        rod(
          id,
          'ink',
          [x + side * 1.3, 23.65, z - 1],
          [x + side * 1.3, 23.75, z - 1],
          0.61,
        );
      }
    }
    lift = 0;
    pipe(
      'collector',
      'hose',
      [
        [x, 19.5, 15 - d / 2],
        [x, 19.2, 1],
        [x, 16.9 + (x + 26) * 0.032, 0],
      ],
      0.64,
    );
  }
  // Mecanismos situados sólo en A1.
  rod('motor', 'metal', [-31, 23.8, 17], [-31, 27.7, 17], 1.45);
  rod('motor', 'ink', [-31, 27.5, 17], [-31, 28.2, 17], 1.32);
  rod('motor', 'steel', [-31, 16.4, 17], [-31, 24.1, 17], 0.26);
  box('motor', 'orange', -31, 16.5, 17, 4.2, 0.65, 0.85);
  box('motor', 'orange', -31, 17.3, 17, 0.85, 0.65, 4);
  for (let k = -2; k <= 2; k++)
    box('motor', 'steel', -31 + k, 16.5, 19.7, 0.21, 4.7, 0.2);
  box('gate', 'blue', -15.2, 18.8, 12, 2.6, 3.2, 2.6);
  rod('gate', 'brass', [-15.2, 20.6, 12], [-15.2, 20.6, 9.6], 0.36);
  box('gate', 'metal', -15.3, 17.7, 9.7, 0.6, 4, 2.8);
  pipe('gate', 'steel', flowLines[3].slice(0, 4), 0.85);
  pipe('emergency', 'steel', flowLines[3].slice(3), 0.83);
  tray('emergency', 34, -1, 6, 6, 1.9, 2.55, 0, 'metal', 'steel');
  // Colector en U y cartucho filtrante, con descarga libre a D.
  // La canaleta baja progresivamente desde A3 y vierte por encima del cartucho del filtro.
  const slope = Math.atan2(1.65, 51);
  const tilt = new T.Quaternion().setFromAxisAngle(
    new T.Vector3(0, 0, 1),
    slope,
  );
  box('collector', 'metal', -0.5, 17.05, 0, 54, 0.44, 2.8, tilt);
  for (const z of [-1.32, 1.32])
    box('collector', 'white', -0.5, 17.7, z, 54, 1.5, 0.28, tilt);
  box('collector', 'waterTop', -0.5, 17.35, 0, 54, 0.1, 2.24, tilt);
  pipe('collector', 'metal', flowLines[0].slice(3, 6), 0.65);
  tray('tank', -26, -18, 23, 15, 4.65, 8.1, 4.1, 'edge');
  label('tank', 'D', -26, 7, -10.24, 3.3, 1.6, '#2e4948', '#deeee8');
  for (const x of [-31, -21])
    for (const z of [-12, -5]) box('filter', 'steel', x, 9, z, 0.5, 8.4, 0.5);
  tray('filter', -26, -8.3, 10.8, 7.5, 12.7, 2.75, 0, 'metal', 'ink');
  lift = 5; // Cartucho de malla extraíble.
  for (let k = -4; k <= 4; k += 0.75)
    box('filter', 'steel', -26 + k, 15.37, -8.3, 0.29, 0.24, 6.8);
  for (let k = -3; k <= 3; k += 1.15)
    box('filter', 'metal', -26, 15.5, -8.3 + k, 10, 0.22, 0.17);
  lift = 0;
  pipe(
    'filter',
    'white',
    [
      [-26, 12.7, -10],
      [-26, 12.7, -13.4],
      [-26, 10.1, -13.4],
    ],
    0.77,
  );
  rod('p1', 'ink', [-32, 13.9, 9], [-32, 13.9, 5.5], 1.38);
  box('p1', 'blue', -32, 13.9, 5.4, 2.45, 2.25, 1.8);
  pipe('p1', 'hose', flowLines[1], 0.62);
  pipe('irrigation', 'hose', flowLines[2], 0.48);
  for (const [x, y, z] of [
    [-34, 16, -1],
    [-34, 16, 5],
    [-12, 6, -15.5],
  ])
    rod(
      x === -12 ? 'irrigation' : 'p1',
      'metal',
      [x, y, z - 0.28],
      [x, y, z + 0.28],
      0.79,
    );
  rod('irrigation', 'ink', [-17, 6, -15.5], [-14, 6, -15.5], 1.1);
  pipe(
    'emergency',
    'hose',
    [
      [-37, 11, -18],
      [-38.3, 11, -18],
      [-38.3, 6, -18],
      [-38.3, 6, -2],
      [-11, 6, -2],
      [34, 6, -2],
      [34, 4, -2],
    ],
    0.38,
  );
  // Caja seca ventilada, placa del microcontrolador visible bajo cubierta ahumada.
  for (const x of [19, 33])
    for (const z of [-24, -12]) box('control', 'steel', x, 5.6, z, 1.3, 2, 1.3);
  tray('control', 26, -18.3, 17, 16, 6.6, 5.1, 0, 'edge', 'pearl');
  box('control', 'ink', 26, 11.79, -18.3, 16, 0.34, 15);
  box('control', 'pcb', 25.3, 12, -18.3, 10.4, 0.48, 11.5);
  box('control', 'metal', 25.3, 12.7, -19.4, 5, 0.8, 5.1);
  box('control', 'black', 25.3, 12.65, -14.9, 3.1, 0.71, 2.3);
  label(
    'control',
    'ESP32',
    25.3,
    13.13,
    -19.5,
    3.8,
    1.35,
    '#a7b3ae',
    '#303f39',
    true,
  );
  for (let i = 0; i < 3; i++) {
    box('control', 'ink', 31.9, 12.03, -21.8 + 2.25 * i, 1.05, 0.95, 1.4);
    box('control', 'brass', 31.9, 12.58, -21.8 + 2.25 * i, 0.6, 0.1, 0.78);
  }
  for (const x of [20.62, 30])
    for (let k = 0; k < 9; k++)
      box('control', 'brass', x, 12.45, -23.1 + k * 1.13, 0.55, 0.65, 0.42);
  lift = 8; // Tapa de inspección del compartimento seco.
  box('control', 'glass', 26, 13.37, -18.3, 17, 0.22, 16);
  lift = 0;
  for (const x of [18.3, 33.7])
    for (const z of [-25.4, -11.25])
      rod('control', 'steel', [x, 11.9, z], [x, 13.6, z], 0.35);
  for (let k = 0; k < 6; k++)
    box('control', 'ink', 22 + k * 1.5, 8.7, -10.19, 0.84, 1.5, 0.1);
  // Interfaz de mantenimiento en la cara frontal del compartimento seco.
  box('lcd', 'ink', 26, 9.35, -9.9, 15.2, 4.6, 1.3);
  box('lcd', 'steel', 26, 9.35, -9.21, 14.6, 4.1, 0.2);
  box('lcd', 'black', 24.8, 9.3, -9.05, 10.6, 3.2, 0.2);
  label(
    'lcd',
    brand.toUpperCase(),
    24.8,
    9.3,
    -8.91,
    9.4,
    2.38,
    '#a1c69f',
    '#233a31',
  );
  for (const [i, c] of ['green', 'amber', 'red'].entries())
    ell('lcd', c, 31.1 + i * 0.75, 9.6, -9.05, 0.27, 0.27, 0.22);

  // Arquitectura de la cuadra. Unidades de maqueta; la vía y la vereda comparten bordillo.
  under = false;
  layer = 'siempre';
  for (const x of [-34, 34])
    for (const z of [-24, 24])
      rod('base', 'ink', [x, -0.85, z], [x, -0.19, z], 2);
  box('base', 'ink', 0, 0.65, 0, 80.3, 1.8, 60.3);
  box('base', 'steel', 0, 1.68, 0, 80.2, 0.24, 60.2);
  box('base', 'deck', 0, 1.93, 0, 79.95, 0.34, 59.95);
  label(
    'base',
    'CIRCUNVALACIÓN SUR',
    -22,
    0.7,
    30.17,
    19,
    1.1,
    '#293a35',
    '#d5ddd3',
  );

  // Perímetro del terreno con juntas irregulares. Desaparece al abrir la sección.
  layer = 'cubierta';
  const corners = [
    [-40, 30],
    [40, 30],
    [40, -30],
    [-40, -30],
  ];
  const strata = [
    [2.1, 0, 'loam'],
    [9.2, 1.15, 'subsoil'],
    [14.8, 0.58, 'aggregate'],
    [17.75, 0.24, 'roadbed'],
    [19.22, 0, null],
  ];
  const elevation = ([height, wave], x, z) =>
    height +
    wave *
      (0.52 * Math.sin(0.14 * x + 0.097 * z) +
        0.34 * Math.sin(0.22 * x - 0.17 * z) +
        0.14 * Math.cos(0.4 * z));
  function earthFace(start, end, low, high) {
    const coords = [],
      uv = [],
      count = 16;
    function corner(t, boundary) {
      const x = start[0] + t * (end[0] - start[0]),
        z = start[1] + t * (end[1] - start[1]);
      return [x, elevation(boundary, x, z), z];
    }
    for (let i = 0; i < count; i++) {
      const t = i / count,
        next = (i + 1) / count;
      const a = corner(t, low),
        b = corner(next, low),
        c = corner(next, high),
        d = corner(t, high);
      for (const [position, u, v] of [
        [a, t, 0],
        [b, next, 0],
        [c, next, 1],
        [a, t, 0],
        [c, next, 1],
        [d, t, 1],
      ]) {
        coords.push(...position);
        uv.push(u, v);
      }
    }
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(coords, 3));
    geom.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geom.computeVertexNormals();
    const face = new T.Mesh(geom, materials[low[2]]);
    face.userData.materialName = low[2];
    face.castShadow = true;
    face.receiveShadow = true;
    groups.base.add(face);
    sectional.push({ obj: face, layer });
  }
  corners.forEach((c, i) => {
    for (let j = 0; j < strata.length - 1; j++)
      earthFace(c, corners[(i + 1) % 4], strata[j], strata[j + 1]);
  });
  function slab(id, color, x0, x1, z0, z1, top, depth) {
    box(
      id,
      color,
      (x0 + x1) / 2,
      top - depth / 2,
      (z0 + z1) / 2,
      x1 - x0,
      depth,
      z1 - z0,
    );
  }

  // El corte excava el frente, conservando el terreno de retaguardia y una
  // terraza bajo el parterre y sus losas contiguas. Su perfil sitúa los equipos bajo rasante.
  layer = 'subsuelo';
  slab('base', 'excavation', -39.9, 39.9, -29.9, 29.9, 2.21, 0.14);
  // El contorno en planta deja el depósito y la caja seca enteros delante de la cara de tierra.
  const cutPerimeter = [
    [-40, -28.3],
    [-10.7, -28.3],
    [-10.7, -20.75],
    [12.7, -20.75],
    [12.7, -28.3],
    [40, -28.3],
    [40, -30],
    [-40, -30],
  ];
  cutPerimeter.forEach((a, i) => {
    const b = cutPerimeter[(i + 1) % cutPerimeter.length];
    for (let j = 0; j < strata.length - 1; j++)
      earthFace(a, b, strata[j], strata[j + 1]);
  });
  slab('base', 'aggregate', -16, 21, -25, -8.45, 19.37, 1.05);
  slab('base', 'subsoil', -16, 21, -25, -8.45, 18.33, 0.95);
  slab('base', 'aggregate', -40, 40, -30, -24.8, 19.37, 0.29);
  // El perfil lateral de la losa y el fondo excavado delimitan la sección.
  layer = 'cubierta';
  // Calzada y cuneta con tres huecos abiertos. La capa de rodadura no atraviesa las rejillas.
  const stations = [
    ['a1', -25],
    ['a2', 0],
    ['a3', 25],
  ];
  const gutterBack = -2.35,
    gutterFront = 4.5,
    grateZ = 1,
    grateW = 8.4,
    grateD = 4.85;
  slab('base', 'asphalt', -40, 40, gutterFront, 30, ROAD, 0.61);
  slab('base', 'gutter', -40, 40, gutterBack, grateZ - grateD / 2, ROAD, 0.61);
  slab('base', 'gutter', -40, 40, grateZ + grateD / 2, gutterFront, ROAD, 0.61);
  let previous = -40;
  for (const [, x] of stations) {
    slab(
      'base',
      'gutter',
      previous,
      x - grateW / 2,
      grateZ - grateD / 2,
      grateZ + grateD / 2,
      ROAD,
      0.61,
    );
    previous = x + grateW / 2;
  }
  slab(
    'base',
    'gutter',
    previous,
    40,
    grateZ - grateD / 2,
    grateZ + grateD / 2,
    ROAD,
    0.61,
  );
  for (const x of [-35, -15, 15, 35])
    box(
      'base',
      'joint',
      x,
      ROAD + 0.007,
      (gutterBack + gutterFront) / 2,
      0.065,
      0.018,
      gutterFront - gutterBack,
    );
  for (const x of [-32, -11, 10, 31])
    box('base', 'marking', x, ROAD + 0.018, 21.3, 8.5, 0.028, 0.42);
  // La vereda se corta en losas con un único hueco continuo para el parterre.
  const bed = { left: -11, right: 13, back: -20, front: -8.4 };
  const xs = [-40, -32, -24, -16, bed.left, -3, 5, bed.right, 21, 29, 36, 40];
  const zs = [-30, -24.8, bed.back, -14.1, bed.front, -3.25];
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      const l = xs[i],
        r = xs[i + 1],
        b = zs[j],
        f = zs[j + 1];
      if (l >= bed.left && r <= bed.right && b >= bed.back && f <= bed.front)
        continue;
      const terrace = l >= -16 && r <= 21 && f <= bed.front;
      layer = j === 0 || terrace ? 'siempre' : 'cubierta';
      slab('base', 'joint', l, r, b, f, WALK - 0.11, 1.5);
      slab(
        'base',
        'pavement',
        l + 0.035,
        r - 0.035,
        b + 0.035,
        f - 0.035,
        WALK,
        0.88,
      );
    }
  layer = 'cubierta';
  for (let x = -40; x < 40; x += 5) {
    slab(
      'base',
      'curb',
      x + 0.025,
      x + 4.975,
      -3.25,
      gutterBack,
      WALK - 0.025,
      1.64,
    );
    // Pestaña superior suave separa visualmente la piedra de bordillo de la cuneta.
    box(
      'base',
      'edge',
      x + 2.5,
      WALK - 0.093,
      gutterBack + 0.016,
      4.85,
      0.065,
      0.055,
    );
  }

  // Bocas de tormenta de fundición a ras de la calzada. El foso oscuro sólo se ve entre barras.
  for (const [id, x] of stations) {
    layer = 'cubierta';
    box(id, 'throat', x, ROAD - 3.3, grateZ, grateW - 0.1, 0.2, grateD - 0.1);
    for (const side of [-1, 1]) {
      box(
        id,
        'throat',
        x + side * (grateW / 2 - 0.12),
        ROAD - 1.74,
        grateZ,
        0.24,
        3.1,
        grateD,
      );
      box(
        id,
        'throat',
        x,
        ROAD - 1.74,
        grateZ + side * (grateD / 2 - 0.12),
        grateW,
        3.1,
        0.24,
      );
    }
    layer = 'siempre';
    for (const side of [-1, 1]) {
      box(
        id,
        'lidEdge',
        x + side * (grateW / 2 - 0.2),
        ROAD - 0.09,
        grateZ,
        0.4,
        0.26,
        grateD,
      );
      box(
        id,
        'lidEdge',
        x,
        ROAD - 0.09,
        grateZ + side * (grateD / 2 - 0.2),
        grateW - 0.4,
        0.26,
        0.4,
      );
    }
    for (let k = 0; k < 11; k++)
      box(
        id,
        'cast',
        x - 3.55 + k * 0.71,
        ROAD - 0.075,
        grateZ,
        0.32,
        0.29,
        grateD - 0.45,
      );
    box(id, 'cast', x, ROAD - 0.33, grateZ, grateW - 0.55, 0.3, 0.24);
    for (const side of [-1, 1])
      for (const s of [-1, 1])
        rod(
          id,
          'steel',
          [
            x + side * (grateW / 2 - 0.27),
            ROAD + 0.037,
            grateZ + s * (grateD / 2 - 0.24),
          ],
          [
            x + side * (grateW / 2 - 0.27),
            ROAD + 0.067,
            grateZ + s * (grateD / 2 - 0.24),
          ],
          0.12,
        );
    // En el corte queda un cuello abierto que vincula cada boca con su cámara.
    layer = 'subsuelo';
    const lower = below(x, id === 'a1' ? 24.7 : 22.7, 15)[1];
    for (const side of [-1, 1]) {
      for (const s of [-1, 1])
        box(
          id,
          'metal',
          x + side * (grateW / 2 - 0.26),
          (ROAD + lower) / 2,
          grateZ + s * (grateD / 2 - 0.22),
          0.28,
          ROAD - lower,
          0.28,
        );
    }
    box(id, 'metal', x, lower + 0.12, grateZ - grateD / 2, grateW, 0.3, 0.34);
  }

  // Lecho de tierra contenido en la vereda. Una franja transversal queda visible en el corte.
  layer = 'siempre';
  slab(
    'garden',
    'subsoil',
    bed.left,
    bed.right,
    bed.back,
    bed.front,
    WALK - 0.63,
    2.15,
  );
  slab(
    'garden',
    'mulch',
    bed.left + 0.15,
    bed.right - 0.15,
    bed.back + 0.15,
    bed.front - 0.15,
    WALK - 0.04,
    0.65,
  );
  slab(
    'garden',
    'groundCover',
    bed.left + 0.38,
    bed.right - 0.38,
    bed.back + 0.38,
    bed.front - 0.38,
    WALK + 0.015,
    0.1,
  );
  for (const [l, r, b, f] of [
    [bed.left, bed.right, bed.back, bed.back + 0.36],
    [bed.left, bed.right, bed.front - 0.36, bed.front],
    [bed.left, bed.left + 0.36, bed.back, bed.front],
    [bed.right - 0.36, bed.right, bed.back, bed.front],
  ])
    slab('garden', 'curb', l, r, b, f, WALK + 0.12, 0.64);
  // Hojas con nervio central y punta. La misma geometría se instancia para las matas ornamentales.
  const leafGeometry = new T.BufferGeometry();
  const leafVertices = [
    [0, 0, 0],
    [-0.48, 0.5, 0.07],
    [0, 0.48, 0.26],
    [0.48, 0.5, 0.07],
    [0, 1, 0.22],
  ];
  const leafFaces = [0, 2, 1, 0, 3, 2, 1, 2, 4, 2, 3, 4];
  leafGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      leafFaces.flatMap((i) => leafVertices[i]),
      3,
    ),
  );
  leafGeometry.computeVertexNormals();
  geometries.leaf = leafGeometry;
  for (const name of [
    'leafDark',
    'olive',
    'leafLight',
    'grass',
    'green',
    'moss',
  ])
    materials[name].side = T.DoubleSide;
  function leaf(x, y, z, angle, tilt, length, width, shade) {
    const rotation = new T.Quaternion().setFromEuler(
      new T.Euler(tilt, angle, 0, 'YXZ'),
    );
    primitive(
      'garden',
      'leaf',
      shade,
      [x, y, z],
      [width, length, width],
      rotation,
    );
  }
  const plants = [
    [-7.8, -11.4],
    [-2.8, -15.2],
    [2.1, -10.9],
    [4.6, -17.5],
    [10, -16.2],
  ];
  plants.forEach(([x, z], idx) => {
    ell('garden', 'mulch', x, WALK + 0.04, z, 1.55, 0.11, 1.2);
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 9 : 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + 0.44 * idx + ring;
        leaf(
          x,
          WALK + 0.13,
          z,
          angle,
          ring === 0 ? 0.98 : 0.47,
          (ring === 0 ? 2.7 : 2.5) + random() * 0.52,
          ring === 0 ? 0.76 : 0.62,
          ['leafDark', 'olive', 'leafLight'][(i + ring + idx) % 3],
        );
      }
    }
  });
  // Arbusto ornamental de varios tallos y copa ligera, alejado del dispersor.
  function shrub(x, z, height, radius) {
    ell(
      'garden',
      'mulch',
      x,
      WALK + 0.035,
      z,
      radius * 0.75,
      0.13,
      radius * 0.63,
    );
    const origin = [x, WALK + 0.08, z];
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.399,
        rad = (0.4 + 0.6 * random()) * radius;
      const crown = [
        x + Math.cos(angle) * rad,
        WALK + height * (0.69 + 0.31 * random()),
        z + Math.sin(angle) * rad * 0.78,
      ];
      const fork = [
        origin[0] + (crown[0] - x) * 0.32,
        WALK + height * 0.42,
        origin[2] + (crown[2] - z) * 0.32,
      ];
      rod('garden', 'bark', origin, fork, 0.115);
      rod('garden', 'bark', fork, crown, 0.09);
      ell(
        'garden',
        i % 3 === 0 ? 'olive' : 'leafDark',
        ...crown,
        radius * 0.67,
        radius * 0.49,
        radius * 0.62,
      );
      for (let t = 0; t < (compact ? 7 : 14); t++) {
        const phi = random() * 6.283,
          s = Math.sqrt(random());
        const lx = crown[0] + Math.cos(phi) * radius * 0.64 * s,
          lz = crown[2] + Math.sin(phi) * radius * 0.61 * s;
        const ly = crown[1] + radius * 0.45 * Math.sqrt(1 - s * s);
        ell(
          'garden',
          t % 3 === 0 ? 'leafLight' : 'olive',
          lx,
          ly,
          lz,
          0.3 + random() * 0.32,
          0.23 + random() * 0.24,
          0.32 + random() * 0.26,
        );
      }
    }
  }
  shrub(-6.2, -16.6, 5.1, 2.4);
  shrub(1.4, -17.0, 3.2, 1.5);
  for (let i = 0; i < (compact ? 39 : 72); i++) {
    const x = bed.left + 0.8 + random() * (bed.right - bed.left - 1.6),
      z = bed.back + 0.8 + random() * (bed.front - bed.back - 1.6);
    if (Math.hypot(x - HEAD_X, z - HEAD_Z) < 1.48) continue;
    for (let j = 0; j < 3; j++)
      leaf(
        x,
        WALK + 0.05,
        z,
        random() * 6.28,
        0.3 + random() * 0.8,
        0.32 + random() * 0.47,
        0.19,
        'grass',
      );
  }
  for (const [x, z] of [
    [-8.8, -13.8],
    [3.1, -15.4],
    [10.5, -18.4],
  ]) {
    for (let i = 0; i < 4; i++) {
      const p = [
        x + random() * 1.3,
        WALK + 2.3 + random() * 0.9,
        z + random() * 1.2,
      ];
      rod('garden', 'olive', [p[0] - 0.3, WALK + 0.2, p[2]], p, 0.049);
      for (let j = 0; j < 6; j++) {
        const a = j * 1.05;
        ell(
          'garden',
          'bloom',
          p[0] + Math.cos(a) * 0.21,
          p[1] + (j % 2) * 0.12,
          p[2] + Math.sin(a) * 0.21,
          0.18,
          0.15,
          0.18,
        );
      }
    }
  }

  // Sólo el emisor del riego queda sobre el terreno. La montante pertenece a P2.
  rod(
    'sprinkler',
    'ink',
    [HEAD_X, WALK - 0.02, HEAD_Z],
    [HEAD_X, WALK + 0.21, HEAD_Z],
    0.98,
  );
  rod(
    'sprinkler',
    'metal',
    [HEAD_X, WALK + 0.21, HEAD_Z],
    [HEAD_X, WALK + 1.02, HEAD_Z],
    0.34,
  );
  rod(
    'sprinkler',
    'ink',
    [HEAD_X, WALK + 0.97, HEAD_Z],
    [HEAD_X, WALK + 1.32, HEAD_Z],
    0.63,
  );
  rod(
    'sprinkler',
    'brass',
    [HEAD_X, WALK + 1.33, HEAD_Z],
    [HEAD_X, WALK + 1.39, HEAD_Z],
    0.36,
  );
  pipe(
    'sprinkler',
    'brass',
    [
      [HEAD_X, WALK + 1.11, HEAD_Z],
      [HEAD_X - 0.53, WALK + 1.16, HEAD_Z + 0.14],
    ],
    0.135,
  );

  for (const {
    id,
    shape,
    color,
    lift,
    layer,
    transforms,
  } of batches.values()) {
    const obj = new T.InstancedMesh(
      geometries[shape],
      materials[color],
      transforms.length,
    );
    transforms.forEach((m, i) => obj.setMatrixAt(i, m));
    obj.instanceMatrix.needsUpdate = true;
    obj.castShadow = !translucent.includes(color);
    obj.receiveShadow = true;
    obj.userData.materialName = color;
    sectional.push({ obj, layer });
    if (lift) removable.push({ obj, lift });
    groups[id].add(obj);
  }
  const beads = [];
  const allLines = [
    ...flowLines,
    ...[-25, 0].map((x) => [
      [x, 19.5, 7],
      [x, 19.2, 1],
      [x, 16.9 + (x + 26) * 0.032, 0],
    ]),
  ];
  allLines.forEach((line, i) => {
    const curve = new T.CurvePath();
    line
      .slice(1)
      .forEach((v, j) =>
        curve.add(
          new T.LineCurve3(
            new T.Vector3(...below(...line[j])),
            new T.Vector3(...below(...v)),
          ),
        ),
      );
    const mat = new T.MeshBasicMaterial({
      color: i === 3 ? 0xffbc6e : 0x79eddf,
      depthTest: false,
    });
    for (let j = 0; j < 4; j++) {
      const dot = new T.Mesh(geometries.sphere, mat);
      dot.scale.setScalar(0.53);
      dot.renderOrder = 3;
      root.add(dot);
      beads.push({ dot, curve, offset: j / 4 });
      dot.visible = false;
    }
  });
  for (const [dx, dz] of [
    [-5.8, -3],
    [-6.8, 0.4],
    [-4.1, 2.3],
    [2.8, -3.1],
  ]) {
    const origin = new T.Vector3(HEAD_X, WALK + 1.23, HEAD_Z);
    const curve = new T.QuadraticBezierCurve3(
      origin,
      origin.clone().add(new T.Vector3(dx * 0.55, 2.55, dz * 0.55)),
      new T.Vector3(HEAD_X + dx, WALK + 0.13, HEAD_Z + dz),
    );
    const spray = new T.MeshBasicMaterial({ color: 0x92dfeb, depthTest: true });
    for (let j = 0; j < 5; j++) {
      const dot = new T.Mesh(geometries.sphere, spray);
      dot.visible = false;
      dot.scale.setScalar(0.12);
      root.add(dot);
      beads.push({ dot, curve, offset: j / 5 });
    }
  }
  function setCut(enabled) {
    for (const { obj, layer } of sectional) {
      obj.visible =
        layer === 'siempre' ||
        (enabled ? layer === 'subsuelo' : layer === 'cubierta');
    }
  }
  setCut(false);
  return {
    root,
    groups,
    explode(amount) {
      for (const { obj, lift } of removable) obj.position.y = amount * lift;
      Object.entries(groups).forEach(([id, g]) =>
        g.position.fromArray(displacements[id]).multiplyScalar(amount),
      );
    },
    cut(enabled) {
      setCut(enabled);
    },
    highlight(id) {
      for (const [key, g] of Object.entries(groups))
        for (const obj of g.children) {
          const name = obj.userData.materialName;
          if (!name || name === 'glass') continue;
          if (key === id) {
            if (!obj.userData.selected) {
              obj.userData.selected = materials[name].clone();
              obj.userData.selected.emissive.setHex(0x50783a);
              obj.userData.selected.emissiveIntensity = 0.55;
            }
            obj.material = obj.userData.selected;
          } else obj.material = materials[name];
        }
    },
    flow(enabled, t) {
      beads.forEach(({ dot, curve, offset }) => {
        dot.visible = enabled;
        if (enabled)
          dot.position.copy(curve.getPointAt((t * 0.15 + offset) % 1));
      });
    },
  };
}
