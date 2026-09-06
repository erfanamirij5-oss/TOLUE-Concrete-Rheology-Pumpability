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
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 2 },
      ],
    },
    pumpCapability: {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 2_000_000 }],
    },
    assumptions: ['test-fixture'],
  };
}

describe('executeEngineeringAnalysis', () => {
  it('orchestrates all engineering stages with one run identity and snapshot hash', () => {
    const result = executeEngineeringAnalysis(fixture());

    expect(result.runId).toBe('analysis-run-001');
    expect(result.simulation.runId).toBe(result.runId);
    expect(result.resultCenter.runId).toBe(result.runId);
    expect(result.diagnostics.runId).toBe(result.runId);
    expect(result.visualization3d.runId).toBe(result.runId);

    expect(result.resultCenter.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.diagnostics.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.visualization3d.inputSnapshotHash).toBe(result.inputSnapshotHash);
    expect(result.method).toBe('tolue-engineering-analysis-orchestrator-v1');
  });

  it('is deterministic for identical inputs', () => {
    const a = executeEngineeringAnalysis(fixture());
    const b = executeEngineeringAnalysis(fixture());
    expect(a).toEqual(b);
  });

  it('propagates incomplete analysis without inventing missing hydraulic contributions', () => {
    const input = fixture();
    input.pipeline.segments.push({ id: 'E1', kind: 'elbow', elevationChangeM: 0 });

    const result = executeEngineeringAnalysis(input);

    expect(result.completeness).toBe('incomplete');
    expect(result.simulation.pipeline.requiredPressurePa).toBeNull();
    expect(result.resultCenter.results.find(r => r.id === 'pipeline.requiredPressure')?.value).toBeNull();
    expect(result.diagnostics.findings.some(f => f.kind === 'INCOMPLETE_ANALYSIS')).toBe(true);
    expect(result.visualization3d.segments[1]?.hydraulicStatus).toBe('incomplete');
    expect(result.visualization3d.physicalSimulationClaim).toBe(false);
  });
});
