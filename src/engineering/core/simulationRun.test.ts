import { describe, expect, it } from 'vitest';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';

const base: SimulationRunInput = {
  runId: 'RUN-001',
  engineVersion: '0.1.0',
  createdAtIso: '2026-09-06T20:52:00+03:30',
  pipeline: {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 5 }],
  },
  pumpCapability: {
    capabilityCurve: [
      { flowRateM3s: 0, availableConcretePressurePa: 5_000_000 },
      { flowRateM3s: 0.002, availableConcretePressurePa: 4_000_000 },
    ],
    provenance: 'manufacturer_curve',
  },
};

describe('simulation run contract', () => {
  it('combines pipeline, profile and pump assessment into one traceable run', () => {
    const result = executeSimulationRun(base);
    expect(result.status).toBe('complete');
    expect(result.runId).toBe('RUN-001');
    expect(result.pipeline.completeness).toBe('complete');
    expect(result.pressureProfile.completeness).toBe('complete');
    expect(result.pumpAssessment?.status).toBe('PASS');
    expect(result.methods).toContain('tolue-pipeline-pressure-v2');
    expect(result.methods).toContain('tolue-pressure-profile-v2');
    expect(result.methods).toContain('tolue-hydraulic-invariants-v2');
    expect(result.methods).toContain('tolue-pump-capability-v1');
    expect(result.methods).not.toContain('tolue-project-calibrated-local-loss-v1');
  });

  it('exposes the project-calibrated local-loss method when used by the route', () => {
    const input: SimulationRunInput = {
      ...base,
      pipeline: {
        ...base.pipeline,
        segments: [
          { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
          {
            id: 'E1',
            kind: 'elbow',
            elevationChangeM: 0,
            calibratedLocalLoss: {
              calibrationCurve: [
                { flowRateM3s: 0.0005, pressureLossPa: 10_000 },
                { flowRateM3s: 0.0015, pressureLossPa: 30_000 },
              ],
              provenanceEntityId: 'LOCAL-EVIDENCE-001',
              calibrationId: 'LOCAL-CAL-001',
            },
          },
        ],
      },
    };
    const result = executeSimulationRun(input);
    expect(result.status).toBe('complete');
    expect(result.pipeline.calibratedLocalFrictionPressurePa).toBeCloseTo(20_000, 8);
    expect(result.methods).toContain('tolue-project-calibrated-local-loss-v1');
    expect(result.methods.filter(method => method === 'tolue-project-calibrated-local-loss-v1')).toHaveLength(1);
  });

  it('retains an immutable-by-value input snapshot', () => {
    const result = executeSimulationRun(base);
    expect(result.inputSnapshot).not.toBe(base);
    expect(result.inputSnapshot.pipeline).not.toBe(base.pipeline);
    expect(result.inputSnapshot).toEqual(base);
  });

  it('marks a run incomplete when a local-loss segment is not modeled', () => {
    const input: SimulationRunInput = {
      ...base,
      pipeline: {
        ...base.pipeline,
        segments: [
          { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
          { id: 'E1', kind: 'elbow', elevationChangeM: 0 },
        ],
      },
    };
    const result = executeSimulationRun(input);
    expect(result.status).toBe('incomplete');
    expect(result.pipeline.requiredPressurePa).toBeNull();
    expect(result.pumpAssessment?.status).toBe('INSUFFICIENT_DATA');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('does not declare a complete run without pump capability evidence', () => {
    const { pumpCapability: _removed, ...input } = base;
    const result = executeSimulationRun(input);
    expect(result.status).toBe('incomplete');
    expect(result.pumpAssessment).toBeNull();
  });
});
