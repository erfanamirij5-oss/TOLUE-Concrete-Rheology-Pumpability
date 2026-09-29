import type { PublishedVerificationResult } from './publishedFullScaleVerification';

export interface PublishedVerificationFamilyMetrics {
  readonly caseCount: number;
  readonly biasPaPerM: number;
  readonly meanAbsoluteErrorPaPerM: number;
  readonly rootMeanSquareErrorPaPerM: number;
  readonly meanAbsoluteRelativeErrorFraction: number | null;
  readonly convergedCaseCount: number;
  readonly method: 'tolue-published-verification-family-metrics-v1';
}

export function summarizePublishedVerificationFamily(
  results: readonly Readonly<PublishedVerificationResult>[],
): Readonly<PublishedVerificationFamilyMetrics> {
  if (results.length === 0) throw new Error('TIER-B-METRICS-EMPTY');

  let signedErrorSum = 0;
  let absoluteErrorSum = 0;
  let squaredErrorSum = 0;
  let relativeAbsoluteErrorSum = 0;
  let relativeCount = 0;
  let convergedCaseCount = 0;

  for (const result of results) {
    if (!Number.isFinite(result.absoluteErrorPaPerM)) throw new Error(`TIER-B-METRICS-NONFINITE:${result.caseId}:absoluteErrorPaPerM`);
    signedErrorSum += result.absoluteErrorPaPerM;
    absoluteErrorSum += Math.abs(result.absoluteErrorPaPerM);
    squaredErrorSum += result.absoluteErrorPaPerM ** 2;
    if (result.relativeErrorFraction !== null) {
      if (!Number.isFinite(result.relativeErrorFraction)) throw new Error(`TIER-B-METRICS-NONFINITE:${result.caseId}:relativeErrorFraction`);
      relativeAbsoluteErrorSum += Math.abs(result.relativeErrorFraction);
      relativeCount += 1;
    }
    if (result.solverConverged) convergedCaseCount += 1;
  }

  return Object.freeze({
    caseCount: results.length,
    biasPaPerM: signedErrorSum / results.length,
    meanAbsoluteErrorPaPerM: absoluteErrorSum / results.length,
    rootMeanSquareErrorPaPerM: Math.sqrt(squaredErrorSum / results.length),
    meanAbsoluteRelativeErrorFraction: relativeCount === 0 ? null : relativeAbsoluteErrorSum / relativeCount,
    convergedCaseCount,
    method: 'tolue-published-verification-family-metrics-v1',
  });
}
