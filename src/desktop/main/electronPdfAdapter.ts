import { BrowserWindow, dialog, ipcMain, session, type IpcMainInvokeEvent } from 'electron';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, isAbsolute } from 'node:path';
import {
  ENGINEERING_PDF_EXPORT_CHANNEL,
  ENGINEERING_REPORT_TEXT_EXPORT_CHANNEL,
  type EngineeringPdfIpcResponse,
  type EngineeringReportTextIpcRequest,
  type EngineeringReportTextIpcResponse,
  validateEngineeringReportTextIpcRequest,
} from '../ipc/engineeringPdfIpc';
import { executeEngineeringPdfMainAdapter, type EngineeringPdfMainAdapterDeps } from './engineeringPdfMainAdapter';

/** Main-owned, ephemeral, offline report renderer. No preload or page JavaScript. */
export function createElectronPdfPorts(): EngineeringPdfMainAdapterDeps {
  return {
    saveDialog: { async choosePdfDestination(defaultPath) {
      const result = await dialog.showSaveDialog({ defaultPath, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (result.canceled || !result.filePath) return { cancelled: true };
      if (!isAbsolute(result.filePath)) throw new Error('Invalid destination');
      return { cancelled: false, absolutePath: result.filePath };
    } },
    fileWriter: { async writeFileExclusive(path, bytes) { await writeFile(path, bytes, { flag: 'wx' }); } },
    renderer: { async renderHtmlToPdf({ html, page }) {
      const isolatedSession = session.fromPartition(`tolue-pdf-${randomUUID()}`);
      isolatedSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
      isolatedSession.setPermissionCheckHandler(() => false);
      isolatedSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: details.url !== reportUrl }));
      const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'">`;
      const reportUrl = `data:text/html;charset=utf-8,${encodeURIComponent(csp + html)}`;
      const win = new BrowserWindow({ show: false, webPreferences: {
        session: isolatedSession, sandbox: true, contextIsolation: true, nodeIntegration: false,
        javascript: false, webSecurity: true, webviewTag: false, devTools: false,
      } });
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', event => event.preventDefault());
      win.webContents.on('will-attach-webview', event => event.preventDefault());
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          (async () => {
            await win.loadURL(reportUrl);
            return await win.webContents.printToPDF({
              pageSize: page.format, landscape: page.landscape, printBackground: page.printBackground,
              preferCSSPageSize: page.preferCssPageSize, displayHeaderFooter: page.displayHeaderFooter,
              margins: { top: page.marginsMm.top / 25.4, right: page.marginsMm.right / 25.4,
                bottom: page.marginsMm.bottom / 25.4, left: page.marginsMm.left / 25.4 },
            });
          })(),
          new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('PDF timeout')), 30_000); }),
        ]);
      } finally {
        clearTimeout(timer);
        win.destroy();
        isolatedSession.webRequest.onBeforeRequest(null);
        await isolatedSession.clearStorageData();
      }
    } },
  };
}

const rejected = (errorCode: string): EngineeringPdfIpcResponse => ({
  runId: '', engineVersion: '', inputSnapshotHash: '', status: 'REJECTED', savedFileName: null,
  bytesWritten: null, errorCode, method: 'tolue-engineering-pdf-ipc-response-v1',
});

const textRejected = (errorCode: string): EngineeringReportTextIpcResponse => ({
  runId: '', engineVersion: '', inputSnapshotHash: '', format: null, status: 'REJECTED', savedFileName: null,
  bytesWritten: null, errorCode, method: 'tolue-engineering-report-text-ipc-response-v1',
});

async function executeEngineeringReportTextExport(request: unknown): Promise<EngineeringReportTextIpcResponse> {
  let validated: EngineeringReportTextIpcRequest;
  try {
    validateEngineeringReportTextIpcRequest(request);
    validated = request;
  } catch {
    return textRejected('REPORT-TEXT-IPC-REQUEST-001');
  }
  const payload = validated.payload;
  const response = (status: EngineeringReportTextIpcResponse['status'], savedFileName: string | null, bytesWritten: number | null, errorCode: string | null): EngineeringReportTextIpcResponse => ({
    runId: payload.runId,
    engineVersion: payload.engineVersion,
    inputSnapshotHash: payload.inputSnapshotHash,
    format: payload.format,
    status,
    savedFileName,
    bytesWritten,
    errorCode,
    method: 'tolue-engineering-report-text-ipc-response-v1',
  });
  try {
    const extension = payload.format === 'html' ? 'html' : 'json';
    const result = await dialog.showSaveDialog({
      defaultPath: payload.fileName,
      filters: [{ name: payload.format === 'html' ? 'HTML' : 'JSON', extensions: [extension] }],
    });
    if (result.canceled || !result.filePath) return response('CANCELLED', null, null, null);
    if (!isAbsolute(result.filePath)) return response('FAILED', null, null, 'REPORT-TEXT-PATH-001');
    const bytes = Buffer.from(payload.content, 'utf8');
    if (bytes.byteLength === 0) return response('FAILED', null, null, 'REPORT-TEXT-EMPTY-001');
    await writeFile(result.filePath, bytes, { flag: 'wx' });
    return response('SUCCESS', basename(result.filePath), bytes.byteLength, null);
  } catch {
    return response('FAILED', null, null, 'REPORT-TEXT-MAIN-EXECUTION-001');
  }
}

function trustedSender(owner: BrowserWindow, trustedDocumentUrl: string, event: IpcMainInvokeEvent): boolean {
  return !owner.isDestroyed()
    && event.sender === owner.webContents
    && event.senderFrame === owner.webContents.mainFrame
    && event.senderFrame.url === trustedDocumentUrl;
}

/** Shell supplies the exact trusted window and document URL; subframes are denied. */
export function registerEngineeringPdfIpc(owner: BrowserWindow, trustedDocumentUrl: string): () => void {
  let busy = false;
  ipcMain.handle(ENGINEERING_PDF_EXPORT_CHANNEL, async (event: IpcMainInvokeEvent, payload: unknown) => {
    if (!trustedSender(owner, trustedDocumentUrl, event)) return rejected('PDF-IPC-SENDER-001');
    if (busy) return rejected('PDF-IPC-BUSY-001');
    busy = true;
    try { return await executeEngineeringPdfMainAdapter(payload, createElectronPdfPorts()); }
    finally { busy = false; }
  });
  ipcMain.handle(ENGINEERING_REPORT_TEXT_EXPORT_CHANNEL, async (event: IpcMainInvokeEvent, payload: unknown) => {
    if (!trustedSender(owner, trustedDocumentUrl, event)) return textRejected('REPORT-TEXT-IPC-SENDER-001');
    if (busy) return textRejected('REPORT-TEXT-IPC-BUSY-001');
    busy = true;
    try { return await executeEngineeringReportTextExport(payload); }
    finally { busy = false; }
  });
  return () => {
    ipcMain.removeHandler(ENGINEERING_REPORT_TEXT_EXPORT_CHANNEL);
    ipcMain.removeHandler(ENGINEERING_PDF_EXPORT_CHANNEL);
  };
}
