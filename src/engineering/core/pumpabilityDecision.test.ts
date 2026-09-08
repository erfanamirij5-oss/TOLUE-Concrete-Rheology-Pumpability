import { describe, expect, it } from 'vitest';
import { assessPumpabilityDecision } from './pumpabilityDecision';
import { executeSimulationRun, SimulationRunInput } from './simulationRun';

function input(availablePressurePa: number): SimulationRunInput {
  return {
    runId: 'RUN-PUMPABILITY-DECISION',
    engineVersion: '0.1.0',
    createdAtIso: '2026-09-08T08:50:00+03:30',
    pipeline: {
      targetFlowRateM3s: 0.001,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 },
      segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 }],
    },
    pumpCapability: {
      provenance: 'manufacturer_rated_point',
      capabilityCurve: [{ flowRateM3s: 0.001, availableConcretePressurePa: availablePressurePa }],
    },
  };
}

describe('TOLUE pumpability decision v1', () => {
  it('reports pressure-only acceptability without claiming stability or blockage safety', () => {
    const run = executeSimulationRun(input(5_000_000));
    const decision = assessPumpabilityDecision(run);

    expect(decision.pressureFeasibility).toBe('PASS');
    expect(decision.status).toBe('PRESSURE_ONLY_ACCEPTABLE');
    expect(decision.stability).toBe('NOT_ASSESSED');
    expect(decision.blockageRisk).toBe('NOT_ASSESSED');
    expect(decision.limitations.some(text => text.includes('not a complete pumpability'))).toBe(true);
  });

  it('fails on exact negative pressure capability without inventing a secondary threshold', () => {
    const run = executeSimulationRun(input(1));
    const decision = assessPumpabilityDecision(run);

    expect(decision.pressureFeasibility).toBe('FAIL');
    expect(decision.status).toBe('FAIL_PRESSURE');
    expect(decision.stability).toBe('NOT_ASSESSED');
    expect(decision.blockageRisk).toBe('NOT_ASSESSED');
  });

  it('returns insufficient data when pump capability is absent', () => {
    const { pumpCapability: _removed, ...withoutPump } = input(5_000_000);
    const run = executeSimulationRun(withoutPump);
    const decision = assessPumpabilityDecision(run);

    expect(decision.pressureFeasibility).toBe('INSUFFICIENT_DATA');
    expect(decision.status).toBe('INSUFFICIENT_DATA');
  });

  it('is deterministic and preserves source method traceability', () => {
    const run = executeSimulationRun(input(5_000_000));
    const a = assessPumpabilityDecision(run);
    const b = assessPumpabilityDecision(run);
    expect(a).toEqual(b);
    expect(a.sourceMethodIds).toEqual(run.methods);
    expect(a.method).toBe('tolue-pumpability-decision-v1');
  });
});
