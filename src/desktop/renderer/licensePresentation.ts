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
    message: canUseApplication ? 'لایسنس معتبر است و نرم‌افزار آماده استفاده است.' : 'برای استفاده از بخش مهندسی، یک لایسنس معتبر و مخصوص همین دستگاه وارد کنید.',
    method: 'tolue-license-presentation-v1',
  });
}

export function importOutcomeMessage(response: LicenseImportIpcResponse): string {
  if (!response || response.method !== 'tolue-license-import-ipc-response-v1') throw new Error('LICENSE-IMPORT-PRESENTATION-001');
  if (response.status === 'IMPORTED' && response.licenseStatus === 'ACTIVE') return 'لایسنس با موفقیت تأیید و نصب شد.';
  if (response.status === 'CANCELLED') return 'انتخاب فایل لایسنس لغو شد.';
  return 'لایسنس پذیرفته نشد. فایل، امضا، دستگاه و بازه اعتبار را بررسی کنید.';
}
