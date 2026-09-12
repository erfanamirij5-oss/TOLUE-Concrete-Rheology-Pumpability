import type { DiagnosticFinding } from '../../engineering/core/diagnostics';
import type { EngineeringValidationStatus } from '../../engineering/core/engineeringResult';
import type { TolueStatusTone } from './designSystem';

export interface DiagnosticSeverityUx { readonly label: string; readonly tone: TolueStatusTone; readonly priority: number; }

export function diagnosticSeverityUx(severity: DiagnosticFinding['severity']): Readonly<DiagnosticSeverityUx> {
  if (severity === 'critical') return Object.freeze({ label: 'بحرانی', tone: 'critical', priority: 0 });
  if (severity === 'warning') return Object.freeze({ label: 'هشدار', tone: 'warning', priority: 1 });
  return Object.freeze({ label: 'اطلاع', tone: 'nominal', priority: 2 });
}

export function diagnosticKindLabel(kind: DiagnosticFinding['kind']): string {
  const labels: Readonly<Record<DiagnosticFinding['kind'], string>> = Object.freeze({
    INCOMPLETE_ANALYSIS: 'تحلیل ناقص', INSUFFICIENT_DATA: 'داده ناکافی', PUMP_PRESSURE_INSUFFICIENT: 'فشار پمپ ناکافی', PUMP_PRESSURE_ADEQUATE: 'فشار پمپ کافی', STABILITY_UNACCEPTABLE: 'پایداری نامطلوب', BLOCKAGE_UNACCEPTABLE: 'ریسک انسداد نامطلوب', PUMPABILITY_PROJECT_QUALIFIED: 'پمپ‌پذیری تأییدشده برای پروژه', PUMPABILITY_PARTIALLY_QUALIFIED: 'پمپ‌پذیری با تأیید جزئی', PUMPABILITY_SCREENED_ACCEPTABLE: 'غربالگری پمپ‌پذیری قابل قبول', PUMPABILITY_PARTIALLY_SCREENED: 'غربالگری پمپ‌پذیری ناقص',
  });
  return labels[kind];
}

export function diagnosticBasisLabel(basis: DiagnosticFinding['basis']): string {
  if (basis === 'data_completeness') return 'کامل‌بودن داده';
  if (basis === 'exact_mathematical_relation') return 'رابطه ریاضی صریح';
  if (basis === 'engineering_screening') return 'غربالگری مهندسی شفاف';
  return 'شواهد معتبر پروژه‌ای';
}

export function diagnosticValidationLabel(status: EngineeringValidationStatus): string {
  const labels: Readonly<Record<EngineeringValidationStatus, string>> = Object.freeze({ verified: 'اعتبارسنجی‌شده', candidate: 'کاندید مهندسی', preliminary: 'مقدماتی', out_of_domain: 'خارج از دامنه', insufficient_data: 'داده ناکافی', blocked: 'مسدود' });
  return labels[status];
}

export function sortDiagnosticFindings<T extends Pick<DiagnosticFinding, 'severity'>>(findings: readonly T[]): readonly T[] {
  return Object.freeze([...findings].sort((a, b) => diagnosticSeverityUx(a.severity).priority - diagnosticSeverityUx(b.severity).priority));
}
