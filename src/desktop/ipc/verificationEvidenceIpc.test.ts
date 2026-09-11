import { describe, expect, it } from 'vitest';
import { VERIFICATION_EVIDENCE_IMPORT_CHANNEL, validateVerificationEvidenceImportIpcRequest } from './verificationEvidenceIpc';

describe('verification evidence IPC request', () => {
  it('accepts the exact import request contract', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL })).not.toThrow();
  });

  it('rejects unknown fields and wrong channels', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL, path: 'renderer-must-not-supply-path' })).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
    expect(() => validateVerificationEvidenceImportIpcRequest({ channel: 'other' })).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-002');
  });

  it('rejects non-object requests', () => {
    expect(() => validateVerificationEvidenceImportIpcRequest(null)).toThrow('VERIFICATION-EVIDENCE-IPC-REQUEST-001');
  });
});
