import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  ENGINEERING_RUN_LOAD_CHANNEL,
  type EngineeringRunLoadIpcResponse,
  validateEngineeringRunLoadIpcRequest,
} from '../ipc/engineeringRunIpc';
import type { EngineeringRunRepository } from './persistence/engineeringRunRepository';

const rejected = (errorCode: string): EngineeringRunLoadIpcResponse => ({
  status: 'REJECTED', input: null, result: null, errorCode,
  method: 'tolue-engineering-run-load-ipc-response-v1',
});

export function registerEngineeringRunLoadIpc(
  owner: BrowserWindow,
  trustedDocumentUrl: string,
  engineeringRuns: Readonly<EngineeringRunRepository>,
): () => void {
  ipcMain.handle(ENGINEERING_RUN_LOAD_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<EngineeringRunLoadIpcResponse> => {
    if (owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame || event.senderFrame.url !== trustedDocumentUrl) {
      return rejected('RUN-LOAD-IPC-SENDER-001');
    }
    try { validateEngineeringRunLoadIpcRequest(request); }
    catch (error) { return rejected(error instanceof Error ? error.message : 'RUN-LOAD-IPC-VALIDATION-001'); }
    try {
      const persisted = engineeringRuns.findByRunId(request.runId);
      if (!persisted) return { status: 'NOT_FOUND', input: null, result: null, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' };
      return { status: 'SUCCESS', input: persisted.input, result: persisted.result, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' };
    } catch {
      return rejected('RUN-LOAD-IPC-PERSISTENCE-001');
    }
  });
  return () => ipcMain.removeHandler(ENGINEERING_RUN_LOAD_CHANNEL);
}
