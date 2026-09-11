import { describe, expect, it } from 'vitest';
import { validateFieldValidationCase, type FieldValidationCase } from './fieldValidationDataset';

function fixture(): FieldValidationCase {
  return {
    caseId: 'FIELD-QA-001',
    source: {
      projectId: 'P-001',
      mixRevisionId: 'MIX-R1',
      pipelineScenarioId: 'PIPE-001',
      pumpScenarioId: 'PUMP-001',
      sourceHash: 'sha256:qa-only',
      recordedAtIso: '2026-09-11T12:00:00.000Z',
      recordedBy: 'TOLUE QA',
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

describe('field validation dataset integrity', () => {
  it('accepts a traceable measured case', () => {
    expect(() => validateFieldValidationCase(fixture())).not.toThrow();
  });

  it('requires an exclusion reason for excluded cases', () => {
    expect(() => validateFieldValidationCase({ ...fixture(), evidenceQuality: 'EXCLUDED' })).toThrow('FIELD-CASE-INVALID:exclusionReason');
  });

  it('does not allow unavailable lubrication data to masquerade as measured values', () => {
    expect(() => validateFieldValidationCase({ ...fixture(), lubricationQualificationMode: 'UNAVAILABLE' })).toThrow('FIELD-CASE-INVALID:lubricationUnavailableHasValues');
  });

  it('rejects unresolved reconstruction assumptions', () => {
    expect(() => validateFieldValidationCase({ ...fixture(), assumptions: ['unresolved: sensor calibration record missing'] })).toThrow('FIELD-CASE-UNRESOLVED-ASSUMPTION');
  });
});
