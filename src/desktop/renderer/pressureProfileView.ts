import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PressureProfilePresentation } from './pressureProfilePresentation';

function pressure(value: number | null): string {
  return value === null ? '—' : `${value} Pa`;
}

function coordinate(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`;
}

export function renderPressureProfileView(
  root: HTMLElement,
  presentation?: Readonly<PressureProfilePresentation>,
): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'پروفایل فشار خط لوله');
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'پروفایل فشار مسیر';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'این نما فقط نقاط تولیدشده توسط Engineering Core را نمایش می‌دهد. برای نقاط not_computed هیچ interpolation، صفر جایگزین یا تخمین گرافیکی ایجاد نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!presentation) {
    const empty = document.createElement('p');
    empty.textContent = 'هنوز پروفایل فشار معتبر از تحلیل فعال دریافت نشده است.';
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const summary = document.createElement('div');
  summary.style.display = 'grid';
  summary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
  summary.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const [label, value] of [
    ['Peak pressure', pressure(presentation.peakRequiredPressurePa)],
    ['Peak point', presentation.peakPointIndex === null ? '—' : String(presentation.peakPointIndex)],
    ['Completeness', presentation.completeness],
    ['Outlet reference', `${presentation.outletPressureReferencePa} Pa`],
  ] as const) {
    const card = document.createElement('div');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const key = document.createElement('strong'); key.textContent = label;
    const val = document.createElement('div'); val.textContent = value; val.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; val.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
    card.append(key, val); summary.appendChild(card);
  }
  panel.appendChild(summary);

  const table = document.createElement('div');
  table.style.display = 'grid';
  table.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  table.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  for (const point of presentation.points) {
    const row = document.createElement('article');
    row.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    row.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    row.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    row.style.background = point.status === 'computed' ? TOLUE_DESIGN_TOKENS.color.surface : TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    const identity = document.createElement('strong'); identity.textContent = `#${point.index} · ${point.segmentId ?? 'INLET'}`;
    const values = document.createElement('div');
    values.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    values.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
    values.textContent = `x=${coordinate(point.positionM, 'm')} · z=${coordinate(point.elevationM, 'm')} · cumulative=${pressure(point.cumulativeRequiredPressurePa)} · remaining=${pressure(point.remainingRequiredPressurePa)}`;
    const trace = document.createElement('small');
    trace.style.display = 'block'; trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; trace.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    trace.textContent = `status=${point.status} · method=${point.pressureMethod ?? '—'} · calibration=${point.calibrationId ?? '—'} · provenance=${point.provenanceEntityId ?? '—'}`;
    row.append(identity, values, trace); table.appendChild(row);
  }
  panel.appendChild(table);

  const meta = document.createElement('small');
  meta.style.display = 'block'; meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg; meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  meta.textContent = `Method: ${presentation.method} · Assumption: ${presentation.assumption}`;
  panel.appendChild(meta);
  root.appendChild(panel);
}
