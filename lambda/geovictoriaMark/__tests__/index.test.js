jest.mock('@sparticuz/chromium', () => ({
  args: ['--no-sandbox'],
  defaultViewport: { width: 800, height: 600 },
  executablePath: jest.fn().mockResolvedValue('/opt/chromium'),
  headless: true,
}));


jest.mock('puppeteer-core', () => ({
  launch: jest.fn(),
}));


const { handler } = require('../index');
const { launch: mockLaunch } = require('puppeteer-core');


function makePageMock({
  iframeExists = true,
  contentFrameOk = true,
  clickedOk = true,
} = {}) {
  const evaluateResult = clickedOk
    ? { ok: true, text: 'Entrada' }
    : { ok: false, reason: 'no-buttons' };

  const frameObj = contentFrameOk
    ? {
        waitForSelector: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(evaluateResult),
      }
    : null;

  const iframeHandle = iframeExists
    ? { contentFrame: jest.fn().mockResolvedValue(frameObj) }
    : null;

  const page = {
    goto: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn().mockResolvedValue(undefined),
    $: jest
      .fn()
      .mockResolvedValueOnce(iframeHandle)
      .mockResolvedValueOnce(iframeHandle),
    type: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
  };

  return page;
}

function makeBrowserWithPage(page) {
  return {
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn().mockResolvedValue(undefined),
  };
}


async function runHandlerWithTimers(event, advanceMs = 7000) {
  const promise = handler(event);
  await jest.advanceTimersByTimeAsync(advanceMs);
  return await promise;
}

describe('GeoVictoria Lambda handler', () => {
  beforeEach(() => {
    jest.useFakeTimers();  
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();  
  });

  test('400 cuando faltan credenciales', async () => {
    const res = await handler({ user: undefined, password: undefined });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      message: 'Faltan las credenciales de GeoVictoria',
    });
    expect(mockLaunch).not.toHaveBeenCalled();
  });

  test('401 cuando no se encuentra el iframe (posible credencial inválida)', async () => {
    const page = makePageMock({ iframeExists: false });
    const browser = makeBrowserWithPage(page);
    mockLaunch.mockResolvedValue(browser);

    const res = await runHandlerWithTimers({ user: 'u', password: 'p' });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toEqual({ message: 'Credenciales inválidas' });
  });

  test('500 cuando contentFrame() es null', async () => {
    const page = makePageMock({ iframeExists: true, contentFrameOk: false });
    const browser = makeBrowserWithPage(page);
    mockLaunch.mockResolvedValue(browser);

    const res = await runHandlerWithTimers({ user: 'u', password: 'p' });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({
      message: 'No pude obtener contentFrame(). Reintentar más tarde',
    });
  });

  test('500 cuando evaluate devuelve ok=false', async () => {
    const page = makePageMock({ iframeExists: true, contentFrameOk: true, clickedOk: false });
    const browser = makeBrowserWithPage(page);
    mockLaunch.mockResolvedValue(browser);

    const res = await runHandlerWithTimers({ user: 'u', password: 'p' });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.message).toMatch(/No se pudo clickear el botón del widget/);
  });

  test('200 en camino feliz (click ejecutado)', async () => {
    const page = makePageMock({ iframeExists: true, contentFrameOk: true, clickedOk: true });
    const browser = makeBrowserWithPage(page);
    mockLaunch.mockResolvedValue(browser);

    const res = await runHandlerWithTimers({ user: 'u', password: 'p' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      message: 'Ingreso/egreso exitoso',
      clicked: 'Entrada',
    });

    expect(page.goto).toHaveBeenCalledWith(
      'https://clients.geovictoria.com/account/login',
      expect.objectContaining({ waitUntil: 'networkidle2' })
    );
    expect(page.type).toHaveBeenCalledWith('#user', 'u', expect.any(Object));
    expect(page.type).toHaveBeenCalledWith('#password', 'p', expect.any(Object));
    expect(page.click).toHaveBeenCalledWith('#btnLogin');
  });
});
