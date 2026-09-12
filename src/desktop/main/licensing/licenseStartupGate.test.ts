import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalLicensePayload, type LicenseEntitlementPayload } from './licenseEnvelope';
import { evaluateLicenseStartupGate } from './licenseStartupGate';

const entitlement: LicenseEntitlementPayload = Object.freeze({
  licenseId: 'license-001',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId: 'machine-a',
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2027-01-01T00:00:00.000Z',
});

function fixture(payload: Readonly<LicenseEntitlementPayload> = entitlement) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const signatureBase64 = sign(null, Buffer.from(canonicalLicensePayload(payload), 'utf8'), privateKey).toString('base64');
  return {
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
    envelope: { schemaVersion: 'tolue-license-v1', entitlement: payload, signatureBase64 },
  } as const;
}

describe('license startup gate', () => {
  it('starts only for a verified active machine-bound entitlement', () => {
    const { publicKeyPem, envelope } = fixture();
    const result = evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem, machineId: 'machine-a', nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.canStartApplication).toBe(true);
    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.evaluation.status).toBe('ACTIVE');
  });

  it('fails closed when signature or envelope verification fails', () => {
    const { publicKeyPem, envelope } = fixture();
    const tampered = { ...envelope, entitlement: { ...envelope.entitlement, machineId: 'machine-b' } };
    const result = evaluateLicenseStartupGate({ signedEnvelope: tampered, publicKeyPem, machineId: 'machine-b', nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.canStartApplication).toBe(false);
    expect(result.verificationStatus).toBe('INVALID_SIGNATURE_OR_ENVELOPE');
    expect(result.evaluation.status).toBe('MISSING');
  });

  it('preserves machine mismatch and expiry from the commercial policy', () => {
    const { publicKeyPem, envelope } = fixture();
    expect(evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem, machineId: 'machine-b', nowIso: '2026-09-09T00:00:00.000Z' }).evaluation.status).toBe('MACHINE_MISMATCH');
    expect(evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem, machineId: 'machine-a', nowIso: '2027-01-01T00:00:00.001Z' }).evaluation.status).toBe('EXPIRED');
  });

  it('requires explicit machine and time while legacy v1 still needs its external public key', () => {
    const { envelope } = fixture();
    expect(() => evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem: '', machineId: '', nowIso: '2026-09-09T00:00:00.000Z' })).toThrow('LICENSE-STARTUP-MACHINE-001');
    expect(() => evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem: '', machineId: 'machine-a', nowIso: '' })).toThrow('LICENSE-STARTUP-TIME-001');
    const legacyWithoutKey = evaluateLicenseStartupGate({ signedEnvelope: envelope, publicKeyPem: '', machineId: 'machine-a', nowIso: '2026-09-09T00:00:00.000Z' });
    expect(legacyWithoutKey.canStartApplication).toBe(false);
    expect(legacyWithoutKey.verificationStatus).toBe('INVALID_SIGNATURE_OR_ENVELOPE');
  });
});
