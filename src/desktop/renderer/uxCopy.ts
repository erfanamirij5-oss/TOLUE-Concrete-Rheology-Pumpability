import type { ApplicationDataFlowState } from './applicationDataFlow';

export interface SessionUxCopy {
  readonly title: string;
  readonly detail: string;
  readonly tone: 'neutral' | 'success' | 'warning' | 'danger';
}

export function sessionUxCopy(state: Readonly<ApplicationDataFlowState>): Readonly<SessionUxCopy> {
  if (state.isStale || state.status === 'STALE') {
    return Object.freeze({
      title: 'نیاز به محاسبه مجدد',
      detail: 'ورودی‌ها بعد از آخرین تحلیل تغییر کرده‌اند. برای به‌روزرسانی نتایج، تحلیل را دوباره اجرا کنید.',
      tone: 'warning',
    });
  }
  switch (state.status) {
    case 'IDLE':
      return Object.freeze({ title: 'آماده شروع', detail: 'اطلاعات پروژه و ورودی‌های مهندسی را تکمیل کنید.', tone: 'neutral' });
    case 'READY':
      return Object.freeze({ title: 'آماده تحلیل', detail: 'ورودی‌های لازم دریافت شده‌اند و تحلیل می‌تواند اجرا شود.', tone: 'success' });
    case 'RUNNING':
      return Object.freeze({ title: 'در حال تحلیل', detail: 'محاسبات مهندسی در حال انجام است؛ تا پایان تحلیل از اجرای مجدد خودداری کنید.', tone: 'neutral' });
    case 'SUCCEEDED':
      return Object.freeze({
        title: 'نتایج به‌روز هستند',
        detail: state.analysis ? `تحلیل ${state.analysis.runId} با وضعیت ${state.analysis.completeness} در دسترس است.` : 'تحلیل با موفقیت تکمیل شد.',
        tone: 'success',
      });
    case 'REJECTED':
      return Object.freeze({ title: 'تحلیل تکمیل نشد', detail: state.errorCode ?? 'ورودی‌ها و پیام‌های تشخیصی را بررسی کنید.', tone: 'danger' });
    default:
      return Object.freeze({ title: 'وضعیت نامشخص', detail: 'وضعیت فعلی تحلیل قابل تشخیص نیست.', tone: 'neutral' });
  }
}
