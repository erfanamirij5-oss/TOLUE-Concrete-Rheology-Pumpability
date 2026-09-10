import { createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const METHOD = 'tolue-license-public-keyring-v1';
export const RC_KEY_ID = 'tolue-rc-2026-01';
export const ALLOWED_KEY_STATUSES = new Set(['ACTIVE', 'RETIRED']);

export function normalizePem(value) {
  if (typeof value !== 'string') throw new Error('STABLE-TRUST-001: publicKeyPem must be a string');
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
}

function parseEd25519PublicKey(publicKeyPem, codePrefix) {
  let key;
  try {
    key = createPublicKey(normalizePem(publicKeyPem));
  } catch {
    throw new Error(`${codePrefix}: public key is not a valid public key`);
  }
  if (key.asymmetricKeyType !== 'ed25519') throw new Error(`${codePrefix}: key must be Ed25519`);
  return key;
}

export function validateStableTrust({ keyring, publicKeyPem }) {
  if (!keyring || typeof keyring !== 'object' || Array.isArray(keyring)) throw new Error('STABLE-TRUST-002: keyring must be an object');
  if (keyring.method !== METHOD) throw new Error('STABLE-TRUST-003: invalid keyring method');
  if (typeof keyring.activeKeyId !== 'string' || keyring.activeKeyId.length === 0) throw new Error('STABLE-TRUST-004: activeKeyId is required');
  if (keyring.activeKeyId === RC_KEY_ID) throw new Error('STABLE-TRUST-005: RC key cannot be the stable ACTIVE trust root');
  if (!Array.isArray(keyring.keys) || keyring.keys.length === 0) throw new Error('STABLE-TRUST-006: keys must be a non-empty array');

  const seenKeyIds = new Set();
  for (const keyEntry of keyring.keys) {
    if (!keyEntry || typeof keyEntry !== 'object' || Array.isArray(keyEntry)) throw new Error('STABLE-TRUST-013: each key entry must be an object');
    if (typeof keyEntry.keyId !== 'string' || keyEntry.keyId.trim().length === 0) throw new Error('STABLE-TRUST-014: every key must have a non-empty keyId');
    if (seenKeyIds.has(keyEntry.keyId)) throw new Error('STABLE-TRUST-015: keyId values must be unique');
    seenKeyIds.add(keyEntry.keyId);
    if (!ALLOWED_KEY_STATUSES.has(keyEntry.status)) throw new Error('STABLE-TRUST-016: key status must be ACTIVE or RETIRED');
    parseEd25519PublicKey(keyEntry.publicKeyPem, 'STABLE-TRUST-017');
  }

  const active = keyring.keys.filter((key) => key.status === 'ACTIVE');
  if (active.length !== 1) throw new Error('STABLE-TRUST-007: exactly one ACTIVE key is required');
  if (active[0].keyId !== keyring.activeKeyId) throw new Error('STABLE-TRUST-008: activeKeyId must identify the ACTIVE key');
  if (active[0].keyId === RC_KEY_ID) throw new Error('STABLE-TRUST-009: RC key cannot be ACTIVE for stable');

  const key = parseEd25519PublicKey(active[0].publicKeyPem, 'STABLE-TRUST-010');

  if (publicKeyPem !== undefined && normalizePem(publicKeyPem) !== normalizePem(active[0].publicKeyPem)) {
    throw new Error('STABLE-TRUST-012: packaged PEM does not match ACTIVE keyring PEM');
  }

  return {
    method: keyring.method,
    activeKeyId: keyring.activeKeyId,
    asymmetricKeyType: key.asymmetricKeyType,
    trustedKeyIds: keyring.keys.map((entry) => entry.keyId),
    retiredKeyIds: keyring.keys.filter((entry) => entry.status === 'RETIRED').map((entry) => entry.keyId)
  };
}

function main() {
  const keyringPath = process.argv[2];
  const pemPath = process.argv[3];
  if (!keyringPath || !pemPath) {
    console.error('Usage: node scripts/validate-stable-license-trust.mjs <keyring.json> <public-key.pem>');
    process.exit(2);
  }
  const keyring = JSON.parse(readFileSync(resolve(keyringPath), 'utf8'));
  const publicKeyPem = readFileSync(resolve(pemPath), 'utf8');
  const result = validateStableTrust({ keyring, publicKeyPem });
  console.log(`Stable trust valid: ${result.activeKeyId} (${result.asymmetricKeyType}); trusted keys=${result.trustedKeyIds.length}; retired=${result.retiredKeyIds.length}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) main();
