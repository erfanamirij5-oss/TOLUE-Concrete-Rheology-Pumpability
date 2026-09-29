import { describe, expect, it } from 'vitest';
import { summarizePublishedVerificationFamily } from './publishedVerificationMetrics';
import type { PublishedVerificationResult } from './publishedFullScaleVerification';

function result(caseId: string, error: number, relative: number | null, converged = true): PublishedVerificationResult {
  return {
    caseId,
    referenceId: 'REF',
    predictedPressureGradientPaPerM: 10000 + error,
    measuredPressureGradientPaPerM: 10000,
    absoluteErrorPaPerM: error,
    relativeErrorFraction: relative,
    solverConverged: converged,
    solverMethod: 'tolue-two-fluid-bingham-coaxial-v1',
    sourceHash: 'sha256:test',
    assumptions: [],
    method: 'tolue-published-full-scale-verification-v1',
  };
}

describe('published verification family metrics', () => {
  it('computes bias, MAE, RMSE and MARE without imposing an acceptance threshold', () => {
    const metrics = summarizePublishedVerificationFamily([
      result('A', 100, 0.01),
      result('B', -300, -0.03),
    ]);

    expect(metrics.caseCount).toBe(2);
    expect(metrics.biasPaPerM).toBe(-100);
    expect(metrics.meanAbsoluteErrorPaPerM).toBe(200);
    expect(metrics.rootMeanSquareErrorPaPerM).toBeCloseTo(Math.sqrt(50000), 12);
    expect(metrics.meanAbsoluteRelativeErrorFraction).toBeCloseTo(0.02, 12);
    expect(metrics.convergedCaseCount).toBe(2);
  });

  it('rejects an empty family', () => {
    expect(() => summarizePublishedVerificationFamily([])).toThrow('TIER-B-METRICS-EMPTY');
  });
});
