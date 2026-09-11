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

const succeededWithDecision = (decisionStatus: string): ApplicationDataFlowState => ({
  ...state('SUCCEEDED'),
  activeRunId: 'run-ux',
  activeInputSnapshotHash: 'hash-ux',
  analysis: {
    runId: 'run-ux',
    engineVersion: 'v1.1.0-rc.3',
    executionStatus: 'EXECUTED',
    completeness: 'complete',
    inputSnapshotHash: 'hash-ux',
    pipeline: null,
    pressureProfile: null,
    pressureComposition: null,
    rheologyCurves: null,
    visualization3d: null,
    pump: null,
    diagnostics: null,
    report: null,
    results: {
      runId: 'run-ux',
      engineVersion: 'v1.1.0-rc.3',
      inputSnapshotHash: 'hash-ux',
      completeness: 'complete',
      method: 'tolue-engineering-result-center-v4',
      warnings: [],
      results: [],
      pumpabilityDecision: {
        pressureFeasibility: decisionStatus === 'FAIL_PRESSURE' ? 'FAIL' : 'PASS',
        stability: decisionStatus === 'FAIL_STABILITY' ? 'UNACCEPTABLE' : 'NOT_ASSESSED',
        blockageRisk: decisionStatus === 'FAIL_BLOCKAGE' ? 'UNACCEPTABLE' : 'NOT_ASSESSED',
        status: decisionStatus,
        method: 'tolue-pumpability-decision-v2',
      },
    },
  } as ApplicationDataFlowState['analysis'],
});

const blockedRun = (): ApplicationDataFlowState => ({
  ...state('SUCCEEDED'),
  activeRunId: 'run-blocked',
  analysis: {
    runId: 'run-blocked',
    engineVersion: 'v1.1.0-rc.3',
    executionStatus: 'BLOCKED',
    completeness: 'incomplete',
    inputSnapshotHash: null,
    pipeline: null,
    pressureProfile: null,
    pressureComposition: null,
    rheologyCurves: null,
    visualization3d: null,
    pump: null,
    results: null,
    diagnostics: null,
    report: null,
  },
});

describe('session UX copy', () => {
  it('translates internal lifecycle states into user-facing Persian guidance', () => {
    expect(sessionUxCopy(state('IDLE')).title).toBe('آماده شروع');
    expect(sessionUxCopy(state('READY')).title).toBe('آماده تحلیل');
    expect(sessionUxCopy(state('RUNNING')).title).toBe('در حال تحلیل');
    expect(sessionUxCopy(state('REJECTED')).title).toBe('تحلیل تکمیل نشد');
  });

  it('prioritizes stale guidance over the underlying state', () => {
    const copy = sessionUxCopy(state('SUCCEEDED', true));
    expect(copy.title).toBe('نیاز به محاسبه مجدد');
    expect(copy.tone).toBe('warning');
    expect(copy.detail).toContain('KPI');
  });

  it('maps successful engineering decisions into explicit post-run feedback', () => {
    expect(sessionUxCopy(succeededWithDecision('PROJECT_QUALIFIED_ACCEPTABLE')).tone).toBe('success');
    expect(sessionUxCopy(succeededWithDecision('PRESSURE_ONLY_ACCEPTABLE')).title).toContain('فشار قابل قبول');
    expect(sessionUxCopy(succeededWithDecision('FAIL_PRESSURE')).title).toBe('عدم کفایت فشار پمپ');
    expect(sessionUxCopy(succeededWithDecision('FAIL_STABILITY')).tone).toBe('danger');
    expect(sessionUxCopy(succeededWithDecision('FAIL_BLOCKAGE')).detail).toContain('محل فیزیکی گرفتگی');
    expect(sessionUxCopy(succeededWithDecision('INSUFFICIENT_DATA')).tone).toBe('warning');
  });

  it('distinguishes a readiness-blocked run from an executed result', () => {
    const copy = sessionUxCopy(blockedRun());
    expect(copy.title).toBe('اجرای مهندسی مسدود شد');
    expect(copy.tone).toBe('danger');
    expect(copy.detail).toContain('Readiness Gate');
  });

  it('does not expose internal lifecycle labels to the user copy', () => {
    for (const status of ['IDLE', 'READY', 'RUNNING', 'REJECTED', 'STALE'] as const) {
      const copy = sessionUxCopy(state(status, status === 'STALE'));
      expect(copy.title).not.toContain(status);
      expect(copy.detail).not.toContain(status);
    }
  });
});
