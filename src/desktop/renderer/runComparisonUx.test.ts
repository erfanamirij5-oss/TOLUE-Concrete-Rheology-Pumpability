import { describe, expect, it } from 'vitest';
import type { EngineeringRunComparisonIdentity } from '../../engineering/core/engineeringRunComparison';
import { comparisonDeltaLabel, comparisonRunStatusLabel, RUN_COMPARISON_INTERPRETATION_LABEL, RUN_COMPARISON_METHOD_LABEL } from './runComparisonUx';

const identity = (overrides: Partial<EngineeringRunComparisonIdentity> = {}): EngineeringRunComparisonIdentity => ({
  runId: 'run-1',
  engineVersion: '1.0.0',
  inputSnapshotHash: 'hash-1',
  executionStatus: 'EXECUTED',
  completeness: 'complete',
  ...overrides,
});

describe('run comparison presentation semantics', () => {
  it('maps only existing execution/completeness states', () => {
    expect(comparisonRunStatusLabel(identity())).toBe('تحلیل کامل');
    expect(comparisonRunStatusLabel(identity({ executionStatus: 'BLOCKED', completeness: 'incomplete', inputSnapshotHash: null }))).toBe('تحلیل اجرا نشده');
  });

  it('formats signed deltas without inferring quality', () => {
    expect(comparisonDeltaLabel(12.5, 'Pa')).toContain('+');
    expect(comparisonDeltaLabel(-2, 'Pa')).toContain('-');
    expect(comparisonDeltaLabel(null, 'Pa')).toBe('—');
  });

  it('keeps the comparison method and interpretation explicit', () => {
    expect(RUN_COMPARISON_METHOD_LABEL).toContain('Candidate − Baseline');
    expect(RUN_COMPARISON_INTERPRETATION_LABEL).toContain('بهتر/بدتر');
  });
});
