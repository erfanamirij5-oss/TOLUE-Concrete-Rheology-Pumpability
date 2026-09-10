export interface RunHistoryComparisonSelection {
  readonly baselineRunId: string | null;
  readonly candidateRunId: string | null;
}

export type RunHistorySelectionRole = 'baseline' | 'candidate';

export function createRunHistoryComparisonSelection(): Readonly<RunHistoryComparisonSelection> {
  return Object.freeze({ baselineRunId: null, candidateRunId: null });
}

export function selectRunForComparison(
  state: Readonly<RunHistoryComparisonSelection>,
  role: RunHistorySelectionRole,
  runId: string,
): Readonly<RunHistoryComparisonSelection> {
  const normalizedRunId = runId.trim();
  if (!normalizedRunId) throw new Error('RUN-HISTORY-SELECTION-ID-001');
  return Object.freeze(role === 'baseline'
    ? { baselineRunId: normalizedRunId, candidateRunId: state.candidateRunId }
    : { baselineRunId: state.baselineRunId, candidateRunId: normalizedRunId });
}

export function clearRunHistoryComparisonSelection(
  state: Readonly<RunHistoryComparisonSelection>,
  role?: RunHistorySelectionRole,
): Readonly<RunHistoryComparisonSelection> {
  if (!role) return createRunHistoryComparisonSelection();
  return Object.freeze(role === 'baseline'
    ? { baselineRunId: null, candidateRunId: state.candidateRunId }
    : { baselineRunId: state.baselineRunId, candidateRunId: null });
}

export function canCompareSelectedRuns(state: Readonly<RunHistoryComparisonSelection>): boolean {
  return state.baselineRunId !== null && state.candidateRunId !== null && state.baselineRunId !== state.candidateRunId;
}

export function runHistorySelectionSummary(state: Readonly<RunHistoryComparisonSelection>): string {
  if (!state.baselineRunId && !state.candidateRunId) return 'برای مقایسه، یک تحلیل مبنا و یک تحلیل کاندید انتخاب کنید.';
  if (!state.baselineRunId) return `کاندید: ${state.candidateRunId} · تحلیل مبنا را انتخاب کنید.`;
  if (!state.candidateRunId) return `مبنا: ${state.baselineRunId} · تحلیل کاندید را انتخاب کنید.`;
  if (state.baselineRunId === state.candidateRunId) return 'تحلیل مبنا و کاندید باید دو Run متفاوت باشند.';
  return `آماده مقایسه · مبنا: ${state.baselineRunId} · کاندید: ${state.candidateRunId}`;
}
