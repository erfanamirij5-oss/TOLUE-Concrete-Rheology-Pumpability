import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { evaluateLicenseClockGuard, type LicenseClockGuardResult } from './licenseClockGuard';
import { deriveMachineId, type MachineGuidReader, windowsRegistryMachineGuidReader } from './machineIdentity';
import { recoverProvisionedLicenseState } from './licenseProvisioning';
import { evaluateLicenseStartupGate, type LicenseStartupGateResult } from './licenseStartupGate';

export interface LicenseRuntimeInput {
  readonly userDataPath: string;
  readonly resourcesPath: string;
  readonly nowIso: string;
  readonly machineGuidReader?: Readonly<MachineGuidReader>;
}

export interface LicenseRuntimeResult {
  readonly licenseFilePath: string;
  readonly publicKeyPath: string;
  readonly machineId: string;
  readonly clock: Readonly<LicenseClockGuardResult>;
  readonly gate: Readonly<LicenseStartupGateResult>;
  readonly method: 'tolue-license-runtime-v3';
}

const LICENSE_FILE_NAME = 'tolue-license.json';
const PUBLIC_KEY_RESOURCE = 'license/tolue-license-public-key.pem';
const METHOD = 'tolue-license-runtime-v3' as const;

function requireAbsolute(path: string, code: string): string {
  if (!path.trim() || !isAbsolute(path)) throw new Error(code);
  return path;
}

const rejectedGate = (): Readonly<LicenseStartupGateResult> => Object.freeze({
  canStartApplication: false,
  evaluation: Object.freeze({ status: 'INVALID' as const, canUseApplication: false, licenseId: null, method: 'tolue-commercial-license-policy-v1' as const }),
  verificationStatus: 'INVALID_SIGNATURE_OR_ENVELOPE' as const,
  method: 'tolue-license-startup-gate-v1' as const,
});

export function evaluatePackagedLicenseRuntime(input: Readonly<LicenseRuntimeInput>): Readonly<LicenseRuntimeResult> {
  const userDataPath = requireAbsolute(input.userDataPath, 'LICENSE-RUNTIME-USERDATA-001');
  const resourcesPath = requireAbsolute(input.resourcesPath, 'LICENSE-RUNTIME-RESOURCES-001');
  if (!input.nowIso.trim()) throw new Error('LICENSE-RUNTIME-TIME-001');

  try { recoverProvisionedLicenseState(userDataPath); } catch { /* fail closed below if persisted state is unreadable */ }

  const licenseFilePath = join(userDataPath, LICENSE_FILE_NAME);
  const publicKeyPath = join(resourcesPath, PUBLIC_KEY_RESOURCE);
  let signedEnvelope: unknown;
  let publicKeyPem = '';
  try {
    signedEnvelope = JSON.parse(readFileSync(licenseFilePath, 'utf8')) as unknown;
  } catch {
    signedEnvelope = null;
  }
  try {
    publicKeyPem = readFileSync(publicKeyPath, 'utf8');
  } catch {
    publicKeyPem = '';
  }

  const reader = input.machineGuidReader ?? windowsRegistryMachineGuidReader;
  const machineId = deriveMachineId(reader);
  const clock = evaluateLicenseClockGuard(userDataPath, input.nowIso);
  const gate = clock.accepted && publicKeyPem.trim()
    ? evaluateLicenseStartupGate({ signedEnvelope, publicKeyPem, machineId, nowIso: input.nowIso })
    : rejectedGate();

  return Object.freeze({ licenseFilePath, publicKeyPath, machineId, clock, gate, method: METHOD });
}
