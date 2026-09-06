import { describe, expect, it } from 'vitest';
import { analyzePipeline, elevationPressurePa } from './pipeline';

const bulk = { yieldStressPa: 80, plasticViscosityPaS: 30 };
const lubricationLayer = { yieldStressPa: 5, plasticViscosityPaS: 2 };

describe('elevation pressure', () => {
  it('G07 computes rho*g*dz with positive upward sign', () => {
    expect(elevationPressurePa(2400, 10)).toBeCloseTo(235359.6, 6);
  });
  it('preserves sign for downward elevation', () => {
    expect(elevationPressurePa(2400, -10)).toBeCloseTo(-235359.6, 6);
  });
});

describe('pipeline pressure aggregation', () => {
  it('aggregates validated straight friction and elevation contributions', () => {
    const result = analyzePipeline({
      targetFlowRateM3s: 0.01,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.003,
      bulk,
      lubricationLayer,
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'S2', kind: 'straight', lengthM: 30, pipeRadiusM: 0.0625, elevationChangeM: 10 },
      ],
    });
    expect(result.completeness).toBe('complete');
    expect(result.requiredPressurePa).not.toBeNull();
    expect(result.elevationPressurePa).toBeCloseTo(235359.6, 6);
    expect(result.straightFrictionPressurePa).toBeGreaterThan(0);
    expect(result.requiredPressurePa!).toBeCloseTo(result.straightFrictionPressurePa + result.elevationPressurePa, 6);
  });

  it('never treats an unsupported elbow loss as zero', () => {
    const result = analyzePipeline({
      targetFlowRateM3s: 0.01,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.003,
      bulk,
      lubricationLayer,
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'E1', kind: 'elbow', elevationChangeM: 2 },
      ],
    });
    expect(result.completeness).toBe('incomplete');
    expect(result.requiredPressurePa).toBeNull();
    expect(result.segments[1]!.frictionPressurePa).toBeNull();
    expect(result.segments[1]!.status).toBe('not_computed');
  });
});
