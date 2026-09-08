import { app, BrowserWindow, dialog, protocol, session } from 'electron';
import { isAbsolute } from 'node:path';
import { registerEngineeringPdfIpc } from './electronPdfAdapter';

export const DESKTOP_URL = 'tolue://desktop/index.html';
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const HTML = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>طلوع | رئولوژی و پمپ‌پذیری بتن</title>
<style>body{margin:0;background:#f4f5f2;color:#172635;font:18px Vazirmatn,Vazir,Tahoma,sans-serif}main{max-width:900px;margin:12vh auto;padding:40px}small{color:#526575}h1{line-height:1.7}p{line-height:2}</style>
<main><small>TOLUE Concrete Rheology &amp; Pumpability</small><h1>طلوع؛ رئولوژی و پمپ‌پذیری بتن</h1><p>محیط مهندسی طلوع</p><p>فرم‌های ورود اطلاعات و نمایش نتایج در مرحله توسعه هستند.</p></main></html>`;

/** Explicit asset allowlist: never map a renderer URL to a filesystem path. */
export function desktopResponse(url: string, method: string): Response {
  if (url !== DESKTOP_URL || method !== 'GET') return new Response(null, { status: 404 });
  return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' } });
}

/** Called once, before app readiness. The entry point owns the preload path. */
export function startDesktopShell(preloadPath: string): void {
  if (!isAbsolute(preloadPath)) throw new Error('DESKTOP-PRELOAD-PATH-001');
  app.enableSandbox();
  protocol.registerSchemesAsPrivileged([{ scheme: 'tolue', privileges: { standard: true, secure: true } }]);
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  let owner: BrowserWindow | undefined;
  let opening = false;
  let ready = false;
  const failStartup = () => {
    dialog.showErrorBox('طلوع', 'راه‌اندازی محیط مهندسی انجام نشد. برنامه را دوباره اجرا کنید.');
    app.quit();
  };
  const open = async (): Promise<void> => {
    if (!ready || opening || owner) return;
    opening = true;
    try {
      const win = new BrowserWindow({ width: 1200, height: 800, minWidth: 900, minHeight: 600,
        show: false, autoHideMenuBar: true, webPreferences: {
          session: session.fromPartition('tolue-desktop'), preload: preloadPath,
          sandbox: true, contextIsolation: true, nodeIntegration: false,
          nodeIntegrationInWorker: false, webSecurity: true, webviewTag: false, devTools: false,
        } });
      owner = win;
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', event => event.preventDefault());
      win.webContents.on('will-redirect', event => event.preventDefault());
      win.webContents.on('will-attach-webview', event => event.preventDefault());
      const dispose = registerEngineeringPdfIpc(win, DESKTOP_URL);
      win.once('closed', () => { dispose(); owner = undefined; });
      try { await win.loadURL(DESKTOP_URL); if (!win.isDestroyed()) win.show(); }
      catch { if (!win.isDestroyed()) win.destroy(); throw new Error('DESKTOP-LOAD-001'); }
    } finally { opening = false; }
  };
  app.on('second-instance', () => {
    if (owner) { if (owner.isMinimized()) owner.restore(); owner.focus(); }
  });
  app.on('activate', () => { void open().catch(failStartup); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  void app.whenReady().then(async () => {
    const isolated = session.fromPartition('tolue-desktop');
    isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    isolated.setPermissionCheckHandler(() => false);
    isolated.webRequest.onBeforeRequest((details, callback) => callback({ cancel: details.url !== DESKTOP_URL }));
    isolated.on('will-download', event => event.preventDefault());
    isolated.protocol.handle('tolue', request => desktopResponse(request.url, request.method));
    ready = true;
    await open();
  }).catch(failStartup);
}
