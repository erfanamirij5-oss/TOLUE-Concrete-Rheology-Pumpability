import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PressureProfilePresentation } from './pressureProfilePresentation';

function pressure(value: number | null): string {
  return value === null ? '—' : `${value} Pa`;
}

function coordinate(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`;
}

function renderPressureChart(
  panel: HTMLElement,
  presentation: Readonly<PressureProfilePresentation>,
): void {
  const drawable = presentation.points.filter(point =>
    point.status === 'computed'
    && point.positionM !== null
    && point.remainingRequiredPressurePa !== null,
  );
  if (drawable.length === 0) return;

  const width = 760;
  const height = 280;
  const padding = 36;
  const maxX = Math.max(...drawable.map(point => point.positionM ?? 0), 1);
  const pressures = drawable.map(point => point.remainingRequiredPressurePa ?? 0);
  const minP = Math.min(...pressures, 0);
  const maxP = Math.max(...pressures, 1);
  const spanP = Math.max(maxP - minP, 1);
  const x = (positionM: number) => padding + (positionM / maxX) * (width - 2 * padding);
  const y = (pressurePa: number) => height - padding - ((pressurePa - minP) / spanP) * (height - 2 * padding);

  const wrapper = document.createElement('div');
  wrapper.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  wrapper.style.overflowX = 'auto';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'نمودار فشار باقی‌مانده در طول مسیر');
  svg.style.width = '100%';
  svg.style.minWidth = '620px';
  svg.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  svg.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  svg.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

  const axisX = document.createElementNS(svg.namespaceURI, 'line');
  axisX.setAttribute('x1', String(padding)); axisX.setAttribute('y1', String(height - padding));
  axisX.setAttribute('x2', String(width - padding)); axisX.setAttribute('y2', String(height - padding));
  axisX.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.border);
  const axisY = document.createElementNS(svg.namespaceURI, 'line');
  axisY.setAttribute('x1', String(padding)); axisY.setAttribute('y1', String(padding));
  axisY.setAttribute('x2', String(padding)); axisY.setAttribute('y2', String(height - padding));
  axisY.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.border);
  svg.append(axisX, axisY);

  for (let i = 1; i < presentation.points.length; i += 1) {
    const previous = presentation.points[i - 1]!;
    const current = presentation.points[i]!;
    if (
      previous.status !== 'computed' || current.status !== 'computed'
      || previous.positionM === null || current.positionM === null
      || previous.remainingRequiredPressurePa === null || current.remainingRequiredPressurePa === null
    ) continue;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', String(x(previous.positionM)));
    line.setAttribute('y1', String(y(previous.remainingRequiredPressurePa)));
    line.setAttribute('x2', String(x(current.positionM)));
    line.setAttribute('y2', String(y(current.remainingRequiredPressurePa)));
    line.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.focus);
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);
  }

  for (const point of drawable) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', String(x(point.positionM!)));
    circle.setAttribute('cy', String(y(point.remainingRequiredPressurePa!)));
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', TOLUE_DESIGN_TOKENS.color.focus);
    const title = document.createElementNS(svg.namespaceURI, 'title');
    title.textContent = `#${point.index} · ${point.segmentId ?? 'INLET'} · ${point.positionM} m · ${point.remainingRequiredPressurePa} Pa`;
    circle.appendChild(title);
    svg.appendChild(circle);
  }

  const caption = document.createElement('small');
  caption.textContent = 'محور افقی: موقعیت هندسی معلوم (m) · محور عمودی: فشار باقی‌مانده موردنیاز (Pa). اتصال فقط بین نقاط مجاور computed رسم می‌شود.';
  caption.style.display = 'block';
  caption.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
  caption.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  wrapper.append(svg, caption);
  panel.appendChild(wrapper);
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
  renderPressureChart(panel, presentation);

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
