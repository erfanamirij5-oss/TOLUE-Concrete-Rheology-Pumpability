import { describe, expect, it } from 'vitest';
import { buildBinghamRheologyCurve } from './rheologyCurve';

describe('Bingham rheology curve', () => {
  it('computes exact positive-shear constitutive points', () => {
    const result = buildBinghamRheologyCurve({ yieldStressPa: 50, plasticViscosityPaS: 2 }, [1, 5, 10]);
    expect(result.points).toEqual([
      { shearRateSInv: 1, shearStressPa: 52 },
      { shearRateSInv: 5, shearStressPa: 60 },
      { shearRateSInv: 10, shearStressPa: 70 },
    ]);
    expect(result.method).toBe('tolue-bingham-rheology-curve-v1');
    expect(result.interpretation).toBe('positive-shear-rate-constitutive-line');
    expect(Object.isFrozen(result.points)).toBe(true);
  });

  it('fails closed for zero, negative, or unsorted sampling rates', () => {
    expect(() => buildBinghamRheologyCurve({ yieldStressPa: 0, plasticViscosityPaS: 1 }, [0, 1])).toThrow();
    expect(() => buildBinghamRheologyCurve({ yieldStressPa: 0, plasticViscosityPaS: 1 }, [5, 1])).toThrow();
  });
});
