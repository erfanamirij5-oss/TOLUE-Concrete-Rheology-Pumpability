import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { ResultCenterPresentation } from './resultPresentation';

function displayValue(value: number | string | boolean | null, unit: string | null): string {
  if (value === null) return '—';
  const text = String(value);
  return unit ? `${text} ${unit}` : text;
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
  note.textContent = 'تمام کلاس‌ها، وضعیت‌های اعتبارسنجی، شواهد و تصمیم پمپ‌پذیری مستقیماً از Engineering Core نمایش داده می‌شوند؛ Renderer نتیجه جدیدی استنتاج نمی‌کند.';
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

  if (center.pumpabilityDecision) {
    const decision = document.createElement('article');
    decision.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    decision.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;
    decision.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    decision.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    decision.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    decision.textContent = `تصمیم: ${center.pumpabilityDecision.status} | فشار: ${center.pumpabilityDecision.pressureFeasibility} | پایداری: ${center.pumpabilityDecision.stability} | انسداد: ${center.pumpabilityDecision.blockageRisk}`;
    panel.appendChild(decision);
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const result of center.results) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const heading = document.createElement('strong');
    heading.textContent = result.label;
    const value = document.createElement('div');
    value.textContent = displayValue(result.value, result.unit);
    value.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0`;
    const meta = document.createElement('small');
    meta.textContent = `${result.resultClass} · ${result.validationStatus} · ${result.evidenceStatus} · ${result.methodId}`;
    meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    card.append(heading, value, meta);
    grid.appendChild(card);
  }
  panel.appendChild(grid);
  root.appendChild(panel);
}
