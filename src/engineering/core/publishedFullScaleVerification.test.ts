import { describe, expect, it } from 'vitest';
import {
  evaluatePublishedFullScaleCase,
  validatePublishedFullScaleCase,
  type PublishedFullScaleVerificationCase,
} from './publishedFullScaleVerification';

function infrastructureFixture(): PublishedFullScaleVerificationCase {
  return {
    caseId: 'INFRA-ONLY-NOT-TIER-B-EVIDENCE',
    source: {
      referenceId: 'INFRA-REFERENCE',
      title: 'Infrastructure verification fixture only',
      authors: ['TOLUE QA'],
      publicationYear: 2026,
      doi: '10.0000/infrastructure-only',
      sourceVersion: 'test-fixture-v1',
      sourceHash: 'sha256:test-fixture-not-literature-evidence',
      peerReviewed: true,
      fullScalePumping: true,
    },
    targetFlowRateM3s: 0.001,
    pipeRadiusM: 0.05,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 40, plasticViscosityPaS: 18 },
    lubricationLayer: { yieldStressPa: 4, plasticViscosityPaS: 2 },
    measuredPressureGradientPaPerM: 10000,
    assumptions: ['Synthetic QA fixture; MUST NOT be registered as published Tier-B evidence.'],
    sourceInputTrace: {
      targetFlowRateM3s: 'synthetic QA input',
      pipeRadiusM: 'synthetic QA input',
      lubricationLayerThicknessM: 'synthetic QA input',
      bulkYieldStressPa: 'synthetic QA input',
      bulkPlasticViscosityPaS: 'synthetic QA input',
      lubricationLayerYieldStressPa: 'synthetic QA input',
      lubricationLayerPlasticViscosityPaS: 'synthetic QA input',
      measuredPressureGradientPaPerM: 'synthetic QA input',
    },
  };
}

describe('published full-scale verification harness', () => {
  it('computes deterministic prediction and signed error without inventing a tolerance', () => {
    const a = evaluatePublishedFullScaleCase(infrastructureFixture());
    const b = evaluatePublishedFullScaleCase(infrastructureFixture());
    expect(a).toEqual(b);
    expect(a.solverConverged).toBe(true);
    expect(a.absoluteErrorPaPerM).toBeCloseTo(a.predictedPressureGradientPaPerM - a.measuredPressureGradientPaPerM, 10);
    expect(a.relativeErrorFraction).toBeCloseTo(a.absoluteErrorPaPerM / a.measuredPressureGradientPaPerM, 12);
    expect(a.method).toBe('tolue-published-full-scale-verification-v1');
  });

  it('rejects a case with unresolved reconstruction assumptions', () => {
    const input = infrastructureFixture();
    const unresolved = { ...input, assumptions: ['unresolved: lubrication-layer thickness is not available in source material'] };
    expect(() => validatePublishedFullScaleCase(unresolved)).toThrow('TIER-B-CASE-UNRESOLVED-ASSUMPTION');
  });

  it('rejects missing source trace instead of accepting an undocumented number', () => {
    const input = infrastructureFixture();
    const invalid = {
      ...input,
      sourceInputTrace: { ...input.sourceInputTrace, bulkYieldStressPa: '' },
    };
    expect(() => validatePublishedFullScaleCase(invalid)).toThrow('TIER-B-CASE-INVALID:sourceInputTrace.bulkYieldStressPa');
  });

  it('rejects non-peer-reviewed or non-full-scale evidence from the Tier-B path', () => {
    const input = infrastructureFixture();
    expect(() => validatePublishedFullScaleCase({ ...input, source: { ...input.source, peerReviewed: false } })).toThrow('TIER-B-CASE-NOT-PEER-REVIEWED');
    expect(() => validatePublishedFullScaleCase({ ...input, source: { ...input.source, fullScalePumping: false } })).toThrow('TIER-B-CASE-NOT-FULL-SCALE');
  });
});
