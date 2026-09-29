import { describe, expect, it } from 'vitest';
import { diagnoseEngineeringResults } from './diagnostics';
import { buildEngineeringResultCenter } from './resultCenter';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';
import { buildEngineeringVisualization3DData } from './visualization3d';

const base: SimulationRunInput = {
  runId: 'run-3d-001',
  engineVersion: '0.1.0',
  createdAtIso: '2026-09-06T17:00:00.000Z',
  pipeline: {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 2 }],
  },
  pumpCapability: {
    capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: 2_000_000 }],
    provenance: 'manufacturer_rated_point',
  },
};

function build(input: SimulationRunInput) {
  const run = executeSimulationRun(input);
  const center = buildEngineeringResultCenter(run);
  const diagnostics = diagnoseEngineeringResults(center);
  return buildEngineeringVisualization3DData(run, center, diagnostics);
}

describe('3D engineering visualization data contract', () => {
  it('maps a computed straight segment without claiming physical 3D simulation', () => {
    const data = build(base);
    expect(data.representation).toBe('engineering_visualization');
    expect(data.physicalSimulationClaim).toBe(false);
    expect(data.pressureProfileAssumption).toBe('stationary-segment-properties');
    expect(data.segments[0]!.startStationM).toBe(0);
    expect(data.segments[0]!.endStationM).toBe(10);
    expect(data.segments[0]!.pipeRadiusM).toBe(0.0625);
    expect(data.segments[0]!.flowRateM3s.value).toBe(0.001);
    expect(data.segments[0]!.hydraulicStatus).toBe('computed');
    expect(data.spatialValidation.status).toBe('not_available');
  });

  it('propagates validated spatial geometry when supplied by the engineering input', () => {
    const input: SimulationRunInput = structuredClone(base);
    input.runId = 'run-3d-spatial-001';
    input.pipeline.segments = [{
      id: 'S1', kind: 'straight', lengthM: Math.sqrt(104), pipeRadiusM: 0.0625, elevationChangeM: 2,
      spatial: { startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 10, yM: 0, zM: 2 } },
    }];
    const data = build(input);
    expect(data.spatialValidation.status).toBe('valid');
    expect(data.segments[0]!.spatialStartPoint).toEqual({ xM: 0, yM: 0, zM: 0 });
    expect(data.segments[0]!.spatialEndPoint).toEqual({ xM: 10, yM: 0, zM: 2 });
    expect(data.method).toBe('tolue-3d-visualization-contract-v3');
  });

  it('preserves unsupported local hydraulic loss as not_computed', () => {
    const input: SimulationRunInput = structuredClone(base);
    input.runId = 'run-3d-002';
    input.pipeline.segments = [
      { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
      { id: 'E1', kind: 'elbow', elevationChangeM: 1 },
    ];
    const data = build(input);
    expect(data.completeness).toBe('incomplete');
    expect(data.segments[1]!.frictionPressureLossPa.status).toBe('not_computed');
    expect(data.segments[1]!.totalPressureChangePa.status).toBe('not_computed');
    expect(data.segments[1]!.inletRemainingPressurePa.status).toBe('not_computed');
    expect(data.segments[1]!.pipeRadiusM).toBeNull();
  });

  it('is deterministic for identical engineering sources', () => {
    expect(build(base)).toEqual(build(base));
  });

  it('rejects cross-run source mixing', () => {
    const run = executeSimulationRun(base);
    const center = buildEngineeringResultCenter(run);
    const diagnostics = diagnoseEngineeringResults(center);
    expect(() => buildEngineeringVisualization3DData({ ...run, runId: 'other-run' }, center, diagnostics)).toThrow(/runId mismatch/);
  });
});
