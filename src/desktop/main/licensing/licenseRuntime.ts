import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { evaluateLicenseClockGuard, type LicenseClockGuardResult } from './licenseClockGuard';
import { parseLicensePublicKeyring, resolveLicensePublicKey } from './licenseKeyring';
import { deriveMachineId, type MachineGuidReader, windowsRegistryMachineGuidReader } from './machineIdentity';
import { recoverProvisionedLicenseState } from './licenseProvisioning';
import { evaluateLicenseStartupGate, type LicenseStartupGateResult } from './licenseStartupGate';
import { resolveEffectiveLicenseTime, verifyTrustedTimeAnchor, type VerifiedTrustedTime } from './licenseTrustedTime';

export interface LicenseRuntimeInput {
  readonly userDataPath: string;
  readonly resourcesPath: string;
  readonly nowIso: string;
  readonly machineGuidReader?: Readonly<MachineGuidReader>;
}

export interface LicenseRuntimeResult {
  readonly licenseFilePath: string;
  readonly publicKeyPath: string;
  readonly publicKeyringPath: string;
  readonly trustedTimePath: string;
  readonly resolvedKeyId: string | null;
  readonly machineId: string;
  readonly localNowIso: string;
  readonly effectiveNowIso: string;
  readonly trustedTime: Readonly<VerifiedTrustedTime> | null;
  readonly clock: Readonly<LicenseClockGuardResult>;
  readonly gate: Readonly<LicenseStartupGateResult>;
  readonly method: 'tolue-license-runtime-v4';
}

const LICENSE_FILE_NAME = 'tolue-license.json';
const TRUSTED_TIME_FILE_NAME = 'tolue-trusted-time.json';
const PUBLIC_KEY_RESOURCE = 'license/tolue-license-public-key.pem';
const PUBLIC_KEYRING_RESOURCE = 'license/tolue-license-public-keyring.json';
const LEGACY_V1_KEY_ID = 'legacy-v1';
const METHOD = 'tolue-license-runtime-v4' as const;

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
  if (!input.nowIso.trim() || !Number.isFinite(Date.parse(input.nowIso))) throw new Error('LICENSE-RUNTIME-TIME-001');

  try { recoverProvisionedLicenseState(userDataPath); } catch { /* fail closed below if persisted state is unreadable */ }

  const licenseFilePath = join(userDataPath, LICENSE_FILE_NAME);
  const trustedTimePath = join(userDataPath, TRUSTED_TIME_FILE_NAME);
  const publicKeyPath = join(resourcesPath, PUBLIC_KEY_RESOURCE);
  const publicKeyringPath = join(resourcesPath, PUBLIC_KEYRING_RESOURCE);
  let signedEnvelope: unknown;
  let publicKeyPem = '';
  let resolvedKeyId: string | null = null;
  let keyring: ReturnType<typeof parseLicensePublicKeyring> = null;
  try {
    signedEnvelope = JSON.parse(readFileSync(licenseFilePath, 'utf8')) as unknown;
  } catch {
    signedEnvelope = null;
  }

  try {
    keyring = parseLicensePublicKeyring(JSON.parse(readFileSync(publicKeyringPath, 'utf8')) as unknown);
    if (keyring) {
      publicKeyPem = resolveLicensePublicKey(keyring, LEGACY_V1_KEY_ID) ?? '';
      resolvedKeyId = publicKeyPem ? LEGACY_V1_KEY_ID : null;
    }
  } catch {
    publicKeyPem = '';
    keyring = null;
  }

  if (!publicKeyPem) {
    try {
      publicKeyPem = readFileSync(publicKeyPath, 'utf8');
      resolvedKeyId = publicKeyPem.trim() ? LEGACY_V1_KEY_ID : null;
    } catch {
      publicKeyPem = '';
      resolvedKeyId = null;
    }
  }

  let trustedTime: Readonly<VerifiedTrustedTime> | null = null;
  try {
    const rawAnchor = JSON.parse(readFileSync(trustedTimePath, 'utf8')) as unknown;
    trustedTime = verifyTrustedTimeAnchor(rawAnchor, keyId => {
      if (keyring) return resolveLicensePublicKey(keyring, keyId);
      return keyId === LEGACY_V1_KEY_ID && publicKeyPem.trim() ? publicKeyPem : null;
    });
  } catch {
    trustedTime = null;
  }
  const effectiveNowIso = resolveEffectiveLicenseTime(input.nowIso, trustedTime);

  const reader = input.machineGuidReader ?? windowsRegistryMachineGuidReader;
  const machineId = deriveMachineId(reader);
  const clock = evaluateLicenseClockGuard(userDataPath, effectiveNowIso);
  const gate = clock.accepted && publicKeyPem.trim()
    ? evaluateLicenseStartupGate({ signedEnvelope, publicKeyPem, machineId, nowIso: effectiveNowIso })
    : rejectedGate();

  return Object.freeze({
    licenseFilePath,
    publicKeyPath,
    publicKeyringPath,
    trustedTimePath,
    resolvedKeyId,
    machineId,
    localNowIso: input.nowIso,
    effectiveNowIso,
    trustedTime,
    clock,
    gate,
    method: METHOD,
  });
}
