import type { VerificationEvidencePackage } from '../../engineering/core/verificationEvidencePackage';
import type { VerificationEvidencePackageHistoryItem } from '../main/persistence/verificationEvidenceRepository';

export const VERIFICATION_EVIDENCE_IMPORT_CHANNEL = 'tolue:verification-evidence:import:v1' as const;
export const VERIFICATION_EVIDENCE_HISTORY_CHANNEL = 'tolue:verification-evidence:history:v1' as const;
export const VERIFICATION_EVIDENCE_LOAD_CHANNEL = 'tolue:verification-evidence:load:v1' as const;

export interface VerificationEvidenceImportIpcRequest { readonly channel: typeof VERIFICATION_EVIDENCE_IMPORT_CHANNEL; }
export interface VerificationEvidenceHistoryIpcRequest { readonly channel: typeof VERIFICATION_EVIDENCE_HISTORY_CHANNEL; }
export interface VerificationEvidenceLoadIpcRequest { readonly channel: typeof VERIFICATION_EVIDENCE_LOAD_CHANNEL; readonly packageId: string; }

export interface VerificationEvidenceImportIpcResponse {
  readonly status: 'IMPORTED' | 'CANCELLED' | 'REJECTED';
  readonly evidencePackage: Readonly<VerificationEvidencePackage> | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-verification-evidence-import-ipc-response-v1';
}

export interface VerificationEvidenceHistoryIpcResponse {
  readonly status: 'SUCCESS' | 'REJECTED';
  readonly items: readonly Readonly<VerificationEvidencePackageHistoryItem>[];
  readonly errorCode: string | null;
  readonly method: 'tolue-verification-evidence-history-ipc-response-v1';
}

export interface VerificationEvidenceLoadIpcResponse {
  readonly status: 'SUCCESS' | 'NOT_FOUND' | 'REJECTED';
  readonly evidencePackage: Readonly<VerificationEvidencePackage> | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-verification-evidence-load-ipc-response-v1';
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
  return value as Record<string, unknown>;
}

export function validateVerificationEvidenceImportIpcRequest(value: unknown): asserts value is VerificationEvidenceImportIpcRequest {
  const request = record(value);
  if (Object.keys(request).length !== 1 || request.channel !== VERIFICATION_EVIDENCE_IMPORT_CHANNEL) throw new Error('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
}

export function validateVerificationEvidenceHistoryIpcRequest(value: unknown): asserts value is VerificationEvidenceHistoryIpcRequest {
  const request = record(value);
  if (Object.keys(request).length !== 1 || request.channel !== VERIFICATION_EVIDENCE_HISTORY_CHANNEL) throw new Error('VERIFICATION-EVIDENCE-HISTORY-IPC-REQUEST-001');
}

export function validateVerificationEvidenceLoadIpcRequest(value: unknown): asserts value is VerificationEvidenceLoadIpcRequest {
  const request = record(value);
  if (Object.keys(request).length !== 2 || request.channel !== VERIFICATION_EVIDENCE_LOAD_CHANNEL || typeof request.packageId !== 'string' || !request.packageId.trim()) throw new Error('VERIFICATION-EVIDENCE-LOAD-IPC-REQUEST-001');
}
