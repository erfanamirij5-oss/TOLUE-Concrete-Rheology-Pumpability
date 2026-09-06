import { describe, expect, it } from 'vitest';
import { assessInputEvidence, SimulationInputProvenance } from './inputProvenance';

function verified(): SimulationInputProvenance {
  return {
    bulkRheology: { provenance: 'measured', methodId: 'rheometer-method', measuredAtIso: '2026-09-06T00:00:00.000Z', equipmentId: 'RHEO-01' },
    lubricationLayerRheology: { provenance: 'calibrated', calibrationId: 'LL-CAL-001' },
    lubricationLayerThickness: { provenance: 'calibrated', methodId: 'project-calibration-v1' },
    pumpCapability: { provenance: 'manufacturer', sourceDocumentId: 'pump-datasheet-001' },
  };
}

describe('TOLUE input provenance contract', () => {
  it('returns VERIFIED for traceable evidence metadata', () => {
    const result = assessInputEvidence(verified());
    expect(result.status).toBe('VERIFIED');
    expect(result.findings).toEqual([]);
  });

  it('marks assumed engineering inputs PRELIMINARY', () => {
    const input = verified();
    input.lubricationLayerThickness = { provenance: 'assumed', note: 'Scenario assumption' };
    const result = assessInputEvidence(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'PROV-ASSUMED-001')).toBe(true);
  });

  it('marks incomplete measured provenance PRELIMINARY without inventing metadata', () => {
    const input = verified();
    input.bulkRheology = { provenance: 'measured' };
    const result = assessInputEvidence(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'PROV-MEASURED-001')).toBe(true);
    expect(result.findings.some(f => f.ruleId === 'PROV-MEASURED-002')).toBe(true);
  });

  it('blocks malformed supplied timestamps', () => {
    const input = verified();
    input.bulkRheology.measuredAtIso = 'not-a-date';
    const result = assessInputEvidence(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'PROV-META-001')).toBe(true);
  });

  it('is deterministic', () => {
    expect(assessInputEvidence(verified())).toEqual(assessInputEvidence(verified()));
  });
});
