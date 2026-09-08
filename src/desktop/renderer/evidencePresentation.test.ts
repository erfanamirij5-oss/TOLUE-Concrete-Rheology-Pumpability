import { describe, expect, it } from 'vitest';
import { createEvidencePresentation } from './evidencePresentation';

describe('project-qualified evidence presentation boundary', () => {
  it('preserves applicable evidence domain and traceability', () => {
    const presentation = createEvidencePresentation({
      domain: 'stability',
      status: 'APPLICABLE',
      outcome: 'ACCEPTABLE',
      projectId: 'project-1',
      evidenceId: 'evidence-1',
      provenanceEntityId: 'entity-1',
      methodId: 'method-1',
      referenceIds: ['ref-1'],
      targetFlowRateM3s: 0.01,
      qualifiedFlowRangeM3s: { min: 0.005, max: 0.015 },
      applicabilityStatement: 'Qualified only for the declared project flow range.',
      limitations: ['Not universal.'],
      method: 'tolue-project-qualified-pumpability-evidence-v1',
    });

    expect(presentation.status).toBe('APPLICABLE');
    expect(presentation.outcome).toBe('ACCEPTABLE');
    expect(presentation.methodId).toBe('method-1');
    expect(Object.isFrozen(presentation.referenceIds)).toBe(true);
    expect(Object.isFrozen(presentation.qualifiedFlowRangeM3s)).toBe(true);
  });

  it('preserves OUT_OF_DOMAIN null outcome without extrapolation', () => {
    const presentation = createEvidencePresentation({
      domain: 'blockage',
      status: 'OUT_OF_DOMAIN',
      outcome: null,
      projectId: 'project-1',
      evidenceId: 'evidence-2',
      provenanceEntityId: 'entity-2',
      methodId: 'method-2',
      referenceIds: [],
      targetFlowRateM3s: 0.03,
      qualifiedFlowRangeM3s: { min: 0.005, max: 0.015 },
      applicabilityStatement: 'Qualified only inside the measured domain.',
      limitations: ['No extrapolation.'],
      method: 'tolue-project-qualified-pumpability-evidence-v1',
    });

    expect(presentation.status).toBe('OUT_OF_DOMAIN');
    expect(presentation.outcome).toBeNull();
  });
});
