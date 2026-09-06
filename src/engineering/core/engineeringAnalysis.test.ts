import { describe, expect, it } from 'vitest';
import { executeEngineeringAnalysis } from './engineeringAnalysis';
import { SimulationRunInput } from './simulationRun';
import { EngineeringInputProvenanceRecord, SimulationInputProvenance } from './inputProvenance';

function measuredRecord(entityId: string): EngineeringInputProvenanceRecord {
  return {
    evidence: {
      entityId,
      entityKind: 'measurement_result',
      generatedByActivityId: `${entityId}-measurement`,
      uncertainty: { expandedUncertainty: 1, coverageFactor: 2, unit: 'Pa', evaluationMethodId: 'test-uncertainty-evaluation' },
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
    bulkRheology: measuredRecord('bulk-rheology'),
    lubricationLayerRheology: measuredRecord('ll-rheology'),
    lubricationLayerThickness: {
      evidence: { entityId: 'll-thickness', entityKind: 'derived_result', generatedByActivityId: 'll-derivation', sourceEntityIds: ['test-source-data'] },
      activities: [{ id: 'll-derivation', kind: 'derivation', methodId: 'test-ll-method', agentIds: ['TOLUE-TEST'] }],
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
    runId: 'analysis-run-001',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-06T00:00:00.000Z',
    pipeline: {
      targetFlowRateM3s: 0.001,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 2 }],
    },
    pumpCapability: {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 2_000_000 }],
    },
    provenance: documentedProvenance(),
  };
}

describe('executeEngineeringAnalysis readiness integration', () => {
  it('executes READY input through every downstream stage with one identity and hash', () => {
    const result = executeEngineeringAnalysis(fixture());
    expect(result.readiness.status).toBe('READY');
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed analysis');

    expect(result.simulation.runId).toBe(result.runId);
    expect(result.resultCenter.runId).toBe(result.runId);
    expect(result.diagnostics.runId).toBe(result.runId);
    expect(result.visualization3d.runId).toBe(result.runId);
    expect(result.resultCenter.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.diagnostics.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.visualization3d.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.method).toBe('tolue-engineering-analysis-orchestrator-v2');
  });

  it('executes a hydraulically complete run when pump pressure is insufficient and emits a critical diagnostic', () => {
    const input = fixture();
    input.pumpCapability = {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 1_000 }],
    };
    const result = executeEngineeringAnalysis(input);

    expect(result.readiness.status).toBe('READY');
    expect(result.executionStatus).toBe('EXECUTED');
    expect(result.completeness).toBe('complete');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed pump-fail analysis');
    expect(result.simulation.pumpCapability?.status).toBe('FAIL');
    expect(result.diagnostics.findings.some(f => f.kind === 'PUMP_PRESSURE_INSUFFICIENT' && f.severity === 'critical')).toBe(true);
  });

  it('blocks missing pump capability before solver/downstream outputs are created', () => {
    const input = fixture();
    delete input.pumpCapability;
    const result = executeEngineeringAnalysis(input);

    expect(result.readiness.status).toBe('BLOCKED');
    expect(result.executionStatus).toBe('BLOCKED');
    expect(result.readiness.findings.some(f => f.ruleId === 'RG-PUMP-001')).toBe(true);
    expect(result.inputSnapshotHash).toBeNull();
    expect(result.simulation).toBeNull();
    expect(result.resultCenter).toBeNull();
    expect(result.diagnostics).toBeNull();
    expect(result.visualization3d).toBeNull();
  });

  it('executes PRELIMINARY input while preserving readiness provenance', () => {
    const input = fixture();
    input.assumptions = ['Lubrication-layer rheology supplied from an explicit engineering assumption.'];
    const result = executeEngineeringAnalysis(input);

    expect(result.readiness.status).toBe('PRELIMINARY');
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected preliminary execution');
    expect(result.simulation.assumptions).toEqual(input.assumptions);
  });

  it('executes provenance-missing legacy input as PRELIMINARY, not READY', () => {
    const input = fixture();
    delete input.provenance;
    const result = executeEngineeringAnalysis(input);
    expect(result.readiness.status).toBe('PRELIMINARY');
    expect(result.executionStatus).toBe('EXECUTED');
    expect(result.readiness.findings.some(f => f.ruleId === 'RG-PROV-002')).toBe(true);
  });

  it('hard-blocks unsupported pipeline fittings before any solver/downstream result exists', () => {
    const input = fixture();
    input.pipeline.segments.push({ id: 'E1', kind: 'elbow', elevationChangeM: 0 });
    const result = executeEngineeringAnalysis(input);

    expect(result.readiness.status).toBe('BLOCKED');
    expect(result.executionStatus).toBe('BLOCKED');
    expect(result.completeness).toBe('incomplete');
    expect(result.inputSnapshotHash).toBeNull();
    expect(result.simulation).toBeNull();
    expect(result.resultCenter).toBeNull();
    expect(result.diagnostics).toBeNull();
    expect(result.visualization3d).toBeNull();
    expect(result.readiness.findings.some(f => f.ruleId === 'RG-MODEL-001')).toBe(true);
  });

  it('hard-blocks invalid LL geometry instead of allowing the solver to throw', () => {
    const input = fixture();
    input.pipeline.lubricationLayerThicknessM = 0.0625;
    const result = executeEngineeringAnalysis(input);

    expect(result.executionStatus).toBe('BLOCKED');
    expect(result.readiness.findings.some(f => f.ruleId === 'RG-LL-002')).toBe(true);
  });

  it('is deterministic for identical READY and BLOCKED inputs', () => {
    expect(executeEngineeringAnalysis(fixture())).toEqual(executeEngineeringAnalysis(fixture()));
    const blocked = fixture();
    blocked.pipeline.segments.push({ id: 'V1', kind: 'valve', elevationChangeM: 0 });
    expect(executeEngineeringAnalysis(blocked)).toEqual(executeEngineeringAnalysis(blocked));
  });
});
