import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { prepareStableTrust } from './prepare-stable-license-trust.mjs';
import { RC_KEY_ID, validateStableTrust } from './validate-stable-license-trust.mjs';

function ed25519PublicPem() {
  const { publicKey } = generateKeyPairSync('ed25519');
  return publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

test('prepares deterministic stable ACTIVE trust from a production-like Ed25519 public key', () => {
  const pem = ed25519PublicPem();
  const result = prepareStableTrust({ keyId: 'tolue-prod-example-01', publicKeyPem: pem });
  assert.equal(result.keyring.method, 'tolue-license-public-keyring-v1');
  assert.equal(result.keyring.activeKeyId, 'tolue-prod-example-01');
  assert.equal(result.keyring.keys.length, 1);
  assert.equal(result.keyring.keys[0].status, 'ACTIVE');
  assert.equal(result.keyring.keys[0].publicKeyPem, result.publicKeyPem);
  const validated = validateStableTrust({ keyring: result.keyring, publicKeyPem: result.publicKeyPem });
  assert.equal(validated.activeKeyId, 'tolue-prod-example-01');
  assert.equal(validated.asymmetricKeyType, 'ed25519');
});

test('rejects RC keyId', () => {
  assert.throws(
    () => prepareStableTrust({ keyId: RC_KEY_ID, publicKeyPem: ed25519PublicPem() }),
    /STABLE-PROVISION-002/
  );
});

test('rejects private-key material', () => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  assert.throws(
    () => prepareStableTrust({ keyId: 'tolue-prod-example-02', publicKeyPem: privatePem }),
    /STABLE-PROVISION-004/
  );
});

test('rejects non-Ed25519 public keys', () => {
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const rsaPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  assert.throws(
    () => prepareStableTrust({ keyId: 'tolue-prod-example-03', publicKeyPem: rsaPem }),
    /STABLE-PROVISION-006/
  );
});

test('rejects missing production keyId and missing public PEM', () => {
  assert.throws(() => prepareStableTrust({ keyId: '   ', publicKeyPem: ed25519PublicPem() }), /STABLE-PROVISION-001/);
  assert.throws(() => prepareStableTrust({ keyId: 'tolue-prod-example-04', publicKeyPem: '' }), /STABLE-PROVISION-003/);
});
