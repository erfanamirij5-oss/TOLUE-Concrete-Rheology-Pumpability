import { describe, expect, it } from 'vitest';
import { evaluateProjectQualifiedPumpabilityEvidence } from './projectQualifiedPumpabilityEvidence';

const base = {
  domain: 'stability' as const,
  projectId: 'PROJECT-001',
  evidenceId: 'STABILITY-EVIDENCE-001',
  provenanceEntityId: 'PROV-STABILITY-001',
  methodId: 'project-qualified-stability-test-v1',
  referenceIds: ['LAB-REPORT-001'],
  outcome: 'ACCEPTABLE' as const,
  qualifiedFlowRangeM3s: { min: 0.0005, max: 0.0015 },
  targetFlowRateM3s: 0.001,
  applicabilityStatement: 'Qualified only for PROJECT-001 within the tested flow interval.',
  limitations: ['No transfer to another project without independent qualification.'],
};

describe('project-qualified pumpability evidence v1', () => {
  it('admits exact in-domain project evidence without creating a universal model', () => {
    const result = evaluateProjectQualifiedPumpabilityEvidence(base);
    expect(result.status).toBe('APPLICABLE');
    expect(result.outcome).toBe('ACCEPTABLE');
    expect(result.projectId).toBe('PROJECT-001');
    expect(result.method).toBe('tolue-project-qualified-pumpability-evidence-v1');
  });

  it('fails closed outside the qualified flow domain and does not extrapolate outcome', () => {
    const result = evaluateProjectQualifiedPumpabilityEvidence({ ...base, targetFlowRateM3s: 0.002 });
    expect(result.status).toBe('OUT_OF_DOMAIN');
    expect(result.outcome).toBeNull();
  });

  it('supports blockage evidence as a separate domain rather than inferring it from pressure', () => {
    const result = evaluateProjectQualifiedPumpabilityEvidence({
      ...base,
      domain: 'blockage',
      evidenceId: 'BLOCKAGE-EVIDENCE-001',
      provenanceEntityId: 'PROV-BLOCKAGE-001',
      methodId: 'project-qualified-blockage-test-v1',
      outcome: 'UNACCEPTABLE',
    });
    expect(result.domain).toBe('blockage');
    expect(result.outcome).toBe('UNACCEPTABLE');
  });

  it('rejects malformed identity and domain metadata', () => {
    expect(() => evaluateProjectQualifiedPumpabilityEvidence({ ...base, evidenceId: '' })).toThrow(/evidenceId/);
    expect(() => evaluateProjectQualifiedPumpabilityEvidence({
      ...base,
      qualifiedFlowRangeM3s: { min: 0.002, max: 0.001 },
    })).toThrow(/qualified flow range/);
  });

  it('is deterministic and preserves evidence arrays by value', () => {
    const a = evaluateProjectQualifiedPumpabilityEvidence(base);
    const b = evaluateProjectQualifiedPumpabilityEvidence(base);
    expect(a).toEqual(b);
    expect(a.referenceIds).not.toBe(base.referenceIds);
    expect(a.limitations).not.toBe(base.limitations);
  });
});
