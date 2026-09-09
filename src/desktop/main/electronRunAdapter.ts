import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { compareEngineeringRuns } from '../../engineering/core/engineeringRunComparison';
import {
  ENGINEERING_RUN_COMPARISON_CHANNEL,
  ENGINEERING_RUN_HISTORY_CHANNEL,
  ENGINEERING_RUN_LOAD_CHANNEL,
  type EngineeringRunComparisonIpcResponse,
  type EngineeringRunHistoryIpcResponse,
  type EngineeringRunLoadIpcResponse,
  validateEngineeringRunComparisonIpcRequest,
  validateEngineeringRunHistoryIpcRequest,
  validateEngineeringRunLoadIpcRequest,
} from '../ipc/engineeringRunIpc';
import type { EngineeringRunRepository } from './persistence/engineeringRunRepository';

const loadRejected = (errorCode: string): EngineeringRunLoadIpcResponse => ({ status: 'REJECTED', input: null, result: null, errorCode, method: 'tolue-engineering-run-load-ipc-response-v1' });
const historyRejected = (errorCode: string): EngineeringRunHistoryIpcResponse => ({ status: 'REJECTED', items: [], errorCode, method: 'tolue-engineering-run-history-ipc-response-v1' });
const comparisonRejected = (errorCode: string): EngineeringRunComparisonIpcResponse => ({ status: 'REJECTED', comparison: null, errorCode, method: 'tolue-engineering-run-comparison-ipc-response-v1' });
const trusted = (owner: BrowserWindow, trustedDocumentUrl: string, event: IpcMainInvokeEvent): boolean =>
  !owner.isDestroyed() && event.sender === owner.webContents && event.senderFrame === owner.webContents.mainFrame && event.senderFrame.url === trustedDocumentUrl;

export function registerEngineeringRunLoadIpc(owner: BrowserWindow, trustedDocumentUrl: string, engineeringRuns: Readonly<EngineeringRunRepository>): () => void {
  ipcMain.handle(ENGINEERING_RUN_LOAD_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<EngineeringRunLoadIpcResponse> => {
    if (!trusted(owner, trustedDocumentUrl, event)) return loadRejected('RUN-LOAD-IPC-SENDER-001');
    try { validateEngineeringRunLoadIpcRequest(request); } catch (error) { return loadRejected(error instanceof Error ? error.message : 'RUN-LOAD-IPC-VALIDATION-001'); }
    try {
      const persisted = engineeringRuns.findByRunId(request.runId);
      if (!persisted) return { status: 'NOT_FOUND', input: null, result: null, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' };
      return { status: 'SUCCESS', input: persisted.input, result: persisted.result, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1' };
    } catch { return loadRejected('RUN-LOAD-IPC-PERSISTENCE-001'); }
  });
  ipcMain.handle(ENGINEERING_RUN_HISTORY_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<EngineeringRunHistoryIpcResponse> => {
    if (!trusted(owner, trustedDocumentUrl, event)) return historyRejected('RUN-HISTORY-IPC-SENDER-001');
    try { validateEngineeringRunHistoryIpcRequest(request); } catch (error) { return historyRejected(error instanceof Error ? error.message : 'RUN-HISTORY-IPC-VALIDATION-001'); }
    try { return { status: 'SUCCESS', items: engineeringRuns.listHistory(), errorCode: null, method: 'tolue-engineering-run-history-ipc-response-v1' }; }
    catch { return historyRejected('RUN-HISTORY-IPC-PERSISTENCE-001'); }
  });
  ipcMain.handle(ENGINEERING_RUN_COMPARISON_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<EngineeringRunComparisonIpcResponse> => {
    if (!trusted(owner, trustedDocumentUrl, event)) return comparisonRejected('RUN-COMPARISON-IPC-SENDER-001');
    try { validateEngineeringRunComparisonIpcRequest(request); } catch (error) { return comparisonRejected(error instanceof Error ? error.message : 'RUN-COMPARISON-IPC-VALIDATION-001'); }
    try {
      const baseline = engineeringRuns.findByRunId(request.baselineRunId);
      const candidate = engineeringRuns.findByRunId(request.candidateRunId);
      if (!baseline || !candidate) return { status: 'NOT_FOUND', comparison: null, errorCode: null, method: 'tolue-engineering-run-comparison-ipc-response-v1' };
      return { status: 'SUCCESS', comparison: compareEngineeringRuns(baseline.result, candidate.result), errorCode: null, method: 'tolue-engineering-run-comparison-ipc-response-v1' };
    } catch { return comparisonRejected('RUN-COMPARISON-IPC-PERSISTENCE-001'); }
  });
  return () => { ipcMain.removeHandler(ENGINEERING_RUN_COMPARISON_CHANNEL); ipcMain.removeHandler(ENGINEERING_RUN_HISTORY_CHANNEL); ipcMain.removeHandler(ENGINEERING_RUN_LOAD_CHANNEL); };
}
