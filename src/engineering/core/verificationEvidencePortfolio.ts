import { evaluatePublishedFullScaleCase, type PublishedFullScaleVerificationCase, type PublishedVerificationResult } from './publishedFullScaleVerification';
import { summarizePublishedVerificationFamily, type PublishedVerificationFamilyMetrics } from './publishedVerificationMetrics';
import { evaluateFieldValidationCase, type FieldValidationEvaluationInput, type FieldValidationEvaluationResult } from './fieldValidationEvaluation';

export type VerificationTier = 'TIER_B_PUBLISHED_FULL_SCALE' | 'TIER_C_TOLUE_FIELD';
export type VerificationAdmissionStatus = 'CANDIDATE' | 'ADMITTED' | 'EXCLUDED';

export interface PublishedVerificationEvidenceEntry {
  readonly tier: 'TIER_B_PUBLISHED_FULL_SCALE';
  readonly admissionStatus: VerificationAdmissionStatus;
  readonly exclusionReason?: string;
  readonly case: Readonly<PublishedFullScaleVerificationCase>;
}

export interface FieldVerificationEvidenceEntry {
  readonly tier: 'TIER_C_TOLUE_FIELD';
  readonly admissionStatus: VerificationAdmissionStatus;
  readonly exclusionReason?: string;
  readonly evaluationInput: Readonly<FieldValidationEvaluationInput>;
}

export type VerificationEvidenceEntry = PublishedVerificationEvidenceEntry | FieldVerificationEvidenceEntry;

export interface VerificationEvidencePortfolioResult {
  readonly admittedTierBResults: readonly Readonly<PublishedVerificationResult>[];
  readonly admittedTierCResults: readonly Readonly<FieldValidationEvaluationResult>[];
  readonly tierBMetrics: Readonly<PublishedVerificationFamilyMetrics> | null;
  readonly candidateCount: number;
  readonly excludedCount: number;
  readonly p0TierBCoveragePresent: boolean;
  readonly p0TierCCoveragePresent: boolean;
  readonly productionValidationComplete: false;
  readonly limitations: readonly string[];
  readonly method: 'tolue-verification-evidence-portfolio-v1';
}

function validateAdmission(status: VerificationAdmissionStatus, exclusionReason: string | undefined): void {
  if (status === 'EXCLUDED') {
    if (!exclusionReason?.trim()) throw new Error('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-001');
  } else if (exclusionReason?.trim()) {
    throw new Error('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-002');
  }
}

/**
 * Evaluates only explicitly ADMITTED verification evidence. CANDIDATE records
 * remain visible in portfolio counts but cannot influence metrics. EXCLUDED
 * records are retained for auditability. This function deliberately does not
 * define universal acceptance tolerances or promote the model to production.
 */
export function evaluateVerificationEvidencePortfolio(
  entries: readonly Readonly<VerificationEvidenceEntry>[],
): Readonly<VerificationEvidencePortfolioResult> {
  const tierB: PublishedVerificationResult[] = [];
  const tierC: FieldValidationEvaluationResult[] = [];
  let candidateCount = 0;
  let excludedCount = 0;

  for (const entry of entries) {
    validateAdmission(entry.admissionStatus, entry.exclusionReason);
    if (entry.admissionStatus === 'CANDIDATE') { candidateCount += 1; continue; }
    if (entry.admissionStatus === 'EXCLUDED') { excludedCount += 1; continue; }

    if (entry.tier === 'TIER_B_PUBLISHED_FULL_SCALE') tierB.push(evaluatePublishedFullScaleCase(entry.case));
    else tierC.push(evaluateFieldValidationCase(entry.evaluationInput));
  }

  return Object.freeze({
    admittedTierBResults: Object.freeze(tierB),
    admittedTierCResults: Object.freeze(tierC),
    tierBMetrics: tierB.length ? summarizePublishedVerificationFamily(tierB) : null,
    candidateCount,
    excludedCount,
    p0TierBCoveragePresent: tierB.length > 0,
    p0TierCCoveragePresent: tierC.length > 0,
    productionValidationComplete: false as const,
    limitations: Object.freeze([
      'Presence of Tier-B or Tier-C evidence does not by itself establish production validation.',
      'No universal error tolerance or automatic model promotion is applied by this portfolio.',
      'Scientific acceptance requires controlled review of uncertainty, applicability domain, model-form error, and evidence representativeness.',
    ]),
    method: 'tolue-verification-evidence-portfolio-v1',
  });
}
