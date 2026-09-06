import { describe, expect, it } from 'vitest';
import { inputSnapshotFingerprint } from './resultCenter';
import { validateEngineeringResult } from './engineeringResult';

describe('Engineering Result provenance contract', () => {
  it('creates deterministic fingerprints independent of object key order', () => {
    const a = inputSnapshotFingerprint({ flow: 0.01, pipe: { radius: 0.0625, length: 100 } });
    const b = inputSnapshotFingerprint({ pipe: { length: 100, radius: 0.0625 }, flow: 0.01 });
    expect(a).toBe(b);
    expect(a.startsWith('fnv1a32:')).toBe(true);
  });

  it('changes fingerprint when an engineering input changes', () => {
    expect(inputSnapshotFingerprint({ flow: 0.01 })).not.toBe(inputSnapshotFingerprint({ flow: 0.011 }));
  });

  it('keeps scientific validation and evidence documentation as independent dimensions', () => {
    const result = {
      id: 'pressure', label: 'Pressure', value: 1, unit: 'Pa',
      resultClass: 'PHYSICAL_MODEL' as const, methodId: 'model-v1', methodVersion: '0.1.0',
      referenceIds: [], standardEditionIds: [], applicability: 'test', assumptions: [], limitations: [],
      validationStatus: 'candidate' as const, evidenceStatus: 'DOCUMENTED' as const,
      inputSnapshotHash: 'fnv1a32:12345678', sourceRunId: 'run-1',
    };
    expect(() => validateEngineeringResult(result)).not.toThrow();
    expect(result.validationStatus).toBe('candidate');
    expect(result.evidenceStatus).toBe('DOCUMENTED');
  });

  it('rejects a result without traceability identity', () => {
    expect(() => validateEngineeringResult({
      id: 'pressure', label: 'Pressure', value: 1, unit: 'Pa',
      resultClass: 'PHYSICAL_MODEL', methodId: '', methodVersion: '0.1.0',
      referenceIds: [], standardEditionIds: [], applicability: 'test', assumptions: [], limitations: [],
      validationStatus: 'candidate', evidenceStatus: 'NOT_ASSESSED', inputSnapshotHash: 'fnv1a32:12345678', sourceRunId: 'run-1',
    })).toThrow(/methodId/);
  });
});
