import { describe, expect, it } from 'vitest';
import { flowRateForTwoFluidBingham, solveTwoFluidBingham } from './twoFluidBingham';

const newtonian = { yieldStressPa: 0, plasticViscosityPaS: 1 };

describe('two-fluid Bingham coaxial solver', () => {
  it('collapses to Hagen-Poiseuille when both domains are the same Newtonian fluid', () => {
    const R = 0.0625;
    const G = 1668.860303;
    const result = flowRateForTwoFluidBingham({
      pressureGradientPaPerM: G,
      pipeRadiusM: R,
      lubricationLayerThicknessM: 0.004,
      bulk: newtonian,
      lubricationLayer: newtonian,
    });
    const expected = Math.PI * Math.pow(R, 4) * G / 8;
    expect(result.flowRateM3s).toBeCloseTo(expected, 7);
  });

  it('is invariant to arbitrary interface position when both fluids are identical', () => {
    const common = { yieldStressPa: 35, plasticViscosityPaS: 18 };
    const base = {
      pressureGradientPaPerM: 5000,
      pipeRadiusM: 0.0625,
      bulk: common,
      lubricationLayer: common,
    };
    const a = flowRateForTwoFluidBingham({ ...base, lubricationLayerThicknessM: 0.002 });
    const b = flowRateForTwoFluidBingham({ ...base, lubricationLayerThicknessM: 0.010 });
    expect(a.flowRateM3s).toBeCloseTo(b.flowRateM3s, 8);
  });

  it('a lower-viscosity lubrication layer increases flow at fixed pressure gradient', () => {
    const noBenefit = flowRateForTwoFluidBingham({
      pressureGradientPaPerM: 6000,
      pipeRadiusM: 0.0625,
      lubricationLayerThicknessM: 0.004,
      bulk: { yieldStressPa: 50, plasticViscosityPaS: 30 },
      lubricationLayer: { yieldStressPa: 50, plasticViscosityPaS: 30 },
    });
    const lubricated = flowRateForTwoFluidBingham({
      pressureGradientPaPerM: 6000,
      pipeRadiusM: 0.0625,
      lubricationLayerThicknessM: 0.004,
      bulk: { yieldStressPa: 50, plasticViscosityPaS: 30 },
      lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 3 },
    });
    expect(lubricated.flowRateM3s).toBeGreaterThan(noBenefit.flowRateM3s);
  });

  it('inverse solver round-trips a two-fluid forward case', () => {
    const forward = flowRateForTwoFluidBingham({
      pressureGradientPaPerM: 8000,
      pipeRadiusM: 0.0625,
      lubricationLayerThicknessM: 0.004,
      bulk: { yieldStressPa: 60, plasticViscosityPaS: 25 },
      lubricationLayer: { yieldStressPa: 8, plasticViscosityPaS: 2.5 },
    });
    const inverse = solveTwoFluidBingham({
      targetFlowRateM3s: forward.flowRateM3s,
      pipeRadiusM: 0.0625,
      lubricationLayerThicknessM: 0.004,
      bulk: { yieldStressPa: 60, plasticViscosityPaS: 25 },
      lubricationLayer: { yieldStressPa: 8, plasticViscosityPaS: 2.5 },
    });
    expect(inverse.converged).toBe(true);
    expect(inverse.pressureGradientPaPerM).toBeCloseTo(8000, 3);
  });

  it('rejects nonphysical lubrication-layer geometry', () => {
    expect(() => solveTwoFluidBingham({
      targetFlowRateM3s: 0.01,
      pipeRadiusM: 0.05,
      lubricationLayerThicknessM: 0.05,
      bulk: newtonian,
      lubricationLayer: newtonian,
    })).toThrow();
  });
});
