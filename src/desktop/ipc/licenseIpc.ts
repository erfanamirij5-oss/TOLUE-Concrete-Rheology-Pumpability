import type { LicenseStatus } from '../main/licensing/licensePolicy';

export const LICENSE_STATUS_CHANNEL = 'tolue:license:status:v1' as const;
export const LICENSE_IMPORT_CHANNEL = 'tolue:license:import:v1' as const;

export interface LicenseStatusIpcRequest {
  readonly channel: typeof LICENSE_STATUS_CHANNEL;
}

export interface LicenseImportIpcRequest {
  readonly channel: typeof LICENSE_IMPORT_CHANNEL;
}

export interface LicenseStatusIpcResponse {
  readonly status: LicenseStatus;
  readonly machineCode: string;
  readonly licenseId: string | null;
  readonly validUntilIso: string | null;
  readonly canUseApplication: boolean;
  readonly errorCode: string | null;
  readonly method: 'tolue-license-status-ipc-response-v1';
}

export interface LicenseImportIpcResponse {
  readonly status: 'IMPORTED' | 'CANCELLED' | 'REJECTED';
  readonly licenseStatus: LicenseStatus;
  readonly licenseId: string | null;
  readonly validUntilIso: string | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-license-import-ipc-response-v1';
}

export function validateLicenseStatusIpcRequest(value: unknown): asserts value is LicenseStatusIpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('LICENSE-STATUS-IPC-REQUEST-001');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || record.channel !== LICENSE_STATUS_CHANNEL) throw new Error('LICENSE-STATUS-IPC-REQUEST-002');
}

export function validateLicenseImportIpcRequest(value: unknown): asserts value is LicenseImportIpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('LICENSE-IMPORT-IPC-REQUEST-001');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || record.channel !== LICENSE_IMPORT_CHANNEL) throw new Error('LICENSE-IMPORT-IPC-REQUEST-002');
}
