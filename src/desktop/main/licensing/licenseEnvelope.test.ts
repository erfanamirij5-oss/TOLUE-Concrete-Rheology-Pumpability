import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalLicensePayload, verifySignedLicenseEnvelope, type LicenseEntitlementPayload, type SignedLicenseEnvelope } from './licenseEnvelope';

const entitlement: LicenseEntitlementPayload = Object.freeze({
  licenseId: 'license-001',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId: 'machine-a',
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2027-01-01T00:00:00.000Z',
});

function keys() {
  return generateKeyPairSync('ed25519');
}

function envelope(privateKey: ReturnType<typeof keys>['privateKey'], payload: LicenseEntitlementPayload = entitlement): SignedLicenseEnvelope {
  const signature = sign(null, Buffer.from(canonicalLicensePayload(payload), 'utf8'), privateKey).toString('base64');
  return Object.freeze({ schemaVersion: 'tolue-license-v1', entitlement: payload, signatureBase64: signature });
}

describe('signed commercial license envelope', () => {
  it('creates VERIFIED entitlement only after Ed25519 signature verification', () => {
    const { publicKey, privateKey } = keys();
    const verified = verifySignedLicenseEnvelope(envelope(privateKey), publicKey.export({ type: 'spki', format: 'pem' }).toString());
    expect(verified).toEqual({ ...entitlement, verification: 'VERIFIED' });
  });

  it('rejects tampering after signing', () => {
    const { publicKey, privateKey } = keys();
    const signed = envelope(privateKey);
    const tampered = { ...signed, entitlement: { ...signed.entitlement, machineId: 'machine-b' } };
    expect(verifySignedLicenseEnvelope(tampered, publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });

  it('rejects signatures from another key', () => {
    const signer = keys();
    const verifier = keys();
    expect(verifySignedLicenseEnvelope(envelope(signer.privateKey), verifier.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });

  it('rejects malformed envelopes, extra fields and non-Ed25519 keys', () => {
    const { publicKey, privateKey } = keys();
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(verifySignedLicenseEnvelope({ ...envelope(privateKey), extra: true }, pem)).toBeNull();
    expect(verifySignedLicenseEnvelope({ ...envelope(privateKey), signatureBase64: 'not-a-signature' }, pem)).toBeNull();
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    expect(verifySignedLicenseEnvelope(envelope(privateKey), rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });
});
