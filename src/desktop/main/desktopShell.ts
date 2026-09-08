import { app, BrowserWindow, dialog, protocol, session } from 'electron';
import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { registerEngineeringAnalysisIpc } from './electronAnalysisAdapter';
import { registerEngineeringPdfIpc } from './electronPdfAdapter';
import { bootstrapPersistence } from './persistence/persistenceBootstrap';
import type { EngineeringRunRepository } from './persistence/engineeringRunRepository';

export const DESKTOP_URL = 'tolue://desktop/index.html';
export const DESKTOP_RENDERER_URL = 'tolue://desktop/renderer.js';
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const HTML = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>طلوع | رئولوژی و پمپ‌پذیری بتن</title><style>body{margin:0;background:#f4f5f2;color:#172635;font:18px Vazirmatn,Vazir,Tahoma,sans-serif}main{max-width:900px;margin:12vh auto;padding:40px}small{color:#526575}h1{line-height:1.7}p{line-height:2}</style></head><body><main id="app"><small>TOLUE Concrete Rheology &amp; Pumpability</small><h1>طلوع؛ رئولوژی و پمپ‌پذیری بتن</h1><p>محیط مهندسی طلوع</p><p>فرم‌های ورود اطلاعات و نمایش نتایج در مرحله توسعه هستند.</p></main><script src="${DESKTOP_RENDERER_URL}" defer></script></body></html>`;

export function desktopResponse(url: string, method: string, rendererJavascript: string): Response {
  if (method !== 'GET') return new Response(null, { status: 404 });
  const commonHeaders = { 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' };
  if (url === DESKTOP_URL) return new Response(HTML, { headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
  if (url === DESKTOP_RENDERER_URL) return new Response(rendererJavascript, { headers: { ...commonHeaders, 'Content-Type': 'text/javascript; charset=utf-8' } });
  return new Response(null, { status: 404 });
}

export function startDesktopShell(preloadPath: string, rendererPath: string): void {
  if (!isAbsolute(preloadPath)) throw new Error('DESKTOP-PRELOAD-PATH-001');
  if (!isAbsolute(rendererPath)) throw new Error('DESKTOP-RENDERER-PATH-001');
  app.enableSandbox();
  protocol.registerSchemesAsPrivileged([{ scheme: 'tolue', privileges: { standard: true, secure: true } }]);
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  let owner: BrowserWindow | undefined;
  let opening = false;
  let ready = false;
  let rendererJavascript = '';
  let closePersistence: (() => void) | undefined;
  let engineeringRuns: Readonly<EngineeringRunRepository> | undefined;
  const failStartup = () => { dialog.showErrorBox('طلوع', 'راه‌اندازی محیط مهندسی انجام نشد. برنامه را دوباره اجرا کنید.'); app.quit(); };
  const open = async (): Promise<void> => {
    if (!ready || opening || owner) return;
    opening = true;
    try {
      const win = new BrowserWindow({ width: 1200, height: 800, minWidth: 900, minHeight: 600, show: false, autoHideMenuBar: true, webPreferences: {
        session: session.fromPartition('tolue-desktop'), preload: preloadPath, sandbox: true, contextIsolation: true, nodeIntegration: false,
        nodeIntegrationInWorker: false, webSecurity: true, webviewTag: false, devTools: false,
      } });
      owner = win;
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', event => event.preventDefault());
      win.webContents.on('will-redirect', event => event.preventDefault());
      win.webContents.on('will-attach-webview', event => event.preventDefault());
      const disposePdf = registerEngineeringPdfIpc(win, DESKTOP_URL);
      const disposeAnalysis = registerEngineeringAnalysisIpc(win, DESKTOP_URL, engineeringRuns);
      win.once('closed', () => { disposeAnalysis(); disposePdf(); owner = undefined; });
      try { await win.loadURL(DESKTOP_URL); if (!win.isDestroyed()) win.show(); }
      catch { if (!win.isDestroyed()) win.destroy(); throw new Error('DESKTOP-LOAD-001'); }
    } finally { opening = false; }
  };
  app.on('second-instance', () => { if (owner) { if (owner.isMinimized()) owner.restore(); owner.focus(); } });
  app.on('activate', () => { void open().catch(failStartup); });
  app.on('before-quit', () => { const close = closePersistence; closePersistence = undefined; engineeringRuns = undefined; close?.(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  void app.whenReady().then(async () => {
    const persistence = bootstrapPersistence(app.getPath('userData'));
    closePersistence = persistence.close;
    engineeringRuns = persistence.engineeringRuns;
    rendererJavascript = await readFile(rendererPath, 'utf8');
    if (rendererJavascript.length === 0) throw new Error('DESKTOP-RENDERER-EMPTY-001');
    const isolated = session.fromPartition('tolue-desktop');
    isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false)); isolated.setPermissionCheckHandler(() => false);
    const allowedUrls = new Set([DESKTOP_URL, DESKTOP_RENDERER_URL]);
    isolated.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !allowedUrls.has(details.url) }));
    isolated.on('will-download', event => event.preventDefault());
    isolated.protocol.handle('tolue', request => desktopResponse(request.url, request.method, rendererJavascript));
    ready = true; await open();
  }).catch(failStartup);
}
