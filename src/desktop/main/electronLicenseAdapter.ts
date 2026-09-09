import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import {
  LICENSE_IMPORT_CHANNEL,
  LICENSE_STATUS_CHANNEL,
  type LicenseImportIpcResponse,
  type LicenseStatusIpcResponse,
  validateLicenseImportIpcRequest,
  validateLicenseStatusIpcRequest,
} from '../ipc/licenseIpc';
import { appendLicenseAudit, type LicenseAuditEvent } from './licensing/licenseAudit';
import { evaluatePackagedLicenseRuntime } from './licensing/licenseRuntime';
import { provisionSignedLicense } from './licensing/licenseProvisioning';
import type { LicenseStatus } from './licensing/licensePolicy';

export interface ElectronLicenseAdapterInput {
  readonly owner: BrowserWindow;
  readonly trustedDocumentUrl: string;
  readonly userDataPath: string;
  readonly resourcesPath: string;
  readonly nowIso: () => string;
  readonly onActivated?: () => void;
}

const trusted = (input: Readonly<ElectronLicenseAdapterInput>, event: IpcMainInvokeEvent): boolean =>
  !input.owner.isDestroyed() && event.sender === input.owner.webContents && event.senderFrame === input.owner.webContents.mainFrame && event.senderFrame.url === input.trustedDocumentUrl;

function audit(input: Readonly<ElectronLicenseAdapterInput>, event: LicenseAuditEvent, status: LicenseStatus, licenseId: string | null, errorCode: string | null, occurredAtIso = input.nowIso()): void {
  try { appendLicenseAudit(input.userDataPath, { occurredAtIso, event, status, licenseId, errorCode }); } catch { /* audit must not alter licensing decision */ }
}

function status(input: Readonly<ElectronLicenseAdapterInput>): LicenseStatusIpcResponse {
  try {
    const runtime = evaluatePackagedLicenseRuntime({ userDataPath: input.userDataPath, resourcesPath: input.resourcesPath, nowIso: input.nowIso() });
    return {
      status: runtime.gate.evaluation.status,
      machineCode: runtime.machineId,
      licenseId: runtime.gate.evaluation.licenseId,
      validUntilIso: null,
      canUseApplication: runtime.gate.canStartApplication,
      errorCode: runtime.clock.accepted ? null : `LICENSE-CLOCK-${runtime.clock.status}`,
      method: 'tolue-license-status-ipc-response-v1',
    };
  } catch {
    return { status: 'INVALID', machineCode: '', licenseId: null, validUntilIso: null, canUseApplication: false, errorCode: 'LICENSE-STATUS-RUNTIME-001', method: 'tolue-license-status-ipc-response-v1' };
  }
}

export function registerLicenseIpc(input: Readonly<ElectronLicenseAdapterInput>): () => void {
  ipcMain.handle(LICENSE_STATUS_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<LicenseStatusIpcResponse> => {
    if (!trusted(input, event)) return { status: 'INVALID', machineCode: '', licenseId: null, validUntilIso: null, canUseApplication: false, errorCode: 'LICENSE-STATUS-IPC-SENDER-001', method: 'tolue-license-status-ipc-response-v1' };
    try { validateLicenseStatusIpcRequest(request); } catch (error) {
      return { status: 'INVALID', machineCode: '', licenseId: null, validUntilIso: null, canUseApplication: false, errorCode: error instanceof Error ? error.message : 'LICENSE-STATUS-IPC-VALIDATION-001', method: 'tolue-license-status-ipc-response-v1' };
    }
    return status(input);
  });

  ipcMain.handle(LICENSE_IMPORT_CHANNEL, async (event: IpcMainInvokeEvent, request: unknown): Promise<LicenseImportIpcResponse> => {
    if (!trusted(input, event)) return { status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: 'LICENSE-IMPORT-IPC-SENDER-001', method: 'tolue-license-import-ipc-response-v1' };
    try { validateLicenseImportIpcRequest(request); } catch (error) {
      return { status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: error instanceof Error ? error.message : 'LICENSE-IMPORT-IPC-VALIDATION-001', method: 'tolue-license-import-ipc-response-v1' };
    }
    const occurredAtIso = input.nowIso();
    const selected = await dialog.showOpenDialog(input.owner, { title: 'انتخاب فایل مجوز طلوع', properties: ['openFile'], filters: [{ name: 'TOLUE License', extensions: ['json'] }] });
    if (selected.canceled || selected.filePaths.length !== 1) {
      const current = status(input);
      audit(input, 'IMPORT_CANCELLED', current.status, current.licenseId, null, occurredAtIso);
      return { status: 'CANCELLED', licenseStatus: current.status, licenseId: null, validUntilIso: null, errorCode: null, method: 'tolue-license-import-ipc-response-v1' };
    }
    const sourceLicensePath = selected.filePaths[0];
    if (!sourceLicensePath) {
      audit(input, 'IMPORT_REJECTED', 'INVALID', null, 'LICENSE-IMPORT-FILE-001', occurredAtIso);
      return { status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: 'LICENSE-IMPORT-FILE-001', method: 'tolue-license-import-ipc-response-v1' };
    }
    const current = status(input);
    if (!current.machineCode) {
      audit(input, 'IMPORT_REJECTED', 'INVALID', null, 'LICENSE-IMPORT-MACHINE-001', occurredAtIso);
      return { status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: 'LICENSE-IMPORT-MACHINE-001', method: 'tolue-license-import-ipc-response-v1' };
    }
    const provisioned = provisionSignedLicense({
      userDataPath: input.userDataPath,
      publicKeyPath: join(input.resourcesPath, 'license', 'tolue-license-public-key.pem'),
      machineId: current.machineCode,
      nowIso: occurredAtIso,
      sourceLicensePath,
    });
    if (provisioned.status !== 'IMPORTED') {
      const refreshed = status(input);
      audit(input, 'IMPORT_REJECTED', refreshed.status, null, provisioned.errorCode, occurredAtIso);
      return { status: 'REJECTED', licenseStatus: refreshed.status, licenseId: null, validUntilIso: null, errorCode: provisioned.errorCode, method: 'tolue-license-import-ipc-response-v1' };
    }
    const refreshed = status(input);
    if (!refreshed.canUseApplication || refreshed.status !== 'ACTIVE') {
      audit(input, 'IMPORT_REJECTED', refreshed.status, provisioned.licenseId, 'LICENSE-IMPORT-POSTVERIFY-001', occurredAtIso);
      return { status: 'REJECTED', licenseStatus: refreshed.status, licenseId: provisioned.licenseId, validUntilIso: provisioned.validUntilIso, errorCode: 'LICENSE-IMPORT-POSTVERIFY-001', method: 'tolue-license-import-ipc-response-v1' };
    }
    audit(input, 'IMPORT_ACCEPTED', refreshed.status, provisioned.licenseId, null, occurredAtIso);
    const response: LicenseImportIpcResponse = { status: 'IMPORTED', licenseStatus: refreshed.status, licenseId: provisioned.licenseId, validUntilIso: provisioned.validUntilIso, errorCode: null, method: 'tolue-license-import-ipc-response-v1' };
    if (input.onActivated) setImmediate(input.onActivated);
    return response;
  });

  return () => { ipcMain.removeHandler(LICENSE_IMPORT_CHANNEL); ipcMain.removeHandler(LICENSE_STATUS_CHANNEL); };
}
