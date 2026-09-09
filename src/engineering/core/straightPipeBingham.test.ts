import { describe, expect, it } from 'vitest';
import { binghamFlowRateFromPressureGradient, solveStraightPipeBingham } from './straightPipeBingham';

describe('straight-pipe Bingham solver', () => {
  it('collapses exactly to Hagen-Poiseuille for zero yield stress', () => {
    const diameterM = 0.125;
    const lengthM = 100;
    const flowRateM3S = 36 / 3600;
    const viscosityPaS = 1;
    const radius = diameterM / 2;
    const expectedGradient = (8 * viscosityPaS * flowRateM3S) / (Math.PI * Math.pow(radius, 4));

    const result = solveStraightPipeBingham({
      diameterM,
      lengthM,
      flowRateM3S,
      fluid: { yieldStressPa: 0, plasticViscosityPaS: viscosityPaS },
    });

    expect(result.pressureGradientPaM).toBeCloseTo(expectedGradient, 6);
    expect(result.pressureLossPa).toBeCloseTo(expectedGradient * lengthM, 4);
    expect(result.plugRadiusRatio).toBe(0);
  });

  it('returns no flow below the yield threshold', () => {
    const q = binghamFlowRateFromPressureGradient(100, 0.1, {
      yieldStressPa: 10,
      plasticViscosityPaS: 1,
    });
    expect(q).toBe(0);
  });

  it('round-trips Q through Buckingham-Reiner inversion', () => {
    const input = {
      diameterM: 0.125,
      lengthM: 80,
      flowRateM3S: 30 / 3600,
      fluid: { yieldStressPa: 50, plasticViscosityPaS: 35 },
    };
    const result = solveStraightPipeBingham(input);
    const recoveredQ = binghamFlowRateFromPressureGradient(
      result.pressureGradientPaM,
      input.diameterM,
      input.fluid,
    );
    expect(recoveredQ).toBeCloseTo(input.flowRateM3S, 10);
    expect(result.wallShearStressPa).toBeGreaterThan(input.fluid.yieldStressPa);
    expect(result.plugRadiusRatio).toBeGreaterThan(0);
    expect(result.plugRadiusRatio).toBeLessThan(1);
  });

  it('rejects physically invalid inputs instead of silently defaulting', () => {
    expect(() => solveStraightPipeBingham({
      diameterM: 0,
      lengthM: 10,
      flowRateM3S: 0.01,
      fluid: { yieldStressPa: 20, plasticViscosityPaS: 10 },
    })).toThrow(RangeError);
  });
});
