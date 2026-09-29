import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { getPumpabilityEvidenceDraft, removePumpabilityEvidenceDraft, setPumpabilityEvidenceDraft } from './evidenceInputDraft';

const fixture = (): SimulationRunInput => ({
  runId: 'run-evidence',
  engineVersion: '1.1.0-rc.3',
  createdAtIso: '2026-09-11T12:00:00.000Z',
  pipeline: {
    targetFlowRateM3s: 0.02,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 80, plasticViscosityPaS: 50 },
    lubricationLayer: { yieldStressPa: 10, plasticViscosityPaS: 5 },
    segments: [],
  },
});

const evidence = () => ({
  projectId: 'PRJ-101',
  evidenceId: 'STAB-01',
  provenanceEntityId: 'prov-stab-01',
  methodId: 'field-test-v1',
  referenceIds: ['REPORT-17'],
  outcome: 'ACCEPTABLE' as const,
  qualifiedFlowRangeM3s: { min: 0.01, max: 0.03 },
  applicabilityStatement: 'Applicable only to the documented project mix, route and pumping configuration.',
  limitations: ['No extrapolation outside the qualified flow range.'],
});

describe('project pumpability evidence draft authoring', () => {
  it('stores explicit stability evidence without mutating the source input', () => {
    const source = fixture();
    const next = setPumpabilityEvidenceDraft(source, 'stability', evidence());
    expect(next.pumpabilityEvidence?.stability?.evidenceId).toBe('STAB-01');
    expect(source.pumpabilityEvidence).toBeUndefined();
  });

  it('allows documented out-of-domain evidence to remain stored without extrapolating it', () => {
    const source = fixture();
    const record = evidence();
    record.qualifiedFlowRangeM3s = { min: 0.03, max: 0.04 };
    const next = setPumpabilityEvidenceDraft(source, 'stability', record);
    expect(next.pumpabilityEvidence?.stability?.qualifiedFlowRangeM3s.min).toBe(0.03);
  });

  it('rejects malformed evidence before it enters the session draft', () => {
    const source = fixture();
    const record = evidence();
    record.methodId = '   ';
    expect(() => setPumpabilityEvidenceDraft(source, 'stability', record)).toThrow('methodId must not be empty');
  });

  it('authors stability and blockage independently', () => {
    const source = fixture();
    const withStability = setPumpabilityEvidenceDraft(source, 'stability', evidence());
    const blockage = { ...evidence(), evidenceId: 'BLK-01', provenanceEntityId: 'prov-blk-01', outcome: 'UNACCEPTABLE' as const };
    const withBoth = setPumpabilityEvidenceDraft(withStability, 'blockage', blockage);
    expect(withBoth.pumpabilityEvidence?.stability?.evidenceId).toBe('STAB-01');
    expect(withBoth.pumpabilityEvidence?.blockage?.evidenceId).toBe('BLK-01');
  });

  it('removes one domain without deleting the other and removes the empty container last', () => {
    const source = setPumpabilityEvidenceDraft(setPumpabilityEvidenceDraft(fixture(), 'stability', evidence()), 'blockage', {
      ...evidence(), evidenceId: 'BLK-01', provenanceEntityId: 'prov-blk-01',
    });
    const one = removePumpabilityEvidenceDraft(source, 'stability');
    expect(one.pumpabilityEvidence?.stability).toBeUndefined();
    expect(one.pumpabilityEvidence?.blockage).toBeDefined();
    const none = removePumpabilityEvidenceDraft(one, 'blockage');
    expect(none.pumpabilityEvidence).toBeUndefined();
  });

  it('returns a detached evidence record for editing', () => {
    const source = setPumpabilityEvidenceDraft(fixture(), 'stability', evidence());
    const current = getPumpabilityEvidenceDraft(source, 'stability');
    expect(current?.referenceIds).toEqual(['REPORT-17']);
    expect(current).not.toBe(source.pumpabilityEvidence?.stability);
  });
});
