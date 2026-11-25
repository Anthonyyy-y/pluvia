// Prueba aislada de las cuatro fuentes. No accede a dispositivos o servidores externos.
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');
const fs = require('node:fs/promises'),
  http = require('node:http');
const os = require('node:os'),
  path = require('node:path');
const root = path.resolve(__dirname, '..');
async function verify() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pluvia-qa-dos-'));
  let backend, browser, placa;
  try {
    const bin = path.join(dir, 'generar');
    execFileSync(process.env.CXX || 'c++', [
      '-std=c++17',
      '-Wall',
      '-Wextra',
      '-Werror',
      path.join(root, 'firmware/tests/test_json_dos.cpp'),
      '-o',
      bin,
    ]);
    const wire = execFileSync(bin, { encoding: 'utf8' }),
      packet = JSON.parse(wire);
    assert.deepEqual(
      packet.lecturas.map((r) => r.valor),
      [8.5, null],
    );
    assert.equal(packet.lecturas[0].nivelEstanque, null);
    assert.equal(packet.lecturas[0].reservaEstimadaS, 4.5);
    backend = spawn('python3', ['-B', '-u', 'server/app.py'], {
      cwd: root,
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: '0',
        DATA_DIR: dir,
        DEVICE_TOKEN: 'token-prueba',
        MONITOR_PASSWORD: 'acceso-prueba',
        DEVICE_ID: 'placa-prueba',
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const url = await new Promise((ok, no) => {
      const t = setTimeout(() => no(Error('Backend no disponible')), 10000);
      backend.stdout.on('data', (b) => {
        const m = b.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (m) {
          clearTimeout(t);
          ok(m[0]);
        }
      });
      backend.once('error', no);
    });
    placa = http.createServer((req, res) => {
      res.writeHead(req.url === '/api/v1/lecturas' ? 200 : 404, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(wire);
    });
    await new Promise((ok) => placa.listen(0, '127.0.0.1', ok));
    browser = await chromium.launch({
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const apiHits = [];
    page.on('request', (r) => {
      if (r.url().startsWith(url + '/api/')) apiHits.push(r.url());
    });
    await page.goto(url + '/monitoreo/');
    await page.locator('#sample-badge').waitFor();
    await page.selectOption('#scenario', 'd2');
    assert.equal(await page.locator('#state-D2').innerText(), 'Alerta');
    assert.equal(apiHits.length, 0);
    await page.selectOption('#scenario', 'fallo');
    assert.equal(await page.locator('#val-D2').innerText(), '—');
    await page.selectOption('#scenario', 'riego');
    assert.equal(await page.locator('#pump').innerText(), 'Activada');
    const dlPromise = page.waitForEvent('download');
    await page.click('#csv');
    const dl = await dlPromise;
    const csv = await fs.readFile(await dl.path(), 'utf8');
    assert.match(csv, /SIMULACION/);
    await page.click('[data-mode="wifi"]');
    await page.fill(
      '#device-url',
      'http://127.0.0.1:' + placa.address().port + '/api/v1/lecturas',
    );
    await page.locator('#wifi-actions button').click();
    await page.waitForFunction(
      () => document.querySelector('#state-D1').textContent === 'Alerta',
    );
    assert.equal(
      await page.locator('#physical-tank').innerText(),
      'Sin medición',
    );
    assert.equal(await page.locator('#val-D2').innerText(), '—');
    await page.click('#disconnect');
    assert.match(await page.locator('#connection').innerText(), /Desconectado/);
    await page.addInitScript(
      ({ lineas }) => {
        const bytes = new TextEncoder().encode(lineas);
        Object.defineProperty(navigator, 'serial', {
          configurable: true,
          value: {
            requestPort: async () => ({
              readable: new ReadableStream({
                start(c) {
                  c.enqueue(bytes.slice(0, 10));
                  c.enqueue(bytes.slice(10));
                },
              }),
              open: async () => {},
              close: async () => {},
            }),
          },
        });
      },
      {
        lineas: packet.lecturas.map((r) => JSON.stringify(r)).join('\n') + '\n',
      },
    );
    await page.goto(url + '/monitoreo/?modo=usb');
    await page.click('#serial-connect');
    await page.waitForFunction(
      () => document.querySelector('#state-D1').textContent === 'Alerta',
    );
    assert.equal(await page.locator('#motor').innerText(), 'Activada');
    await page.click('[data-mode="nube"]');
    const posted = await page.request.post(url + '/api/v1/telemetry', {
      headers: { Authorization: 'Bearer token-prueba' },
      data: packet,
    });
    assert.equal(posted.status(), 201);
    await page.fill('#password', 'acceso-prueba');
    await page.locator('#login button').click();
    await page.waitForFunction(
      () =>
        document.querySelector('#connection').textContent === 'Nube conectada',
    );
    assert.match(await page.locator('#alerts').innerText(), /D2.*sin eco/i);
    assert.equal(await page.locator('#state-D2').innerText(), 'Sin eco válido');
    await page.locator('#alerts button').first().click();
    await page.click('#logout');
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      const fuera = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((n) => n.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8)
          .map((n) => n.tagName + '.' + n.className),
      );
      assert.deepEqual(fuera, [], 'Desborde a ' + width + ' px: ' + fuera);
    }
    assert.deepEqual(errors, []);
    console.log(
      'OK: serializador real C++, demo sin backend, USB segmentado, HTTP local, POST v2, nube autenticada, alertas, CSV y móvil.',
    );
  } finally {
    await browser?.close();
    if (backend) backend.kill();
    if (placa) await new Promise((r) => placa.close(r));
    await fs.rm(dir, { recursive: true, force: true });
  }
}
if (require.main === module)
  verify().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
module.exports = { verify };
