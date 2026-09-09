import { app, BrowserWindow, dialog, protocol, session } from 'electron';
import { isAbsolute } from 'node:path';
import { registerLicenseIpc } from './electronLicenseAdapter';

const ACTIVATION_URL = 'tolue-activate://license/index.html';
const ACTIVATION_RENDERER_URL = 'tolue-activate://license/renderer.js';
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const HTML = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>فعال‌سازی طلوع</title><style>body{margin:0;background:#f4f5f2;color:#172635;font:16px Tahoma,sans-serif}main{max-width:680px;margin:8vh auto;padding:40px}section{background:#fff;border:1px solid #d9dfe3;border-radius:16px;padding:28px}h1{margin-top:0}code{display:block;direction:ltr;text-align:left;word-break:break-all;background:#eef1f3;padding:14px;border-radius:10px}button{border:0;border-radius:10px;padding:12px 20px;font:inherit;cursor:pointer;background:#172635;color:#fff}p{line-height:1.9}.muted{color:#647482}</style></head><body><main><section><h1>فعال‌سازی مجوز طلوع</h1><p>برای این دستگاه مجوز فعال پیدا نشد. این محیط فقط برای مشاهده کد دستگاه و واردکردن فایل مجوز معتبر است.</p><p class="muted">کد دستگاه</p><code id="machine">در حال دریافت…</code><p id="status"></p><button id="import" type="button">انتخاب و فعال‌سازی فایل مجوز</button></section></main><script src="${ACTIVATION_RENDERER_URL}" defer></script></body></html>`;
const RENDERER = `const machine=document.getElementById('machine');const status=document.getElementById('status');const button=document.getElementById('import');async function refresh(){const r=await window.tolue.getLicenseStatus();machine.textContent=r.machineCode||'نامشخص';status.textContent='وضعیت مجوز: '+r.status;}button.addEventListener('click',async()=>{button.disabled=true;status.textContent='در حال بررسی فایل مجوز…';try{const r=await window.tolue.importLicense();if(r.status==='IMPORTED'&&r.licenseStatus==='ACTIVE'){status.textContent='مجوز با موفقیت فعال شد. برنامه در حال بازگشایی امن است…';}else if(r.status==='CANCELLED'){status.textContent='انتخاب فایل لغو شد.';}else{status.textContent='فایل مجوز پذیرفته نشد: '+(r.errorCode||r.licenseStatus);}}catch{status.textContent='خطا در فرایند فعال‌سازی.';}finally{button.disabled=false;}});void refresh();`;

function response(url: string, method: string): Response {
  if (method !== 'GET') return new Response(null, { status: 404 });
  const headers = { 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' };
  if (url === ACTIVATION_URL) return new Response(HTML, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
  if (url === ACTIVATION_RENDERER_URL) return new Response(RENDERER, { headers: { ...headers, 'Content-Type': 'text/javascript; charset=utf-8' } });
  return new Response(null, { status: 404 });
}

export function startLicenseActivationShell(preloadPath: string, userDataPath: string): void {
  if (!isAbsolute(preloadPath)) throw new Error('LICENSE-ACTIVATION-PRELOAD-001');
  if (!isAbsolute(userDataPath)) throw new Error('LICENSE-ACTIVATION-USERDATA-001');
  app.setPath('userData', userDataPath);
  app.enableSandbox();
  protocol.registerSchemesAsPrivileged([{ scheme: 'tolue-activate', privileges: { standard: true, secure: true } }]);
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }
  let owner: BrowserWindow | undefined;
  const fail = () => { dialog.showErrorBox('طلوع', 'محیط فعال‌سازی مجوز راه‌اندازی نشد.'); app.quit(); };
  const open = async (): Promise<void> => {
    if (owner) return;
    const win = new BrowserWindow({ width: 760, height: 620, minWidth: 680, minHeight: 540, show: false, autoHideMenuBar: true, webPreferences: {
      session: session.fromPartition('tolue-license-activation'), preload: preloadPath, sandbox: true, contextIsolation: true, nodeIntegration: false,
      nodeIntegrationInWorker: false, webSecurity: true, webviewTag: false, devTools: false,
    } });
    owner = win;
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    win.webContents.on('will-redirect', event => event.preventDefault());
    win.webContents.on('will-attach-webview', event => event.preventDefault());
    const disposeLicense = registerLicenseIpc({
      owner: win,
      trustedDocumentUrl: ACTIVATION_URL,
      userDataPath,
      resourcesPath: process.resourcesPath,
      nowIso: () => new Date().toISOString(),
      onActivated: () => { app.relaunch(); app.exit(0); },
    });
    win.once('closed', () => { disposeLicense(); owner = undefined; });
    await win.loadURL(ACTIVATION_URL);
    if (!win.isDestroyed()) win.show();
  };
  app.on('second-instance', () => { if (owner) { if (owner.isMinimized()) owner.restore(); owner.focus(); } });
  app.on('activate', () => { void open().catch(fail); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  void app.whenReady().then(async () => {
    const isolated = session.fromPartition('tolue-license-activation');
    isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    isolated.setPermissionCheckHandler(() => false);
    const allowed = new Set([ACTIVATION_URL, ACTIVATION_RENDERER_URL]);
    isolated.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !allowed.has(details.url) }));
    isolated.on('will-download', event => event.preventDefault());
    isolated.protocol.handle('tolue-activate', request => response(request.url, request.method));
    await open();
  }).catch(fail);
}
