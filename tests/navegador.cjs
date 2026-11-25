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
async function verifyLanding(browser,url,width,height) {
  const page = await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>{if (!r.failure()?.errorText.includes('ABORTED')) errors.push(r.url()+' '+r.failure()?.errorText);});
  page.on('console',m=>{ if(m.type()==='error')errors.push(m.text()); });
  page.on('response',r=>{ if(r.status()>=400)errors.push(r.status()+' '+r.url()); });
  await page.goto(url);
  await page.locator('#hero-model.ready').waitFor();
  await page.locator('[data-hero=cut]').click();
  assert.equal(await page.locator('#hero-model').getAttribute('data-section'),'subsuelo');
  await page.locator('.pl-menu').click();
  const routes=await page.locator('#pl-menu-list a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
  assert.equal(routes.length,11);
  for (const route of routes) {
    await page.goto(url+route,{waitUntil:'networkidle'});
    const navReady = await page.locator('#pl-menu-list [aria-current=page]').count();
    if (!navReady || errors.length) throw Error(width+'px '+route+' : '+JSON.stringify(errors)+' '+await page.title());

    await page.locator('main h1').waitFor();
    assert.equal(await page.locator('#pl-menu-list [aria-current=page]').getAttribute('href'),route);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desbordamiento '+route+' a '+width);
    if(route==='/producto/') {
      await page.locator('#detail-model').scrollIntoViewIfNeeded();
      await page.locator('#detail-model.ready').waitFor({timeout:20000}).catch(async err => {
        throw Error(err.message + ' / ' + width + ' px / ' + (await page.locator('#detail-model').getAttribute('class')) + ' / ' + errors.join(' · '));
      });
      for (const mode of ['pipes','front','covered']) {
        await page.selectOption('#view',mode);
        assert.equal(await page.locator('#detail-model').getAttribute('data-section'),mode==='covered'?'superficie':'subsuelo');
      }
      await page.selectOption('#component-picker','junction');
      assert.match(await page.locator('#module-spec').innerText(),/./);
      await page.click('#open-material');
      assert.match(await page.locator('#mat-name').innerText(),/./);
      await page.click('[data-layer=exploded]');
      assert.equal(await page.locator('[data-layer=exploded]').getAttribute('aria-pressed'),'true');
    }
    if(route==='/simulacion/') {
      await page.locator('#sim-a').fill('9');
      assert.match(await page.locator('#sim-state').innerText(),/limpieza/);
    }
    if(route==='/contacto/') {
      await page.click('#contact-open');
      await page.locator('[name=name]').fill('Prueba');
      await page.locator('[name=email]').fill('prueba@example.org');
      await page.locator('[name=message]').fill('Ensayo de formulario en el servidor temporal');
      await page.locator('#contact-form [type=submit]').click();
      await page.getByText(/Solicitud registrada. Referencia/).waitFor();
    }
  }
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('Once rutas verificadas a '+width+' px');
}
(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pluvia-ui-'));
  let server, browser;
  const password = randomUUID();
  try {
    server = await startBackend(temp, password);
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    for (const [w, h] of [
      [1920, 1000],
      [375, 812],
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
    await page.waitForLoadState('networkidle');
    await page.locator('#detail-model').scrollIntoViewIfNeeded();
    await page.locator('#detail-model.unavailable').waitFor();
    for (const [mode,file] of [['covered','urbano-planta.svg'],['front','frontal.svg'],['pipes','superior-tuberias.svg']]) {
      await page.selectOption('#view',mode);
      await assertPlanLoaded(page,'#detail-model img',file);
    }
    await page.selectOption('#component-picker','gate');
    assert.match(await page.locator('#module-name').innerText(),/compuerta/i);
    await page.close();
    console.log('Alternativa sin WebGL verificada.');
    await require("./monitor.cjs").verify();
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
