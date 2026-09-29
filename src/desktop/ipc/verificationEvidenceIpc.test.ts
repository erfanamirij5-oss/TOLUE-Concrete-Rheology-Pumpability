import { describe, expect, it } from 'vitest';
import {
  VERIFICATION_EVIDENCE_HISTORY_CHANNEL,
  VERIFICATION_EVIDENCE_IMPORT_CHANNEL,
  VERIFICATION_EVIDENCE_LOAD_CHANNEL,
  validateVerificationEvidenceHistoryIpcRequest,
  validateVerificationEvidenceImportIpcRequest,
  validateVerificationEvidenceLoadIpcRequest,
} from './verificationEvidenceIpc';

describe('verification evidence IPC request', () => {
  it('accepts the exact import request contract', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL })).not.toThrow();
  });

  it('rejects renderer-supplied file paths and wrong import channels', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL, path: 'renderer-must-not-supply-path' })).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: 'other' })).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
  });

  it('accepts only the exact history request contract', () => {
    expect(() => validateVerificationEvidenceHistoryIpcRequest({ channel: VERIFICATION_EVIDENCE_HISTORY_CHANNEL })).not.toThrow();
    expect(() => validateVerificationEvidenceHistoryIpcRequest({ channel: VERIFICATION_EVIDENCE_HISTORY_CHANNEL, extra: true })).toThrow('VERIFICATION-EVIDENCE-HISTORY-IPC-REQUEST-001');
  });

  it('requires a non-empty package id for load requests', () => {
    expect(() => validateVerificationEvidenceLoadIpcRequest({ channel: VERIFICATION_EVIDENCE_LOAD_CHANNEL, packageId: 'VP-001' })).not.toThrow();
    expect(() => validateVerificationEvidenceLoadIpcRequest({ channel: VERIFICATION_EVIDENCE_LOAD_CHANNEL, packageId: '   ' })).toThrow('VERIFICATION-EVIDENCE-LOAD-IPC-REQUEST-001');
    expect(() => validateVerificationEvidenceLoadIpcRequest({ channel: VERIFICATION_EVIDENCE_LOAD_CHANNEL, packageId: 'VP-001', path: 'forbidden' })).toThrow('VERIFICATION-EVIDENCE-LOAD-IPC-REQUEST-001');
  });

  it('rejects non-object requests', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest(null)).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
    expect(() => validateVerificationEvidenceHistoryIpcRequest([])).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
    expect(() => validateVerificationEvidenceLoadIpcRequest('VP-001')).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
  });
});
