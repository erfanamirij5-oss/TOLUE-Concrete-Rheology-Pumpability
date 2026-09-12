import type { ApplicationDataFlowState } from './applicationDataFlow';

export interface SessionUxCopy { readonly title: string; readonly detail: string; readonly tone: 'neutral' | 'success' | 'warning' | 'danger'; }

function succeededCopy(state: Readonly<ApplicationDataFlowState>): Readonly<SessionUxCopy> {
  if (state.analysis?.executionStatus === 'BLOCKED') return Object.freeze({ title: 'اجرای مهندسی مسدود شد', detail: 'کنترل آمادگی اجازه محاسبه نداده است. ورودی‌های پروژه، مسیر، رئولوژی و تجهیزات را تکمیل کنید و تحلیل را دوباره اجرا کنید.', tone: 'danger' });
  const decision = state.analysis?.results?.pumpabilityDecision;
  if (!decision) return Object.freeze({ title: 'تحلیل اجرا شد', detail: state.analysis ? `اجرای ${state.analysis.runId} تکمیل شده است، اما تصمیم نهایی پمپ‌پذیری برای این اجرا در دسترس نیست.` : 'تحلیل با موفقیت تکمیل شد.', tone: 'warning' });

  switch (decision.status) {
    case 'PROJECT_QUALIFIED_ACCEPTABLE': return Object.freeze({ title: 'نتیجه قابل قبول با شواهد پروژه', detail: 'فشار، پایداری و ریسک انسداد در محدوده شواهد پروژه قابل قبول گزارش شده‌اند. جزئیات را در نتایج و شواهد بررسی کنید.', tone: 'success' });
    case 'SCREENED_ACCEPTABLE': return Object.freeze({ title: 'غربالگری پایداری و انسداد قابل قبول است', detail: 'فشار قابل تأمین است و هر دو غربالگری خودکار پایداری و ریسک انسداد نتیجه قابل قبول دارند. این نتیجه مقدماتی است و جایگزین شواهد واقعی پروژه نمی‌شود.', tone: 'success' });
    case 'PARTIALLY_QUALIFIED_ACCEPTABLE': return Object.freeze({ title: 'نتیجه قابل قبول با شواهد ناقص', detail: 'فشار قابل قبول است و بخشی از شواهد پروژه نیز نتیجه قابل قبول دارد؛ این وضعیت معادل تأیید کامل پمپ‌پذیری نیست.', tone: 'warning' });
    case 'PARTIALLY_SCREENED_ACCEPTABLE': return Object.freeze({ title: 'غربالگری پمپ‌پذیری ناقص است', detail: 'فشار قابل تأمین است و یکی از حوزه‌های پایداری یا انسداد ارزیابی شده، اما برای حوزه دیگر ورودی کافی وجود ندارد.', tone: 'warning' });
    case 'PRESSURE_ONLY_ACCEPTABLE': return Object.freeze({ title: 'فشار قابل قبول؛ ورودی پایداری و انسداد لازم است', detail: 'ظرفیت فشار پمپ پاسخ‌گو است، اما برای ارزیابی پایداری و ریسک انسداد باید ورودی‌های غربالگری خودکار یا شواهد پروژه‌ای تکمیل شوند.', tone: 'warning' });
    case 'FAIL_PRESSURE': return Object.freeze({ title: 'عدم کفایت فشار پمپ', detail: 'فشار قابل تأمین پمپ برای شرایط فعلی کافی نیست. پمپ و مسیر خط لوله را بررسی کنید و تحلیل را دوباره اجرا کنید.', tone: 'danger' });
    case 'FAIL_STABILITY': return Object.freeze({ title: 'عدم پذیرش پایداری', detail: 'ارزیابی پایداری نتیجه غیرقابل قبول دارد. بخش پایداری/انسداد و یافته‌های تشخیصی را بررسی کنید.', tone: 'danger' });
    case 'FAIL_BLOCKAGE': return Object.freeze({ title: 'ریسک انسداد غیرقابل قبول', detail: 'ارزیابی ریسک انسداد نتیجه غیرقابل قبول دارد. اندازه سنگدانه، حداقل قطر داخلی مسیر و یافته‌های تشخیصی را بررسی کنید.', tone: 'danger' });
    case 'INSUFFICIENT_DATA': return Object.freeze({ title: 'داده برای تصمیم کافی نیست', detail: 'تحلیل اجرا شده، اما داده کافی برای تصمیم پمپ‌پذیری وجود ندارد. ورودی‌های پمپ، مسیر و تحلیل پایداری/انسداد را تکمیل کنید.', tone: 'warning' });
  }
}

export function sessionUxCopy(state: Readonly<ApplicationDataFlowState>): Readonly<SessionUxCopy> {
  if (state.isStale || state.status === 'STALE') return Object.freeze({ title: 'نیاز به محاسبه مجدد', detail: 'ورودی‌ها بعد از آخرین تحلیل تغییر کرده‌اند. برای به‌روزرسانی شاخص‌ها، نمای سه‌بعدی و نتایج، تحلیل را دوباره اجرا کنید.', tone: 'warning' });
  switch (state.status) {
    case 'IDLE': return Object.freeze({ title: 'آماده شروع', detail: 'اطلاعات پروژه و ورودی‌های مهندسی را تکمیل کنید.', tone: 'neutral' });
    case 'READY': return Object.freeze({ title: 'آماده تحلیل', detail: 'ورودی‌ها آماده‌اند. اجرای تحلیل، شاخص‌ها، نمای سه‌بعدی و مرکز نتایج را از یک تصویر ورودی واحد به‌روزرسانی می‌کند.', tone: 'success' });
    case 'RUNNING': return Object.freeze({ title: 'در حال تحلیل', detail: 'هسته مهندسی در حال محاسبه است؛ تا پایان اجرا، خروجی قبلی مبنای تصمیم جدید نیست.', tone: 'neutral' });
    case 'SUCCEEDED': return succeededCopy(state);
    case 'REJECTED': return Object.freeze({ title: 'تحلیل تکمیل نشد', detail: state.errorCode ?? 'ورودی‌ها و پیام‌های تشخیصی را بررسی کنید.', tone: 'danger' });
    default: return Object.freeze({ title: 'وضعیت نامشخص', detail: 'وضعیت فعلی تحلیل قابل تشخیص نیست.', tone: 'neutral' });
  }
}
