import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { DRAFT_PLACEHOLDER_ASSUMPTION } from '../../engineering/core/readinessGate';
import { confirmStarterDraftInputs, hasStarterDraftPlaceholder } from './draftIntegrity';

function fixture(): SimulationRunInput {
  return {
    runId: 'draft-001',
    engineVersion: 'v1.1.0-rc.3',
    createdAtIso: '2026-09-11T12:00:00.000Z',
    pipeline: {
      targetFlowRateM3s: 0.01,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.001,
      bulk: { yieldStressPa: 50, plasticViscosityPaS: 10 },
      lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 1 },
      segments: [],
    },
    assumptions: [DRAFT_PLACEHOLDER_ASSUMPTION, 'Project-specific ordinary assumption'],
  };
}

describe('starter draft integrity', () => {
  it('detects the exact starter placeholder marker', () => {
    expect(hasStarterDraftPlaceholder(fixture())).toBe(true);
    const input = fixture();
    input.assumptions = ['Project-specific ordinary assumption'];
    expect(hasStarterDraftPlaceholder(input)).toBe(false);
  });

  it('requires explicit acknowledgement before clearing the marker', () => {
    expect(() => confirmStarterDraftInputs(fixture(), false)).toThrow('DRAFT-INTEGRITY-ACK-001');
  });

  it('removes only the starter marker and preserves ordinary assumptions without mutating source', () => {
    const source = fixture();
    const next = confirmStarterDraftInputs(source, true);
    expect(next.assumptions).toEqual(['Project-specific ordinary assumption']);
    expect(source.assumptions).toContain(DRAFT_PLACEHOLDER_ASSUMPTION);
  });

  it('refuses a meaningless second confirmation after the marker is gone', () => {
    const confirmed = confirmStarterDraftInputs(fixture(), true);
    expect(() => confirmStarterDraftInputs(confirmed, true)).toThrow('DRAFT-INTEGRITY-NO-PLACEHOLDER-001');
  });
});
