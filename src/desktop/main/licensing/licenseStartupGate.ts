import { verifySignedLicenseEnvelope } from './licenseEnvelope';
import { evaluateLicense, type LicenseEvaluation } from './licensePolicy';

export interface LicenseStartupGateInput {
  readonly signedEnvelope: unknown;
  readonly publicKeyPem: string;
  readonly machineId: string;
  readonly nowIso: string;
}

export interface LicenseStartupGateResult {
  readonly canStartApplication: boolean;
  readonly evaluation: Readonly<LicenseEvaluation>;
  readonly verificationStatus: 'VERIFIED' | 'INVALID_SIGNATURE_OR_ENVELOPE';
  readonly method: 'tolue-license-startup-gate-v1';
}

const METHOD = 'tolue-license-startup-gate-v1' as const;

export function evaluateLicenseStartupGate(input: Readonly<LicenseStartupGateInput>): Readonly<LicenseStartupGateResult> {
  if (!input.machineId.trim()) throw new Error('LICENSE-STARTUP-MACHINE-001');
  if (!input.publicKeyPem.trim()) throw new Error('LICENSE-STARTUP-PUBLIC-KEY-001');
  if (!input.nowIso.trim()) throw new Error('LICENSE-STARTUP-TIME-001');

  const entitlement = verifySignedLicenseEnvelope(input.signedEnvelope, input.publicKeyPem);
  if (!entitlement) {
    const evaluation = evaluateLicense({ entitlement: null, machineId: input.machineId, nowIso: input.nowIso });
    return Object.freeze({
      canStartApplication: false,
      evaluation,
      verificationStatus: 'INVALID_SIGNATURE_OR_ENVELOPE',
      method: METHOD,
    });
  }

  const evaluation = evaluateLicense({ entitlement, machineId: input.machineId, nowIso: input.nowIso });
  return Object.freeze({
    canStartApplication: evaluation.canUseApplication,
    evaluation,
    verificationStatus: 'VERIFIED',
    method: METHOD,
  });
}
