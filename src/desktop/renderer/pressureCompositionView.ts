import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PressureCompositionPresentation } from './pressureCompositionPresentation';

function pressure(value: number | null): string { return value === null ? '—' : `${value} Pa`; }

export function renderPressureCompositionView(root: HTMLElement, presentation?: Readonly<PressureCompositionPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'ترکیب فشار خط لوله');
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  const title = document.createElement('h2'); title.textContent = 'ترکیب فشار موردنیاز'; title.style.marginTop = '0';
  const note = document.createElement('p'); note.textContent = 'اجزای فشار مستقیماً از PipelineAnalysisResult نمایش داده می‌شوند. این نمودار سهم، درصد یا ضریب جدید مهندسی استنتاج نمی‌کند.'; note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);
  if (!presentation) { const empty = document.createElement('p'); empty.textContent = 'هنوز داده معتبر ترکیب فشار دریافت نشده است.'; panel.appendChild(empty); root.appendChild(panel); return; }

  const maxMagnitude = Math.max(1, ...presentation.items.map(item => Math.abs(item.valuePa)));
  const chart = document.createElement('div'); chart.style.display = 'grid'; chart.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const item of presentation.items) {
    const row = document.createElement('div');
    const header = document.createElement('div'); header.style.display = 'flex'; header.style.justifyContent = 'space-between';
    const label = document.createElement('strong'); label.textContent = item.label;
    const value = document.createElement('span'); value.textContent = pressure(item.valuePa); value.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
    header.append(label, value);
    const track = document.createElement('div'); track.style.height = '16px'; track.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; track.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted; track.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; track.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm; track.style.overflow = 'hidden';
    const bar = document.createElement('div'); bar.style.height = '100%'; bar.style.width = `${(Math.abs(item.valuePa) / maxMagnitude) * 100}%`; bar.style.background = item.valuePa < 0 ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.focus; bar.dataset.sign = item.valuePa < 0 ? 'negative' : 'nonnegative';
    track.appendChild(bar); row.append(header, track); chart.appendChild(row);
  }
  panel.appendChild(chart);
  const total = document.createElement('p'); total.style.marginBottom = '0'; total.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg; total.textContent = `Required pressure: ${pressure(presentation.requiredPressurePa)} · Completeness: ${presentation.completeness} · Method: ${presentation.method}`;
  panel.appendChild(total); root.appendChild(panel);
}
