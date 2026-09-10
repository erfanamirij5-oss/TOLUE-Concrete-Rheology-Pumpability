import { TOLUE_DESIGN_TOKENS, statusToneColor } from './designSystem';
import type { DiagnosticsPresentation } from './diagnosticsPresentation';
import { diagnosticBasisLabel, diagnosticKindLabel, diagnosticSeverityUx, diagnosticValidationLabel, sortDiagnosticFindings } from './diagnosticsUx';

export function renderDiagnosticsView(root: HTMLElement, diagnostics?: Readonly<DiagnosticsPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'تشخیص‌های مهندسی');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'تشخیص‌ها و هشدارهای مهندسی';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'اولویت، نوع، مبنا، Rule ID و توصیه‌ها فقط از Diagnostics Core نمایش داده می‌شوند؛ Renderer هیچ تشخیص یا آستانه جدیدی تولید نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!diagnostics) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز Diagnostics معتبر از Engineering Core دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const criticalCount = diagnostics.findings.filter(item => item.severity === 'critical').length;
  const warningCount = diagnostics.findings.filter(item => item.severity === 'warning').length;
  const infoCount = diagnostics.findings.filter(item => item.severity === 'info').length;
  const summary = document.createElement('div');
  summary.style.display = 'grid';
  summary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
  summary.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  summary.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.lg} 0`;
  for (const [label, value, tone] of [
    ['بحرانی', criticalCount, 'critical'],
    ['هشدار', warningCount, 'warning'],
    ['اطلاع', infoCount, 'nominal'],
  ] as const) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${statusToneColor(tone)}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const number = document.createElement('strong');
    number.textContent = String(value);
    number.style.display = 'block';
    number.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;
    number.style.color = statusToneColor(tone);
    const text = document.createElement('span');
    text.textContent = label;
    card.append(number, text);
    summary.appendChild(card);
  }
  panel.appendChild(summary);

  if (diagnostics.findings.length === 0) {
    const nominal = document.createElement('div');
    nominal.textContent = 'Diagnostics Core هیچ Finding فعالی برای این تحلیل گزارش نکرده است.';
    nominal.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    nominal.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    nominal.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(nominal);
    root.appendChild(panel);
    return;
  }

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const finding of sortDiagnosticFindings(diagnostics.findings)) {
    const severity = diagnosticSeverityUx(finding.severity);
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${statusToneColor(severity.tone)}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

    const badge = document.createElement('span');
    badge.textContent = severity.label;
    badge.style.display = 'inline-block';
    badge.style.padding = '2px 8px';
    badge.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.sm;
    badge.style.borderRadius = '999px';
    badge.style.border = `1px solid ${statusToneColor(severity.tone)}`;
    badge.style.color = statusToneColor(severity.tone);
    badge.style.fontWeight = '700';

    const heading = document.createElement('strong');
    heading.textContent = finding.title;
    heading.style.display = 'block';
    const message = document.createElement('p');
    message.textContent = finding.message;

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.flexWrap = 'wrap';
    meta.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
    meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    for (const text of [diagnosticKindLabel(finding.kind), diagnosticBasisLabel(finding.basis), diagnosticValidationLabel(finding.validationStatus)]) {
      const item = document.createElement('small');
      item.textContent = text;
      meta.appendChild(item);
    }

    card.append(badge, heading, message, meta);
    if (finding.recommendation) {
      const recommendation = document.createElement('p');
      recommendation.textContent = `اقدام پیشنهادی: ${finding.recommendation}`;
      recommendation.style.marginBottom = '0';
      recommendation.style.fontWeight = '600';
      card.appendChild(recommendation);
    }

    const details = document.createElement('details');
    details.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    const summaryLine = document.createElement('summary');
    summaryLine.textContent = 'جزئیات ردیابی';
    const trace = document.createElement('small');
    trace.style.display = 'block';
    trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    trace.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    trace.textContent = `Rule: ${finding.ruleId}@${finding.ruleVersion} · Source results: ${finding.sourceResultIds.join(', ') || '—'} · Run: ${finding.sourceRunId}`;
    details.append(summaryLine, trace);
    card.appendChild(details);
    list.appendChild(card);
  }
  panel.appendChild(list);
  root.appendChild(panel);
}
