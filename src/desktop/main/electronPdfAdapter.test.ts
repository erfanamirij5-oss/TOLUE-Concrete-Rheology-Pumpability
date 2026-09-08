import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildEngineeringPdfIpcRequest } from '../ipc/engineeringPdfIpc';
import { createTolueBridge } from '../preload/tolueBridge';
import { executeEngineeringPdfMainAdapter } from './engineeringPdfMainAdapter';
import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
const mock = vi.hoisted(() => ({
  save: vi.fn(), write: vi.fn(), print: vi.fn(), load: vi.fn(), destroy: vi.fn(), handle: vi.fn(), remove: vi.fn(),
  windowOptions: vi.fn(), request: vi.fn(), clear: vi.fn(), open: vi.fn(), on: vi.fn(), expose: vi.fn(), invoke: vi.fn(),
}));
vi.mock('electron', () => ({
  BrowserWindow: class {
    constructor(options: unknown) { mock.windowOptions(options); }
    webContents = { printToPDF: mock.print, setWindowOpenHandler: mock.open, on: mock.on };
    loadURL = mock.load; destroy = mock.destroy;
  },
  session: { fromPartition: () => ({ setPermissionRequestHandler: vi.fn(), setPermissionCheckHandler: vi.fn(),
    webRequest: { onBeforeRequest: mock.request }, clearStorageData: mock.clear }) },
  dialog: { showSaveDialog: mock.save }, ipcMain: { handle: mock.handle, removeHandler: mock.remove },
  contextBridge: { exposeInMainWorld: mock.expose }, ipcRenderer: { invoke: mock.invoke },
}));
vi.mock('node:fs/promises', () => ({ writeFile: mock.write }));
import { createElectronPdfPorts, registerEngineeringPdfIpc } from './electronPdfAdapter';
const payload = (): EngineeringPdfExportRequest => ({
  runId: 'run', engineVersion: 'v1', inputSnapshotHash: 'hash', fileName: 'report.pdf', html: '<html dir="rtl">گزارش</html>',
  mediaType: 'application/pdf', sourceMediaType: 'text/html', rendererBoundary: 'privileged_desktop_main_process',
  scientificClaim: 'presentation_only_no_new_engineering_inference', method: 'tolue-engineering-pdf-export-request-v1',
  page: { format: 'A4', landscape: false, printBackground: true, preferCssPageSize: true, displayHeaderFooter: false,
    marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
});
beforeEach(() => { vi.clearAllMocks(); mock.save.mockResolvedValue({ canceled: false, filePath: process.platform === 'win32' ? 'C:\\reports\\report.pdf' : '/reports/report.pdf' }); mock.print.mockResolvedValue(new Uint8Array([37,80,68,70])); mock.write.mockResolvedValue(undefined); mock.load.mockResolvedValue(undefined); });
describe('Electron PDF adapter', () => {
  it('prints with isolated offline settings, converts millimetres to inches, preserves identity', async () => {
    const request = buildEngineeringPdfIpcRequest(payload()); const snapshot = structuredClone(request);
    const result = await executeEngineeringPdfMainAdapter(request, createElectronPdfPorts());
    expect(result).toMatchObject({ status: 'SUCCESS', runId: 'run', engineVersion: 'v1', inputSnapshotHash: 'hash', bytesWritten: 4 });
    expect(request).toEqual(snapshot);
    expect(mock.windowOptions).toHaveBeenCalledWith(expect.objectContaining({ show: false, webPreferences: expect.objectContaining({ sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: false }) }));
    expect(mock.print).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 'A4', preferCSSPageSize: true, margins: { top: 14/25.4, right: 14/25.4, bottom: 14/25.4, left: 14/25.4 } }));
    expect(decodeURIComponent(mock.load.mock.calls[0]![0])).toContain(request.payload.html);
    expect(mock.write).toHaveBeenCalledWith(expect.any(String), expect.any(Uint8Array), { flag: 'wx' });
    const callback = vi.fn(); mock.request.mock.calls[0]![0]({ url: 'https://evil.test' }, callback); expect(callback).toHaveBeenCalledWith({ cancel: true });
    expect(mock.open.mock.calls[0]![0]()).toEqual({ action: 'deny' }); expect(mock.destroy).toHaveBeenCalledOnce();
  });
  it.each([null, undefined, {}, { payload: null }, { channel: 'wrong', payload: payload() }, { channel: 'tolue:engineering:pdf-export:v1', payload: { ...payload(), absolutePath: '/tmp/x' } }, { channel: 'tolue:engineering:pdf-export:v1', payload: { ...payload(), fileName: 'C:\\escape.pdf' } }])('rejects malformed or path-bearing request %#', async request => {
    expect((await executeEngineeringPdfMainAdapter(request, createElectronPdfPorts())).status).toBe('REJECTED'); expect(mock.save).not.toHaveBeenCalled();
  });
  it('returns cancellation without rendering', async () => { mock.save.mockResolvedValue({ canceled: true }); expect((await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), createElectronPdfPorts())).status).toBe('CANCELLED'); expect(mock.load).not.toHaveBeenCalled(); });
  it.each(['save', 'print', 'write'] as const)('contains %s errors', async port => { mock[port].mockRejectedValueOnce(new Error('secret path')); const result = await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), createElectronPdfPorts()); expect(result.status).toBe('FAILED'); expect(JSON.stringify(result)).not.toContain('secret'); });
  it('fails closed on empty bytes', async () => { mock.print.mockResolvedValueOnce(new Uint8Array()); expect((await executeEngineeringPdfMainAdapter(buildEngineeringPdfIpcRequest(payload()), createElectronPdfPorts())).status).toBe('FAILED'); expect(mock.write).not.toHaveBeenCalled(); });
  it('forwards fixed PDF operation through trusted main frame while bridge exposes only typed operations', async () => {
    const mainFrame = { url: 'app://tolue' }; const owner = { isDestroyed: () => false, webContents: { mainFrame } };
    const dispose = registerEngineeringPdfIpc(owner as unknown as Parameters<typeof registerEngineeringPdfIpc>[0], mainFrame.url);
    const [channel, handler] = mock.handle.mock.calls[0]!; expect(channel).toBe('tolue:engineering:pdf-export:v1');
    const bridge = createTolueBridge((_channel, request) => handler({ sender: owner.webContents, senderFrame: mainFrame }, request));
    expect(Object.keys(bridge).sort()).toEqual(['executeEngineeringAnalysis', 'exportEngineeringPdf']); expect(Object.isFrozen(bridge)).toBe(true);
    expect((await bridge.exportEngineeringPdf(payload())).status).toBe('SUCCESS');
    expect((await handler({ sender: {}, senderFrame: mainFrame }, buildEngineeringPdfIpcRequest(payload()))).status).toBe('REJECTED');
    expect((await handler({ sender: owner.webContents, senderFrame: { url: mainFrame.url } }, buildEngineeringPdfIpcRequest(payload()))).status).toBe('REJECTED');
    dispose(); expect(mock.remove).toHaveBeenCalledWith(channel);
  });
  it('exposes only the typed API, never raw ipcRenderer', async () => { await import('../preload/index'); expect(mock.expose).toHaveBeenCalledWith('tolue', { executeEngineeringAnalysis: expect.any(Function), exportEngineeringPdf: expect.any(Function) }); });
});
