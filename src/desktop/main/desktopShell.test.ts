import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  ready: vi.fn(), lock: vi.fn(), quit: vi.fn(), sandbox: vi.fn(), schemes: vi.fn(), getPath: vi.fn(), setPath: vi.fn(), setName: vi.fn(),
  appOn: vi.fn(), options: vi.fn(), load: vi.fn(), show: vi.fn(), destroy: vi.fn(),
  on: vi.fn(), once: vi.fn(), open: vi.fn(), registerPdf: vi.fn(), registerAnalysis: vi.fn(), registerRunLoad: vi.fn(), disposePdf: vi.fn(), disposeAnalysis: vi.fn(), disposeRunLoad: vi.fn(),
  request: vi.fn(), check: vi.fn(), filter: vi.fn(), protocol: vi.fn(), sessionOn: vi.fn(), error: vi.fn(), read: vi.fn(),
  bootstrapPersistence: vi.fn(), closePersistence: vi.fn(), saveRun: vi.fn(), findRun: vi.fn(),
}));
vi.mock('electron', () => ({
  app: { whenReady: m.ready, requestSingleInstanceLock: m.lock, quit: m.quit, enableSandbox: m.sandbox, on: m.appOn, getPath: m.getPath, setPath: m.setPath, setName: m.setName },
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
vi.mock('./electronPdfAdapter', () => ({ registerEngineeringPdfIpc: m.registerPdf }));
vi.mock('./electronAnalysisAdapter', () => ({ registerEngineeringAnalysisIpc: m.registerAnalysis }));
vi.mock('./electronRunAdapter', () => ({ registerEngineeringRunLoadIpc: m.registerRunLoad }));
vi.mock('./persistence/persistenceBootstrap', () => ({ bootstrapPersistence: m.bootstrapPersistence }));
import { desktopResponse, DESKTOP_APPLICATION_NAME, DESKTOP_RENDERER_URL, DESKTOP_USER_DATA_DIRECTORY, DESKTOP_URL, startDesktopShell } from './desktopShell';
const preload = process.platform === 'win32' ? 'C:\\tolue\\preload.cjs' : '/tolue/preload.cjs';
const renderer = process.platform === 'win32' ? 'C:\\tolue\\renderer.js' : '/tolue/renderer.js';
const rendererJs = 'globalThis.__tolueRenderer=true;';
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
beforeEach(() => {
  vi.resetAllMocks(); m.lock.mockReturnValue(true); m.ready.mockResolvedValue(undefined); m.read.mockResolvedValue(rendererJs);
  let userData = process.platform === 'win32' ? 'C:\\Users\\test\\AppData\\Roaming' : '/tolue/user-data';
  m.getPath.mockImplementation((name:string)=>name==='userData'?userData:'');
  m.setPath.mockImplementation((name:string,value:string)=>{if(name==='userData')userData=value;});
  m.bootstrapPersistence.mockReturnValue({ databasePath: '/tolue/db', migration: { fromVersion: 0, toVersion: 1, appliedVersions: [1], method: 'tolue-persistence-migration-v2' }, engineeringRuns: { save: m.saveRun, findByRunId: m.findRun }, close: m.closePersistence });
  m.load.mockResolvedValue(undefined); m.registerPdf.mockReturnValue(m.disposePdf); m.registerAnalysis.mockReturnValue(m.disposeAnalysis); m.registerRunLoad.mockReturnValue(m.disposeRunLoad);
});
describe('secure desktop shell', () => {
  it('serves only exact allowlisted assets with restrictive CSP and Persian RTL', async () => {
    const page=desktopResponse(DESKTOP_URL,'GET',rendererJs); expect(page.status).toBe(200); expect(page.headers.get('Content-Security-Policy')).toContain("script-src 'self'"); const html=await page.text(); expect(html).toContain('lang="fa" dir="rtl"'); expect(html).toContain(`src="${DESKTOP_RENDERER_URL}"`); const script=desktopResponse(DESKTOP_RENDERER_URL,'GET',rendererJs); expect(script.status).toBe(200); expect(await script.text()).toBe(rendererJs); for(const url of ['file:///etc/passwd','https://evil.test','tolue://desktop/../secret',DESKTOP_URL+'?path=x',DESKTOP_RENDERER_URL+'?x=1'])expect(desktopResponse(url,'GET',rendererJs).status).toBe(404); expect(desktopResponse(DESKTOP_URL,'POST',rendererJs).status).toBe(404);
  });
  it('locks application identity and dedicated userData before readiness', async()=>{let resolveReady!:()=>void;m.ready.mockReturnValue(new Promise<void>(resolve=>{resolveReady=resolve;}));startDesktopShell(preload,renderer);expect(m.setName).toHaveBeenCalledWith(DESKTOP_APPLICATION_NAME);expect(m.setPath).toHaveBeenCalledWith('userData',expect.stringContaining(DESKTOP_USER_DATA_DIRECTORY));expect(m.options).not.toHaveBeenCalled();resolveReady();await flush();expect(m.bootstrapPersistence).toHaveBeenCalledWith(expect.stringContaining(DESKTOP_USER_DATA_DIRECTORY));});
  it('waits for readiness, bootstraps persistence, and installs isolated window', async()=>{startDesktopShell(preload,renderer);await flush();expect(m.read).toHaveBeenCalledWith(renderer,'utf8');expect(m.sandbox).toHaveBeenCalledOnce();expect(m.options).toHaveBeenCalledWith(expect.objectContaining({show:false,webPreferences:expect.objectContaining({preload,sandbox:true,contextIsolation:true,nodeIntegration:false,webviewTag:false})}));expect(m.registerPdf).toHaveBeenCalledWith(expect.anything(),DESKTOP_URL);expect(m.registerAnalysis).toHaveBeenCalled();expect(m.registerRunLoad).toHaveBeenCalled();expect(m.load).toHaveBeenCalledWith(DESKTOP_URL);expect(m.show).toHaveBeenCalledOnce();expect(m.open.mock.calls[0]![0]()).toEqual({action:'deny'});const cb=vi.fn();m.filter.mock.calls[0]![0]({url:'https://evil.test'},cb);expect(cb).toHaveBeenCalledWith({cancel:true});m.request.mock.calls[0]![0](null,'camera',cb);expect(cb).toHaveBeenLastCalledWith(false);m.once.mock.calls.find(c=>c[0]==='closed')![1]();expect(m.disposeRunLoad).toHaveBeenCalledOnce();expect(m.disposePdf).toHaveBeenCalledOnce();expect(m.disposeAnalysis).toHaveBeenCalledOnce();m.appOn.mock.calls.find(c=>c[0]==='before-quit')![1]();expect(m.closePersistence).toHaveBeenCalledOnce();});
  it('rejects relative main-owned asset paths and exits duplicate instance without a window',async()=>{expect(()=>startDesktopShell('relative.cjs',renderer)).toThrow('DESKTOP-PRELOAD-PATH-001');expect(()=>startDesktopShell(preload,'relative.js')).toThrow('DESKTOP-RENDERER-PATH-001');m.lock.mockReturnValue(false);startDesktopShell(preload,renderer);await flush();expect(m.quit).toHaveBeenCalledOnce();expect(m.options).not.toHaveBeenCalled();});
  it('fails closed when renderer asset cannot be loaded or is empty',async()=>{m.read.mockRejectedValueOnce(new Error('private renderer path'));startDesktopShell(preload,renderer);await flush();expect(m.options).not.toHaveBeenCalled();expect(m.quit).toHaveBeenCalledOnce();expect(JSON.stringify(m.error.mock.calls)).not.toContain('private renderer path');});
  it('disposes IPC on document load failure and contains native error details',async()=>{m.load.mockRejectedValue(new Error('private filesystem detail'));startDesktopShell(preload,renderer);await flush();expect(m.destroy).toHaveBeenCalledOnce();expect(m.disposeRunLoad).toHaveBeenCalledOnce();expect(m.disposePdf).toHaveBeenCalledOnce();expect(m.disposeAnalysis).toHaveBeenCalledOnce();expect(m.show).not.toHaveBeenCalled();expect(m.quit).toHaveBeenCalledOnce();expect(JSON.stringify(m.error.mock.calls)).not.toContain('private filesystem');});
  it('does not register another window while the first load is pending',async()=>{m.load.mockReturnValue(new Promise<void>(()=>{}));startDesktopShell(preload,renderer);await flush();m.appOn.mock.calls.find(c=>c[0]==='activate')![1]();await flush();expect(m.options).toHaveBeenCalledOnce();expect(m.registerPdf).toHaveBeenCalledOnce();expect(m.registerAnalysis).toHaveBeenCalledOnce();expect(m.registerRunLoad).toHaveBeenCalledOnce();});
});
