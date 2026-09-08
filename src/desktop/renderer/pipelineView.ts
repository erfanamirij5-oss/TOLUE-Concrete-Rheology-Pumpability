import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PipelinePresentation } from './pipelinePresentation';
import type { PressureProfilePresentation } from './pressureProfilePresentation';
import { renderPressureProfileView } from './pressureProfileView';

const EMPTY_PIPELINE: Readonly<PipelinePresentation> = Object.freeze({
  completeness: 'incomplete',
  method: 'tolue-pipeline-pressure-v2',
  components: Object.freeze([
    Object.freeze({ id: 'straight-friction', label: 'افت فشار اصطکاکی مسیر مستقیم', valuePa: null, source: 'engineering-core' as const }),
    Object.freeze({ id: 'calibrated-local-friction', label: 'افت فشار موضعی کالیبره‌شده', valuePa: null, source: 'engineering-core' as const }),
    Object.freeze({ id: 'elevation', label: 'فشار ناشی از اختلاف ارتفاع', valuePa: null, source: 'engineering-core' as const }),
    Object.freeze({ id: 'required', label: 'فشار موردنیاز', valuePa: null, source: 'engineering-core' as const }),
  ]),
  segments: Object.freeze([]),
});

function formatPressure(valuePa: number | null): string {
  return valuePa === null ? '— Pa' : `${valuePa} Pa`;
}

export function renderPipelineView(
  root: HTMLElement,
  presentation: Readonly<PipelinePresentation> = EMPTY_PIPELINE,
  pressureProfile?: Readonly<PressureProfilePresentation>,
): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'اجزای فشار خط لوله');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'اجزای فشار خط لوله';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'مقادیر فقط از Engineering Core نمایش داده می‌شوند. افت موضعی بدون کالیبراسیون معتبر محاسبه‌شده فرض نمی‌شود و مقدار صفر جایگزین نمی‌گردد.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;

  for (const component of presentation.components) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

    const label = document.createElement('strong');
    label.textContent = component.label;
    const value = document.createElement('div');
    value.textContent = formatPressure(component.valuePa);
    value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    value.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;

    card.append(label, value);
    grid.appendChild(card);
  }

  const meta = document.createElement('small');
  meta.textContent = `Completeness: ${presentation.completeness} · Method: ${presentation.method}`;
  meta.style.display = 'block';
  meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  panel.append(title, note, grid, meta);
  root.appendChild(panel);
  renderPressureProfileView(root, pressureProfile);
}
