import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { ReportExportPresentation } from './reportPresentation';

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
    return Object.freeze({
      status,
      message: `درخواست صدور PDF رد شد${errorCode ? ` · ${errorCode}` : ''}`,
    });
  }

  if (
    response.runId !== report.runId ||
    response.engineVersion !== report.engineVersion ||
    response.inputSnapshotHash !== report.inputSnapshotHash
  ) {
    throw new Error('REPORT-PDF-RESPONSE-IDENTITY-001');
  }

  if (status === 'CANCELLED') {
    return Object.freeze({ status, message: 'صدور PDF توسط کاربر لغو شد؛ فایلی نوشته نشد.' });
  }
  if (status === 'FAILED') {
    return Object.freeze({
      status,
      message: `صدور PDF انجام نشد${errorCode ? ` · ${errorCode}` : ''}`,
    });
  }

  const savedFileName = typeof response.savedFileName === 'string' && response.savedFileName.trim() ? response.savedFileName : null;
  const bytesWritten = typeof response.bytesWritten === 'number' && Number.isFinite(response.bytesWritten) && response.bytesWritten > 0
    ? response.bytesWritten
    : null;
  if (!savedFileName || bytesWritten === null || errorCode !== null) throw new Error('REPORT-PDF-RESPONSE-SUCCESS-001');
  return Object.freeze({
    status,
    message: `PDF با موفقیت ذخیره شد: ${savedFileName} · ${bytesWritten.toLocaleString('fa-IR')} بایت`,
  });
}

function appendFormatCard(
  root: HTMLElement,
  titleText: string,
  mediaType: string,
  descriptionText: string,
): void {
  const card = document.createElement('article');
  card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

  const title = document.createElement('strong');
  title.textContent = titleText;
  const description = document.createElement('p');
  description.textContent = descriptionText;
  description.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0`;
  description.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const media = document.createElement('small');
  media.textContent = mediaType;
  card.append(title, description, media);
  root.appendChild(card);
}

export function renderReportView(
  root: HTMLElement,
  report?: Readonly<ReportExportPresentation>,
  actions?: Readonly<ReportExportActions>,
): void {
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
  note.textContent = 'مرکز کنترل گزارش Run فعال؛ هویت Run، نسخه موتور و Snapshot پیش از صدور قابل بازبینی است.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!report) {
    const empty = document.createElement('div');
    empty.setAttribute('role', 'status');
    empty.textContent = 'گزارش هنوز آماده نیست. ابتدا تحلیل معتبر را اجرا کنید تا بسته گزارش Engineering Core برای Run فعال ساخته شود.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const readiness = document.createElement('div');
  readiness.setAttribute('role', 'status');
  readiness.textContent = 'آماده صدور · گزارش به Run فعال و Snapshot فعلی متصل است.';
  readiness.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.md} 0`;
  readiness.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  readiness.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.statusNominal}`;
  readiness.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  readiness.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal;
  panel.appendChild(readiness);

  const formatsTitle = document.createElement('h3');
  formatsTitle.textContent = 'بسته خروجی';
  const formats = document.createElement('div');
  formats.style.display = 'grid';
  formats.style.gridTemplateColumns = 'repeat(auto-fit, minmax(190px, 1fr))';
  formats.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  appendFormatCard(formats, 'PDF', report.pdfRequest.mediaType, 'نسخه قابل ارائه و آرشیو از همین Run فعال');
  appendFormatCard(formats, 'HTML', report.htmlMediaType, 'نمای ساخت‌یافته گزارش طبق قرارداد Engineering Core');
  appendFormatCard(formats, 'JSON', report.jsonMediaType, 'داده ساخت‌یافته برای رهگیری و تبادل');
  panel.append(formatsTitle, formats);

  const traceability = document.createElement('details');
  traceability.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const traceabilitySummary = document.createElement('summary');
  traceabilitySummary.textContent = 'هویت و رهگیری گزارش';
  traceabilitySummary.style.cursor = 'pointer';
  traceability.appendChild(traceabilitySummary);

  const meta = document.createElement('div');
  meta.style.display = 'grid';
  meta.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
  meta.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;

  const values: readonly [string, string][] = [
    ['Run ID', report.runId],
    ['Engine', report.engineVersion],
    ['Snapshot', report.inputSnapshotHash],
    ['Locale', report.reportLocale],
    ['Direction', report.reportDirection],
    ['Bundle method', report.bundleMethod],
  ];
  for (const [labelText, valueText] of values) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small');
    label.textContent = labelText;
    const value = document.createElement('div');
    value.textContent = valueText;
    value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    value.style.overflowWrap = 'anywhere';
    card.append(label, value);
    meta.appendChild(card);
  }
  traceability.appendChild(meta);
  panel.appendChild(traceability);

  const exportArea = document.createElement('div');
  exportArea.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  exportArea.style.paddingTop = TOLUE_DESIGN_TOKENS.spacing.md;
  exportArea.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;

  const exportTitle = document.createElement('h3');
  exportTitle.textContent = 'صدور نسخه نهایی';
  const exportHint = document.createElement('p');
  exportHint.textContent = 'PDF فقط از قرارداد آماده‌شده توسط Engineering Core و از Run فعال Session صادر می‌شود؛ Renderer فایل‌سیستم یا printToPDF را مستقیماً کنترل نمی‌کند.';
  exportHint.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const exportStatus = document.createElement('p');
  exportStatus.setAttribute('aria-live', 'polite');
  exportStatus.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const pdf = document.createElement('button');
  pdf.type = 'button';
  pdf.textContent = 'صدور PDF Run فعال';
  pdf.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.lg}`;
  pdf.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.focus}`;
  pdf.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  pdf.style.fontFamily = 'inherit';
  pdf.style.fontWeight = '700';
  pdf.disabled = !actions;
  if (!actions) {
    exportStatus.textContent = 'عملیات صدور PDF در این Session در دسترس نیست.';
  } else {
    pdf.addEventListener('click', () => {
      pdf.disabled = true;
      pdf.setAttribute('aria-busy', 'true');
      pdf.textContent = 'در حال صدور PDF…';
      exportStatus.textContent = 'در حال صدور PDF Run فعال…';
      void actions.exportActiveEngineeringPdf()
        .then(response => {
          exportStatus.textContent = presentEngineeringPdfExportResponse(report, response).message;
        })
        .catch(() => {
          exportStatus.textContent = 'پاسخ صدور PDF معتبر نیست یا هویت Run/Hash با Session فعال تطابق ندارد.';
        })
        .finally(() => {
          pdf.disabled = false;
          pdf.removeAttribute('aria-busy');
          pdf.textContent = 'صدور PDF Run فعال';
        });
    });
  }
  exportArea.append(exportTitle, exportHint, pdf, exportStatus);
  panel.appendChild(exportArea);
  root.appendChild(panel);
}
