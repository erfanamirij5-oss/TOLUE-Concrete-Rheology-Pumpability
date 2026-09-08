import { describe, expect, it } from 'vitest';
import { canCompareSelectedRuns, createRunHistoryComparisonSelection, selectRunForComparison } from './runHistorySelection';

describe('run history comparison selection', () => {
  it('starts empty and non-comparable', () => {
    const state = createRunHistoryComparisonSelection();
    expect(state).toEqual({ baselineRunId: null, candidateRunId: null });
    expect(Object.isFrozen(state)).toBe(true);
    expect(canCompareSelectedRuns(state)).toBe(false);
  });

  it('enables comparison only for two distinct selected run ids', () => {
    const baseline = selectRunForComparison(createRunHistoryComparisonSelection(), 'baseline', 'run-a');
    expect(canCompareSelectedRuns(baseline)).toBe(false);
    const same = selectRunForComparison(baseline, 'candidate', 'run-a');
    expect(canCompareSelectedRuns(same)).toBe(false);
    const distinct = selectRunForComparison(same, 'candidate', 'run-b');
    expect(distinct).toEqual({ baselineRunId: 'run-a', candidateRunId: 'run-b' });
    expect(canCompareSelectedRuns(distinct)).toBe(true);
  });

  it('updates one role without mutating the other selection', () => {
    const initial = selectRunForComparison(selectRunForComparison(createRunHistoryComparisonSelection(), 'baseline', 'run-a'), 'candidate', 'run-b');
    const changed = selectRunForComparison(initial, 'baseline', 'run-c');
    expect(initial).toEqual({ baselineRunId: 'run-a', candidateRunId: 'run-b' });
    expect(changed).toEqual({ baselineRunId: 'run-c', candidateRunId: 'run-b' });
    expect(changed).not.toBe(initial);
    expect(Object.isFrozen(changed)).toBe(true);
  });

  it('fails closed on an empty run id', () => {
    expect(() => selectRunForComparison(createRunHistoryComparisonSelection(), 'baseline', '   ')).toThrow('RUN-HISTORY-SELECTION-ID-001');
  });
});
