import { describe, expect, it } from 'vitest';
import { importOutcomeMessage, presentLicenseStatus } from './licensePresentation';

const status = (overrides: Partial<Parameters<typeof presentLicenseStatus>[0]> = {}) => ({
  status: 'MISSING' as const,
  machineCode: 'machine-code-123',
  licenseId: null,
  validUntilIso: null,
  canUseApplication: false,
  errorCode: null,
  method: 'tolue-license-status-ipc-response-v1' as const,
  ...overrides,
});

describe('license presentation', () => {
  it('permits application presentation only for Main-authoritative ACTIVE status', () => {
    expect(presentLicenseStatus(status({ status: 'ACTIVE', canUseApplication: true })).canUseApplication).toBe(true);
    expect(presentLicenseStatus(status({ status: 'ACTIVE', canUseApplication: false })).canUseApplication).toBe(false);
    expect(presentLicenseStatus(status({ status: 'MISSING', canUseApplication: true })).canUseApplication).toBe(false);
  });

  it('preserves machine code and verified metadata without inventing values', () => {
    const view = presentLicenseStatus(status({ status: 'EXPIRED', licenseId: 'lic-1', validUntilIso: '2026-09-09T00:00:00.000Z' }));
    expect(view).toMatchObject({ status: 'EXPIRED', machineCode: 'machine-code-123', licenseId: 'lic-1', validUntilIso: '2026-09-09T00:00:00.000Z' });
    expect(Object.isFrozen(view)).toBe(true);
  });

  it('provides status-specific user guidance without changing authorization semantics', () => {
    expect(presentLicenseStatus(status({ status: 'EXPIRED' })).message).toContain('پایان رسیده');
    expect(presentLicenseStatus(status({ status: 'MACHINE_MISMATCH' })).message).toContain('دستگاه دیگری');
    expect(presentLicenseStatus(status({ status: 'NOT_YET_VALID' })).message).toContain('شروع نشده');
    expect(presentLicenseStatus(status({ status: 'INVALID' })).message).toContain('معتبر نیست');
  });

  it('fails closed on malformed status responses', () => {
    expect(() => presentLicenseStatus({ ...status(), machineCode: '' })).toThrow('LICENSE-PRESENTATION-001');
    expect(() => presentLicenseStatus({ ...status(), method: 'bad' as never })).toThrow('LICENSE-PRESENTATION-001');
  });

  it('reports import outcomes with specific rejection guidance and validity details', () => {
    expect(importOutcomeMessage({ status: 'IMPORTED', licenseStatus: 'ACTIVE', licenseId: 'lic', validUntilIso: '2027-01-01T00:00:00.000Z', errorCode: null, method: 'tolue-license-import-ipc-response-v1' })).toContain('2027-01-01');
    expect(importOutcomeMessage({ status: 'REJECTED', licenseStatus: 'INVALID', licenseId: null, validUntilIso: null, errorCode: 'x', method: 'tolue-license-import-ipc-response-v1' })).toContain('معتبر نیست');
    expect(importOutcomeMessage({ status: 'REJECTED', licenseStatus: 'MACHINE_MISMATCH', licenseId: null, validUntilIso: null, errorCode: 'x', method: 'tolue-license-import-ipc-response-v1' })).toContain('دستگاه دیگری');
  });
});
