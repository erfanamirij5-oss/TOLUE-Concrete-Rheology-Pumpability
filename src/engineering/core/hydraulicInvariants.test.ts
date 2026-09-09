import { describe, expect, it } from 'vitest';
import { PipelineAnalysisInput, analyzePipeline } from './pipeline';
import { buildPressureProfile } from './pressureProfile';
import { verifyHydraulicInvariants } from './hydraulicInvariants';

const material = { yieldStressPa: 0, plasticViscosityPaS: 1 };

function completeInput(): PipelineAnalysisInput {
  return {
    targetFlowRateM3s: 0.001,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0,
    bulk: material,
    lubricationLayer: material,
    segments: [
      { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 5 },
      { id: 'S2', kind: 'straight', lengthM: 20, pipeRadiusM: 0.0625, elevationChangeM: -2 },
    ],
  };
}

describe('TOLUE hydraulic invariants', () => {
  it('accepts a complete single-source hydraulic result', () => {
    const input = completeInput();
    const pipeline = analyzePipeline(input);
    const profile = buildPressureProfile(input, pipeline);
    const result = verifyHydraulicInvariants(pipeline, profile);

    expect(result.status).toBe('consistent');
    expect(result.checkedInvariantIds).toContain('SOURCE_IDENTITY');
    expect(result.checkedInvariantIds).toContain('REQUIRED_SEGMENT_SUM');
    expect(result.checkedInvariantIds).toContain('PROFILE_STEPS');
  });

  it('accepts a complete route with project-calibrated local loss and preserves its component sum', () => {
    const input: PipelineAnalysisInput = {
      ...completeInput(),
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
    const profile = buildPressureProfile(input, pipeline);
    const result = verifyHydraulicInvariants(pipeline, profile);

    expect(result.status).toBe('consistent');
    expect(pipeline.calibratedLocalFrictionPressurePa).toBeCloseTo(20_000, 8);
    expect(result.checkedInvariantIds).toContain('CALIBRATED_LOCAL_FRICTION_SUM');
    expect(result.checkedInvariantIds).toContain('TRACEABILITY_PROPAGATION');
  });

  it('accepts explicit incomplete/null propagation without inventing local loss', () => {
    const input: PipelineAnalysisInput = {
      ...completeInput(),
      segments: [
        { id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.0625, elevationChangeM: 0 },
        { id: 'E1', kind: 'elbow', elevationChangeM: 0 },
      ],
    };
    const pipeline = analyzePipeline(input);
    const profile = buildPressureProfile(input, pipeline);
    const result = verifyHydraulicInvariants(pipeline, profile);

    expect(result.status).toBe('incomplete');
    expect(result.checkedInvariantIds).toContain('INCOMPLETE_NULL_PROPAGATION');
  });

  it('rejects a mutated required pressure instead of allowing downstream divergence', () => {
    const input = completeInput();
    const pipeline = analyzePipeline(input);
    const profile = buildPressureProfile(input, pipeline);
    const corrupted = { ...pipeline, requiredPressurePa: pipeline.requiredPressurePa! + 1000 };

    expect(() => verifyHydraulicInvariants(corrupted, { ...profile, pipeline: corrupted })).toThrow(/REQUIRED_COMPONENT_SUM/);
  });

  it('rejects a mutated pressure-profile step', () => {
    const input = completeInput();
    const pipeline = analyzePipeline(input);
    const profile = buildPressureProfile(input, pipeline);
    const corruptedProfile = {
      ...profile,
      points: profile.points.map((point, index) =>
        index === 1 && point.remainingRequiredPressurePa !== null
          ? { ...point, remainingRequiredPressurePa: point.remainingRequiredPressurePa + 1000 }
          : point,
      ),
    };

    expect(() => verifyHydraulicInvariants(pipeline, corruptedProfile)).toThrow(/PROFILE_STEP/);
  });

  it('is deterministic for identical pipeline/profile data', () => {
    const input = completeInput();
    const pipeline = analyzePipeline(input);
    const profile = buildPressureProfile(input, pipeline);

    expect(verifyHydraulicInvariants(pipeline, profile)).toEqual(verifyHydraulicInvariants(pipeline, profile));
  });
});
