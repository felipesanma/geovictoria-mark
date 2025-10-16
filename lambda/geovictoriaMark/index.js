process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const LOGIN_PAGE_URL = 'https://clients.geovictoria.com/account/login';
const GEO_USERNAME = process.env.GEO_USERNAME;
const GEO_PASSWORD = process.env.GEO_PASSWORD;

exports.handler = async (event, context) => {

  console.log('Evento recibido:', event);

  user = event.user || GEO_USERNAME;
  password = event.password || GEO_PASSWORD;

  if (!user || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Faltan las credenciales de GeoVictoria' }),
    };
  }

  clicked = await geovictoriaMark(user, password);

  return {
    message: 'Scraping completed successfully',
    result: {
      clicked,
      user
    }
  };
}

async function geovictoriaMark(user, password) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();

  console.log('[1/5] Navegando a login…');
  await page.goto(LOGIN_PAGE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('#login-form', { timeout: 20000 });

  console.log('[2/5] Iniciando sesión…');
  await page.type('#user', user, { delay: 20 });
  await page.type('#password', password, { delay: 20 });
  await page.click('#btnLogin');

  await page.waitForSelector('#main', { timeout: 30000 }).catch(() => {});
  await delay(5000);

  console.log('[3/5] Buscando el iframe de gvportal');
  const iframeHandle =
    (await page.$('iframe[name="myFrame"]')) ||
    (await page.$('iframe[src*="gvportal.geovictoria.com"]'));
  if (!iframeHandle) {
    throw new Error('No encontré el iframe');
  }

  const frame = await iframeHandle.contentFrame();
  if (!frame) {
    throw new Error('No pude obtener contentFrame(). ¿sandbox sin allow-same-origin?');
  }

  console.log('[4/5] Leyendo <web-punch-widget>');
  await frame.waitForSelector('web-punch-widget', { timeout: 20000 });

  const clicked = await frame.evaluate(() => {
    const host = document.querySelector('web-punch-widget');
    if (!host || !host.shadowRoot) return { ok: false, reason: 'no-host-or-shadow' };

    const toggle = host.shadowRoot.querySelector('#expand-collapse-toggle');
    if (toggle && typeof toggle.click === 'function') {
      try { toggle.click(); } catch (e) {}
    }

    const content = host.shadowRoot.querySelector('web-punch-content');
    if (!content || !content.shadowRoot) return { ok: false, reason: 'no-inner-host-or-shadow' };

    const root2 = content.shadowRoot;
    const btnEntry = root2.querySelector('.btn-entry');
    const btnExit  = root2.querySelector('.btn-exit');

    const target = btnEntry || btnExit;
    if (!target) return { ok: false, reason: 'no-buttons' };

    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'center', inline: 'center' });
    }
    if (typeof target.click === 'function') target.click();

    const text = target.querySelector('.btn-text')?.textContent?.trim() || '(sin texto)';
    return { ok: true, text };
  });

  if (!clicked.ok) {
    throw new Error(`No se pudo clickear el botón del widget: ${clicked.reason}`);
  }

  console.log(' [5/5] Click en:', clicked.text);
  await delay(2000);
  await browser.close();

  return clicked.text;
}

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));