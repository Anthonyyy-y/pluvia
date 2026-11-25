'use strict';
// Protocolo compartido por Web Serial y HTTP. Los null conservan su significado
// de medida ausente y cada sensor lleva su propio tiempo de adquisición.
(() => {
  const ids = ['D1', 'D2'];
  const natural = (n) => Number.isFinite(n) && n >= 0;
  function lectura(r, origen = 'REAL') {
    if (
      !r ||
      !ids.includes(r.sensor) ||
      !Number.isSafeInteger(r.ts) ||
      r.ts < 0 ||
      !(r.valor === null || natural(r.valor)) ||
      typeof r.bombaEstado !== 'boolean' ||
      !(r.nivelEstanque === null || natural(r.nivelEstanque))
    )
      throw Error('Registro JSON incompatible.');
    if (r.reservaEstimadaS != null && !natural(r.reservaEstimadaS))
      throw Error('Reserva estimada inválida.');
    for (const key of ['motorEstado', 'compuertaAbierta', 'luz'])
      if (
        r[key] !== undefined &&
        r[key] !== null &&
        typeof r[key] !== 'boolean'
      )
        throw Error('Orden de control inválida.');
    const source = r.source ?? origen;
    if (!['REAL', 'SIMULACION'].includes(source))
      throw Error('Origen de medición desconocido.');
    return { ...r, source };
  }
  function paquete(p) {
    if (p && p.version === 2) {
      if (
        !Array.isArray(p.lecturas) ||
        p.lecturas.length !== 2 ||
        !ids.every((id, i) => p.lecturas[i]?.sensor === id) ||
        !p.lecturas.every((r) => r.source === p.source)
      )
        throw Error('Par de sensores incompleto.');
      return p.lecturas.map((r) => lectura(r, p.source));
    }
    if (Array.isArray(p)) return p.map((r) => lectura(r));
    return [lectura(p)];
  }
  function estado(valor) {
    if (valor === null) return ['Sin eco válido', 'missing'];
    if (valor >= 8) return ['Alerta', 'high'];
    if (valor >= 5) return ['Precaución', 'warn'];
    return ['Normal', ''];
  }
  function demo(escenario, seq) {
    const oscilacion = Math.sin(seq / 3) * 0.45;
    const alturas = [2.5 + oscilacion, 3.3 - oscilacion];
    if (escenario === 'd1') alturas[0] = 8.6 + oscilacion;
    if (escenario === 'd2') alturas[1] = 8.7 - oscilacion;
    if (escenario === 'fallo') alturas[1] = null;
    return ids.map((sensor, i) => ({
      ts: seq * 2000,
      sensor,
      valor: alturas[i] === null ? null : +alturas[i].toFixed(2),
      bombaEstado: escenario === 'riego',
      nivelEstanque: null,
      reservaEstimadaS: escenario === 'riego' ? 8 + oscilacion : 4,
      motorEstado: escenario === 'd1',
      compuertaAbierta: escenario === 'd1' || escenario === 'd2',
      luz: escenario === 'riego',
      source: 'SIMULACION',
    }));
  }
  function csv(registros, via) {
    const rows = [
      [
        'recepcion_utc',
        'fuente',
        'origen',
        'ts_ms',
        'sensor',
        'valor_cm',
        'bomba_orden',
        'nivel_estanque_cm',
        'reserva_estimada_s',
        'motor_orden',
        'compuerta_abierta',
        'luz',
      ],
    ];
    for (const r of registros)
      rows.push([
        new Date(r.t).toISOString(),
        via,
        r.source,
        r.ts,
        r.sensor,
        r.valor,
        r.bombaEstado,
        r.nivelEstanque,
        r.reservaEstimadaS,
        r.motorEstado,
        r.compuertaAbierta,
        r.luz,
      ]);
    return (
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map(
              (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"',
            )
            .join(','),
        )
        .join('\r\n') +
      '\r\n'
    );
  }
  window.PluviaDatos = { ids, lectura, paquete, estado, demo, csv };
})();
