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
  if (!runId.trim()) throw new Error('RUN-HISTORY-SELECTION-ID-001');
  return Object.freeze(role === 'baseline'
    ? { baselineRunId: runId, candidateRunId: state.candidateRunId }
    : { baselineRunId: state.baselineRunId, candidateRunId: runId });
}

export function canCompareSelectedRuns(state: Readonly<RunHistoryComparisonSelection>): boolean {
  return state.baselineRunId !== null && state.candidateRunId !== null && state.baselineRunId !== state.candidateRunId;
}
