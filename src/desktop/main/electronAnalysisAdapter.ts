import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { executeEngineeringAnalysis } from '../../engineering/core/engineeringAnalysis';
import {
  ENGINEERING_ANALYSIS_CHANNEL,
  type EngineeringAnalysisIpcResponse,
  validateEngineeringAnalysisIpcRequest,
} from '../ipc/engineeringAnalysisIpc';

const rejected = (errorCode: string): EngineeringAnalysisIpcResponse => ({
  status: 'REJECTED', result: null, errorCode,
  method: 'tolue-engineering-analysis-ipc-response-v1',
});

export function registerEngineeringAnalysisIpc(owner: BrowserWindow, trustedDocumentUrl: string): () => void {
  let busy = false;
  ipcMain.handle(ENGINEERING_ANALYSIS_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<EngineeringAnalysisIpcResponse> => {
    if (owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame || event.senderFrame.url !== trustedDocumentUrl) {
      return rejected('ANALYSIS-IPC-SENDER-001');
    }
    if (busy) return rejected('ANALYSIS-IPC-BUSY-001');
    busy = true;
    try {
      try { validateEngineeringAnalysisIpcRequest(request); }
      catch (error) { return rejected(error instanceof Error ? error.message : 'ANALYSIS-IPC-VALIDATION-001'); }
      try {
        return {
          status: 'SUCCESS', result: executeEngineeringAnalysis(request.payload), errorCode: null,
          method: 'tolue-engineering-analysis-ipc-response-v1',
        };
      } catch {
        return rejected('ANALYSIS-IPC-EXECUTION-001');
      }
    } finally {
      busy = false;
    }
  });
  return () => ipcMain.removeHandler(ENGINEERING_ANALYSIS_CHANNEL);
}
