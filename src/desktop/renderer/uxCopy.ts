import type { ApplicationDataFlowState } from './applicationDataFlow';

export interface SessionUxCopy {
  readonly title: string;
  readonly detail: string;
  readonly tone: 'neutral' | 'success' | 'warning' | 'danger';
}

function succeededCopy(state: Readonly<ApplicationDataFlowState>): Readonly<SessionUxCopy> {
  if (state.analysis?.executionStatus === 'BLOCKED') {
    return Object.freeze({
      title: 'اجرای مهندسی مسدود شد',
      detail: 'Readiness Gate اجازه محاسبه نداده است. ورودی‌های پروژه، مسیر، رئولوژی و تجهیزات را تکمیل کنید و Run را دوباره اجرا کنید.',
      tone: 'danger',
    });
  }

  const decision = state.analysis?.results?.pumpabilityDecision;
  if (!decision) {
    return Object.freeze({
      title: 'تحلیل اجرا شد',
      detail: state.analysis
        ? `Run ${state.analysis.runId} تکمیل شده است، اما تصمیم نهایی پمپ‌پذیری برای این Run در دسترس نیست.`
        : 'تحلیل با موفقیت تکمیل شد.',
      tone: 'warning',
    });
  }

  switch (decision.status) {
    case 'PROJECT_QUALIFIED_ACCEPTABLE':
      return Object.freeze({
        title: 'نتیجه قابل قبول با شواهد پروژه',
        detail: 'فشار، پایداری و ریسک گرفتگی در محدوده شواهد پروژه قابل قبول گزارش شده‌اند. جزئیات را در نتایج و شواهد بررسی کنید.',
        tone: 'success',
      });
    case 'PARTIALLY_QUALIFIED_ACCEPTABLE':
      return Object.freeze({
        title: 'نتیجه قابل قبول با شواهد ناقص',
        detail: 'فشار قابل قبول است و بخشی از شواهد پروژه نیز نتیجه قابل قبول دارد؛ این وضعیت معادل تأیید کامل پمپ‌پذیری نیست.',
        tone: 'warning',
      });
    case 'PRESSURE_ONLY_ACCEPTABLE':
      return Object.freeze({
        title: 'فشار قابل قبول؛ شواهد تکمیلی لازم است',
        detail: 'ظرفیت فشار پمپ پاسخ‌گو است، اما درباره پایداری و گرفتگی نتیجه پروژه‌محور کافی وجود ندارد.',
        tone: 'warning',
      });
    case 'FAIL_PRESSURE':
      return Object.freeze({
        title: 'عدم کفایت فشار پمپ',
        detail: 'فشار قابل تأمین پمپ برای شرایط فعلی کافی نیست. Pump و Pipeline را بررسی کنید و سپس تحلیل را دوباره اجرا کنید.',
        tone: 'danger',
      });
    case 'FAIL_STABILITY':
      return Object.freeze({
        title: 'عدم پذیرش پایداری',
        detail: 'شواهد پروژه وضعیت پایداری را غیرقابل قبول گزارش کرده‌اند. Evidence و Diagnostics را بررسی کنید.',
        tone: 'danger',
      });
    case 'FAIL_BLOCKAGE':
      return Object.freeze({
        title: 'ریسک گرفتگی غیرقابل قبول',
        detail: 'شواهد پروژه نتیجه غیرقابل قبول برای ریسک گرفتگی دارند. محل فیزیکی گرفتگی توسط Core تعیین نمی‌شود.',
        tone: 'danger',
      });
    case 'INSUFFICIENT_DATA':
      return Object.freeze({
        title: 'داده برای تصمیم کافی نیست',
        detail: 'تحلیل اجرا شده، اما داده کافی برای تصمیم پمپ‌پذیری وجود ندارد. ورودی‌های Pump، Pipeline و Evidence را تکمیل کنید.',
        tone: 'warning',
      });
  }
}

export function sessionUxCopy(state: Readonly<ApplicationDataFlowState>): Readonly<SessionUxCopy> {
  if (state.isStale || state.status === 'STALE') {
    return Object.freeze({
      title: 'نیاز به محاسبه مجدد',
      detail: 'ورودی‌ها بعد از آخرین تحلیل تغییر کرده‌اند. برای به‌روزرسانی KPI، نمای سه‌بعدی و نتایج، تحلیل را دوباره اجرا کنید.',
      tone: 'warning',
    });
  }
  switch (state.status) {
    case 'IDLE':
      return Object.freeze({ title: 'آماده شروع', detail: 'اطلاعات پروژه و ورودی‌های مهندسی را تکمیل کنید.', tone: 'neutral' });
    case 'READY':
      return Object.freeze({ title: 'آماده تحلیل', detail: 'ورودی‌ها آماده‌اند. اجرای تحلیل، KPI، نمای سه‌بعدی و Result Center را از یک Snapshot واحد به‌روزرسانی می‌کند.', tone: 'success' });
    case 'RUNNING':
      return Object.freeze({ title: 'در حال تحلیل', detail: 'Engineering Core در حال محاسبه است؛ تا پایان Run، خروجی قبلی مبنای تصمیم جدید نیست.', tone: 'neutral' });
    case 'SUCCEEDED':
      return succeededCopy(state);
    case 'REJECTED':
      return Object.freeze({ title: 'تحلیل تکمیل نشد', detail: state.errorCode ?? 'ورودی‌ها و پیام‌های تشخیصی را بررسی کنید.', tone: 'danger' });
    default:
      return Object.freeze({ title: 'وضعیت نامشخص', detail: 'وضعیت فعلی تحلیل قابل تشخیص نیست.', tone: 'neutral' });
  }
}
