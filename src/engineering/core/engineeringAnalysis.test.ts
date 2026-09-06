import { describe, expect, it } from 'vitest';
import { executeEngineeringAnalysis } from './engineeringAnalysis';
import { SimulationRunInput } from './simulationRun';

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

  it('executes PRELIMINARY input while preserving readiness provenance', () => {
    const input = fixture();
    input.assumptions = ['Lubrication-layer rheology supplied from an explicit engineering assumption.'];
    const result = executeEngineeringAnalysis(input);

    expect(result.readiness.status).toBe('PRELIMINARY');
    expect(result.executionStatus).toBe('EXECUTED');
    if (result.executionStatus !== 'EXECUTED') throw new Error('expected preliminary execution');
    expect(result.simulation.assumptions).toEqual(input.assumptions);
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
