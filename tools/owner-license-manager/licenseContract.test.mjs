import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { issueLicense, verifyLicenseEnvelope } = require('./licenseContract.cjs');

function keys() {
  const pair = generateKeyPairSync('ed25519');
  const publicPem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString().replace(/\r\n/g, '\n').trim() + '\n';
  return {
    ...pair,
    privatePem: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    fingerprint: createHash('sha256').update(publicPem).digest('hex'),
  };
}

const input = Object.freeze({
  licenseId: 'RHEO-2026-0001',
  machineCode: 'c'.repeat(64),
  validFromIso: '2026-09-10T00:00:00.000Z',
  validUntilIso: '2027-09-10T00:00:00.000Z',
});

test('produces the exact strict tolue-license-v1 envelope accepted by the Rheology runtime', () => {
  const key = keys();
  const issued = issueLicense(input, key.privatePem, key.fingerprint);
  assert.deepEqual(Object.keys(issued.envelope), ['schemaVersion', 'entitlement', 'signatureBase64']);
  assert.deepEqual(Object.keys(issued.envelope.entitlement), ['licenseId', 'productId', 'machineId', 'validFromIso', 'validUntilIso']);
  assert.equal(issued.envelope.entitlement.productId, 'tolue-concrete-rheology-pumpability');
  assert.equal(verifyLicenseEnvelope(issued.envelope, key.publicKey), true);
});

test('stays aligned with the checked-in customer runtime contract', () => {
  const runtime = readFileSync(new URL('../../src/desktop/main/licensing/licenseEnvelope.ts', import.meta.url), 'utf8');
  assert.match(runtime, /productId: 'tolue-concrete-rheology-pumpability'/);
  assert.match(runtime, /schemaVersion: 'tolue-license-v1'/);
  const fields = ['licenseId', 'productId', 'machineId', 'validFromIso', 'validUntilIso'];
  const canonicalBlock = runtime.slice(runtime.indexOf('export function canonicalLicensePayload'), runtime.indexOf('export function verifySignedLicenseEnvelope'));
  for (let index = 1; index < fields.length; index += 1) {
    assert.ok(canonicalBlock.indexOf(fields[index - 1]) < canonicalBlock.indexOf(fields[index]), `runtime canonical field order changed at ${fields[index]}`);
  }
});

test('rejects tampering, wrong production key, invalid machine code and invalid validity range', () => {
  const key = keys();
  const issued = issueLicense(input, key.privatePem, key.fingerprint);
  assert.equal(verifyLicenseEnvelope({ ...issued.envelope, entitlement: { ...issued.envelope.entitlement, machineId: 'd'.repeat(64) } }, key.publicKey), false);
  assert.throws(() => issueLicense(input, key.privatePem, '0'.repeat(64)), /LM-KEY-004/);
  assert.throws(() => issueLicense({ ...input, machineCode: 'bad' }, key.privatePem, key.fingerprint), /LM-MACHINE-001/);
  assert.throws(() => issueLicense({ ...input, validUntilIso: input.validFromIso }, key.privatePem, key.fingerprint), /LM-TIME-003/);
});
