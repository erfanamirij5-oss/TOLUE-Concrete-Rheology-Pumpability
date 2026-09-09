import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PumpCapabilityPresentation } from './pumpPresentation';
import { renderPumpFlowPressureCurveView } from './pumpFlowPressureCurveView';
import { renderPumpPressureChartView } from './pumpPressureChartView';

function pressureText(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

export function renderPumpView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'قابلیت فشار پمپ');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'قابلیت پمپ و تطابق فشار';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'وضعیت PASS/FAIL/INSUFFICIENT_DATA مستقیماً از Engineering Core نمایش داده می‌شود. Renderer آستانه یا حاشیه ایمنی جدید ایجاد نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!result) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز نتیجه معتبر قابلیت پمپ از Engineering Core دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    renderPumpPressureChartView(root);
    renderPumpFlowPressureCurveView(root);
    return;
  }

  const values: readonly [string, string][] = [
    ['دبی هدف', `${result.targetFlowRateM3s} m³/s`],
    ['فشار موردنیاز', pressureText(result.requiredPressurePa)],
    ['فشار قابل تأمین', pressureText(result.availablePressurePa)],
    ['حاشیه فشار', pressureText(result.pressureMarginPa)],
    ['وضعیت', result.status],
    ['روش درون‌یابی', result.interpolation],
    ['منشأ داده', result.provenance],
    ['روش', result.method],
  ];

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const [labelText, valueText] of values) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small');
    label.textContent = labelText;
    label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const value = document.createElement('div');
    value.textContent = valueText;
    value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    card.append(label, value);
    grid.appendChild(card);
  }
  panel.appendChild(grid);
  root.appendChild(panel);
  renderPumpPressureChartView(root, result);
  renderPumpFlowPressureCurveView(root, result);
}
