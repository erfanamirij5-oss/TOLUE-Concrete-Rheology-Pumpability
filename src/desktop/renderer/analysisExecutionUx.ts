import type { ApplicationDataFlowState } from './applicationDataFlow';

export interface AnalysisExecutionUxState {
  readonly label: string;
  readonly detail: string;
  readonly enabled: boolean;
  readonly busy: boolean;
}

export function analysisExecutionUxState(state: Readonly<ApplicationDataFlowState>, hasActions: boolean): Readonly<AnalysisExecutionUxState> {
  if (!hasActions) return Object.freeze({ label: 'اجرای تحلیل', detail: 'سرویس تحلیل در دسترس نیست.', enabled: false, busy: false });
  if (state.status === 'RUNNING') return Object.freeze({ label: 'در حال تحلیل…', detail: 'محاسبات در حال اجراست؛ تا پایان تحلیل دوباره ارسال نکنید.', enabled: false, busy: true });
  if (!state.input) return Object.freeze({ label: 'اجرای تحلیل', detail: 'برای اجرای تحلیل ابتدا ورودی‌های مهندسی را تکمیل کنید.', enabled: false, busy: false });
  if (state.status === 'STALE' || state.isStale) return Object.freeze({ label: 'محاسبه مجدد', detail: 'ورودی‌ها تغییر کرده‌اند و نتایج قبلی باید به‌روزرسانی شوند.', enabled: true, busy: false });
  if (state.status === 'REJECTED') return Object.freeze({ label: 'تلاش مجدد', detail: 'تحلیل قبلی تکمیل نشد. ورودی‌ها را بررسی و دوباره اجرا کنید.', enabled: true, busy: false });
  if (state.status === 'SUCCEEDED') return Object.freeze({ label: 'اجرای مجدد تحلیل', detail: 'تحلیل فعال معتبر است. در صورت نیاز می‌توانید آن را دوباره اجرا کنید.', enabled: true, busy: false });
  return Object.freeze({ label: 'اجرای تحلیل', detail: 'ورودی‌های لازم آماده‌اند و تحلیل می‌تواند اجرا شود.', enabled: true, busy: false });
}
