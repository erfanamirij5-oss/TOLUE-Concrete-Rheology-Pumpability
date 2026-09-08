import { describe, expect, it } from 'vitest';
import { evaluateLicense, type VerifiedLicenseEntitlement } from './licensePolicy';

const entitlement: VerifiedLicenseEntitlement = Object.freeze({
  licenseId: 'license-001',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId: 'machine-a',
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2027-01-01T00:00:00.000Z',
  verification: 'VERIFIED',
});

const evaluate = (overrides: Partial<Parameters<typeof evaluateLicense>[0]> = {}) => evaluateLicense({
  entitlement,
  machineId: 'machine-a',
  nowIso: '2026-09-09T00:00:00.000Z',
  ...overrides,
});

describe('commercial license policy', () => {
  it('permits only a verified, in-window, machine-bound entitlement', () => {
    expect(evaluate()).toEqual({
      status: 'ACTIVE',
      canUseApplication: true,
      licenseId: 'license-001',
      method: 'tolue-commercial-license-policy-v1',
    });
  });

  it('fails closed when entitlement is missing', () => {
    expect(evaluate({ entitlement: null }).status).toBe('MISSING');
    expect(evaluate({ entitlement: null }).canUseApplication).toBe(false);
  });

  it('fails closed on machine mismatch', () => {
    const result = evaluate({ machineId: 'machine-b' });
    expect(result.status).toBe('MACHINE_MISMATCH');
    expect(result.canUseApplication).toBe(false);
  });

  it('fails closed before activation and after expiration', () => {
    expect(evaluate({ nowIso: '2025-12-31T23:59:59.000Z' }).status).toBe('NOT_YET_VALID');
    expect(evaluate({ nowIso: '2027-01-01T00:00:00.001Z' }).status).toBe('EXPIRED');
  });

  it('accepts exact validity boundaries', () => {
    expect(evaluate({ nowIso: entitlement.validFromIso }).status).toBe('ACTIVE');
    expect(evaluate({ nowIso: entitlement.validUntilIso }).status).toBe('ACTIVE');
  });

  it('rejects malformed time and invalid validity windows', () => {
    expect(() => evaluate({ nowIso: 'not-a-time' })).toThrow('LICENSE-TIME-001');
    expect(evaluate({ entitlement: { ...entitlement, validUntilIso: entitlement.validFromIso } }).status).toBe('INVALID');
  });
});
