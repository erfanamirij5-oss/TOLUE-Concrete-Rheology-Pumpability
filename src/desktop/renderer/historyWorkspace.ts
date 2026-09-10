import type { EngineeringRunComparisonIpcResponse, EngineeringRunHistoryIpcResponse } from '../ipc/engineeringRunIpc';

export type HistoryWorkspaceStatus = 'IDLE' | 'LOADING_HISTORY' | 'READY' | 'COMPARING' | 'ERROR';

export interface HistoryWorkspaceState {
  readonly status: HistoryWorkspaceStatus;
  readonly history: EngineeringRunHistoryIpcResponse | null;
  readonly comparison: EngineeringRunComparisonIpcResponse | null;
  readonly errorMessage: string | null;
}

export function createHistoryWorkspaceState(): Readonly<HistoryWorkspaceState> {
  return Object.freeze({ status: 'IDLE', history: null, comparison: null, errorMessage: null });
}

export function beginHistoryLoad(state: Readonly<HistoryWorkspaceState>): Readonly<HistoryWorkspaceState> {
  return Object.freeze({ ...state, status: 'LOADING_HISTORY', errorMessage: null });
}

export function applyHistoryResponse(state: Readonly<HistoryWorkspaceState>, response: EngineeringRunHistoryIpcResponse): Readonly<HistoryWorkspaceState> {
  if (response.status !== 'SUCCESS') return Object.freeze({ ...state, status: 'ERROR', history: response, errorMessage: 'دریافت تاریخچه تحلیل‌ها انجام نشد. دوباره تلاش کنید.' });
  return Object.freeze({ ...state, status: 'READY', history: response, errorMessage: null });
}

export function beginRunComparison(state: Readonly<HistoryWorkspaceState>): Readonly<HistoryWorkspaceState> {
  return Object.freeze({ ...state, status: 'COMPARING', comparison: null, errorMessage: null });
}

export function applyComparisonResponse(state: Readonly<HistoryWorkspaceState>, response: EngineeringRunComparisonIpcResponse): Readonly<HistoryWorkspaceState> {
  if (response.status === 'SUCCESS') return Object.freeze({ ...state, status: 'READY', comparison: response, errorMessage: null });
  return Object.freeze({ ...state, status: 'ERROR', comparison: response, errorMessage: response.status === 'NOT_FOUND' ? 'یکی از تحلیل‌های انتخاب‌شده یافت نشد.' : 'مقایسه تحلیل‌ها انجام نشد. دوباره تلاش کنید.' });
}

export function failHistoryWorkspace(state: Readonly<HistoryWorkspaceState>, message: string): Readonly<HistoryWorkspaceState> {
  return Object.freeze({ ...state, status: 'ERROR', errorMessage: message });
}
