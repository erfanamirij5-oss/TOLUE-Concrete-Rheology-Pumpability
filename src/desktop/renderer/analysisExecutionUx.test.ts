import { describe, expect, it } from 'vitest';
import type { ApplicationDataFlowState } from './applicationDataFlow';
import { analysisExecutionUxState } from './analysisExecutionUx';

const makeState = (overrides: Partial<ApplicationDataFlowState> = {}): ApplicationDataFlowState => ({
  status: 'IDLE', input: null, analysis: null, activeRunId: null, activeInputSnapshotHash: null, errorCode: null, isStale: false, ...overrides,
});

const input = { runId: 'run-1', engineVersion: 'test' } as ApplicationDataFlowState['input'];

describe('analysis execution UX', () => {
  it('blocks execution without engineering input', () => {
    const ux = analysisExecutionUxState(makeState(), true);
    expect(ux.enabled).toBe(false);
    expect(ux.detail).toContain('ورودی‌های مهندسی');
  });

  it('blocks duplicate execution while running', () => {
    const ux = analysisExecutionUxState(makeState({ status: 'RUNNING', input }), true);
    expect(ux.enabled).toBe(false);
    expect(ux.busy).toBe(true);
    expect(ux.label).toContain('در حال تحلیل');
  });

  it('offers recalculation for stale results', () => {
    const ux = analysisExecutionUxState(makeState({ status: 'STALE', input, isStale: true }), true);
    expect(ux.enabled).toBe(true);
    expect(ux.label).toBe('محاسبه مجدد');
  });

  it('offers retry after a rejected analysis', () => {
    const ux = analysisExecutionUxState(makeState({ status: 'REJECTED', input, errorCode: 'X' }), true);
    expect(ux.enabled).toBe(true);
    expect(ux.label).toBe('تلاش مجدد');
  });
});
