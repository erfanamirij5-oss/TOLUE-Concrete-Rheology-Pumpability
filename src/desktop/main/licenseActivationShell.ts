import { app, BrowserWindow, dialog, protocol, session } from 'electron';
import { isAbsolute } from 'node:path';
import { registerLicenseIpc } from './electronLicenseAdapter';

const ACTIVATION_URL = 'tolue-activate://license/index.html';
const ACTIVATION_RENDERER_URL = 'tolue-activate://license/renderer.js';
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const HTML = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>فعال‌سازی طلوع</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f4f5f2;color:#172635;font:16px Tahoma,sans-serif}main{width:min(100%,760px);margin:0 auto;padding:clamp(18px,5vw,48px)}section{background:#fff;border:1px solid #d7ddda;border-radius:18px;padding:clamp(20px,4vw,34px);box-shadow:0 10px 30px rgba(23,38,53,.06)}h1{margin:0 0 12px;font-size:clamp(24px,4vw,32px)}p{line-height:1.9}.muted{color:#526575}.machine-wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:stretch;margin:8px 0 14px}code{display:flex;align-items:center;direction:ltr;text-align:left;word-break:break-all;background:#eef1ee;padding:14px;border-radius:10px;min-height:48px}button{border:0;border-radius:10px;padding:12px 18px;font:inherit;cursor:pointer;background:#172635;color:#fff;min-height:44px}button.secondary{background:#eef1ee;color:#172635;border:1px solid #d7ddda}button:focus-visible{outline:3px solid #315f78;outline-offset:2px}button:disabled{opacity:.58;cursor:wait}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.status{min-height:32px;margin:14px 0 0}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.meta div{background:#f7f8f6;border:1px solid #e1e5e2;border-radius:10px;padding:10px}.meta strong{display:block;margin-bottom:5px}@media(max-width:620px){main{padding:14px}.machine-wrap{grid-template-columns:1fr}.actions{flex-direction:column}.actions button{width:100%}.meta{grid-template-columns:1fr}}</style></head><body><main><section><h1>فعال‌سازی مجوز طلوع</h1><p>برای این دستگاه مجوز فعال پیدا نشد. کد دستگاه را کپی کنید و فقط فایل لایسنس معتبر صادرشده برای همین دستگاه را وارد کنید.</p><p class="muted">کد دستگاه</p><div class="machine-wrap"><code id="machine">در حال دریافت…</code><button id="copy" class="secondary" type="button">کپی کد دستگاه</button></div><div id="meta" class="meta" hidden><div><strong>شناسه لایسنس</strong><span id="license-id">—</span></div><div><strong>اعتبار تا</strong><span id="valid-until">—</span></div></div><p id="status" class="status" role="status" aria-live="polite"></p><div class="actions"><button id="import" type="button">انتخاب و فعال‌سازی فایل مجوز</button></div></section></main><script src="${ACTIVATION_RENDERER_URL}" defer></script></body></html>`;
const RENDERER = `const machine=document.getElementById('machine');const status=document.getElementById('status');const button=document.getElementById('import');const copy=document.getElementById('copy');const meta=document.getElementById('meta');const licenseId=document.getElementById('license-id');const validUntil=document.getElementById('valid-until');function label(s){return({ACTIVE:'فعال',EXPIRED:'منقضی‌شده',MACHINE_MISMATCH:'عدم تطابق دستگاه',NOT_YET_VALID:'هنوز معتبر نشده',MISSING:'لایسنس نصب نشده',INVALID:'نامعتبر'})[s]||s||'نامشخص'}function guidance(s){return({EXPIRED:'اعتبار این لایسنس به پایان رسیده است.',MACHINE_MISMATCH:'این لایسنس برای دستگاه دیگری صادر شده است.',NOT_YET_VALID:'بازه اعتبار این لایسنس هنوز شروع نشده است.',MISSING:'فایل لایسنس معتبر مخصوص همین دستگاه را وارد کنید.',INVALID:'فایل لایسنس معتبر نیست یا امضای آن تأیید نشد.'})[s]||''}async function refresh(){const r=await window.tolue.getLicenseStatus();machine.textContent=r.machineCode||'نامشخص';status.textContent='وضعیت مجوز: '+label(r.status)+(guidance(r.status)?' — '+guidance(r.status):'');if(r.licenseId||r.validUntilIso){meta.hidden=false;licenseId.textContent=r.licenseId||'—';validUntil.textContent=r.validUntilIso||'—';}}copy.addEventListener('click',async()=>{const value=machine.textContent||'';let copied=false;try{await navigator.clipboard.writeText(value);copied=true;}catch{}if(!copied){const range=document.createRange();range.selectNodeContents(machine);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);copied=document.execCommand('copy');selection.removeAllRanges();}status.textContent=copied?'کد دستگاه کپی شد.':'کپی خودکار ممکن نبود؛ کد دستگاه را به‌صورت دستی کپی کنید.';});button.addEventListener('click',async()=>{button.disabled=true;status.textContent='در حال بررسی فایل مجوز…';try{const r=await window.tolue.importLicense();if(r.status==='IMPORTED'&&r.licenseStatus==='ACTIVE'){status.textContent='مجوز با موفقیت فعال شد'+(r.validUntilIso?'؛ اعتبار تا '+r.validUntilIso:'')+'. برنامه در حال بازگشایی امن است…';}else if(r.status==='CANCELLED'){status.textContent='انتخاب فایل لغو شد.';}else{status.textContent=guidance(r.licenseStatus)||'فایل مجوز پذیرفته نشد.';}}catch{status.textContent='خطا در فرایند فعال‌سازی. دوباره تلاش کنید.';}finally{button.disabled=false;}});void refresh();`;

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
    const win = new BrowserWindow({ width: 760, height: 620, minWidth: 520, minHeight: 500, show: false, autoHideMenuBar: true, webPreferences: {
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
