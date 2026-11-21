// Láminas esquemáticas de identificación. Las formas ilustran la función de cada pieza.
const ink = '#294b43',
  pcb = '#507865',
  brass = '#b28f57',
  metal = '#aebbb3',
  water = '#84b9b5';
const rect = (x, y, w, h, fill, rx = 1) =>
  '<rect x="' +
  x +
  '" y="' +
  y +
  '" width="' +
  w +
  '" height="' +
  h +
  '" rx="' +
  rx +
  '" fill="' +
  fill +
  '"/>';
const circ = (x, y, r, fill) =>
  '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"/>';
const path = (d, stroke = ink, width = 2, fill = 'none') =>
  '<path d="' +
  d +
  '" stroke="' +
  stroke +
  '" stroke-width="' +
  width +
  '" fill="' +
  fill +
  '" stroke-linecap="round" stroke-linejoin="round"/>';
const text = (x, y, words, size = 7, fill = ink) =>
  '<text x="' +
  x +
  '" y="' +
  y +
  '" text-anchor="middle" font-size="' +
  size +
  '" fill="' +
  fill +
  '" font-family="monospace">' +
  words +
  '</text>';
const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
const screw = (x, y) =>
  circ(x, y, 2.5, metal) +
  path('M' + (x - 1.4) + ' ' + (y + 1.4) + 'l2.8 -2.8', ink, 0.7);
function board(mark) {
  return (
    rect(32, 12, 82, 55, pcb, 4) +
    repeat(
      12,
      (i) =>
        rect(35 + i * 6.4, 14, 2.5, 4, brass) +
        rect(35 + i * 6.4, 61, 2.5, 4, brass),
    ) +
    rect(47, 23, 34, 31, metal, 2) +
    rect(83, 23, 17, 29, '#203b35') +
    repeat(4, (i) => path('M87 ' + (26 + i * 6) + 'h9', brass, 1)) +
    rect(26, 29, 11, 17, '#cbd0c4', 2) +
    text(64, 41, mark, 6) +
    screw(108, 19) +
    screw(108, 60)
  );
}
function chip(mark) {
  return (
    repeat(
      8,
      (i) =>
        rect(43 + i * 8, 16, 3, 12, metal) + rect(43 + i * 8, 53, 3, 11, metal),
    ) +
    rect(38, 25, 71, 30, ink, 3) +
    circ(44, 32, 2, metal) +
    text(74, 43, mark, 8, '#e2ece1')
  );
}
function resistor(paired = false) {
  const one = (y) =>
    path('M22 ' + y + 'h105', metal, 2.5) +
    rect(48, y - 7, 45, 14, '#bca67b', 5) +
    [ink, brass, '#997364', '#6e7966']
      .map((c, i) => rect(56 + i * 8, y - 7, 3, 14, c))
      .join('');
  return paired ? one(30) + one(52) : one(40);
}
function pump() {
  return (
    rect(42, 25, 51, 29, ink, 9) +
    rect(38, 29, 14, 21, pcb, 3) +
    rect(91, 32, 23, 10, metal, 2) +
    rect(75, 15, 9, 15, metal) +
    path('M43 36C27 36 26 25 18 24', pcb) +
    path('M43 42C25 42 24 34 16 34', ink) +
    circ(77, 39, 9, metal) +
    circ(77, 39, 4, pcb)
  );
}
function vessel(variant) {
  return (
    path('m28 29 49-13 39 15-51 15z', ink, 1.4, '#c7d6c9') +
    path('m28 29 37 17v25L28 53z', ink, 1.4, '#90a99c') +
    path(
      'm65 46 51-15v25L65 71z',
      ink,
      1.4,
      variant === 'tank' ? water : '#b3c9bc',
    ) +
    path(
      'm35 30 41-10 31 11-43 12z',
      ink,
      1,
      variant === 'empty'
        ? '#e3ebe1'
        : variant === 'garden'
          ? '#708654'
          : water,
    )
  );
}
const tube = () =>
  path('M18 56h20q8 0 8-10V32q0-6 7-6h26q9 0 9 8v10q0 5 6 5h28', ink, 8) +
  path(
    'M18 55h20q7 0 7-9V32q0-7 8-7h26q10 0 10 9v10q0 4 5 4h28',
    '#94ada0',
    4,
  ) +
  rect(28, 50, 4, 10, brass) +
  rect(109, 43, 4, 10, brass);
