import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.platform !== 'win32') throw new Error('CI-LICENSE-WINDOWS-001');
const output = execFileSync('reg.exe', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding: 'utf8' });
const match = output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
const guid = match?.[1]?.trim() ?? '';
if (!guid) throw new Error('CI-LICENSE-MACHINE-001');
const machineId = createHash('sha256').update(`tolue-concrete-rheology-pumpability\n${guid}`, 'utf8').digest('hex');
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const resourceDir = join(process.cwd(), 'build', 'license');
if (!process.env.APPDATA) throw new Error('CI-LICENSE-APPDATA-001');
const userDataDir = join(process.env.APPDATA, 'TOLUE Concrete Rheology & Pumpability', 'TOLUE-Concrete-Rheology-Pumpability');
const fixtureDir = join(userDataDir, '.ci-license-fixtures');
mkdirSync(resourceDir, { recursive: true });
mkdirSync(userDataDir, { recursive: true });
mkdirSync(fixtureDir, { recursive: true });
writeFileSync(join(resourceDir, 'tolue-license-public-key.pem'), publicKey.export({ format: 'pem', type: 'spki' }).toString(), 'utf8');

function envelope(name, entitlement) {
  const signatureBase64 = sign(null, Buffer.from(JSON.stringify(entitlement), 'utf8'), privateKey).toString('base64');
  const raw = JSON.stringify({ schemaVersion: 'tolue-license-v1', entitlement, signatureBase64 });
  writeFileSync(join(fixtureDir, `${name}.json`), raw, 'utf8');
  return raw;
}

const valid = envelope('valid', {
  licenseId: 'github-actions-windows-package',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId,
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2030-01-01T00:00:00.000Z',
});
envelope('expired', {
  licenseId: 'github-actions-expired',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId,
  validFromIso: '2025-01-01T00:00:00.000Z',
  validUntilIso: '2026-01-01T00:00:00.000Z',
});
envelope('wrong-machine', {
  licenseId: 'github-actions-wrong-machine',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId: createHash('sha256').update('definitely-not-this-machine', 'utf8').digest('hex'),
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2030-01-01T00:00:00.000Z',
});
writeFileSync(join(userDataDir, 'tolue-license.json'), valid, 'utf8');
console.log(`Prepared ephemeral CI license and acceptance fixtures for machine ${machineId.slice(0, 12)}… at ${userDataDir}`);
