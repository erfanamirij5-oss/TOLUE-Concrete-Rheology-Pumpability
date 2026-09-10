import { describe, expect, it } from 'vitest';
import type { ApplicationDataFlowState } from './applicationDataFlow';
import { sessionUxCopy } from './uxCopy';

const state = (status: ApplicationDataFlowState['status'], isStale = false): ApplicationDataFlowState => ({
  status,
  input: null,
  analysis: null,
  activeRunId: null,
  activeInputSnapshotHash: null,
  errorCode: status === 'REJECTED' ? 'TEST-ERROR' : null,
  isStale,
});

describe('session UX copy', () => {
  it('translates internal lifecycle states into user-facing Persian guidance', () => {
    expect(sessionUxCopy(state('IDLE')).title).toBe('آماده شروع');
    expect(sessionUxCopy(state('READY')).title).toBe('آماده تحلیل');
    expect(sessionUxCopy(state('RUNNING')).title).toBe('در حال تحلیل');
    expect(sessionUxCopy(state('SUCCEEDED')).title).toBe('نتایج به‌روز هستند');
    expect(sessionUxCopy(state('REJECTED')).title).toBe('تحلیل تکمیل نشد');
  });

  it('prioritizes stale guidance over the underlying state', () => {
    const copy = sessionUxCopy(state('SUCCEEDED', true));
    expect(copy.title).toBe('نیاز به محاسبه مجدد');
    expect(copy.tone).toBe('warning');
  });

  it('does not expose internal English state labels to the user copy', () => {
    for (const status of ['IDLE', 'READY', 'RUNNING', 'SUCCEEDED', 'REJECTED', 'STALE'] as const) {
      const copy = sessionUxCopy(state(status, status === 'STALE'));
      expect(copy.title).not.toContain(status);
      expect(copy.detail).not.toContain(status);
    }
  });
});
