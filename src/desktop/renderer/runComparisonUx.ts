import type { EngineeringRunComparisonIdentity } from '../../engineering/core/engineeringRunComparison';

export function comparisonRunStatusLabel(run: Readonly<EngineeringRunComparisonIdentity>): string {
  if (run.executionStatus === 'BLOCKED') return 'تحلیل اجرا نشده';
  return run.completeness === 'complete' ? 'تحلیل کامل' : 'تحلیل ناقص';
}

export function comparisonDeltaLabel(delta: number | null, unit: string): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toPrecision(7)}${unit ? ` ${unit}` : ''}`;
}

export const RUN_COMPARISON_METHOD_LABEL = 'روش مقایسه: Candidate − Baseline' as const;
export const RUN_COMPARISON_INTERPRETATION_LABEL = 'این مقایسه فقط اختلاف داده‌های موجود را نشان می‌دهد و هیچ نتیجه‌گیری خودکار «بهتر/بدتر» تولید نمی‌کند.' as const;
