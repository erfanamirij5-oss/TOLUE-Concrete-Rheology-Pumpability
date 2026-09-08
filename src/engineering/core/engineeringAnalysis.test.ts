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

function qualifiedEvidence(evidenceId: string, provenanceEntityId: string) {
  return {
    projectId: 'PROJECT-001',
    evidenceId,
    provenanceEntityId,
    methodId: 'project-qualified-test-v1',
    referenceIds: ['REF-001'],
    outcome: 'ACCEPTABLE' as const,
    qualifiedFlowRangeM3s: { min: 0.0005, max: 0.0015 },
    applicabilityStatement: 'Qualified only for the documented project route/material system.',
    limitations: ['Not transferable without independent qualification.'],
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
    expect(result.pumpabilityDecision.runId).toBe(result.runId);
    expect(result.visualization3d.runId).toBe(result.runId);
    expect(result.resultCenter.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.diagnostics.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.visualization3d.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.pumpabilityDecision.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(result.resultCenter.results.find(r => r.id === 'pumpability.decisionStatus')?.value).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(result.visualization3d.pumpabilityDecision?.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(result.resultCenter.method).toBe('tolue-engineering-result-center-v4');
    expect(result.diagnostics.method).toBe('tolue-diagnostics-v2');
    expect(result.visualization3d.method).toBe('tolue-3d-visualization-contract-v2');
    expect(result.method).toBe('tolue-engineering-analysis-orchestrator-v4');
  });

  it('propagates project-qualified three-axis pumpability evidence through Result Center, Diagnostics and 3D', () => {
    const input = fixture();
    input.pumpabilityEvidence = {
      stability: qualifiedEvidence('STAB-001', 'PROV-STAB-001'),
      blockage: qualifiedEvidence('BLOCK-001', 'PROV-BLOCK-001'),
    };
    const result = executeEngineeringAnalysis(input);
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed analysis');

    expect(result.pumpabilityDecision.status).toBe('PROJECT_QUALIFIED_ACCEPTABLE');
    expect(result.resultCenter.results.find(r => r.id === 'pumpability.stabilityEvidence')?.value).toBe('ACCEPTABLE');
    expect(result.resultCenter.results.find(r => r.id === 'pumpability.blockageEvidence')?.value).toBe('ACCEPTABLE');
    expect(result.resultCenter.results.find(r => r.id === 'pumpability.decisionStatus')?.value).toBe('PROJECT_QUALIFIED_ACCEPTABLE');
    expect(result.diagnostics.findings.some(f => f.kind === 'PUMPABILITY_PROJECT_QUALIFIED')).toBe(true);
    expect(result.visualization3d.pumpabilityDecision).toEqual(expect.objectContaining({
      pressureFeasibility: 'PASS',
      stability: 'ACCEPTABLE',
      blockageRisk: 'ACCEPTABLE',
      status: 'PROJECT_QUALIFIED_ACCEPTABLE',
    }));
    expect(result.visualization3d.physicalSimulationClaim).toBe(false);
  });

  it('executes a hydraulically complete run when pump pressure is insufficient and emits a critical diagnostic', () => {
    const input = fixture();
    input.pumpCapability = { provenance: 'manufacturer_rated_point', capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 1_000 }] };
    const result = executeEngineeringAnalysis(input);
    expect(result.readiness.status).toBe('READY');
    expect(result.executionStatus).toBe('EXECUTED');
    expect(result.completeness).toBe('complete');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected executed pump-fail analysis');
    expect(result.simulation.pumpAssessment?.status).toBe('FAIL');
    expect(result.pumpabilityDecision.status).toBe('FAIL_PRESSURE');
    expect(result.diagnostics.findings.some(f => f.kind === 'PUMP_PRESSURE_INSUFFICIENT' && f.severity === 'critical')).toBe(true);
  });

  it('blocks missing pump capability before solver/downstream outputs are created', () => {
    const input = fixture();
    delete input.pumpCapability;
    const result = executeEngineeringAnalysis(input);
    expect(result.readiness.status).toBe('BLOCKED');
    expect(result.executionStatus).toBe('BLOCKED');
    expect(result.inputSnapshotHash).toBeNull();
    expect(result.simulation).toBeNull();
    expect(result.resultCenter).toBeNull();
    expect(result.diagnostics).toBeNull();
    expect(result.pumpabilityDecision).toBeNull();
    expect(result.visualization3d).toBeNull();
  });

  it('is deterministic for identical READY and BLOCKED inputs', () => {
    expect(executeEngineeringAnalysis(fixture())).toEqual(executeEngineeringAnalysis(fixture()));
    const blocked = fixture();
    blocked.pipeline.segments.push({ id: 'V1', kind: 'valve', elevationChangeM: 0 });
    expect(executeEngineeringAnalysis(blocked)).toEqual(executeEngineeringAnalysis(blocked));
  });
});
