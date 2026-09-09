import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalLicensePayload, type LicenseEntitlementPayload } from './licenseEnvelope';
import { deriveMachineId } from './machineIdentity';
import { evaluatePackagedLicenseRuntime } from './licenseRuntime';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tolue-license-runtime-'));
  const userDataPath = join(root, 'userData');
  const resourcesPath = join(root, 'resources');
  mkdirSync(userDataPath, { recursive: true });
  mkdirSync(join(resourcesPath, 'license'), { recursive: true });
  const machineGuidReader = { readWindowsMachineGuid: () => 'CI-MACHINE-GUID-001' } as const;
  const machineId = deriveMachineId(machineGuidReader);
  const entitlement: LicenseEntitlementPayload = Object.freeze({
    licenseId: 'license-ci-001',
    productId: 'tolue-concrete-rheology-pumpability',
    machineId,
    validFromIso: '2026-01-01T00:00:00.000Z',
    validUntilIso: '2027-01-01T00:00:00.000Z',
  });
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const signatureBase64 = sign(null, Buffer.from(canonicalLicensePayload(entitlement), 'utf8'), privateKey).toString('base64');
  writeFileSync(join(resourcesPath, 'license', 'tolue-license-public-key.pem'), publicKey.export({ format: 'pem', type: 'spki' }).toString(), 'utf8');
  writeFileSync(join(userDataPath, 'tolue-license.json'), JSON.stringify({ schemaVersion: 'tolue-license-v1', entitlement, signatureBase64 }), 'utf8');
  return { userDataPath, resourcesPath, machineGuidReader, machineId };
}

describe('packaged license runtime', () => {
  it('loads bundled public key + userData license and permits only the bound machine', () => {
    const f = fixture();
    const result = evaluatePackagedLicenseRuntime({ ...f, nowIso: '2026-09-09T00:00:00.000Z' });
    expect(result.machineId).toBe(f.machineId);
    expect(result.gate.canStartApplication).toBe(true);
    expect(result.gate.evaluation.status).toBe('ACTIVE');
    expect(result.publicKeyPath.endsWith('license/tolue-license-public-key.pem') || result.publicKeyPath.endsWith('license\\tolue-license-public-key.pem')).toBe(true);
  });

  it('fails closed when license file or public key is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-runtime-empty-'));
    const userDataPath = join(root, 'userData');
    const resourcesPath = join(root, 'resources');
    mkdirSync(userDataPath, { recursive: true });
    mkdirSync(resourcesPath, { recursive: true });
    const result = evaluatePackagedLicenseRuntime({
      userDataPath,
      resourcesPath,
      nowIso: '2026-09-09T00:00:00.000Z',
      machineGuidReader: { readWindowsMachineGuid: () => 'CI-MACHINE-GUID-001' },
    });
    expect(result.gate.canStartApplication).toBe(false);
    expect(result.gate.evaluation.status).toBe('INVALID');
  });

  it('rejects non-absolute runtime paths', () => {
    expect(() => evaluatePackagedLicenseRuntime({
      userDataPath: 'relative',
      resourcesPath: '/absolute',
      nowIso: '2026-09-09T00:00:00.000Z',
      machineGuidReader: { readWindowsMachineGuid: () => 'x' },
    })).toThrow('LICENSE-RUNTIME-USERDATA-001');
  });
});
