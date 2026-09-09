import { generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalLicensePayload, type LicenseEntitlementPayload } from './licenseEnvelope';
import { provisionSignedLicense } from './licenseProvisioning';

function fixture(machineId = 'machine-001') {
  const root = mkdtempSync(join(tmpdir(), 'tolue-license-provision-'));
  const userDataPath = join(root, 'userData');
  const resources = join(root, 'resources', 'license');
  mkdirSync(resources, { recursive: true });
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPath = join(resources, 'tolue-license-public-key.pem');
  writeFileSync(publicKeyPath, publicKey.export({ format: 'pem', type: 'spki' }).toString(), 'utf8');
  const entitlement: LicenseEntitlementPayload = {
    licenseId: 'license-001', productId: 'tolue-concrete-rheology-pumpability', machineId,
    validFromIso: '2026-01-01T00:00:00.000Z', validUntilIso: '2027-01-01T00:00:00.000Z',
  };
  const signatureBase64 = sign(null, Buffer.from(canonicalLicensePayload(entitlement), 'utf8'), privateKey).toString('base64');
  const sourceLicensePath = join(root, 'incoming.json');
  const raw = JSON.stringify({ schemaVersion: 'tolue-license-v1', entitlement, signatureBase64 });
  writeFileSync(sourceLicensePath, raw, 'utf8');
  return { root, userDataPath, publicKeyPath, sourceLicensePath, machineId, raw };
}

describe('license provisioning', () => {
  it('persists an active cryptographically verified machine-bound envelope atomically', () => {
    const f = fixture();
    const result = provisionSignedLicense({ ...f, nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.status).toBe('IMPORTED');
    expect(result.licenseId).toBe('license-001');
    expect(readFileSync(join(f.userDataPath, 'tolue-license.json'), 'utf8')).toBe(f.raw);
    expect(existsSync(join(f.userDataPath, 'tolue-license.json.tmp'))).toBe(false);
  });

  it('does not persist a tampered envelope', () => {
    const f = fixture();
    const parsed = JSON.parse(f.raw);
    parsed.entitlement.validUntilIso = '2035-01-01T00:00:00.000Z';
    writeFileSync(f.sourceLicensePath, JSON.stringify(parsed), 'utf8');
    const result = provisionSignedLicense({ ...f, nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.status).toBe('REJECTED');
    expect(result.errorCode).toBe('LICENSE-PROVISION-SIGNATURE-001');
    expect(existsSync(join(f.userDataPath, 'tolue-license.json'))).toBe(false);
  });

  it('rejects a valid signature bound to another machine without persistence', () => {
    const f = fixture('other-machine');
    const result = provisionSignedLicense({ ...f, machineId: 'this-machine', nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.status).toBe('REJECTED');
    expect(result.errorCode).toBe('LICENSE-PROVISION-POLICY-MACHINE_MISMATCH');
    expect(existsSync(join(f.userDataPath, 'tolue-license.json'))).toBe(false);
  });
});
