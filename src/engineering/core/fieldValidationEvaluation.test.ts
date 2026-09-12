import { describe, expect, it } from 'vitest';
import type { FieldValidationCase } from './fieldValidationDataset';
import { evaluateFieldValidationCase } from './fieldValidationEvaluation';

function fieldCase(): FieldValidationCase {
  return {
    caseId: 'FIELD-COMP-001',
    source: {
      projectId: 'PROJECT-001',
      mixRevisionId: 'MIX-R1',
      pipelineScenarioId: 'PIPE-001',
      pumpScenarioId: 'PUMP-001',
      sourceHash: 'sha256:field-case-001',
      recordedAtIso: '2026-09-11T12:00:00.000Z',
      recordedBy: 'TOLUE FIELD TEAM',
    },
    evidenceQuality: 'A',
    bulkRheology: { yieldStressPa: 40, plasticViscosityPaS: 18 },
    lubricationLayerRheology: { yieldStressPa: 4, plasticViscosityPaS: 2 },
    lubricationLayerThicknessM: 0.002,
    lubricationQualificationMode: 'MEASURED_TRIBOLOGY',
    pipelineLengthM: 100,
    pipeInsideDiameterM: 0.1,
    elevationChangeM: 5,
    pumpMake: 'QA',
    pumpModel: 'QA-100',
    pumpRevision: 'R1',
    measurement: {
      measuredFlowRateM3s: 0.01,
      measuredPressurePa: 2_000_000,
      pressureSensorId: 'PS-01',
      pressureSensorLocationM: 95,
      pressureSensorCalibrationRef: 'CAL-01',
    },
    assumptions: [],
  };
}

const comparison = () => ({
  hydraulicScope: 'STRAIGHT_PIPE_WITH_ELEVATION' as const,
  comparisonLengthM: 80,
  elevationChangeM: 4,
  concreteDensityKgM3: 2400,
  measuredPressureDropPa: 1_800_000,
  pressureReferenceDescription: 'Pressure drop between controlled upstream/downstream taps over the declared 80 m straight section.',
  sourceTrace: 'FIELD-SHEET-001 rows 12-18 + pressure logger export PS01/PS02',
});

describe('field validation evaluation', () => {
  it('produces a deterministic model-vs-field pressure comparison with explicit scope', () => {
    const result = evaluateFieldValidationCase({ fieldCase: fieldCase(), comparison: comparison() });
    expect(result.caseId).toBe('FIELD-COMP-001');
    expect(result.projectId).toBe('PROJECT-001');
    expect(result.predictedFrictionPressureDropPa).toBeGreaterThan(0);
    expect(Number.isFinite(result.predictedTotalPressureDropPa)).toBe(true);
    expect(result.measuredPressureDropPa).toBe(1_800_000);
    expect(result.comparisonSourceTrace).toContain('FIELD-SHEET-001');
    expect(result.method).toBe('tolue-field-validation-comparison-v1');
  });

  it('does not reinterpret an excluded field case as validation evidence', () => {
    const excluded = { ...fieldCase(), evidenceQuality: 'EXCLUDED' as const, exclusionReason: 'sensor fault' };
    expect(() => evaluateFieldValidationCase({ fieldCase: excluded, comparison: comparison() })).toThrow('FIELD-COMPARISON-EXCLUDED');
  });

  it('rejects comparison lengths outside the controlled field case', () => {
    expect(() => evaluateFieldValidationCase({ fieldCase: fieldCase(), comparison: { ...comparison(), comparisonLengthM: 101 } }))
      .toThrow('FIELD-COMPARISON-LENGTH-OUTSIDE-CASE');
  });

  it('requires explicit lubrication-layer data for the two-fluid field comparison', () => {
    const base = fieldCase();
    const { lubricationLayerRheology: _rheology, lubricationLayerThicknessM: _thickness, ...withoutLayer } = base;
    const unavailable: FieldValidationCase = { ...withoutLayer, lubricationQualificationMode: 'UNAVAILABLE' };
    expect(() => evaluateFieldValidationCase({ fieldCase: unavailable, comparison: comparison() })).toThrow('FIELD-COMPARISON-LL-UNAVAILABLE');
  });
});
