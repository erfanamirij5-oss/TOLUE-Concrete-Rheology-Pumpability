import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { appendEngineeringSectionHeader, styleEngineeringSection } from './engineeringPanelStyle';
import type { PressureCompositionPresentation } from './pressureCompositionPresentation';
import { assessmentStatusFa } from './persianPresentation';

function pressure(value: number | null): string { return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} مگاپاسکال`; }

export function renderPressureCompositionView(root: HTMLElement, presentation?: Readonly<PressureCompositionPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'ترکیب فشار خط لوله');
  styleEngineeringSection(panel, true);
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  appendEngineeringSectionHeader(panel, 'ترکیب فشار موردنیاز', 'اجزای فشار مستقیماً از نتیجه تحلیل خط لوله نمایش داده می‌شوند و در این نما سهم یا ضریب مهندسی جدیدی ساخته نمی‌شود.', 'ترکیب فشار');
  const body = document.createElement('div');
  Object.assign(body.style, { padding: '14px' });
  panel.appendChild(body);

  if (!presentation) {
    const empty = document.createElement('p');
    empty.textContent = 'هنوز داده معتبر ترکیب فشار دریافت نشده است.';
    empty.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    body.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const maxMagnitude = Math.max(1, ...presentation.items.map(item => Math.abs(item.valuePa)));
  const chart = document.createElement('div');
  Object.assign(chart.style, { display: 'grid', gap: '10px' });

  for (const item of presentation.items) {
    const row = document.createElement('article');
    Object.assign(row.style, { padding: '9px 10px', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`, borderRadius: TOLUE_DESIGN_TOKENS.radius.sm, background: 'rgba(12,23,30,.72)' });
    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' });
    const label = document.createElement('strong'); label.textContent = item.label;
    const value = document.createElement('span');
    value.textContent = pressure(item.valuePa);
    Object.assign(value.style, { fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, direction: 'rtl', color: item.valuePa < 0 ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.text });
    header.append(label, value);

    const track = document.createElement('div');
    Object.assign(track.style, { height: '14px', marginTop: '7px', background: '#071017', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`, borderRadius: '999px', overflow: 'hidden' });
    const bar = document.createElement('div');
    bar.dataset.sign = item.valuePa < 0 ? 'negative' : 'nonnegative';
    Object.assign(bar.style, {
      height: '100%', width: `${(Math.abs(item.valuePa) / maxMagnitude) * 100}%`, minWidth: item.valuePa === 0 ? '0' : '3px',
      background: item.valuePa < 0 ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.focus,
      boxShadow: `0 0 12px ${item.valuePa < 0 ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.focus}55`,
    });
    track.appendChild(bar); row.append(header, track); chart.appendChild(row);
  }

  body.appendChild(chart);
  const total = document.createElement('div');
  Object.assign(total.style, { marginTop: '12px', padding: '10px 12px', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`, borderRadius: TOLUE_DESIGN_TOKENS.radius.sm, background: TOLUE_DESIGN_TOKENS.color.surfaceElevated });
  const required = document.createElement('strong'); required.textContent = `فشار موردنیاز: ${pressure(presentation.requiredPressurePa)}`;
  const meta = document.createElement('small');
  Object.assign(meta.style, { display: 'block', marginTop: '4px', color: TOLUE_DESIGN_TOKENS.color.textMuted, direction: 'rtl' });
  meta.textContent = `کامل بودن تحلیل: ${assessmentStatusFa(presentation.completeness)} · شناسه روش: ${presentation.method}`;
  total.append(required, meta); body.appendChild(total); root.appendChild(panel);
}
