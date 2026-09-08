import { describe, expect, it } from 'vitest';
import { ENGINEERING_RUN_COMPARISON_CHANNEL, validateEngineeringRunComparisonIpcRequest } from './engineeringRunIpc';

describe('engineering run comparison IPC contract', () => {
  it('accepts exactly two distinct non-empty persisted run ids', () => {
    const request = { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-b' };
    expect(() => validateEngineeringRunComparisonIpcRequest(request)).not.toThrow();
  });

  it.each([
    { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: '', candidateRunId: 'run-b' },
    { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: ' ' },
    { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-b', extra: true },
    { channel: 'wrong', baselineRunId: 'run-a', candidateRunId: 'run-b' },
  ])('rejects malformed comparison request %#', request => {
    expect(() => validateEngineeringRunComparisonIpcRequest(request)).toThrow('RUN-COMPARISON-IPC-SHAPE-001');
  });

  it('rejects comparing a run with itself before persistence access', () => {
    expect(() => validateEngineeringRunComparisonIpcRequest({ channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-a' }))
      .toThrow('RUN-COMPARISON-IPC-DISTINCT-001');
  });
});
