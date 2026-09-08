import { BrowserWindow, dialog, ipcMain, session, type IpcMainInvokeEvent } from 'electron';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { ENGINEERING_PDF_EXPORT_CHANNEL, type EngineeringPdfIpcResponse } from '../ipc/engineeringPdfIpc';
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

/** Shell supplies the exact trusted window and document URL; subframes are denied. */
export function registerEngineeringPdfIpc(owner: BrowserWindow, trustedDocumentUrl: string): () => void {
  let busy = false;
  ipcMain.handle(ENGINEERING_PDF_EXPORT_CHANNEL, async (event: IpcMainInvokeEvent, payload: unknown) => {
    if (owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame || event.senderFrame.url !== trustedDocumentUrl) return rejected('PDF-IPC-SENDER-001');
    if (busy) return rejected('PDF-IPC-BUSY-001');
    busy = true;
    try { return await executeEngineeringPdfMainAdapter(payload, createElectronPdfPorts()); }
    finally { busy = false; }
  });
  return () => ipcMain.removeHandler(ENGINEERING_PDF_EXPORT_CHANNEL);
}
