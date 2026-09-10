import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { updateRheologyInputDraft } from './engineeringInputDraft';

const fixture = (): SimulationRunInput => ({
  runId: 'run-b3',
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
});

describe('engineering input draft', () => {
  it('updates one rheology value without mutating the source input', () => {
    const source = fixture();
    const next = updateRheologyInputDraft(source, 'bulk.yieldStressPa', 95);
    expect(next.pipeline.bulk.yieldStressPa).toBe(95);
    expect(source.pipeline.bulk.yieldStressPa).toBe(80);
    expect(next.pipeline.lubricationLayer.plasticViscosityPaS).toBe(5);
  });

  it('rejects non-finite and domain-invalid values before session update', () => {
    const source = fixture();
    expect(() => updateRheologyInputDraft(source, 'bulk.yieldStressPa', -1)).toThrow('ENGINEERING-INPUT-DRAFT-YIELD-001');
    expect(() => updateRheologyInputDraft(source, 'bulk.plasticViscosityPaS', 0)).toThrow('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');
    expect(() => updateRheologyInputDraft(source, 'bulk.yieldStressPa', Number.NaN)).toThrow('ENGINEERING-INPUT-DRAFT-NUMBER-001');
  });
});
