import { describe, expect, it } from 'vitest';
import { createResultCenterPresentation } from './resultPresentation';

describe('result center presentation boundary', () => {
  it('preserves Core result classification, validation, evidence, and null values', () => {
    const presentation = createResultCenterPresentation({
      runId: 'run-1', engineVersion: 'v1', inputSnapshotHash: 'hash-1', warnings: ['warning'], completeness: 'incomplete', method: 'tolue-engineering-result-center-v4',
      results: [{
        id: 'pipeline.requiredPressure', label: 'Required pressure', value: null, unit: 'Pa', resultClass: 'COMPOSITE_ENGINEERING_RESULT',
        methodId: 'pipeline-method', methodVersion: 'v1', referenceIds: [], standardEditionIds: [], applicability: 'project domain', assumptions: [], limitations: ['incomplete'],
        validationStatus: 'insufficient_data', evidenceStatus: 'BLOCKED', inputSnapshotHash: 'hash-1', sourceRunId: 'run-1', provenanceEntityIds: ['entity-1'], calibrationIds: ['cal-1'],
      }],
    });
    expect(presentation.results[0]?.value).toBeNull();
    expect(presentation.results[0]?.resultClass).toBe('COMPOSITE_ENGINEERING_RESULT');
    expect(presentation.results[0]?.validationStatus).toBe('insufficient_data');
    expect(presentation.results[0]?.evidenceStatus).toBe('BLOCKED');
    expect(Object.isFrozen(presentation.results)).toBe(true);
  });

  it('preserves the Core pumpability decision axes without reclassification', () => {
    const presentation = createResultCenterPresentation({
      runId: 'run-2', engineVersion: 'v1', inputSnapshotHash: 'hash-2', warnings: [], completeness: 'complete', method: 'tolue-engineering-result-center-v4', results: [],
    }, {
      runId: 'run-2', pressureFeasibility: 'PASS', stability: 'ACCEPTABLE', blockageRisk: 'OUT_OF_DOMAIN', stabilityEvidence: null, blockageEvidence: null,
      status: 'PARTIALLY_QUALIFIED_ACCEPTABLE', sourceMethodIds: [], limitations: [], method: 'tolue-pumpability-decision-v2',
    });
    expect(presentation.pumpabilityDecision?.status).toBe('PARTIALLY_QUALIFIED_ACCEPTABLE');
    expect(presentation.pumpabilityDecision?.blockageRisk).toBe('OUT_OF_DOMAIN');
  });
});
