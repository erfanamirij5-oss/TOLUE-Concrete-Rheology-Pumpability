import { TOLUE_DESIGN_TOKENS, statusToneColor, type TolueStatusTone } from './designSystem';
import type { DiagnosticsPresentation } from './diagnosticsPresentation';

function toneForSeverity(severity: 'info' | 'warning' | 'critical'): TolueStatusTone {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'nominal';
}

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
  note.textContent = 'نوع، شدت، مبنا، rule ID و توصیه‌ها مستقیماً از Diagnostics Core نمایش داده می‌شوند. Renderer هیچ آستانه یا تشخیص مهندسی جدیدی تولید نمی‌کند.';
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

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const finding of diagnostics.findings) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${statusToneColor(toneForSeverity(finding.severity))}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

    const heading = document.createElement('strong');
    heading.textContent = finding.title;
    const message = document.createElement('p');
    message.textContent = finding.message;
    const meta = document.createElement('small');
    meta.textContent = `${finding.severity} · ${finding.kind} · ${finding.basis} · ${finding.ruleId}@${finding.ruleVersion} · ${finding.validationStatus}`;
    meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    card.append(heading, message, meta);
    if (finding.recommendation) {
      const recommendation = document.createElement('p');
      recommendation.textContent = `توصیه: ${finding.recommendation}`;
      recommendation.style.marginBottom = '0';
      card.appendChild(recommendation);
    }
    list.appendChild(card);
  }
  panel.appendChild(list);
  root.appendChild(panel);
}
