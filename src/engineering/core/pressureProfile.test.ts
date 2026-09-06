import { describe, expect, it } from 'vitest';
import { buildPressureProfile } from './pressureProfile';

const material = { yieldStressPa: 0, plasticViscosityPaS: 1 };

function baseInput() {
  return {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0,
    bulk: material,
    lubricationLayer: material,
  } as const;
}

describe('TOLUE pressure profile', () => {
  it('uses outlet as zero gauge reference and inlet equals required route pressure', () => {
    const result = buildPressureProfile({
      ...baseInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'S2', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: 0 },
      ],
    });
    expect(result.completeness).toBe('complete');
    expect(result.points.at(-1)!.remainingRequiredPressurePa).toBe(0);
    expect(result.points[0]!.remainingRequiredPressurePa).toBeCloseTo(result.pipeline.requiredPressurePa!, 8);
    expect(result.points[0]!.positionM).toBe(0);
    expect(result.points[1]!.positionM).toBe(10);
    expect(result.points[2]!.positionM).toBe(30);
  });

  it('isolates vertical head in the route profile', () => {
    const result = buildPressureProfile({
      ...baseInput(),
      segments: [{ id: 'UP', kind: 'straight', lengthM: 50, pipeRadiusM: 0.0625, elevationChangeM: 50 }],
    });
    expect(result.points[1]!.elevationM).toBe(50);
    expect(result.pipeline.elevationPressurePa).toBeCloseTo(1_176_798, 6);
    expect(result.points[0]!.remainingRequiredPressurePa).toBeCloseTo(result.pipeline.requiredPressurePa!, 8);
  });

  it('does not bridge an unsupported local loss with a fake zero', () => {
    const result = buildPressureProfile({
      ...baseInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'E1', kind: 'elbow', elevationChangeM: 0 },
        { id: 'S2', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
      ],
    });
    expect(result.completeness).toBe('incomplete');
    expect(result.pipeline.requiredPressurePa).toBeNull();
    expect(result.points[0]!.remainingRequiredPressurePa).toBeNull();
    expect(result.peakRequiredPressurePa).toBeNull();
  });

  it('is deterministic for identical input', () => {
    const input = {
      ...baseInput(),
      segments: [{ id: 'S1', kind: 'straight', lengthM: 100, pipeRadiusM: 0.0625, elevationChangeM: 10 }],
    } as const;
    const a = buildPressureProfile({ ...input, segments: [...input.segments] });
    const b = buildPressureProfile({ ...input, segments: [...input.segments] });
    expect(a).toEqual(b);
  });
});
