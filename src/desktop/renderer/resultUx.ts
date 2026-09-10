import type { EngineeringEvidenceStatus, EngineeringValidationStatus } from '../../engineering/core/engineeringResult';
import type { PumpabilityDecisionStatus, PressureFeasibilityStatus } from '../../engineering/core/pumpabilityDecision';
import type { TolueStatusTone } from './designSystem';

export interface ResultStatusUx {
  readonly label: string;
  readonly tone: TolueStatusTone;
}

export function validationStatusUx(status: EngineeringValidationStatus): Readonly<ResultStatusUx> {
  switch (status) {
    case 'verified': return Object.freeze({ label: 'تأییدشده', tone: 'nominal' });
    case 'candidate': return Object.freeze({ label: 'کاندید مهندسی', tone: 'warning' });
    case 'preliminary': return Object.freeze({ label: 'مقدماتی', tone: 'warning' });
    case 'out_of_domain': return Object.freeze({ label: 'خارج از دامنه', tone: 'critical' });
    case 'insufficient_data': return Object.freeze({ label: 'داده ناکافی', tone: 'unknown' });
    case 'blocked': return Object.freeze({ label: 'مسدود', tone: 'critical' });
  }
}

export function evidenceStatusUx(status: EngineeringEvidenceStatus): Readonly<ResultStatusUx> {
  switch (status) {
    case 'DOCUMENTED': return Object.freeze({ label: 'مستندسازی‌شده', tone: 'nominal' });
    case 'PRELIMINARY': return Object.freeze({ label: 'شواهد مقدماتی', tone: 'warning' });
    case 'BLOCKED': return Object.freeze({ label: 'شواهد مسدود', tone: 'critical' });
    case 'NOT_ASSESSED': return Object.freeze({ label: 'ارزیابی‌نشده', tone: 'unknown' });
  }
}

export function pumpabilityDecisionUx(status: PumpabilityDecisionStatus): Readonly<ResultStatusUx> {
  switch (status) {
    case 'PROJECT_QUALIFIED_ACCEPTABLE': return Object.freeze({ label: 'قابل قبول با شواهد پروژه‌ای', tone: 'nominal' });
    case 'PARTIALLY_QUALIFIED_ACCEPTABLE': return Object.freeze({ label: 'قابل قبول با شواهد جزئی', tone: 'warning' });
    case 'PRESSURE_ONLY_ACCEPTABLE': return Object.freeze({ label: 'فقط از نظر فشار قابل قبول', tone: 'warning' });
    case 'FAIL_PRESSURE': return Object.freeze({ label: 'رد به دلیل فشار', tone: 'critical' });
    case 'FAIL_STABILITY': return Object.freeze({ label: 'رد به دلیل پایداری', tone: 'critical' });
    case 'FAIL_BLOCKAGE': return Object.freeze({ label: 'رد به دلیل ریسک انسداد', tone: 'critical' });
    case 'INSUFFICIENT_DATA': return Object.freeze({ label: 'داده ناکافی', tone: 'unknown' });
  }
}

export function pressureFeasibilityUx(status: PressureFeasibilityStatus): Readonly<ResultStatusUx> {
  if (status === 'PASS') return Object.freeze({ label: 'قابل تأمین', tone: 'nominal' });
  if (status === 'FAIL') return Object.freeze({ label: 'غیرقابل تأمین', tone: 'critical' });
  return Object.freeze({ label: 'داده ناکافی', tone: 'unknown' });
}
