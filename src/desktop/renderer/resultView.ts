import { statusToneColor, TOLUE_DESIGN_TOKENS } from './designSystem';
import type { ResultCenterPresentation } from './resultPresentation';
import { evidenceStatusUx, pressureFeasibilityUx, pumpabilityDecisionUx, validationStatusUx } from './resultUx';

function displayValue(value: number | string | boolean | null, unit: string | null): string {
  if (value === null) return '—';
  const text = String(value);
  return unit ? `${text} ${unit}` : text;
}

function makeBadge(text: string, tone: 'nominal' | 'warning' | 'critical' | 'unknown'): HTMLElement {
  const badge = document.createElement('span');
  badge.textContent = text;
  badge.style.display = 'inline-block';
  badge.style.padding = '2px 8px';
  badge.style.marginInlineEnd = TOLUE_DESIGN_TOKENS.spacing.sm;
  badge.style.border = `1px solid ${statusToneColor(tone)}`;
  badge.style.borderRadius = '999px';
  badge.style.color = statusToneColor(tone);
  badge.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  badge.style.fontWeight = '700';
  return badge;
}

export function renderResultView(root: HTMLElement, center?: Readonly<ResultCenterPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'مرکز نتایج مهندسی');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'مرکز نتایج مهندسی';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'وضعیت‌ها و نتایج مستقیماً از Engineering Core نمایش داده می‌شوند؛ رنگ و اولویت‌بندی این صفحه فقط برای خوانایی است و نتیجه مهندسی جدیدی ایجاد نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!center) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز Result Center معتبر از Engineering Core دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const summary = document.createElement('section');
  summary.setAttribute('aria-label', 'خلاصه وضعیت نتایج');
  summary.style.display = 'grid';
  summary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
  summary.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  summary.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;

  const completeness = document.createElement('article');
  completeness.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  completeness.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  completeness.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  const completenessTitle = document.createElement('small');
  completenessTitle.textContent = 'کامل بودن تحلیل';
  const completenessValue = document.createElement('div');
  completenessValue.textContent = center.completeness === 'complete' ? 'کامل' : 'ناقص';
  completenessValue.style.fontWeight = '800';
  completenessValue.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeLg;
  completenessValue.style.color = statusToneColor(center.completeness === 'complete' ? 'nominal' : 'warning');
  completeness.append(completenessTitle, completenessValue);
  summary.appendChild(completeness);

  if (center.pumpabilityDecision) {
    const decisionUx = pumpabilityDecisionUx(center.pumpabilityDecision.status);
    const pressureUx = pressureFeasibilityUx(center.pumpabilityDecision.pressureFeasibility);
    const decision = document.createElement('article');
    decision.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    decision.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    decision.style.border = `1px solid ${statusToneColor(decisionUx.tone)}`;
    decision.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small');
    label.textContent = 'تصمیم پمپ‌پذیری';
    const value = document.createElement('div');
    value.textContent = decisionUx.label;
    value.style.fontWeight = '800';
    value.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeLg;
    value.style.color = statusToneColor(decisionUx.tone);
    const axes = document.createElement('div');
    axes.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    axes.append(makeBadge(`فشار: ${pressureUx.label}`, pressureUx.tone));
    const stabilityTone = center.pumpabilityDecision.stability === 'UNACCEPTABLE' ? 'critical' : center.pumpabilityDecision.stability === 'ACCEPTABLE' ? 'nominal' : 'unknown';
    const blockageTone = center.pumpabilityDecision.blockageRisk === 'UNACCEPTABLE' ? 'critical' : center.pumpabilityDecision.blockageRisk === 'ACCEPTABLE' ? 'nominal' : 'unknown';
    axes.append(makeBadge(`پایداری: ${center.pumpabilityDecision.stability}`, stabilityTone));
    axes.append(makeBadge(`انسداد: ${center.pumpabilityDecision.blockageRisk}`, blockageTone));
    decision.append(label, value, axes);
    summary.appendChild(decision);
  }
  panel.appendChild(summary);

  if (center.warnings.length > 0) {
    const warnings = document.createElement('section');
    warnings.setAttribute('aria-label', 'هشدارهای نتایج');
    warnings.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;
    warnings.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    warnings.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.statusWarning}`;
    warnings.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const warningTitle = document.createElement('strong');
    warningTitle.textContent = `هشدارها (${center.warnings.length})`;
    const list = document.createElement('ul');
    for (const warning of center.warnings) { const item = document.createElement('li'); item.textContent = warning; list.appendChild(item); }
    warnings.append(warningTitle, list);
    panel.appendChild(warnings);
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const result of center.results) {
    const validation = validationStatusUx(result.validationStatus);
    const evidence = evidenceStatusUx(result.evidenceStatus);
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderInlineStart = `4px solid ${statusToneColor(validation.tone)}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const heading = document.createElement('strong');
    heading.textContent = result.label;
    const value = document.createElement('div');
    value.textContent = displayValue(result.value, result.unit);
    value.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0`;
    value.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeLg;
    value.style.fontWeight = '800';
    const badges = document.createElement('div');
    badges.append(makeBadge(validation.label, validation.tone), makeBadge(evidence.label, evidence.tone));
    const meta = document.createElement('small');
    meta.textContent = `${result.resultClass} · ${result.methodId} v${result.methodVersion}`;
    meta.style.display = 'block';
    meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const trace = document.createElement('details');
    trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    const traceSummary = document.createElement('summary');
    traceSummary.textContent = 'دامنه و ردیابی';
    const traceText = document.createElement('p');
    traceText.textContent = result.applicability;
    traceText.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    trace.append(traceSummary, traceText);
    card.append(heading, value, badges, meta, trace);
    grid.appendChild(card);
  }
  panel.appendChild(grid);
  root.appendChild(panel);
}
