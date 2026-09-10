import type { LicenseImportIpcResponse, LicenseStatusIpcResponse } from '../ipc/licenseIpc';
import type { LicenseStatus } from '../main/licensing/licensePolicy';

export interface LicensePresentation {
  readonly status: LicenseStatus;
  readonly statusLabel: string;
  readonly machineCode: string;
  readonly licenseId: string | null;
  readonly validUntilIso: string | null;
  readonly canUseApplication: boolean;
  readonly message: string;
  readonly method: 'tolue-license-presentation-v1';
}

const LABELS: Readonly<Record<LicenseStatus, string>> = Object.freeze({
  ACTIVE: 'فعال',
  EXPIRED: 'منقضی‌شده',
  MACHINE_MISMATCH: 'عدم تطابق دستگاه',
  NOT_YET_VALID: 'هنوز معتبر نشده',
  MISSING: 'لایسنس نصب نشده',
  INVALID: 'نامعتبر',
});

const GUIDANCE: Readonly<Record<LicenseStatus, string>> = Object.freeze({
  ACTIVE: 'لایسنس معتبر است و نرم‌افزار آماده استفاده است.',
  EXPIRED: 'اعتبار این لایسنس به پایان رسیده است. برای ادامه، فایل لایسنس معتبر جدید وارد کنید.',
  MACHINE_MISMATCH: 'این فایل لایسنس برای دستگاه دیگری صادر شده است. کد همین دستگاه را برای صدور لایسنس استفاده کنید.',
  NOT_YET_VALID: 'بازه اعتبار این لایسنس هنوز شروع نشده است. تاریخ شروع اعتبار فایل را بررسی کنید.',
  MISSING: 'برای استفاده از بخش مهندسی، فایل لایسنس معتبر مخصوص همین دستگاه را وارد کنید.',
  INVALID: 'فایل لایسنس معتبر نیست یا امضای آن قابل تأیید نیست. فایل اصلی صادرشده را دوباره انتخاب کنید.',
});

function validText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function presentLicenseStatus(response: LicenseStatusIpcResponse): Readonly<LicensePresentation> {
  if (!response || !validText(response.machineCode) || !(response.status in LABELS) || response.method !== 'tolue-license-status-ipc-response-v1') {
    throw new Error('LICENSE-PRESENTATION-001');
  }
  const canUseApplication = response.status === 'ACTIVE' && response.canUseApplication === true;
  return Object.freeze({
    status: response.status,
    statusLabel: LABELS[response.status],
    machineCode: response.machineCode,
    licenseId: validText(response.licenseId) ? response.licenseId : null,
    validUntilIso: validText(response.validUntilIso) ? response.validUntilIso : null,
    canUseApplication,
    message: canUseApplication ? GUIDANCE.ACTIVE : GUIDANCE[response.status],
    method: 'tolue-license-presentation-v1',
  });
}

export function importOutcomeMessage(response: LicenseImportIpcResponse): string {
  if (!response || response.method !== 'tolue-license-import-ipc-response-v1') throw new Error('LICENSE-IMPORT-PRESENTATION-001');
  if (response.status === 'IMPORTED' && response.licenseStatus === 'ACTIVE') {
    const validity = validText(response.validUntilIso) ? ` اعتبار تا ${response.validUntilIso}.` : '';
    return `لایسنس با موفقیت تأیید و نصب شد.${validity}`;
  }
  if (response.status === 'CANCELLED') return 'انتخاب فایل لایسنس لغو شد.';
  if (response.licenseStatus === 'EXPIRED') return GUIDANCE.EXPIRED;
  if (response.licenseStatus === 'MACHINE_MISMATCH') return GUIDANCE.MACHINE_MISMATCH;
  if (response.licenseStatus === 'NOT_YET_VALID') return GUIDANCE.NOT_YET_VALID;
  if (response.licenseStatus === 'INVALID') return GUIDANCE.INVALID;
  return 'لایسنس پذیرفته نشد. فایل و اطلاعات مجوز را بررسی کنید.';
}
