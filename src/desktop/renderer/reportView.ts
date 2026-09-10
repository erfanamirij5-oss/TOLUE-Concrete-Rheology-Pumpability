import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { ReportExportPresentation } from './reportPresentation';
import { reportWorkspaceSummary } from './reportUx';

export interface ReportExportActions {
  readonly exportActiveEngineeringPdf: () => Promise<unknown>;
}

export interface PdfExportStatusPresentation {
  readonly status: 'SUCCESS' | 'CANCELLED' | 'FAILED' | 'REJECTED';
  readonly message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function presentEngineeringPdfExportResponse(
  report: Readonly<ReportExportPresentation>,
  response: unknown,
): Readonly<PdfExportStatusPresentation> {
  if (!isRecord(response)) throw new Error('REPORT-PDF-RESPONSE-SHAPE-001');
  const status = response.status;
  if (status !== 'SUCCESS' && status !== 'CANCELLED' && status !== 'FAILED' && status !== 'REJECTED') {
    throw new Error('REPORT-PDF-RESPONSE-STATUS-001');
  }

  const errorCode = typeof response.errorCode === 'string' ? response.errorCode : null;
  if (status === 'REJECTED') {
    return Object.freeze({ status, message: `درخواست صدور PDF رد شد${errorCode ? ` · ${errorCode}` : ''}` });
  }
  if (response.runId !== report.runId || response.engineVersion !== report.engineVersion || response.inputSnapshotHash !== report.inputSnapshotHash) {
    throw new Error('REPORT-PDF-RESPONSE-IDENTITY-001');
  }
  if (status === 'CANCELLED') return Object.freeze({ status, message: 'صدور PDF توسط کاربر لغو شد؛ فایلی نوشته نشد.' });
  if (status === 'FAILED') return Object.freeze({ status, message: `صدور PDF انجام نشد${errorCode ? ` · ${errorCode}` : ''}` });

  const savedFileName = typeof response.savedFileName === 'string' && response.savedFileName.trim() ? response.savedFileName : null;
  const bytesWritten = typeof response.bytesWritten === 'number' && Number.isFinite(response.bytesWritten) && response.bytesWritten > 0 ? response.bytesWritten : null;
  if (!savedFileName || bytesWritten === null || errorCode !== null) throw new Error('REPORT-PDF-RESPONSE-SUCCESS-001');
  return Object.freeze({ status, message: `PDF با موفقیت ذخیره شد: ${savedFileName} · ${bytesWritten.toLocaleString('fa-IR')} بایت` });
}

export function renderReportView(root: HTMLElement, report?: Readonly<ReportExportPresentation>, actions?: Readonly<ReportExportActions>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'گزارش و خروجی');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'گزارش مهندسی و خروجی‌ها';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'پیش‌نمایش این بخش فقط قرارداد گزارش آماده‌شده توسط Engineering Core را نشان می‌دهد؛ صدور PDF نیز فقط برای Run فعال و با تطبیق Run/Engine/Snapshot انجام می‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!report) {
    const empty = document.createElement('div');
    empty.textContent = 'برای ساخت گزارش، ابتدا یک تحلیل مهندسی معتبر اجرا یا از تاریخچه بارگذاری کنید.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const summary = reportWorkspaceSummary(report);
  const hero = document.createElement('section');
  hero.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  hero.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  hero.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  const heroTitle = document.createElement('strong');
  heroTitle.textContent = summary.title;
  const heroIdentity = document.createElement('p');
  heroIdentity.textContent = summary.identity;
  heroIdentity.style.marginBottom = '0';
  heroIdentity.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  hero.append(heroTitle, heroIdentity);
  panel.appendChild(hero);

  const meta = document.createElement('div');
  meta.style.display = 'grid';
  meta.style.gridTemplateColumns = 'repeat(auto-fit, minmax(190px, 1fr))';
  meta.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const values: readonly [string, string][] = [
    ['Run ID', report.runId], ['Engine', report.engineVersion], ['زبان گزارش', report.reportLocale], ['جهت', report.reportDirection],
  ];
  for (const [labelText, valueText] of values) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small'); label.textContent = labelText; label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const value = document.createElement('div'); value.textContent = valueText; value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; value.style.overflowWrap = 'anywhere';
    card.append(label, value); meta.appendChild(card);
  }
  panel.appendChild(meta);

  const formats = document.createElement('p');
  formats.textContent = `فرمت‌های قراردادشده: ${summary.formats.join(' · ')}`;
  formats.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.appendChild(formats);

  const traceability = document.createElement('details');
  traceability.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;
  const traceabilitySummary = document.createElement('summary');
  traceabilitySummary.textContent = 'ردیابی گزارش و روش صدور';
  const traceabilityBody = document.createElement('div');
  traceabilityBody.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
  traceabilityBody.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
  traceabilityBody.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  traceabilityBody.style.overflowWrap = 'anywhere';
  traceabilityBody.textContent = `Snapshot: ${report.inputSnapshotHash} · Bundle method: ${summary.method}`;
  traceability.append(traceabilitySummary, traceabilityBody);
  panel.appendChild(traceability);

  const exportStatus = document.createElement('p');
  exportStatus.setAttribute('aria-live', 'polite');
  exportStatus.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const pdf = document.createElement('button');
  pdf.type = 'button';
  pdf.textContent = 'ذخیره PDF همین Run فعال';
  pdf.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  pdf.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.lg}`;
  pdf.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.focus}`;
  pdf.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  pdf.style.fontFamily = 'inherit';
  pdf.style.fontWeight = '700';
  pdf.disabled = !actions;
  if (actions) {
    pdf.addEventListener('click', () => {
      pdf.disabled = true;
      pdf.setAttribute('aria-busy', 'true');
      exportStatus.textContent = 'در حال آماده‌سازی و ذخیره PDF Run فعال…';
      void actions.exportActiveEngineeringPdf()
        .then(response => { exportStatus.textContent = presentEngineeringPdfExportResponse(report, response).message; })
        .catch(() => { exportStatus.textContent = 'پاسخ صدور PDF معتبر نیست یا هویت Run/Hash با Session فعال تطابق ندارد.'; })
        .finally(() => { pdf.disabled = false; pdf.setAttribute('aria-busy', 'false'); });
    });
  }
  panel.append(pdf, exportStatus);
  root.appendChild(panel);
}
