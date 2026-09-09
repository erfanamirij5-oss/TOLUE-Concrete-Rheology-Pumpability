import { describe, expect, it } from 'vitest';
import { analyzePipeline, PipelineAnalysisInput } from './pipeline';
import { buildPressureProfile } from './pressureProfile';

const material = { yieldStressPa: 0, plasticViscosityPaS: 1 };

function baseInput(): Omit<PipelineAnalysisInput, 'segments'> {
  return {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0,
    bulk: material,
    lubricationLayer: material,
  };
}

describe('TOLUE pressure profile', () => {
  it('uses outlet as zero gauge reference and inlet equals required route pressure', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'S2', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: 0 },
      ],
    };
    const pipeline = analyzePipeline(input);
    const result = buildPressureProfile(input, pipeline);
    expect(result.pipeline).toBe(pipeline);
    expect(result.completeness).toBe('complete');
    expect(result.points.at(-1)!.remainingRequiredPressurePa).toBe(0);
    expect(result.points[0]!.remainingRequiredPressurePa).toBeCloseTo(pipeline.requiredPressurePa!, 8);
    expect(result.points[0]!.positionM).toBe(0);
    expect(result.points[1]!.positionM).toBe(10);
    expect(result.points[2]!.positionM).toBe(30);
  });

  it('isolates vertical head in the route profile', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [{ id: 'UP', kind: 'straight', lengthM: 50, pipeRadiusM: 0.0625, elevationChangeM: 50 }],
    };
    const pipeline = analyzePipeline(input);
    const result = buildPressureProfile(input, pipeline);
    expect(result.points[1]!.elevationM).toBe(50);
    expect(pipeline.elevationPressurePa).toBeCloseTo(1_176_798, 6);
    expect(result.points[0]!.remainingRequiredPressurePa).toBeCloseTo(pipeline.requiredPressurePa!, 8);
  });

  it('propagates calibrated local-loss identity without re-solving it', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        {
          id: 'E1', kind: 'elbow', elevationChangeM: 0,
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
    };
    const pipeline = analyzePipeline(input);
    const result = buildPressureProfile(input, pipeline);
    const point = result.points[2]!;
    expect(result.completeness).toBe('complete');
    expect(point.pressureMethod).toBe('project-calibrated-local-loss');
    expect(point.calibrationId).toBe('LOCAL-CAL-001');
    expect(point.provenanceEntityId).toBe('LOCAL-EVIDENCE-001');
    expect(point.remainingRequiredPressurePa).toBe(0);
  });

  it('does not bridge an unsupported local loss with a fake zero', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'E1', kind: 'elbow', elevationChangeM: 0 },
        { id: 'S2', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
      ],
    };
    const pipeline = analyzePipeline(input);
    const result = buildPressureProfile(input, pipeline);
    expect(result.completeness).toBe('incomplete');
    expect(pipeline.requiredPressurePa).toBeNull();
    expect(result.points[0]!.remainingRequiredPressurePa).toBeNull();
    expect(result.peakRequiredPressurePa).toBeNull();
  });

  it('rejects route/result identity divergence instead of silently recomputing', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 }],
    };
    const pipeline = analyzePipeline(input);
    const mismatchedInput: PipelineAnalysisInput = {
      ...input,
      segments: [{ ...input.segments[0]!, id: 'S2' }],
    };
    expect(() => buildPressureProfile(mismatchedInput, pipeline)).toThrow(/identity mismatch/);
  });

  it('is deterministic for identical computed pipeline data', () => {
    const input: PipelineAnalysisInput = {
      ...baseInput(),
      segments: [{ id: 'S1', kind: 'straight', lengthM: 100, pipeRadiusM: 0.0625, elevationChangeM: 10 }],
    };
    const pipeline = analyzePipeline(input);
    const a = buildPressureProfile(input, pipeline);
    const b = buildPressureProfile(input, pipeline);
    expect(a).toEqual(b);
  });
});
