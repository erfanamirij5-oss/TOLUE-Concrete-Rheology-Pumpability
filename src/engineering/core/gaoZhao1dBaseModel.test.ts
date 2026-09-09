import { describe, expect, it } from 'vitest';
import {
  equivalentLubricationDiameterM,
  evaluateGaoZhaoBaseState,
  gaoZhaoReynoldsNumber,
  literalEquation27PressureGradientPaPerM,
  modiFrictionCoefficient,
  mortarKinematicViscosityM2S,
  relativeAggregateRoughness,
} from './gaoZhao1dBaseModel';

describe('Gao/Zhao one-dimensional base-model primitives', () => {
  it('reproduces the published equivalent lubrication diameter', () => {
    expect(equivalentLubricationDiameterM(0.00209)).toBeCloseTo(0.00418, 12);
  });

  it('reproduces source relative roughness from K=15.8 mm and de=4.18 mm', () => {
    expect(relativeAggregateRoughness(0.0158, 0.00418)).toBeCloseTo(3.7799, 4);
  });

  it('reproduces the published Reynolds number and Modi friction coefficient to source rounding', () => {
    const sourceRoundedVelocityMS = 0.951;
    const nu = mortarKinematicViscosityM2S(2.5, 2100);
    const re = gaoZhaoReynoldsNumber(sourceRoundedVelocityMS, 0.00418, nu);
    const kd = relativeAggregateRoughness(0.0158, 0.00418);
    const lambda = modiFrictionCoefficient(kd, re);

    expect(re).toBeCloseTo(3.3392, 3);
    expect(lambda).toBeCloseTo(0.4021, 3);
  });

  it('locks the literal Equation 27 reproduction mismatch instead of hiding a factor', () => {
    const literalGradient = literalEquation27PressureGradientPaPerM(0.4021, 2100, 0.951, 0.00418);
    const publishedGradient = 0.02284e6;

    expect(literalGradient).toBeCloseTo(91_349.91009688996, 6);
    expect(literalGradient / publishedGradient).toBeCloseTo(3.9995582354154976, 6);
  });

  it('evaluates the same published state deterministically', () => {
    const input = {
      meanVelocityMS: 0.951,
      lubricationLayerThicknessM: 0.00209,
      mortarDensityKgM3: 2100,
      mortarDynamicViscosityPaS: 2.5,
      equivalentAggregateDiameterM: 0.0158,
    };

    expect(evaluateGaoZhaoBaseState(input)).toEqual(evaluateGaoZhaoBaseState(input));
  });

  it('rejects non-physical inputs', () => {
    expect(() => equivalentLubricationDiameterM(0)).toThrow();
    expect(() => mortarKinematicViscosityM2S(-1, 2100)).toThrow();
    expect(() => gaoZhaoReynoldsNumber(1, 0.00418, 0)).toThrow();
    expect(() => relativeAggregateRoughness(0.0158, -0.00418)).toThrow();
    expect(() => modiFrictionCoefficient(1, 0)).toThrow();
    expect(() => literalEquation27PressureGradientPaPerM(0, 2100, 0.951, 0.00418)).toThrow();
  });
});
