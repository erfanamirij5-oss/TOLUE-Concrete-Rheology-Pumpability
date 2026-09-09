import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendLicenseAudit, readLicenseAudit } from './licenseAudit';

describe('license audit', () => {
  it('appends ordered minimal licensing events without machine identity or license envelope', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-audit-'));
    appendLicenseAudit(root, { occurredAtIso: '2026-09-09T10:00:00.000Z', event: 'IMPORT_REJECTED', status: 'MACHINE_MISMATCH', licenseId: null, errorCode: 'LICENSE-PROVISION-POLICY-MACHINE_MISMATCH' });
    appendLicenseAudit(root, { occurredAtIso: '2026-09-09T10:01:00.000Z', event: 'IMPORT_ACCEPTED', status: 'ACTIVE', licenseId: 'license-001', errorCode: null });
    const entries = readLicenseAudit(root);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.event).toBe('IMPORT_REJECTED');
    expect(entries[1]?.event).toBe('IMPORT_ACCEPTED');
    expect(JSON.stringify(entries)).not.toContain('machineCode');
    expect(JSON.stringify(entries)).not.toContain('machineId');
    expect(JSON.stringify(entries)).not.toContain('signatureBase64');
    expect(Object.isFrozen(entries)).toBe(true);
  });

  it('rejects newline injection and malformed timestamps', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-audit-'));
    expect(() => appendLicenseAudit(root, { occurredAtIso: 'bad', event: 'IMPORT_REJECTED', status: 'INVALID', licenseId: null, errorCode: null })).toThrow('LICENSE-AUDIT-TIME-001');
    expect(() => appendLicenseAudit(root, { occurredAtIso: '2026-09-09T10:00:00.000Z', event: 'IMPORT_REJECTED', status: 'INVALID', licenseId: null, errorCode: 'bad\nvalue' })).toThrow('LICENSE-AUDIT-VALUE-001');
  });
});