function artFor(id) {
  switch (id) {
    case 0:
      return board('WROOM');
    case 1:
      return (
        rect(72, 24, 45, 30, pcb, 2) +
        rect(79, 30, 12, 11, ink) +
        screw(111, 30) +
        screw(111, 48) +
        path('M74 42C56 45 63 65 41 57S20 44 32 36', ink, 2.8) +
        rect(25, 22, 22, 16, metal, 5) +
        rect(27, 21, 18, 4, ink)
      );
    case 2:
      return (
        rect(26, 25, 93, 32, pcb, 2) +
        [46, 97]
          .map(
            (x) =>
              circ(x, 40, 13, '#cdd5cd') +
              circ(x, 40, 10, ink) +
              circ(x, 40, 8, '#839387') +
              repeat(6, (i) =>
                path('M' + (x - 5 + i * 2) + ' 34v12', ink, 0.65),
              ),
          )
          .join('') +
        rect(65, 33, 14, 11, ink) +
        repeat(4, (i) => rect(61 + i * 6, 56, 2, 10, brass))
      );
    case 3:
      return (
        '<g stroke-dasharray="4 3">' +
        path('M48 53V25h49v28', pcb, 2) +
        '</g>' +
        vessel('empty') +
        text(74, 39, '?', 13)
      );
    case 4:
      return (
        path('M56 49v17m26-17v17', metal, 3) +
        circ(69, 35, 20, '#aa8d61') +
        path(
          'M54 28h22q5 0 3 3H59q-5 0-3 4h23q5 0 2 4H60q-5 0-2 4h24',
          '#775b48',
          2,
        )
      );
    case 5:
      return (
        rect(20, 21, 109, 40, pcb, 2) +
        rect(30, 25, 88, 31, ink, 2) +
        rect(34, 29, 80, 23, '#b0c89e') +
        text(73, 39, 'A1  A2  A3', 8) +
        text(74, 48, 'NIVEL', 7) +
        screw(24, 26) +
        screw(125, 55)
      );
    case 6:
      return ['#669b6e', '#d3ae55', '#bd7360']
        .map((c, i) => {
          const x = 44 + i * 30;
          return (
            path('M' + (x - 3) + ' 43v20m7-20v16', metal, 2) +
            rect(x - 7, 29, 14, 17, c, 5) +
            rect(x - 9, 42, 18, 4, c) +
            circ(x - 2, 32, 2, '#eff3da')
          );
        })
        .join('');
    case 7:
      return (
        rect(45, 30, 61, 26, pcb) +
        circ(70, 37, 17, ink) +
        circ(70, 37, 4, '#82988d') +
        repeat(3, (i) => rect(85 + i * 5, 53, 2, 11, brass))
      );
    case 8:
      return chip('74HC595');
    case 9:
      return (
        rect(32, 25, 46, 28, metal, 9) +
        rect(29, 29, 10, 21, ink, 3) +
        path('M77 39h30', ink, 3) +
        path('M99 39q-5-16 8-18l2 17q12 10 5 17l-9-13q-8 6-17 2z', pcb, 1, pcb)
      );
    case 10:
    case 25:
      return (
        rect(46, 33, 44, 27, ink, 3) +
        rect(42, 38, 52, 4, pcb) +
        circ(64, 29, 8, metal) +
        path('m44 21 43 15', metal, 5) +
        path('M88 51q15 0 19-13', brass, 2)
      );
    case 11:
    case 12:
      return pump();
    case 13:
      return [0, 1, 2]
        .map(
          (i) =>
            rect(23 + 34 * i, 25, 28, 29, pcb, 2) +
            rect(27 + 34 * i, 29, 19, 11, ink) +
            rect(28 + 34 * i, 45, 8, 6, brass) +
            rect(39 + 34 * i, 45, 8, 6, brass),
        )
        .join('');
    case 14:
    case 15:
    case 16:
      return resistor(id !== 14);
    case 17:
      return (
        path('M62 45v22m14-22v22', metal, 2) +
        circ(69, 34, 15, '#b18b53') +
        text(69, 37, '104', 7)
      );
    case 18:
      return (
        rect(49, 26, 39, 30, pcb, 6) +
        circ(68, 40, 11, brass) +
        path('m62 45 12-10', ink, 2) +
        repeat(3, (i) => rect(56 + i * 11, 53, 2, 10, metal))
      );
    case 19:
      return (
        rect(34, 22, 77, 37, metal, 4) +
        repeat(7, (i) => rect(40 + i * 6, 29, 2, 13, ink)) +
        rect(87, 26, 19, 27, pcb, 2) +
        circ(95, 32, 3, brass) +
        circ(95, 46, 3, brass)
      );
    case 20:
      return (
        [0, 1, 2]
          .map((i) =>
            path(
              'M25 ' + (26 + i * 6) + 'C53 16 65 65 103 ' + (49 + i * 4),
              [pcb, brass, ink][i],
              2,
            ),
          )
          .join('') +
        rect(20, 23, 9, 18, ink) +
        rect(101, 45, 13, 17, ink)
      );
    case 21:
      return chip('NIVELES');
    case 22:
      return (
        path('m15 39 70-21 48 17-70 24z', ink, 1.3, '#62706e') +
        path('m15 39 48 20 70-24v9L63 66 15 47z', ink, 1.3, '#9b8c75') +
        path('m15 38 70-21 12 4-70 22z', ink, 0.8, '#c6c8b5') +
        path('m29 48 12-4m11-3 12-4m11-3 12-4', '#eee6c7', 1.4)
      );
    case 23:
      return (
        path('M33 24h81v8h-8v31H41V32h-8z', ink, 1.8, '#acb8ac') +
        rect(47, 32, 53, 25, '#e2ebe1') +
        rect(47, 46, 53, 11, water) +
        rect(49, 23, 50, 7, ink) +
        repeat(6, (i) => path('m' + (52 + i * 8) + ' 25v3', metal, 2)) +
        path('M98 51h19', ink, 4)
      );
    case 24:
      return (
        path('m18 39 64-22 49 17-66 25z', ink, 1.7, '#738078') +
        path('m28 39 54-18 37 13-54 20z', ink, 1.4, '#263d36') +
        repeat(9, (i) =>
          path(
            'm' + (32 + i * 5.8) + ' ' + (38.2 - i * 1.93) + ' 32 11',
            metal,
            2.2,
          ),
        )
      );
    case 28:
      return (
        vessel('empty') +
        repeat(8, (i) =>
          path(
            'm' + (38 + i * 4.1) + ' ' + (29 - i * 0.96) + ' 29 12',
            ink,
            1.5,
          ),
        ) +
        repeat(6, (i) =>
          path('m' + (40 + i * 5) + ' ' + (33 + i * 1.75) + ' 35-10', pcb, 1),
        )
      );
    case 26:
      return (
        path('M18 44 108 15l19 7-89 32z', ink, 1.4, '#a7c5bc') +
        path('m18 40 3 11 17 8 90-31-1-10-89 32z', ink, 1.4, '#b8c9bb')
      );
    case 27:
      return tube();
    case 31:
      return (
        vessel('garden') +
        repeat(15, (i) => {
          const x = 48 + ((i * 19) % 46),
            y = 27 + ((i * 3) % 8);
          return path(
            'm' + x + ' ' + y + ' -2-6 4 3 3-5-1 6z',
            pcb,
            0.8,
            '#81a36c',
          );
        })
      );
    case 32:
      return (
        vessel('empty') +
        path('m26 24 50-14 41 15-52 16z', ink, 1.3, '#c2cbbb') +
        repeat(6, (i) =>
          path('m' + (72 + i * 5) + ' ' + (48 - i * 1.4) + 'v8', ink, 1.6),
        )
      );
    case 33:
      return (
        path('M17 52h112', '#648160', 1.6) +
        path('M25 65h48V47', metal, 5) +
        rect(66, 42, 14, 11, ink, 2) +
        rect(63, 39, 20, 5, pcb, 2) +
        rect(68, 36, 10, 3, ink, 1) +
        '<g stroke-dasharray="3 3">' +
        path(
          'M71 34Q49 9 30 38m44-5q17-27 43-3m-43 3q5-17 17-18',
          '#539797',
          1.7,
        ) +
        '</g>' +
        path(
          'm42 51-4-8 6 4 2-9 2 9 6-4-5 8m50 0-3-7 5 4 3-8 1 7 5-3-5 7',
          pcb,
          1,
          '#8fae78',
        )
      );
    default:
      return vessel(id === 29 ? 'tank' : 'empty');
  }
}
export function materialArt(row) {
  return (
    '<svg role="img" aria-label="Representación esquemática de ' +
    row.name +
    '" viewBox="0 0 148 80" xmlns="http://www.w3.org/2000/svg">' +
    artFor(row.id) +
    '</svg>'
  );
}
