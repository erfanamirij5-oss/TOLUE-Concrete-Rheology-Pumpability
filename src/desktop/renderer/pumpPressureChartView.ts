import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PumpCapabilityPresentation } from './pumpPresentation';

function pressure(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

export function renderPumpPressureChartView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'نمودار فشار موردنیاز و قابل تأمین پمپ');
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'فشار موردنیاز در برابر فشار قابل تأمین';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'ارتفاع میله‌ها صرفاً مقیاس بصری دو مقدار تولیدشده توسط Engineering Core است. هیچ ضریب اطمینان، محدوده حاشیه‌ای یا ظرفیت اضافی در Renderer تعریف نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!result || result.requiredPressurePa === null || result.availablePressurePa === null) {
    const unavailable = document.createElement('p');
    unavailable.textContent = result ? `نمودار کمی در وضعیت ${result.status} قابل ترسیم نیست؛ یکی از فشارهای موردنیاز یا قابل تأمین در Core ناموجود است.` : 'هنوز نتیجه معتبر قابلیت پمپ دریافت نشده است.';
    panel.appendChild(unavailable);
    root.appendChild(panel);
    return;
  }

  const maxPressure = Math.max(1, result.requiredPressurePa, result.availablePressurePa);
  const chart = document.createElement('div');
  chart.style.display = 'grid';
  chart.style.gridTemplateColumns = 'repeat(2, minmax(160px, 1fr))';
  chart.style.gap = TOLUE_DESIGN_TOKENS.spacing.lg;
  chart.style.alignItems = 'end';
  chart.style.minHeight = '260px';

  const values = [
    { id: 'required', label: 'فشار موردنیاز', valuePa: result.requiredPressurePa },
    { id: 'available', label: 'فشار قابل تأمین', valuePa: result.availablePressurePa },
  ] as const;

  for (const item of values) {
    const column = document.createElement('div');
    column.style.display = 'grid';
    column.style.gridTemplateRows = '1fr auto auto';
    column.style.height = '240px';
    column.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
    const track = document.createElement('div');
    track.style.display = 'flex';
    track.style.alignItems = 'flex-end';
    track.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    track.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    track.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    track.style.overflow = 'hidden';
    const bar = document.createElement('div');
    bar.dataset.pressureRole = item.id;
    bar.style.width = '100%';
    bar.style.height = `${(item.valuePa / maxPressure) * 100}%`;
    bar.style.background = TOLUE_DESIGN_TOKENS.color.focus;
    track.appendChild(bar);
    const value = document.createElement('strong'); value.textContent = pressure(item.valuePa); value.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
    const label = document.createElement('span'); label.textContent = item.label;
    column.append(track, value, label); chart.appendChild(column);
  }

  const meta = document.createElement('small');
  meta.style.display = 'block';
  meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  meta.textContent = `Status: ${result.status} · Margin: ${pressure(result.pressureMarginPa)} · Interpolation: ${result.interpolation} · Provenance: ${result.provenance}`;
  panel.append(chart, meta);
  root.appendChild(panel);
}
