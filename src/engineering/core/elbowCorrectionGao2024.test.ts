import { describe, expect, it } from 'vitest';
import {
  evaluateGao2024ElbowCorrection,
  meanVelocityFromFlowRateM3H,
  sourceDomainVelocityRangeMS,
} from './elbowCorrectionGao2024';

const D = 0.125;
const v40 = meanVelocityFromFlowRateM3H({ flowRateM3H: 40, pipeInnerDiameterM: D });
const v120 = meanVelocityFromFlowRateM3H({ flowRateM3H: 120, pipeInnerDiameterM: D });

describe('Gao 2024 elbow correction factor', () => {
  it('reproduces EV-001 flow conversion identity', () => {
    expect(v40).toBeCloseTo(0.9054147873672269, 12);
  });

  it('reproduces EV-002 horizontal bend regression', () => {
    const result = evaluateGao2024ElbowCorrection({
      bendRadiusMm: 195,
      inclinationDeg: 0,
      meanVelocityMS: v40,
    });
    expect(result.lambda).toBeCloseTo(1.841502812495452, 12);
    expect(result.validationStatus).toBe('candidate');
  });

  it('reproduces EV-003 positive inclination case', () => {
    const result = evaluateGao2024ElbowCorrection({
      bendRadiusMm: 195,
      inclinationDeg: 90,
      meanVelocityMS: v40,
    });
    expect(result.lambda).toBeCloseTo(2.592898701290463, 12);
  });

  it('reproduces EV-004 negative inclination case', () => {
    const result = evaluateGao2024ElbowCorrection({
      bendRadiusMm: 195,
      inclinationDeg: -90,
      meanVelocityMS: v40,
    });
    expect(result.lambda).toBeCloseTo(1.0901069237004413, 12);
  });

  it('reproduces EV-005 upper flow case', () => {
    const result = evaluateGao2024ElbowCorrection({
      bendRadiusMm: 195,
      inclinationDeg: 90,
      meanVelocityMS: v120,
    });
    expect(result.lambda).toBeCloseTo(4.4448341073713875, 12);
  });

  it('reproduces EV-006 alternate source-domain corner', () => {
    const result = evaluateGao2024ElbowCorrection({
      bendRadiusMm: 355,
      inclinationDeg: -90,
      meanVelocityMS: v120,
    });
    expect(result.lambda).toBeCloseTo(4.746506233267487, 12);
  });

  it('preserves published directional consistency for source-domain cases', () => {
    const negative = evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: -90, meanVelocityMS: v40 }).lambda;
    const horizontal = evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: 0, meanVelocityMS: v40 }).lambda;
    const positive = evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: 90, meanVelocityMS: v40 }).lambda;
    expect(negative).toBeLessThan(horizontal);
    expect(horizontal).toBeLessThan(positive);
  });

  it('rejects source-domain extrapolation instead of silently evaluating', () => {
    const velocityRange = sourceDomainVelocityRangeMS();
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 194.999, inclinationDeg: 0, meanVelocityMS: v40 })).toThrow(/source domain/);
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 355.001, inclinationDeg: 0, meanVelocityMS: v40 })).toThrow(/source domain/);
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: 90.001, meanVelocityMS: v40 })).toThrow(/source domain/);
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: 0, meanVelocityMS: velocityRange.min - 1e-6 })).toThrow(/source domain/);
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: 0, meanVelocityMS: velocityRange.max + 1e-6 })).toThrow(/source domain/);
  });

  it('does not accept metre/radian values as if they matched source regression units', () => {
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 0.195, inclinationDeg: 0, meanVelocityMS: v40 })).toThrow(/source domain/);
    expect(() => evaluateGao2024ElbowCorrection({ bendRadiusMm: 195, inclinationDeg: Math.PI / 2, meanVelocityMS: v40 })).not.toThrow();
  });
});
