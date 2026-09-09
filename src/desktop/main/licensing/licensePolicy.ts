export type LicenseStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'MACHINE_MISMATCH'
  | 'NOT_YET_VALID'
  | 'MISSING'
  | 'INVALID';

export interface VerifiedLicenseEntitlement {
  readonly licenseId: string;
  readonly productId: 'tolue-concrete-rheology-pumpability';
  readonly machineId: string;
  readonly validFromIso: string;
  readonly validUntilIso: string;
  readonly verification: 'VERIFIED';
}

export interface LicenseEvaluationInput {
  readonly entitlement: Readonly<VerifiedLicenseEntitlement> | null;
  readonly machineId: string;
  readonly nowIso: string;
}

export interface LicenseEvaluation {
  readonly status: LicenseStatus;
  readonly canUseApplication: boolean;
  readonly licenseId: string | null;
  readonly method: 'tolue-commercial-license-policy-v1';
}

const METHOD = 'tolue-commercial-license-policy-v1' as const;

const reject = (status: Exclude<LicenseStatus, 'ACTIVE'>, licenseId: string | null): Readonly<LicenseEvaluation> =>
  Object.freeze({ status, canUseApplication: false, licenseId, method: METHOD });

const parseIso = (value: string): number => {
  const parsed = Date.parse(value);
  if (!value.trim() || !Number.isFinite(parsed)) throw new Error('LICENSE-TIME-001');
  return parsed;
};

export function evaluateLicense(input: Readonly<LicenseEvaluationInput>): Readonly<LicenseEvaluation> {
  if (!input.machineId.trim()) throw new Error('LICENSE-MACHINE-001');
  const now = parseIso(input.nowIso);
  const entitlement = input.entitlement;
  if (!entitlement) return reject('MISSING', null);
  if (entitlement.verification !== 'VERIFIED') return reject('INVALID', entitlement.licenseId);
  if (!entitlement.licenseId.trim() || entitlement.productId !== 'tolue-concrete-rheology-pumpability') {
    return reject('INVALID', entitlement.licenseId || null);
  }
  if (!entitlement.machineId.trim()) return reject('INVALID', entitlement.licenseId);
  const validFrom = parseIso(entitlement.validFromIso);
  const validUntil = parseIso(entitlement.validUntilIso);
  if (validUntil <= validFrom) return reject('INVALID', entitlement.licenseId);
  if (entitlement.machineId !== input.machineId) return reject('MACHINE_MISMATCH', entitlement.licenseId);
  if (now < validFrom) return reject('NOT_YET_VALID', entitlement.licenseId);
  if (now > validUntil) return reject('EXPIRED', entitlement.licenseId);
  return Object.freeze({ status: 'ACTIVE', canUseApplication: true, licenseId: entitlement.licenseId, method: METHOD });
}
