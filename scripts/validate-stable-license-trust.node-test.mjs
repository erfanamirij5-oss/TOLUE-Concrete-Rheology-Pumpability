import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { METHOD, RC_KEY_ID, validateStableTrust } from './validate-stable-license-trust.mjs';

function ed25519Pem() {
  return generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
}

function ring(pem, overrides = {}) {
  const base = {
    method: METHOD,
    activeKeyId: 'tolue-prod-test-2026-01',
    keys: [{ keyId: 'tolue-prod-test-2026-01', publicKeyPem: pem, status: 'ACTIVE' }]
  };
  return { ...base, ...overrides };
}

function expectCode(fn, code) {
  assert.throws(fn, (error) => error instanceof Error && error.message.startsWith(code));
}

test('accepts a valid production-like Ed25519 fixture', () => {
  const pem = ed25519Pem();
  assert.equal(validateStableTrust({ keyring: ring(pem), publicKeyPem: pem }).asymmetricKeyType, 'ed25519');
});

test('rejects RC key id', () => {
  const pem = ed25519Pem();
  expectCode(() => validateStableTrust({ keyring: ring(pem, { activeKeyId: RC_KEY_ID, keys: [{ keyId: RC_KEY_ID, publicKeyPem: pem, status: 'ACTIVE' }] }), publicKeyPem: pem }), 'STABLE-TRUST-005');
});

test('rejects invalid method', () => {
  const pem = ed25519Pem();
  expectCode(() => validateStableTrust({ keyring: ring(pem, { method: 'wrong' }), publicKeyPem: pem }), 'STABLE-TRUST-003');
});

test('rejects multiple ACTIVE keys', () => {
  const pem = ed25519Pem();
  const second = ed25519Pem();
  expectCode(() => validateStableTrust({ keyring: ring(pem, { keys: [{ keyId: 'tolue-prod-test-2026-01', publicKeyPem: pem, status: 'ACTIVE' }, { keyId: 'other', publicKeyPem: second, status: 'ACTIVE' }] }), publicKeyPem: pem }), 'STABLE-TRUST-007');
});

test('rejects mismatched activeKeyId', () => {
  const pem = ed25519Pem();
  expectCode(() => validateStableTrust({ keyring: ring(pem, { activeKeyId: 'different' }), publicKeyPem: pem }), 'STABLE-TRUST-008');
});

test('rejects non-Ed25519 key', () => {
  const pem = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ type: 'spki', format: 'pem' });
  expectCode(() => validateStableTrust({ keyring: ring(pem), publicKeyPem: pem }), 'STABLE-TRUST-011');
});

test('rejects packaged PEM/keyring mismatch', () => {
  const pem = ed25519Pem();
  const other = ed25519Pem();
  expectCode(() => validateStableTrust({ keyring: ring(pem), publicKeyPem: other }), 'STABLE-TRUST-012');
});

test('normalizes CRLF and LF before PEM comparison', () => {
  const pem = ed25519Pem();
  const crlf = pem.replace(/\n/g, '\r\n');
  assert.equal(validateStableTrust({ keyring: ring(crlf), publicKeyPem: pem }).asymmetricKeyType, 'ed25519');
});
