import { describe, expect, it } from 'vitest';
import { assessPumpabilityEvidenceReadiness } from './pumpabilityEvidenceReadiness';

const evidence = () => ({
  stability: {
    projectId: 'PRJ-1', evidenceId: 'E-1', provenanceEntityId: 'P-1', methodId: 'M-1',
    referenceIds: ['R-1'], outcome: 'ACCEPTABLE' as const,
    qualifiedFlowRangeM3s: { min: 0.01, max: 0.03 },
    applicabilityStatement: 'Project-specific qualified evidence.', limitations: [],
  },
});

describe('pumpability evidence readiness', () => {
  it('accepts structurally valid in-domain evidence without findings', () => {
    expect(assessPumpabilityEvidenceReadiness(evidence(), 0.02).findings).toEqual([]);
  });

  it('warns instead of extrapolating out-of-domain evidence', () => {
    const result = assessPumpabilityEvidenceReadiness(evidence(), 0.05);
    expect(result.findings[0]?.severity).toBe('warning');
    expect(result.findings[0]?.ruleId).toBe('RG-EVIDENCE-DOMAIN-001');
  });

  it('blocks malformed evidence before the decision layer executes', () => {
    const malformed = evidence();
    malformed.stability.methodId = '';
    const result = assessPumpabilityEvidenceReadiness(malformed, 0.02);
    expect(result.findings[0]?.severity).toBe('blocking');
    expect(result.findings[0]?.ruleId).toBe('RG-EVIDENCE-INTEGRITY-001');
  });
});
