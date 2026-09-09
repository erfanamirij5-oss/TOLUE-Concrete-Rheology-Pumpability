import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createLicensePublicKeyring, resolveLicensePublicKey } from './licenseKeyring';

const pem = () => generateKeyPairSync('ed25519').publicKey.export({ format: 'pem', type: 'spki' }).toString();

describe('license public keyring', () => {
  it('supports one active key plus legacy verify-only keys without ambiguity', () => {
    const activePem = pem(); const legacyPem = pem();
    const keyring = createLicensePublicKeyring('prod-2026-01', [
      { keyId: 'prod-2025-01', publicKeyPem: legacyPem, status: 'LEGACY_VERIFY_ONLY' },
      { keyId: 'prod-2026-01', publicKeyPem: activePem, status: 'ACTIVE' },
    ]);
    expect(keyring.activeKeyId).toBe('prod-2026-01');
    expect(resolveLicensePublicKey(keyring, 'prod-2025-01')).toBe(legacyPem);
    expect(resolveLicensePublicKey(keyring, 'prod-2026-01')).toBe(activePem);
    expect(resolveLicensePublicKey(keyring, 'unknown')).toBeNull();
    expect(Object.isFrozen(keyring)).toBe(true);
    expect(Object.isFrozen(keyring.keys)).toBe(true);
  });

  it('fails closed on duplicate IDs, multiple active keys, invalid IDs, or non-Ed25519 keys', () => {
    const a = pem(); const b = pem();
    expect(() => createLicensePublicKeyring('prod-2026-01', [
      { keyId: 'prod-2026-01', publicKeyPem: a, status: 'ACTIVE' },
      { keyId: 'prod-2026-01', publicKeyPem: b, status: 'LEGACY_VERIFY_ONLY' },
    ])).toThrow('LICENSE-KEYRING-DUPLICATE-001');
    expect(() => createLicensePublicKeyring('prod-2026-01', [
      { keyId: 'prod-2026-01', publicKeyPem: a, status: 'ACTIVE' },
      { keyId: 'prod-2027-01', publicKeyPem: b, status: 'ACTIVE' },
    ])).toThrow('LICENSE-KEYRING-ACTIVE-002');
    expect(() => createLicensePublicKeyring('X', [{ keyId: 'X', publicKeyPem: a, status: 'ACTIVE' }])).toThrow('LICENSE-KEYRING-KEYID-001');
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ format: 'pem', type: 'spki' }).toString();
    expect(() => createLicensePublicKeyring('prod-2026-01', [{ keyId: 'prod-2026-01', publicKeyPem: rsa, status: 'ACTIVE' }])).toThrow('LICENSE-KEYRING-PEM-002');
  });
});
