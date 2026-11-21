const paths = {
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3.5 7 8.5 5 8.5-5M12 12v9"/>',
  wave: '<path d="M2 12h4l2.6-7 5.2 14 2.5-7H22"/>',
  layers: '<path d="m2 8 10-5 10 5-10 5L2 8Zm0 4 10 5 10-5M2 16l10 5 10-5"/>',
  droplet:
    '<path d="M12 2c-2 4-7 8.6-7 13a7 7 0 1 0 14 0c0-4.4-5-9-7-13Z"/><path d="M8.5 15a3.5 3.5 0 0 0 3.5 3.5"/>',
  sensor:
    '<path d="M5 3h14v4H5zM12 7v2M4 11c1.1 4.4 4 7 8 7s7-2.6 8-7M7.8 10.5c.7 3 2.2 4.2 4.2 4.2s3.5-1.2 4.2-4.2"/>',
  leaf: '<path d="M3 20c2-6 6-8 12-12M4.5 17C2 7.5 9 3.5 21 3c-.3 12-4 18-14.5 15"/>',
  control:
    '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  rotate: '<path d="M4 10a8.2 8.2 0 1 1 1.4 7M4 4v6h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  view: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="2"/>',
  play: '<path d="m7 4 13 8-13 8V4Z"/>',
  pause: '<path d="M8 4v16m8-16v16"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  pointer: '<path d="m4 3 5.5 17 3-7 7-3L4 3Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  book: '<path d="M3 4c4.5-.7 7.2.1 9 2 1.8-1.9 4.5-2.7 9-2v15c-4.5-.7-7.2.1-9 2-1.8-1.9-4.5-2.7-9-2V4Zm9 2v15"/>',
  expand: '<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',
  hand: '<path d="M8 11V6.2a1.5 1.5 0 0 1 3 0V11m0-2.5V4.2a1.5 1.5 0 0 1 3 0V11m0-2.6V6a1.5 1.5 0 0 1 3 0v5m0-1.4a1.5 1.5 0 0 1 3 0V15c0 4-2 6-6 6h-2c-2 0-3.5-.7-5-2.5l-3.5-4.8c-1-1.6.7-3 2-2L8 14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield:
    '<path d="m12 2 8 3v7c0 5-4 8-8 10-4-2-8-5-8-10V5l8-3Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/>',
  monitor:
    '<rect x="2" y="3.5" width="20" height="14" rx="2"/><path d="M8 21h8m-4-3.5V21M6 11h3l2-4 3 7 2-3h2"/>',
};
export function icon(key) {
  return (
    '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    (paths[key] || '') +
    '</svg>'
  );
}
