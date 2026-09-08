import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  ready: vi.fn(), lock: vi.fn(), quit: vi.fn(), sandbox: vi.fn(), schemes: vi.fn(),
  appOn: vi.fn(), options: vi.fn(), load: vi.fn(), show: vi.fn(), destroy: vi.fn(),
  on: vi.fn(), once: vi.fn(), open: vi.fn(), register: vi.fn(), dispose: vi.fn(),
  request: vi.fn(), check: vi.fn(), filter: vi.fn(), protocol: vi.fn(), sessionOn: vi.fn(), error: vi.fn(), read: vi.fn(),
}));
vi.mock('electron', () => ({
  app: { whenReady: m.ready, requestSingleInstanceLock: m.lock, quit: m.quit, enableSandbox: m.sandbox, on: m.appOn },
  protocol: { registerSchemesAsPrivileged: m.schemes }, dialog: { showErrorBox: m.error },
  session: { fromPartition: () => ({ setPermissionRequestHandler: m.request, setPermissionCheckHandler: m.check,
    webRequest: { onBeforeRequest: m.filter }, protocol: { handle: m.protocol }, on: m.sessionOn }) },
  BrowserWindow: class {
    constructor(options: unknown) { m.options(options); }
    webContents = { setWindowOpenHandler: m.open, on: m.on };
    once = m.once; loadURL = m.load; show = m.show;
    isDestroyed = () => false;
    destroy() { m.destroy(); m.once.mock.calls.find(c => c[0] === 'closed')?.[1](); }
  },
}));
vi.mock('node:fs/promises', () => ({ readFile: m.read }));
vi.mock('./electronPdfAdapter', () => ({ registerEngineeringPdfIpc: m.register }));
import { desktopResponse, DESKTOP_RENDERER_URL, DESKTOP_URL, startDesktopShell } from './desktopShell';
const preload = process.platform === 'win32' ? 'C:\\tolue\\preload.cjs' : '/tolue/preload.cjs';
const renderer = process.platform === 'win32' ? 'C:\\tolue\\renderer.js' : '/tolue/renderer.js';
const rendererJs = 'globalThis.__tolueRenderer=true;';
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
beforeEach(() => {
  vi.resetAllMocks(); m.lock.mockReturnValue(true); m.ready.mockResolvedValue(undefined); m.read.mockResolvedValue(rendererJs);
  m.load.mockResolvedValue(undefined); m.register.mockReturnValue(m.dispose);
});
describe('secure desktop shell', () => {
  it('serves only exact allowlisted assets with restrictive CSP and Persian RTL', async () => {
    const page = desktopResponse(DESKTOP_URL, 'GET', rendererJs);
    expect(page.status).toBe(200);
    expect(page.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
    const html = await page.text();
    expect(html).toContain('lang="fa" dir="rtl"');
    expect(html).toContain(`src="${DESKTOP_RENDERER_URL}"`);
    const script = desktopResponse(DESKTOP_RENDERER_URL, 'GET', rendererJs);
    expect(script.status).toBe(200); expect(await script.text()).toBe(rendererJs);
    for (const url of ['file:///etc/passwd', 'https://evil.test', 'tolue://desktop/../secret', DESKTOP_URL + '?path=x', DESKTOP_RENDERER_URL + '?x=1']) {
      expect(desktopResponse(url, 'GET', rendererJs).status).toBe(404);
    }
    expect(desktopResponse(DESKTOP_URL, 'POST', rendererJs).status).toBe(404);
  });
  it('waits for readiness, loads main-owned renderer asset and installs isolated window', async () => {
    let resolveReady!: () => void;
    m.ready.mockReturnValue(new Promise<void>(resolve => { resolveReady = resolve; }));
    startDesktopShell(preload, renderer); expect(m.options).not.toHaveBeenCalled();
    resolveReady(); await flush();
    expect(m.read).toHaveBeenCalledWith(renderer, 'utf8');
    expect(m.sandbox).toHaveBeenCalledOnce();
    expect(m.options).toHaveBeenCalledWith(expect.objectContaining({ show: false, webPreferences: expect.objectContaining({
      preload, sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: false,
    }) }));
    expect(m.register).toHaveBeenCalledWith(expect.anything(), DESKTOP_URL);
    expect(m.load).toHaveBeenCalledWith(DESKTOP_URL); expect(m.show).toHaveBeenCalledOnce();
    expect(m.open.mock.calls[0]![0]()).toEqual({ action: 'deny' });
    for (const [, handler] of m.on.mock.calls) { const event = { preventDefault: vi.fn() }; handler(event); expect(event.preventDefault).toHaveBeenCalledOnce(); }
    const cb = vi.fn();
    m.filter.mock.calls[0]![0]({ url: 'https://evil.test' }, cb); expect(cb).toHaveBeenCalledWith({ cancel: true });
    m.filter.mock.calls[0]![0]({ url: DESKTOP_RENDERER_URL }, cb); expect(cb).toHaveBeenLastCalledWith({ cancel: false });
    expect(m.check.mock.calls[0]![0]()).toBe(false);
    m.request.mock.calls[0]![0](null, 'camera', cb); expect(cb).toHaveBeenLastCalledWith(false);
    m.once.mock.calls.find(c => c[0] === 'closed')![1](); expect(m.dispose).toHaveBeenCalledOnce();
  });
  it('rejects relative main-owned asset paths and exits duplicate instance without a window', async () => {
    expect(() => startDesktopShell('relative.cjs', renderer)).toThrow('DESKTOP-PRELOAD-PATH-001');
    expect(() => startDesktopShell(preload, 'relative.js')).toThrow('DESKTOP-RENDERER-PATH-001');
    m.lock.mockReturnValue(false); startDesktopShell(preload, renderer); await flush();
    expect(m.quit).toHaveBeenCalledOnce(); expect(m.options).not.toHaveBeenCalled();
  });
  it('fails closed when renderer asset cannot be loaded or is empty', async () => {
    m.read.mockRejectedValueOnce(new Error('private renderer path'));
    startDesktopShell(preload, renderer); await flush();
    expect(m.options).not.toHaveBeenCalled(); expect(m.quit).toHaveBeenCalledOnce();
    expect(JSON.stringify(m.error.mock.calls)).not.toContain('private renderer path');
    vi.resetAllMocks(); m.lock.mockReturnValue(true); m.ready.mockResolvedValue(undefined); m.read.mockResolvedValue('');
    startDesktopShell(preload, renderer); await flush();
    expect(m.options).not.toHaveBeenCalled(); expect(m.quit).toHaveBeenCalledOnce();
  });
  it('disposes IPC on document load failure and contains native error details', async () => {
    m.load.mockRejectedValue(new Error('private filesystem detail'));
    startDesktopShell(preload, renderer); await flush();
    expect(m.destroy).toHaveBeenCalledOnce(); expect(m.dispose).toHaveBeenCalledOnce();
    expect(m.show).not.toHaveBeenCalled(); expect(m.quit).toHaveBeenCalledOnce();
    expect(JSON.stringify(m.error.mock.calls)).not.toContain('private filesystem');
  });
  it('does not register another window while the first load is pending', async () => {
    m.load.mockReturnValue(new Promise<void>(() => {}));
    startDesktopShell(preload, renderer); await flush();
    m.appOn.mock.calls.find(c => c[0] === 'activate')![1](); await flush();
    expect(m.options).toHaveBeenCalledOnce(); expect(m.register).toHaveBeenCalledOnce();
  });
});
