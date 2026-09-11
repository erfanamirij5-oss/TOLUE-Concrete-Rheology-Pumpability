import { describe, expect, it } from 'vitest';
import type { PublishedFullScaleVerificationCase } from './publishedFullScaleVerification';
import type { FieldValidationCase } from './fieldValidationDataset';
import { evaluateVerificationEvidencePortfolio, type VerificationEvidenceEntry } from './verificationEvidencePortfolio';

function publishedCase(): PublishedFullScaleVerificationCase {
  return {
    caseId: 'TB-QA-001',
    source: {
      referenceId: 'QA-REFERENCE', title: 'QA full-scale source', authors: ['QA Author'], publicationYear: 2020,
      doi: '10.0000/qa', sourceVersion: 'controlled-copy-1', sourceHash: 'sha256:tb-qa', peerReviewed: true, fullScalePumping: true,
    },
    targetFlowRateM3s: 0.01, pipeRadiusM: 0.05, lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 40, plasticViscosityPaS: 18 }, lubricationLayer: { yieldStressPa: 4, plasticViscosityPaS: 2 },
    measuredPressureGradientPaPerM: 20_000,
    assumptions: ['QA fixture only; not literature evidence.'],
    sourceInputTrace: {
      targetFlowRateM3s: 'qa:q', pipeRadiusM: 'qa:r', lubricationLayerThicknessM: 'qa:ll-thickness',
      bulkYieldStressPa: 'qa:bulk-tau', bulkPlasticViscosityPaS: 'qa:bulk-mu', lubricationLayerYieldStressPa: 'qa:ll-tau',
      lubricationLayerPlasticViscosityPaS: 'qa:ll-mu', measuredPressureGradientPaPerM: 'qa:dpdx',
    },
  };
}

function fieldCase(): FieldValidationCase {
  return {
    caseId: 'TC-QA-001',
    source: { projectId: 'P-001', mixRevisionId: 'MIX-R1', pipelineScenarioId: 'PIPE-001', pumpScenarioId: 'PUMP-001', sourceHash: 'sha256:tc-qa', recordedAtIso: '2026-09-11T12:00:00.000Z', recordedBy: 'QA' },
    evidenceQuality: 'A', bulkRheology: { yieldStressPa: 40, plasticViscosityPaS: 18 },
    lubricationLayerRheology: { yieldStressPa: 4, plasticViscosityPaS: 2 }, lubricationLayerThicknessM: 0.002,
    lubricationQualificationMode: 'MEASURED_TRIBOLOGY', pipelineLengthM: 100, pipeInsideDiameterM: 0.1, elevationChangeM: 5,
    pumpMake: 'QA', pumpModel: 'QA-100', pumpRevision: 'R1',
    measurement: { measuredFlowRateM3s: 0.01, measuredPressurePa: 2_000_000, pressureSensorId: 'PS-01', pressureSensorLocationM: 95, pressureSensorCalibrationRef: 'CAL-01' }, assumptions: [],
  };
}

function fieldEntry(status: 'CANDIDATE'|'ADMITTED'|'EXCLUDED'): VerificationEvidenceEntry {
  return {
    tier: 'TIER_C_TOLUE_FIELD', admissionStatus: status, ...(status==='EXCLUDED'?{exclusionReason:'QA exclusion'}:{}),
    evaluationInput: { fieldCase: fieldCase(), comparison: { hydraulicScope: 'STRAIGHT_PIPE_WITH_ELEVATION', comparisonLengthM: 80, elevationChangeM: 4, concreteDensityKgM3: 2400, measuredPressureDropPa: 1_800_000, pressureReferenceDescription: 'controlled taps', sourceTrace: 'QA field sheet' } },
  };
}

describe('verification evidence portfolio', () => {
  it('does not let candidate evidence influence verification metrics', () => {
    const result = evaluateVerificationEvidencePortfolio([{ tier:'TIER_B_PUBLISHED_FULL_SCALE', admissionStatus:'CANDIDATE', case: publishedCase() }]);
    expect(result.candidateCount).toBe(1);
    expect(result.admittedTierBResults).toHaveLength(0);
    expect(result.tierBMetrics).toBeNull();
    expect(result.p0TierBCoveragePresent).toBe(false);
  });

  it('evaluates admitted Tier-B and Tier-C evidence but never auto-promotes production validation', () => {
    const entries: VerificationEvidenceEntry[] = [
      { tier:'TIER_B_PUBLISHED_FULL_SCALE', admissionStatus:'ADMITTED', case: publishedCase() },
      fieldEntry('ADMITTED'),
    ];
    const result = evaluateVerificationEvidencePortfolio(entries);
    expect(result.admittedTierBResults).toHaveLength(1);
    expect(result.admittedTierCResults).toHaveLength(1);
    expect(result.p0TierBCoveragePresent).toBe(true);
    expect(result.p0TierCCoveragePresent).toBe(true);
    expect(result.productionValidationComplete).toBe(false);
    expect(result.tierBMetrics?.caseCount).toBe(1);
  });

  it('retains excluded records as audit counts without evaluating them', () => {
    const result = evaluateVerificationEvidencePortfolio([fieldEntry('EXCLUDED')]);
    expect(result.excludedCount).toBe(1);
    expect(result.admittedTierCResults).toHaveLength(0);
  });

  it('requires exclusion rationale and rejects rationale on non-excluded evidence', () => {
    expect(() => evaluateVerificationEvidencePortfolio([{ ...fieldEntry('EXCLUDED'), exclusionReason: undefined }])).toThrow('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-001');
    expect(() => evaluateVerificationEvidencePortfolio([{ ...fieldEntry('CANDIDATE'), exclusionReason: 'not allowed here' }])).toThrow('VERIFICATION-PORTFOLIO-EXCLUSION-REASON-002');
  });
});
