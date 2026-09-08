import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { ReportExportPresentation } from './reportPresentation';

export interface ReportExportActions {
  readonly exportActiveEngineeringPdf: () => Promise<unknown>;
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
  note.textContent = 'HTML، JSON و PDF فقط از قراردادهای آماده‌شده توسط Engineering Core صادر می‌شوند. PDF فقط از Run فعال Session صادر می‌شود و Renderer فایل‌سیستم یا printToPDF را مستقیماً کنترل نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!report) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز بسته گزارش معتبر از Engineering Core دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const meta = document.createElement('div');
  meta.style.display = 'grid';
  meta.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
  meta.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;

  const values: readonly [string, string][] = [
    ['Run ID', report.runId],
    ['Engine', report.engineVersion],
    ['Snapshot', report.inputSnapshotHash],
    ['Locale', report.reportLocale],
    ['Direction', report.reportDirection],
    ['HTML', report.htmlMediaType],
    ['JSON', report.jsonMediaType],
    ['PDF', report.pdfRequest.mediaType],
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
    card.append(label, value);
    meta.appendChild(card);
  }
  panel.appendChild(meta);

  const exportStatus = document.createElement('p');
  exportStatus.setAttribute('aria-live', 'polite');
  exportStatus.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const pdf = document.createElement('button');
  pdf.type = 'button';
  pdf.textContent = 'صدور PDF همین Run فعال';
  pdf.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  pdf.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.lg}`;
  pdf.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.focus}`;
  pdf.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  pdf.style.fontFamily = 'inherit';
  pdf.disabled = !actions;
  if (actions) {
    pdf.addEventListener('click', () => {
      pdf.disabled = true;
      exportStatus.textContent = 'در حال صدور PDF Run فعال…';
      void actions.exportActiveEngineeringPdf()
        .then(() => { exportStatus.textContent = 'درخواست صدور PDF Run فعال تکمیل شد.'; })
        .catch(() => { exportStatus.textContent = 'صدور PDF رد شد؛ هویت Run/Hash یا وضعیت Session معتبر نیست.'; })
        .finally(() => { pdf.disabled = false; });
    });
  }
  panel.append(pdf, exportStatus);
  root.appendChild(panel);
}
