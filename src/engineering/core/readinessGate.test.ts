import { describe, expect, it } from 'vitest';
import { assessEngineeringReadiness } from './readinessGate';
import { SimulationRunInput } from './simulationRun';
import { EngineeringInputProvenanceRecord, SimulationInputProvenance } from './inputProvenance';

function measuredRecord(entityId: string, unit: string): EngineeringInputProvenanceRecord {
  return {
    evidence: {
      entityId,
      entityKind: 'measurement_result',
      generatedByActivityId: `${entityId}-measurement`,
      uncertainty: { expandedUncertainty: 1, coverageFactor: 2, unit, evaluationMethodId: 'test-uncertainty-evaluation' },
    },
    activities: [{
      id: `${entityId}-measurement`,
      kind: 'measurement',
      methodId: 'test-measurement-method',
      startedAtIso: '2026-09-06T00:00:00.000Z',
      endedAtIso: '2026-09-06T00:05:00.000Z',
      agentIds: ['TEST-INSTRUMENT'],
      calibrationChain: [{ calibrationId: 'TEST-CAL-001', referenceId: 'TEST-REF-001', calibratedAtIso: '2026-08-01T00:00:00.000Z' }],
    }],
    agents: [{ id: 'TEST-INSTRUMENT', kind: 'equipment' }],
  };
}

function documentedProvenance(): SimulationInputProvenance {
  return {
    bulkRheology: measuredRecord('bulk-rheology', 'Pa'),
    lubricationLayerRheology: measuredRecord('ll-rheology', 'Pa'),
    lubricationLayerThickness: {
      evidence: { entityId: 'll-thickness', entityKind: 'derived_result', generatedByActivityId: 'll-thickness-derivation', sourceEntityIds: ['test-source-data'] },
      activities: [{ id: 'll-thickness-derivation', kind: 'derivation', methodId: 'test-ll-method', agentIds: ['TOLUE-TEST'] }],
      agents: [{ id: 'TOLUE-TEST', kind: 'software' }],
    },
    pumpCapability: {
      evidence: { entityId: 'pump-curve', entityKind: 'manufacturer_data', generatedByActivityId: 'pump-declaration', sourceDocumentId: 'test-pump-datasheet' },
      activities: [{ id: 'pump-declaration', kind: 'manufacturer_declaration', agentIds: ['TEST-PUMP-MFR'] }],
      agents: [{ id: 'TEST-PUMP-MFR', kind: 'organization' }],
    },
  };
}

function fixture(): SimulationRunInput {
  return {
    runId: 'ready-001',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-06T00:00:00.000Z',
    pipeline: {
      targetFlowRateM3s: 0.001,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 50, plasticViscosityPaS: 20 },
      lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 2 },
      segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 2 }],
    },
    pumpCapability: {
      provenance: 'manufacturer_curve',
      capabilityCurve: [
        { flowRateM3s: 0.0005, availableConcretePressurePa: 2_500_000 },
        { flowRateM3s: 0.0015, availableConcretePressurePa: 2_000_000 },
      ],
    },
    provenance: documentedProvenance(),
  };
}

describe('assessEngineeringReadiness', () => {
  it('returns READY only when complete supported inputs also have documented provenance', () => {
    const result = assessEngineeringReadiness(fixture());
    expect(result.status).toBe('READY');
    expect(result.canExecute).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('returns PRELIMINARY when explicit assumptions are present', () => {
    const input = fixture();
    input.assumptions = ['Lubrication-layer thickness is project-calibrated.'];
    const result = assessEngineeringReadiness(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.canExecute).toBe(true);
    expect(result.findings.some(f => f.ruleId === 'RG-PROV-001')).toBe(true);
  });

  it('returns PRELIMINARY when structured provenance is absent', () => {
    const input = fixture();
    delete input.provenance;
    const result = assessEngineeringReadiness(input);
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings.some(f => f.ruleId === 'RG-PROV-002')).toBe(true);
  });

  it('blocks unsupported fitting friction instead of assuming zero loss', () => {
    const input = fixture();
    input.pipeline.segments.push({ id: 'E1', kind: 'elbow', elevationChangeM: 0 });
    const result = assessEngineeringReadiness(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.canExecute).toBe(false);
    expect(result.findings.some(f => f.ruleId === 'RG-MODEL-001')).toBe(true);
  });

  it('blocks invalid lubrication-layer geometry', () => {
    const input = fixture();
    input.pipeline.lubricationLayerThicknessM = 0.0625;
    const result = assessEngineeringReadiness(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'RG-LL-002')).toBe(true);
  });

  it('blocks pump-curve extrapolation', () => {
    const input = fixture();
    input.pipeline.targetFlowRateM3s = 0.002;
    const result = assessEngineeringReadiness(input);
    expect(result.status).toBe('BLOCKED');
    expect(result.findings.some(f => f.ruleId === 'RG-PUMP-005')).toBe(true);
  });

  it('is deterministic', () => {
    expect(assessEngineeringReadiness(fixture())).toEqual(assessEngineeringReadiness(fixture()));
  });
});
