import { describe, expect, it } from 'vitest';
import { applyComparisonResponse, applyHistoryResponse, beginHistoryLoad, beginRunComparison, createHistoryWorkspaceState, failHistoryWorkspace } from './historyWorkspace';

describe('history workspace state', () => {
  it('tracks history loading without touching engineering session state', () => {
    const state = beginHistoryLoad(createHistoryWorkspaceState());
    expect(state.status).toBe('LOADING_HISTORY');
    expect(state.history).toBeNull();
  });

  it('accepts successful history responses', () => {
    const response = {
      status: 'SUCCESS',
      items: [],
      errorCode: null,
      method: 'tolue-engineering-run-history-ipc-response-v1',
    } as const;
    const state = applyHistoryResponse(createHistoryWorkspaceState(), response);
    expect(state.status).toBe('READY');
    expect(state.history).toEqual(response);
  });

  it('tracks comparison independently from the active engineering run', () => {
    const comparing = beginRunComparison(createHistoryWorkspaceState());
    expect(comparing.status).toBe('COMPARING');
    const failed = applyComparisonResponse(comparing, {
      status: 'NOT_FOUND',
      comparison: null,
      errorCode: null,
      method: 'tolue-engineering-run-comparison-ipc-response-v1',
    });
    expect(failed.status).toBe('ERROR');
    expect(failed.errorMessage).toContain('یافت نشد');
  });

  it('exposes transport failures as workspace errors', () => {
    const state = failHistoryWorkspace(createHistoryWorkspaceState(), 'ارتباط برای دریافت تاریخچه برقرار نشد.');
    expect(state.status).toBe('ERROR');
    expect(state.errorMessage).toContain('ارتباط');
  });
});
