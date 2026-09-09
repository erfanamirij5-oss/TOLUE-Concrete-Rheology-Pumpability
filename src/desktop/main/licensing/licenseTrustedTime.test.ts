import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalTrustedTimePayload, resolveEffectiveLicenseTime, verifyTrustedTimeAnchor } from './licenseTrustedTime';

function fixture(trustedAtIso = '2026-09-09T20:00:00.000Z') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const keyId = 'legacy-v1';
  const signatureBase64 = sign(null, Buffer.from(canonicalTrustedTimePayload(keyId, trustedAtIso), 'utf8'), privateKey).toString('base64');
  const anchor = { schemaVersion: 'tolue-trusted-time-v1', keyId, trustedAtIso, signatureBase64 } as const;
  const pem = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  return { anchor, pem };
}

describe('signed trusted time', () => {
  it('verifies an Ed25519-signed anchor and raises effective time to the signed floor', () => {
    const f = fixture();
    const verified = verifyTrustedTimeAnchor(f.anchor, keyId => keyId === 'legacy-v1' ? f.pem : null);
    expect(verified).toMatchObject({ keyId: 'legacy-v1', trustedAtIso: '2026-09-09T20:00:00.000Z' });
    expect(resolveEffectiveLicenseTime('2026-09-09T19:00:00.000Z', verified)).toBe('2026-09-09T20:00:00.000Z');
    expect(resolveEffectiveLicenseTime('2026-09-09T21:00:00.000Z', verified)).toBe('2026-09-09T21:00:00.000Z');
  });

  it('fails closed for tampering, unknown key IDs, and extra fields', () => {
    const f = fixture();
    expect(verifyTrustedTimeAnchor({ ...f.anchor, trustedAtIso: '2035-01-01T00:00:00.000Z' }, () => f.pem)).toBeNull();
    expect(verifyTrustedTimeAnchor({ ...f.anchor, keyId: 'unknown-key' }, () => null)).toBeNull();
    expect(verifyTrustedTimeAnchor({ ...f.anchor, extra: true }, () => f.pem)).toBeNull();
  });

  it('preserves local time when no trusted anchor is available', () => {
    expect(resolveEffectiveLicenseTime('2026-09-09T20:00:00.000Z', null)).toBe('2026-09-09T20:00:00.000Z');
  });
});
