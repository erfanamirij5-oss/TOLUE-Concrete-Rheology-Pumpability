import { describe, expect, it } from 'vitest';
import { assessLubricationLayerQualification } from './lubricationLayerQualification';
import type { SimulationInputProvenance } from './inputProvenance';

function record(entityId: string, kind: 'measurement' | 'calibration' | 'assumption' = 'measurement') {
  return {
    evidence: {
      entityId,
      entityKind: kind === 'assumption' ? 'engineering_assumption' as const : 'measurement_result' as const,
      generatedByActivityId: `${entityId}-activity`,
    },
    activities: [{ id: `${entityId}-activity`, kind }],
    agents: [],
  };
}

function provenance(): SimulationInputProvenance {
  return {
    bulkRheology: record('bulk'),
    lubricationLayerRheology: record('ll-rheo'),
    lubricationLayerThickness: record('ll-thickness'),
    pumpCapability: record('pump'),
  };
}

describe('lubrication-layer qualification', () => {
  it('keeps legacy missing mode preliminary rather than silently qualified', () => {
    const result = assessLubricationLayerQualification(undefined, provenance());
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'LLQ-MODE-001')).toBe(true);
  });

  it('blocks UNAVAILABLE because the current two-fluid pressure model depends on LL inputs', () => {
    const result = assessLubricationLayerQualification({ mode: 'UNAVAILABLE' }, provenance());
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'LLQ-UNAVAILABLE-001')).toBe(true);
  });

  it('qualifies measured tribology when both LL quantities are provenance-bound', () => {
    const result = assessLubricationLayerQualification({
      mode: 'MEASURED_TRIBOLOGY',
      rheologyEvidenceEntityId: 'll-rheo',
      thicknessEvidenceEntityId: 'll-thickness',
    }, provenance());
    expect(result.status).toBe('QUALIFIED');
  });

  it('requires controlled method/reference for calibrated or validated-prediction modes', () => {
    const result = assessLubricationLayerQualification({
      mode: 'PROJECT_CALIBRATED',
      rheologyEvidenceEntityId: 'll-rheo',
      thicknessEvidenceEntityId: 'll-thickness',
    }, provenance());
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'LLQ-METHOD-001')).toBe(true);
    expect(result.findings.some(f => f.ruleId === 'LLQ-REFERENCE-001')).toBe(true);
  });

  it('forces assumed LL evidence to preliminary', () => {
    const p = provenance();
    p.lubricationLayerThickness = record('ll-thickness', 'assumption');
    const result = assessLubricationLayerQualification({
      mode: 'MEASURED_TRIBOLOGY',
      rheologyEvidenceEntityId: 'll-rheo',
      thicknessEvidenceEntityId: 'll-thickness',
    }, p);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'LLQ-THICKNESS-ASSUMED-001')).toBe(true);
  });
});
