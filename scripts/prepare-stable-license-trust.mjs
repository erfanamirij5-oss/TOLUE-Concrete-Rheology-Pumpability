import { createPublicKey } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { METHOD, RC_KEY_ID, normalizePem, validateStableTrust } from './validate-stable-license-trust.mjs';

export function prepareStableTrust({ keyId, publicKeyPem }) {
  if (typeof keyId !== 'string' || keyId.trim().length === 0) {
    throw new Error('STABLE-PROVISION-001: non-empty production keyId is required');
  }
  const normalizedKeyId = keyId.trim();
  if (normalizedKeyId === RC_KEY_ID) {
    throw new Error('STABLE-PROVISION-002: RC keyId cannot be provisioned as stable production trust');
  }
  if (typeof publicKeyPem !== 'string' || publicKeyPem.trim().length === 0) {
    throw new Error('STABLE-PROVISION-003: production public-key PEM is required');
  }
  if (/BEGIN ([A-Z0-9]+ )*PRIVATE KEY/.test(publicKeyPem)) {
    throw new Error('STABLE-PROVISION-004: private-key material is forbidden');
  }

  const normalizedPem = normalizePem(publicKeyPem);
  let parsed;
  try {
    parsed = createPublicKey(normalizedPem);
  } catch {
    throw new Error('STABLE-PROVISION-005: supplied PEM is not a valid public key');
  }
  if (parsed.asymmetricKeyType !== 'ed25519') {
    throw new Error('STABLE-PROVISION-006: stable production public key must be Ed25519');
  }

  const keyring = {
    method: METHOD,
    activeKeyId: normalizedKeyId,
    keys: [
      {
        keyId: normalizedKeyId,
        status: 'ACTIVE',
        publicKeyPem: normalizedPem
      }
    ]
  };

  validateStableTrust({ keyring, publicKeyPem: normalizedPem });
  return { keyring, publicKeyPem: normalizedPem };
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--key-id') result.keyId = argv[++i];
    else if (token === '--public-key-pem') result.publicKeyPemPath = argv[++i];
    else if (token === '--output-dir') result.outputDir = argv[++i];
    else throw new Error(`STABLE-PROVISION-010: unknown argument ${token}`);
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.keyId || !args.publicKeyPemPath) {
    console.error('Usage: node scripts/prepare-stable-license-trust.mjs --key-id <production-key-id> --public-key-pem <path> [--output-dir release/stable/v1.0.0]');
    process.exit(2);
  }

  const pemPath = resolve(args.publicKeyPemPath);
  const outputDir = resolve(args.outputDir || 'release/stable/v1.0.0');
  const prepared = prepareStableTrust({
    keyId: args.keyId,
    publicKeyPem: readFileSync(pemPath, 'utf8')
  });

  const ringPath = resolve(outputDir, 'tolue-license-public-keyring.json');
  const outPemPath = resolve(outputDir, 'tolue-license-public-key.pem');
  mkdirSync(dirname(ringPath), { recursive: true });
  writeFileSync(ringPath, `${JSON.stringify(prepared.keyring, null, 2)}\n`, 'utf8');
  writeFileSync(outPemPath, prepared.publicKeyPem, 'utf8');

  validateStableTrust({
    keyring: JSON.parse(readFileSync(ringPath, 'utf8')),
    publicKeyPem: readFileSync(outPemPath, 'utf8')
  });

  console.log(`Provisioned stable public trust for ${prepared.keyring.activeKeyId}`);
  console.log(`Keyring: ${ringPath}`);
  console.log(`Public PEM: ${outPemPath}`);
  console.log('No private key was generated, read, or written by this tool.');
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) main();
