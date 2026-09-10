import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { updatePipelineScalarDraft, updatePumpCapabilityPointDraft, updateRheologyInputDraft, updateStraightSegmentDraft } from './engineeringInputDraft';

const fixture = (): SimulationRunInput => ({
  runId: 'run-b4',
  engineVersion: '1.0.0',
  createdAtIso: '2026-09-10T12:00:00.000Z',
  pipeline: {
    targetFlowRateM3s: 0.02,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 80, plasticViscosityPaS: 50 },
    lubricationLayer: { yieldStressPa: 10, plasticViscosityPaS: 5 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 20, pipeRadiusM: 0.05, elevationChangeM: 0 }],
  },
  pumpCapability: {
    provenance: 'manufacturer_curve',
    capabilityCurve: [
      { flowRateM3s: 0.01, availableConcretePressurePa: 10_000_000 },
      { flowRateM3s: 0.03, availableConcretePressurePa: 8_000_000 },
    ],
  },
});

describe('engineering input draft', () => {
  it('updates one rheology value without mutating the source input', () => {
    const source = fixture();
    const next = updateRheologyInputDraft(source, 'bulk.yieldStressPa', 95);
    expect(next.pipeline.bulk.yieldStressPa).toBe(95);
    expect(source.pipeline.bulk.yieldStressPa).toBe(80);
    expect(next.pipeline.lubricationLayer.plasticViscosityPaS).toBe(5);
  });

  it('rejects non-finite and domain-invalid rheology values', () => {
    const source = fixture();
    expect(() => updateRheologyInputDraft(source, 'bulk.yieldStressPa', -1)).toThrow('ENGINEERING-INPUT-DRAFT-YIELD-001');
    expect(() => updateRheologyInputDraft(source, 'bulk.plasticViscosityPaS', 0)).toThrow('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');
    expect(() => updateRheologyInputDraft(source, 'bulk.yieldStressPa', Number.NaN)).toThrow('ENGINEERING-INPUT-DRAFT-NUMBER-001');
  });

  it('updates pipeline scalars and straight-segment geometry immutably', () => {
    const source = fixture();
    const flow = updatePipelineScalarDraft(source, 'targetFlowRateM3s', 0.025);
    const radius = updateStraightSegmentDraft(flow, 0, 'pipeRadiusM', 0.06);
    expect(radius.pipeline.targetFlowRateM3s).toBe(0.025);
    expect((radius.pipeline.segments[0] as { pipeRadiusM: number }).pipeRadiusM).toBe(0.06);
    expect(source.pipeline.targetFlowRateM3s).toBe(0.02);
    expect((source.pipeline.segments[0] as { pipeRadiusM: number }).pipeRadiusM).toBe(0.05);
  });

  it('mirrors existing core geometry and density constraints', () => {
    const source = fixture();
    expect(() => updatePipelineScalarDraft(source, 'densityKgM3', 0)).toThrow('ENGINEERING-INPUT-DRAFT-DENSITY-001');
    expect(() => updatePipelineScalarDraft(source, 'lubricationLayerThicknessM', 0.05)).toThrow('ENGINEERING-INPUT-DRAFT-LAYER-RADIUS-001');
    expect(() => updateStraightSegmentDraft(source, 0, 'lengthM', 0)).toThrow('ENGINEERING-INPUT-DRAFT-LENGTH-001');
    expect(() => updateStraightSegmentDraft(source, 0, 'pipeRadiusM', 0.002)).toThrow('ENGINEERING-INPUT-DRAFT-RADIUS-LAYER-001');
  });

  it('updates verified pump-curve points and preserves strict flow ordering', () => {
    const source = fixture();
    const next = updatePumpCapabilityPointDraft(source, 1, 'availableConcretePressurePa', 8_500_000);
    expect(next.pumpCapability?.capabilityCurve[1]?.availableConcretePressurePa).toBe(8_500_000);
    expect(source.pumpCapability?.capabilityCurve[1]?.availableConcretePressurePa).toBe(8_000_000);
    expect(() => updatePumpCapabilityPointDraft(source, 1, 'flowRateM3s', 0.005)).toThrow('ENGINEERING-INPUT-DRAFT-PUMP-ORDER-001');
  });
});
