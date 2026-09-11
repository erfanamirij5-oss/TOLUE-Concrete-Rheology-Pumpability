import type { VerificationEvidencePackage } from '../../engineering/core/verificationEvidencePackage';

export const VERIFICATION_EVIDENCE_IMPORT_CHANNEL = 'tolue:verification-evidence:import:v1' as const;

export interface VerificationEvidenceImportIpcRequest {
  readonly channel: typeof VERIFICATION_EVIDENCE_IMPORT_CHANNEL;
}

export interface VerificationEvidenceImportIpcResponse {
  readonly status: 'IMPORTED' | 'CANCELLED' | 'REJECTED';
  readonly evidencePackage: Readonly<VerificationEvidencePackage> | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-verification-evidence-import-ipc-response-v1';
}

export function validateVerificationEvidenceImportIpcRequest(value: unknown): asserts value is VerificationEvidenceImportIpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || record.channel !== VERIFICATION_EVIDENCE_IMPORT_CHANNEL) throw new Error('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
}
