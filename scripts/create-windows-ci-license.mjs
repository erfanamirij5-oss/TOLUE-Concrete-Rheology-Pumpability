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
const entitlement = {
  licenseId: 'github-actions-windows-package',
  productId: 'tolue-concrete-rheology-pumpability',
  machineId,
  validFromIso: '2026-01-01T00:00:00.000Z',
  validUntilIso: '2030-01-01T00:00:00.000Z',
};
const canonical = JSON.stringify(entitlement);
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const signatureBase64 = sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64');
const resourceDir = join(process.cwd(), 'build', 'license');
const userDataDir = join(process.env.APPDATA ?? '', 'TOLUE-Concrete-Rheology-Pumpability');
if (!process.env.APPDATA) throw new Error('CI-LICENSE-APPDATA-001');
mkdirSync(resourceDir, { recursive: true });
mkdirSync(userDataDir, { recursive: true });
writeFileSync(join(resourceDir, 'tolue-license-public-key.pem'), publicKey.export({ format: 'pem', type: 'spki' }).toString(), 'utf8');
writeFileSync(join(userDataDir, 'tolue-license.json'), JSON.stringify({ schemaVersion: 'tolue-license-v1', entitlement, signatureBase64 }), 'utf8');
console.log(`Prepared ephemeral CI license for machine ${machineId.slice(0, 12)}…`);
