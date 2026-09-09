import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  LICENSE_IMPORT_CHANNEL,
  LICENSE_STATUS_CHANNEL,
  type LicenseImportIpcResponse,
  type LicenseStatusIpcResponse,
  validateLicenseImportIpcRequest,
  validateLicenseStatusIpcRequest,
} from '../ipc/licenseIpc';
import { evaluatePackagedLicenseRuntime } from './licensing/licenseRuntime';
import { provisionSignedLicense } from './licensing/licenseProvisioning';

export interface ElectronLicenseAdapterInput {
  readonly owner: BrowserWindow;
  readonly trustedDocumentUrl: string;
  readonly userDataPath: string;
  readonly resourcesPath: string;
  readonly nowIso: () => string;
}

const trusted = (input: Readonly<ElectronLicenseAdapterInput>, event: IpcMainInvokeEvent): boolean =>
  !input.owner.isDestroyed() && event.sender === input.owner.webContents && event.senderFrame === input.owner.webContents.mainFrame && event.senderFrame.url === input.trustedDocumentUrl;

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
    const selected = await dialog.showOpenDialog(input.owner, { title: 'انتخاب فایل مجوز طلوع', properties: ['openFile'], filters: [{ name: 'TOLUE License', extensions: ['json'] }] });
    if (selected.canceled || selected.filePaths.length !== 1) return { status: 'CANCELLED', licenseStatus: status(input).status, licenseId: null, validUntilIso: null, errorCode: null, method: 'tolue-license-import-ipc-response-v1' };
    const current = status(input);
    if (!current.machineCode) return { status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: 'LICENSE-IMPORT-MACHINE-001', method: 'tolue-license-import-ipc-response-v1' };
    const provisioned = provisionSignedLicense({
      userDataPath: input.userDataPath,
      publicKeyPath: `${input.resourcesPath}/license/tolue-license-public-key.pem`,
      machineId: current.machineCode,
      nowIso: input.nowIso(),
      sourceLicensePath: selected.filePaths[0],
    });
    if (provisioned.status !== 'IMPORTED') return { status: 'REJECTED', licenseStatus: status(input).status, licenseId: null, validUntilIso: null, errorCode: provisioned.errorCode, method: 'tolue-license-import-ipc-response-v1' };
    const refreshed = status(input);
    return { status: 'IMPORTED', licenseStatus: refreshed.status, licenseId: provisioned.licenseId, validUntilIso: provisioned.validUntilIso, errorCode: refreshed.canUseApplication ? null : 'LICENSE-IMPORT-POSTVERIFY-001', method: 'tolue-license-import-ipc-response-v1' };
  });

  return () => { ipcMain.removeHandler(LICENSE_IMPORT_CHANNEL); ipcMain.removeHandler(LICENSE_STATUS_CHANNEL); };
}
