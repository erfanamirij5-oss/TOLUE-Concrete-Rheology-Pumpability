import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { verifySignedLicenseEnvelope } from './licenseEnvelope';
import { evaluateLicense } from './licensePolicy';

export interface LicenseProvisioningInput {
  readonly userDataPath: string;
  readonly publicKeyPath: string;
  readonly machineId: string;
  readonly nowIso: string;
  readonly sourceLicensePath: string;
}

export interface LicenseProvisioningResult {
  readonly status: 'IMPORTED' | 'REJECTED';
  readonly licenseId: string | null;
  readonly validUntilIso: string | null;
  readonly errorCode: string | null;
  readonly method: 'tolue-license-provisioning-v1';
}

const METHOD = 'tolue-license-provisioning-v1' as const;
const LICENSE_FILE_NAME = 'tolue-license.json';

const rejected = (errorCode: string): Readonly<LicenseProvisioningResult> => Object.freeze({
  status: 'REJECTED', licenseId: null, validUntilIso: null, errorCode, method: METHOD,
});

export function provisionSignedLicense(input: Readonly<LicenseProvisioningInput>): Readonly<LicenseProvisioningResult> {
  if (!isAbsolute(input.userDataPath) || !isAbsolute(input.publicKeyPath) || !isAbsolute(input.sourceLicensePath)) {
    return rejected('LICENSE-PROVISION-PATH-001');
  }
  if (!input.machineId.trim() || !input.nowIso.trim()) return rejected('LICENSE-PROVISION-INPUT-001');

  let raw = '';
  let publicKeyPem = '';
  let envelope: unknown;
  try {
    raw = readFileSync(input.sourceLicensePath, 'utf8');
    envelope = JSON.parse(raw) as unknown;
    publicKeyPem = readFileSync(input.publicKeyPath, 'utf8');
  } catch {
    return rejected('LICENSE-PROVISION-READ-001');
  }

  const verified = verifySignedLicenseEnvelope(envelope, publicKeyPem);
  if (!verified) return rejected('LICENSE-PROVISION-SIGNATURE-001');
  const evaluation = evaluateLicense({ entitlement: verified, machineId: input.machineId, nowIso: input.nowIso });
  if (!evaluation.canUseApplication || evaluation.status !== 'ACTIVE') {
    return rejected(`LICENSE-PROVISION-POLICY-${evaluation.status}`);
  }

  const destination = join(input.userDataPath, LICENSE_FILE_NAME);
  const temporary = `${destination}.tmp`;
  try {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(temporary, raw, { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, destination);
  } catch {
    try { rmSync(temporary, { force: true }); } catch { /* best effort cleanup */ }
    return rejected('LICENSE-PROVISION-WRITE-001');
  }

  return Object.freeze({
    status: 'IMPORTED',
    licenseId: verified.licenseId,
    validUntilIso: verified.validUntilIso,
    errorCode: null,
    method: METHOD,
  });
}
