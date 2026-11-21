// Pruebas opcionales con Playwright. Ejecuta desde WEB con "npm run probar:web".
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function startBackend(directory, password) {
  const child = spawn(
    process.env.PYTHON || 'python3',
    ['-B', '-u', 'server/app.py'],
    {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: '0',
        DATA_DIR: directory,
        DEVICE_ID: 'prueba-web',
        DEVICE_TOKEN: randomUUID(),
        MONITOR_PASSWORD: password,
        COOKIE_SECURE: 'false',
        DEMO_INTERVAL_SECONDS: '.4',
        STALE_SECONDS: '2',
        // Deja margen entre caducidad y desconexión para observar ambas transiciones con Chromium.
        OFFLINE_SECONDS: '10',
      },
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(Error('El servidor de ensayo no arrancó en 10 s.'));
    }, 10000);
    child.once('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(Error('El servidor terminó con código ' + code));
    });
    child.stdout.on('data', (data) => {
      const match = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });
  return { child, url };
}
async function assertSection(page, section) {
  const open = section === 'subsuelo';
  for (const selector of ['#hero-model', '#detail-model'])
    assert.equal(
      await page.locator(selector).getAttribute('data-section'),
      section,
    );
  for (const selector of ['[data-hero=cut]', '[data-layer=cut]'])
    assert.equal(
      await page.locator(selector).getAttribute('aria-pressed'),
      String(open),
    );
  assert.equal(
    await page.locator('[data-hero=cut] span').innerText(),
    open ? 'Ver superficie' : 'Ver subsuelo',
  );
}
async function assertPlanLoaded(page, selector, file) {
  await page.waitForFunction(
    ({ selector, file }) => {
      const image = document.querySelector(selector);
      return (
        image.src.endsWith('/assets/' + file) &&
        image.complete &&
        image.naturalWidth > 0
      );
    },
    { selector, file },
  );
}
async function verifyLanding(browser, url, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
  });
  await page.goto(url);
  await page.locator('#hero-model.ready').waitFor();
  await assertSection(page, 'superficie');
  await page.locator('[data-hero=cut]').click();
  await assertSection(page, 'subsuelo');
  await page.locator('[data-hero=cut]').click();
  await assertSection(page, 'superficie');
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    'Desbordamiento horizontal a ' + width,
  );
  if (width === 390) {
    await page.locator('.mobile-menu').click();
    await page.locator('#main-nav a[href="#sistema"]').click();
    await page.locator('#main-nav').waitFor({ state: 'hidden' });
  }
  await page.locator('.hero-actions a').first().click();
  await page.locator('#detail-model.ready').waitFor();
  const surfacePins = page.locator('#detail-model .pin:not([hidden])');
  await page.waitForFunction(
    () =>
      document.querySelectorAll('#detail-model .pin:not([hidden])').length ===
      5,
  );
  assert.deepEqual(
    await surfacePins.evaluateAll((nodes) =>
      nodes.map((n) => n.dataset.component).sort(),
    ),
    ['a1', 'a2', 'a3', 'garden', 'sprinkler'],
  );
  await page.locator('[data-component=sprinkler]').click();
  assert.equal(
    await page.locator('#component-picker').inputValue(),
    'sprinkler',
  );
  await page.locator('#open-material').click();
  assert.match(await page.locator('#mat-name').innerText(), /dispersor/i);
  await page.locator('#locate-material').click();
  await assertSection(page, 'superficie');
  await page.locator('#component-picker').selectOption('tank');
  await assertSection(page, 'subsuelo');
  assert.match(
    await page.locator('#module-description').innerText(),
    /bloquea/,
  );
  await page.locator('#open-material').click();
  assert.equal(await page.locator('#mat-name').innerText(), 'Depósito común');
  await page.locator('#category').selectOption('Control y sensores');
  await page
    .getByRole('button', { name: 'Sensor del depósito', exact: true })
    .click();
  assert.match(await page.locator('#mat-state').innerText(), /Pendiente/);
  await page.locator('#locate-material').click();
  assert.equal(await page.locator('#component-picker').inputValue(), 'tank');
  await page.locator('[data-layer=exploded]').click();
  assert.equal(
    await page.locator('[data-layer=exploded]').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('[data-layer=cut]').click();
  await assertSection(page, 'superficie');
  assert.equal(
    await page.locator('[data-layer=exploded]').getAttribute('aria-pressed'),
    'false',
  );
  await page.locator('[data-layer=flow]').click();
  await assertSection(page, 'subsuelo');
  assert.equal(
    await page.locator('[data-layer=exploded]').getAttribute('aria-pressed'),
    'false',
  );
  await page.locator('#flow-key').waitFor();
  await page.locator('[data-layer=flow]').click();
  await page.locator('#view').selectOption('top');
  await page.locator('[data-zoom=reset]').click();
  await page
    .getByRole('button', { name: 'Tercera alcantarilla', exact: true })
    .click();
  assert.equal(await page.locator('#component-picker').inputValue(), 'a3');
  await page.locator('#tour').click();
  assert.equal(
    await page.locator('#tour').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('#tour').click();
  await page.locator('#contact-open').click();
  await page.locator('#contact-dialog').waitFor({ state: 'visible' });
  if (width === 1440) {
    await page.getByLabel('Nombre', { exact: true }).fill('Ensayo local');
    await page
      .getByLabel('Correo electrónico', { exact: true })
      .fill('prueba@example.invalid');
    await page
      .getByLabel('Mensaje', { exact: true })
      .fill('Verificación automática del formulario en base temporal.');
    await page.route('**/api/v1/contact', (route) => route.abort());
    await page.getByRole('button', { name: 'Registrar solicitud' }).click();
    await page
      .getByText('No se pudo conectar. Tus datos siguen en el formulario.')
      .waitFor();
    assert.equal(
      await page.getByLabel('Nombre', { exact: true }).inputValue(),
      'Ensayo local',
    );
    await page.unroute('**/api/v1/contact');
    await page.getByRole('button', { name: 'Registrar solicitud' }).click();
    await page
      .getByText(/Solicitud registrada. Referencia [a-f0-9]+/)
      .waitFor();
  }
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log(
    width +
      ' px: maqueta, selección, inventario, capas, recorrido y navegación correctos.',
  );
  await page.close();
}
async function verifyPanel(browser, url, password) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + '/monitoreo');
  await page.waitForFunction(() =>
    document.querySelector('.station .badge')?.textContent.includes('NORMAL'),
  );
  assert.equal(
    await page.locator('#source-label').innerText(),
    'Modo demostración — datos simulados',
  );
  await page.selectOption('#scenario', 'a2_alert');
  await page.waitForFunction(() =>
    document
      .querySelectorAll('.station .badge')[1]
      .textContent.includes('ALERTA'),
  );
  await page.locator('.event .secondary').first().click();
  await page.waitForFunction(() =>
    document.querySelector('#events').textContent.includes('Reconocido'),
  );
  await page.selectOption('#scenario', 'tank_missing');
  await page.waitForFunction(() =>
    document
      .querySelector('#reservoir')
      .textContent.includes('Ambas bombas bloqueadas'),
  );
  await page.selectOption('#scenario', 'sensor_error');
  await page.waitForFunction(() =>
    document
      .querySelectorAll('.station .badge')[1]
      .textContent.includes('ERROR'),
  );
  assert.equal(
    await page.locator('.station .level > span').nth(1).innerText(),
    '—',
  );
  const [pauseResponse] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/v1/demo/scenario') &&
        r.request().postDataJSON()?.scenario === 'offline',
    ),
    page.selectOption('#scenario', 'offline'),
  ]);
  assert.equal(pauseResponse.status(), 200);
  assert.equal((await pauseResponse.json()).scenario, 'offline');
  await page.waitForFunction(
    () =>
      document
        .querySelector('#condition')
        .textContent.includes('Mediciones caducadas'),
    undefined,
    { polling: 100 },
  );
  await page.waitForFunction(() =>
    document
      .querySelector('#condition')
      .textContent.includes('Dispositivo desconectado'),
  );
  assert.doesNotMatch(await page.locator('#stations').innerText(), /NORMAL/);
  await page.selectOption('#scenario', 'recovery');
  await page.waitForFunction(() =>
    document.querySelector('.station .badge').textContent.includes('NORMAL'),
  );
  await page.selectOption('#period', '6');
  await page.locator('#history-details summary').click();
  await page.waitForFunction(
    () => document.querySelector('#history-rows').children.length > 0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#csv'),
  ]);
  assert.equal(download.suggestedFilename(), 'telemetria-demo-6h.csv');
  await page.click('#mode-real');
  await page.locator('#auth input[type=password]').fill(password);
  await page.locator('#auth button[type=submit]').click();
  await page
    .getByText('Esperando datos del dispositivo', { exact: true })
    .first()
    .waitFor();
  for (const width of [390, 768, 320]) {
    await page.setViewportSize({ width, height: 850 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'Panel: SSE, alertas, reconocimiento, recuperación, exportación y espera autenticada correctos.',
  );
  await page.close();
}
(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pluvia-ui-'));
  let server, browser;
  const password = randomUUID();
  try {
    server = await startBackend(temp, password);
    browser = await chromium.launch({
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    for (const [w, h] of [
      [1440, 960],
      [390, 844],
      [768, 1024],
      [320, 740],
    ])
      await verifyLanding(browser, server.url, w, h);
    const page = await browser.newPage({
      viewport: { width: 400, height: 820 },
      reducedMotion: 'reduce',
    });
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl2') return null;
        return get.call(this, type, ...args);
      };
    });
    await page.goto(server.url);
    await page.locator('#hero-model.unavailable').waitFor();
    await assertPlanLoaded(page, '#hero-model img', 'urbano-planta.svg');
    await page.locator('[data-hero=cut]').click();
    await assertPlanLoaded(page, '#hero-model img', 'urbano-corte.svg');
    await page.locator('.hero-actions a').first().click();
    await page.locator('#detail-model.unavailable').waitFor();
    await assertPlanLoaded(page, '#detail-model img', 'urbano-corte.svg');
    await page.locator('[data-layer=cut]').click();
    await assertPlanLoaded(page, '#detail-model img', 'urbano-planta.svg');
    await page.locator('#component-picker').selectOption('gate');
    assert.match(await page.locator('#module-name').innerText(), /Compuerta/);
    await assertSection(page, 'subsuelo');
    await assertPlanLoaded(page, '#detail-model img', 'urbano-corte.svg');
    await page.close();
    console.log('Alternativa sin WebGL verificada.');
    await verifyPanel(browser, server.url, password);
  } finally {
    if (browser) await browser.close();
    if (server && !server.child.exitCode) {
      await new Promise((resolve) => {
        server.child.once('exit', resolve);
        server.child.kill();
      });
    }
    await fs.rm(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
