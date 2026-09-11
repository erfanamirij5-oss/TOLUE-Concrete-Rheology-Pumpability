import { evaluatePublishedFullScaleCase, validatePublishedFullScaleCase, type PublishedFullScaleVerificationCase, type PublishedVerificationResult } from './publishedFullScaleVerification';
import { summarizePublishedVerificationFamily, type PublishedVerificationFamilyMetrics } from './publishedVerificationMetrics';
import { evaluateFieldValidationCase, type FieldValidationEvaluationInput, type FieldValidationEvaluationResult } from './fieldValidationEvaluation';
import { validateFieldValidationCase } from './fieldValidationDataset';

export type VerificationTier = 'TIER_B_PUBLISHED_FULL_SCALE' | 'TIER_C_TOLUE_FIELD';
export type VerificationAdmissionStatus = 'CANDIDATE' | 'ADMITTED' | 'EXCLUDED';

export interface VerificationAdmissionReview {
  readonly reviewerId: string;
  readonly reviewedAtIso: string;
  readonly decisionBasis: string;
  readonly sourceArtifactHash: string;
}

interface VerificationAdmissionMetadata {
  readonly admissionStatus: VerificationAdmissionStatus;
  readonly admissionReview?: Readonly<VerificationAdmissionReview>;
  readonly exclusionReason?: string;
}

export interface PublishedVerificationEvidenceEntry extends VerificationAdmissionMetadata {
  readonly tier: 'TIER_B_PUBLISHED_FULL_SCALE';
  readonly case: Readonly<PublishedFullScaleVerificationCase>;
}

export interface FieldVerificationEvidenceEntry extends VerificationAdmissionMetadata {
  readonly tier: 'TIER_C_TOLUE_FIELD';
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
  readonly method: 'tolue-verification-evidence-portfolio-v2';
}

function nonEmpty(value: string | undefined): boolean { return value !== undefined && value.trim().length > 0; }

function expectedSourceHash(entry: Readonly<VerificationEvidenceEntry>): string {
  return entry.tier === 'TIER_B_PUBLISHED_FULL_SCALE'
    ? entry.case.source.sourceHash
    : entry.evaluationInput.fieldCase.source.sourceHash;
}

function validateReview(review: Readonly<VerificationAdmissionReview> | undefined, expectedHash: string): void {
  if (!review) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-REQUIRED-001');
  if (!nonEmpty(review.reviewerId)) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-REVIEWER-001');
  if (!Number.isFinite(Date.parse(review.reviewedAtIso))) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-TIME-001');
  if (!nonEmpty(review.decisionBasis)) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-BASIS-001');
  if (!nonEmpty(review.sourceArtifactHash)) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-HASH-001');
  if (review.sourceArtifactHash !== expectedHash) throw new Error('VERIFICATION-PORTFOLIO-REVIEW-HASH-MISMATCH-001');
}

function validateAdmission(entry: Readonly<VerificationEvidenceEntry>): void {
  if (entry.admissionStatus === 'CANDIDATE') {
    if (entry.exclusionReason?.trim()) throw new Error('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-002');
    if (entry.admissionReview) throw new Error('VERIFICATION-PORTFOLIO-CANDIDATE-REVIEW-001');
    return;
  }

  validateReview(entry.admissionReview, expectedSourceHash(entry));

  if (entry.admissionStatus === 'EXCLUDED') {
    if (!entry.exclusionReason?.trim()) throw new Error('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-001');
    return;
  }
  if (entry.exclusionReason?.trim()) throw new Error('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-002');
}

function validateAdmittedEvidence(entry: Readonly<VerificationEvidenceEntry>): void {
  if (entry.tier === 'TIER_B_PUBLISHED_FULL_SCALE') validatePublishedFullScaleCase(entry.case);
  else {
    validateFieldValidationCase(entry.evaluationInput.fieldCase);
    evaluateFieldValidationCase(entry.evaluationInput);
  }
}

export function admitVerificationEvidence(
  entry: Readonly<VerificationEvidenceEntry>,
  review: Readonly<VerificationAdmissionReview>,
): Readonly<VerificationEvidenceEntry> {
  if (entry.admissionStatus !== 'CANDIDATE') throw new Error('VERIFICATION-PORTFOLIO-ADMIT-NONCANDIDATE-001');
  const admitted = Object.freeze({ ...entry, admissionStatus: 'ADMITTED' as const, admissionReview: Object.freeze({ ...review }) });
  validateAdmission(admitted);
  validateAdmittedEvidence(admitted);
  return admitted;
}

export function excludeVerificationEvidence(
  entry: Readonly<VerificationEvidenceEntry>,
  exclusionReason: string,
  review: Readonly<VerificationAdmissionReview>,
): Readonly<VerificationEvidenceEntry> {
  if (entry.admissionStatus !== 'CANDIDATE') throw new Error('VERIFICATION-PORTFOLIO-EXCLUDE-NONCANDIDATE-001');
  const excluded = Object.freeze({ ...entry, admissionStatus: 'EXCLUDED' as const, exclusionReason, admissionReview: Object.freeze({ ...review }) });
  validateAdmission(excluded);
  return excluded;
}

/**
 * Evaluates only explicitly ADMITTED verification evidence. CANDIDATE records
 * remain visible in portfolio counts but cannot influence metrics. ADMITTED and
 * EXCLUDED records require an auditable review bound to the exact source hash.
 * No universal acceptance tolerance or automatic production promotion occurs.
 */
export function evaluateVerificationEvidencePortfolio(
  entries: readonly Readonly<VerificationEvidenceEntry>[],
): Readonly<VerificationEvidencePortfolioResult> {
  const tierB: PublishedVerificationResult[] = [];
  const tierC: FieldValidationEvaluationResult[] = [];
  let candidateCount = 0;
  let excludedCount = 0;

  for (const entry of entries) {
    validateAdmission(entry);
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
      'Admission is bound to an explicit reviewer decision and the exact controlled source artifact hash.',
      'No universal error tolerance or automatic model promotion is applied by this portfolio.',
      'Scientific acceptance requires controlled review of uncertainty, applicability domain, model-form error, and evidence representativeness.',
    ]),
    method: 'tolue-verification-evidence-portfolio-v2',
  });
}
