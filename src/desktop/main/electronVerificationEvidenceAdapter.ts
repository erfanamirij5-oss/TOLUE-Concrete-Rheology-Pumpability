import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { readFile } from 'node:fs/promises';
import { validateVerificationEvidencePackage, type VerificationEvidencePackage } from '../../engineering/core/verificationEvidencePackage';
import {
  VERIFICATION_EVIDENCE_IMPORT_CHANNEL,
  type VerificationEvidenceImportIpcResponse,
  validateVerificationEvidenceImportIpcRequest,
} from '../ipc/verificationEvidenceIpc';

export interface ElectronVerificationEvidenceAdapterInput {
  readonly owner: BrowserWindow;
  readonly trustedDocumentUrl: string;
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
      return {
        status: 'IMPORTED',
        evidencePackage: Object.freeze(structuredClone(parsed)),
        errorCode: null,
        method: 'tolue-verification-evidence-import-ipc-response-v1',
      };
    } catch (error) {
      return rejected(error instanceof Error ? error.message : 'VERIFICATION-EVIDENCE-IMPORT-001');
    }
  });

  return () => ipcMain.removeHandler(VERIFICATION_EVIDENCE_IMPORT_CHANNEL);
}
