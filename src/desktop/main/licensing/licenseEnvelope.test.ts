import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalLicensePayload, PRODUCTION_KEY_ID, verifySignedLicenseEnvelope, type LicenseEntitlementPayload, type SignedLicenseEnvelopeV1, type SignedLicenseEnvelopeV2 } from './licenseEnvelope';

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

function envelopeV1(privateKey: ReturnType<typeof keys>['privateKey'], payload: LicenseEntitlementPayload = entitlement): SignedLicenseEnvelopeV1 {
  const signature = sign(null, Buffer.from(canonicalLicensePayload(payload), 'utf8'), privateKey).toString('base64');
  return Object.freeze({ schemaVersion: 'tolue-license-v1', entitlement: payload, signatureBase64: signature });
}

function envelopeV2(pair: ReturnType<typeof keys>, payload: LicenseEntitlementPayload = entitlement): { envelope: SignedLicenseEnvelopeV2; fingerprint: string } {
  const publicKeyPem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
  const fingerprint = createHash('sha256').update(publicKeyPem, 'utf8').digest('hex');
  const signatureBase64 = sign(null, Buffer.from(canonicalLicensePayload(payload), 'utf8'), pair.privateKey).toString('base64');
  return {
    envelope: Object.freeze({ schemaVersion: 'tolue-license-v2', keyId: PRODUCTION_KEY_ID, publicKeyPem, entitlement: payload, signatureBase64 }),
    fingerprint,
  };
}

describe('signed commercial license envelope', () => {
  it('creates VERIFIED entitlement only after legacy v1 Ed25519 signature verification', () => {
    const { publicKey, privateKey } = keys();
    const verified = verifySignedLicenseEnvelope(envelopeV1(privateKey), publicKey.export({ type: 'spki', format: 'pem' }).toString());
    expect(verified).toEqual({ ...entitlement, verification: 'VERIFIED' });
  });

  it('verifies self-contained v2 only when the embedded public key matches the pinned fingerprint', () => {
    const pair = keys();
    const signed = envelopeV2(pair);
    expect(verifySignedLicenseEnvelope(signed.envelope, '', signed.fingerprint)).toEqual({ ...entitlement, verification: 'VERIFIED' });
    expect(verifySignedLicenseEnvelope(signed.envelope, '', '0'.repeat(64))).toBeNull();
  });

  it('rejects tampering after signing', () => {
    const { publicKey, privateKey } = keys();
    const signed = envelopeV1(privateKey);
    const tampered = { ...signed, entitlement: { ...signed.entitlement, machineId: 'machine-b' } };
    expect(verifySignedLicenseEnvelope(tampered, publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });

  it('rejects signatures from another key', () => {
    const signer = keys();
    const verifier = keys();
    expect(verifySignedLicenseEnvelope(envelopeV1(signer.privateKey), verifier.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });

  it('rejects malformed envelopes, extra fields and non-Ed25519 keys', () => {
    const { publicKey, privateKey } = keys();
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(verifySignedLicenseEnvelope({ ...envelopeV1(privateKey), extra: true }, pem)).toBeNull();
    expect(verifySignedLicenseEnvelope({ ...envelopeV1(privateKey), signatureBase64: 'not-a-signature' }, pem)).toBeNull();
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    expect(verifySignedLicenseEnvelope(envelopeV1(privateKey), rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString())).toBeNull();
  });
});
