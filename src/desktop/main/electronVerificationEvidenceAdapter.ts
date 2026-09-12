import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { readFile } from 'node:fs/promises';
import { validateVerificationEvidencePackage, type VerificationEvidencePackage } from '../../engineering/core/verificationEvidencePackage';
import {
  VERIFICATION_EVIDENCE_HISTORY_CHANNEL,
  VERIFICATION_EVIDENCE_IMPORT_CHANNEL,
  VERIFICATION_EVIDENCE_LOAD_CHANNEL,
  type VerificationEvidenceHistoryIpcResponse,
  type VerificationEvidenceImportIpcResponse,
  type VerificationEvidenceLoadIpcResponse,
  validateVerificationEvidenceHistoryIpcRequest,
  validateVerificationEvidenceImportIpcRequest,
  validateVerificationEvidenceLoadIpcRequest,
} from '../ipc/verificationEvidenceIpc';
import type { VerificationEvidenceRepository } from './persistence/verificationEvidenceRepository';

export interface ElectronVerificationEvidenceAdapterInput {
  readonly owner: BrowserWindow;
  readonly trustedDocumentUrl: string;
  readonly repository: Readonly<VerificationEvidenceRepository>;
  readonly nowIso: () => string;
}

const trusted = (input: Readonly<ElectronVerificationEvidenceAdapterInput>, event: IpcMainInvokeEvent): boolean =>
  !input.owner.isDestroyed() && event.sender === input.owner.webContents && event.senderFrame === input.owner.webContents.mainFrame && event.senderFrame.url === input.trustedDocumentUrl;

function rejected(errorCode: string): VerificationEvidenceImportIpcResponse {
  return { status: 'REJECTED', evidencePackage: null, errorCode, method: 'tolue-verification-evidence-import-ipc-response-v1' };
}

export function registerVerificationEvidenceIpc(input: Readonly<ElectronVerificationEvidenceAdapterInput>): () => void {
  ipcMain.handle(VERIFICATION_EVIDENCE_IMPORT_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<VerificationEvidenceImportIpcResponse> => {
    if (!trusted(input, event)) return rejected('VERIFICATION-EVIDENCE-IPC-SENDER-001');
    try { validateVerificationEvidenceImportIpcRequest(request); }
    catch (error) { return rejected(error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-IPC-VALIDATION-001'); }

    const selected = await dialog.showOpenDialog(input.owner, {
      title: 'انتخاب بسته شواهد Verification طلوع',
      properties: ['openFile'],
      filters: [{ name: 'TOLUE Verification Evidence', extensions: ['json'] }],
    });
    if (selected.canceled || selected.filePaths.length !== 1) {
      return { status: 'CANCELLED', evidencePackage: null, errorCode: null, method: 'tolue-verification-evidence-import-ipc-response-v1' };
    }
    const filePath = selected.filePaths[0];
    if (!filePath) return rejected('VERIFICATION-EVIDENCE-FILE-001');

    try {
      const raw = await readFile(filePath, 'utf8');
      if (raw.length > 5_000_000) return rejected('VERIFICATION-EVIDENCE-FILE-SIZE-001');
      const parsed = JSON.parse(raw) as VerificationEvidencePackage;
      validateVerificationEvidencePackage(parsed);
      input.repository.save(parsed, input.nowIso());
      return { status: 'IMPORTED', evidencePackage: Object.freeze(structuredClone(parsed)), errorCode: null, method: 'tolue-verification-evidence-import-ipc-response-v1' };
    } catch (error) {
      return rejected(error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-IMPORT-001');
    }
  });

  ipcMain.handle(VERIFICATION_EVIDENCE_HISTORY_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<VerificationEvidenceHistoryIpcResponse> => {
    if (!trusted(input, event)) return { status: 'REJECTED', items: [], errorCode: 'VERIFICATION-EVIDENCE-HISTORY-SENDER-001', method: 'tolue-verification-evidence-history-ipc-response-v1' };
    try { validateVerificationEvidenceHistoryIpcRequest(request); }
    catch (error) { return { status: 'REJECTED', items: [], errorCode: error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-HISTORY-VALIDATION-001', method: 'tolue-verification-evidence-history-ipc-response-v1' }; }
    try { return { status: 'SUCCESS', items: input.repository.listHistory(), errorCode: null, method: 'tolue-verification-evidence-history-ipc-response-v1' }; }
    catch (error) { return { status: 'REJECTED', items: [], errorCode: error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-HISTORY-001', method: 'tolue-verification-evidence-history-ipc-response-v1' }; }
  });

  ipcMain.handle(VERIFICATION_EVIDENCE_LOAD_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<VerificationEvidenceLoadIpcResponse> => {
    if (!trusted(input, event)) return { status: 'REJECTED', evidencePackage: null, errorCode: 'VERIFICATION-EVIDENCE-LOAD-SENDER-001', method: 'tolue-verification-evidence-load-ipc-response-v1' };
    try { validateVerificationEvidenceLoadIpcRequest(request); }
    catch (error) { return { status: 'REJECTED', evidencePackage: null, errorCode: error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-LOAD-VALIDATION-001', method: 'tolue-verification-evidence-load-ipc-response-v1' }; }
    const packageId = (request as { packageId: string }).packageId;
    try {
      const evidencePackage = input.repository.findByPackageId(packageId);
      if (!evidencePackage) return { status: 'NOT_FOUND', evidencePackage: null, errorCode: null, method: 'tolue-verification-evidence-load-ipc-response-v1' };
      return { status: 'SUCCESS', evidencePackage, errorCode: null, method: 'tolue-verification-evidence-load-ipc-response-v1' };
    } catch (error) {
      return { status: 'REJECTED', evidencePackage: null, errorCode: error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-LOAD-001', method: 'tolue-verification-evidence-load-ipc-response-v1' };
    }
  });

  return () => {
    ipcMain.removeHandler(VERIFICATION_EVIDENCE_IMPORT_CHANNEL);
    ipcMain.removeHandler(VERIFICATION_EVIDENCE_HISTORY_CHANNEL);
    ipcMain.removeHandler(VERIFICATION_EVIDENCE_LOAD_CHANNEL);
  };
}
