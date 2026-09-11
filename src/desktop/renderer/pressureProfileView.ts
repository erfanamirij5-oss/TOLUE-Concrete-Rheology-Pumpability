import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { appendEngineeringSectionHeader, styleEngineeringSection } from './engineeringPanelStyle';
import type { PressureProfilePresentation } from './pressureProfilePresentation';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface PressureProfileViewOptions {
  readonly selectedSegmentId?: string | null | undefined;
  readonly onSelectSegment?: ((segmentId: string) => void) | undefined;
}

function pressure(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

function coordinate(value: number | null, unit: string): string {
  return value === null ? '—' : `${value} ${unit}`;
}

function renderPressureChart(
  panel: HTMLElement,
  presentation: Readonly<PressureProfilePresentation>,
  options: Readonly<PressureProfileViewOptions>,
): void {
  const drawable = presentation.points.filter(point =>
    point.status === 'computed'
    && point.positionM !== null
    && point.remainingRequiredPressurePa !== null,
  );
  if (drawable.length === 0) return;

  const width = 760;
  const height = 290;
  const padding = 42;
  const maxX = Math.max(...drawable.map(point => point.positionM ?? 0), 1);
  const pressures = drawable.map(point => point.remainingRequiredPressurePa ?? 0);
  const minP = Math.min(...pressures, 0);
  const maxP = Math.max(...pressures, 1);
  const spanP = Math.max(maxP - minP, 1);
  const x = (positionM: number) => padding + (positionM / maxX) * (width - 2 * padding);
  const y = (pressurePa: number) => height - padding - ((pressurePa - minP) / spanP) * (height - 2 * padding);

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { marginTop: TOLUE_DESIGN_TOKENS.spacing.lg, overflowX: 'auto' });
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'نمودار فشار باقی‌مانده در طول مسیر');
  Object.assign(svg.style, {
    width: '100%', minWidth: '620px', display: 'block',
    background: 'linear-gradient(180deg,rgba(10,24,32,.95),rgba(6,16,22,.98))',
    border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,
    borderRadius: TOLUE_DESIGN_TOKENS.radius.md,
  });

  for (let i = 0; i <= 4; i += 1) {
    const gy = padding + ((height - 2 * padding) * i) / 4;
    const grid = document.createElementNS(SVG_NS, 'line');
    grid.setAttribute('x1', String(padding)); grid.setAttribute('x2', String(width - padding));
    grid.setAttribute('y1', String(gy)); grid.setAttribute('y2', String(gy));
    grid.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.border); grid.setAttribute('opacity', '.35');
    svg.appendChild(grid);
  }

  const axisX = document.createElementNS(SVG_NS, 'line');
  axisX.setAttribute('x1', String(padding)); axisX.setAttribute('y1', String(height - padding));
  axisX.setAttribute('x2', String(width - padding)); axisX.setAttribute('y2', String(height - padding));
  axisX.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.borderStrong);
  const axisY = document.createElementNS(SVG_NS, 'line');
  axisY.setAttribute('x1', String(padding)); axisY.setAttribute('y1', String(padding));
  axisY.setAttribute('x2', String(padding)); axisY.setAttribute('y2', String(height - padding));
  axisY.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.borderStrong);
  svg.append(axisX, axisY);

  for (let i = 1; i < presentation.points.length; i += 1) {
    const previous = presentation.points[i - 1]!;
    const current = presentation.points[i]!;
    if (
      previous.status !== 'computed' || current.status !== 'computed'
      || previous.positionM === null || current.positionM === null
      || previous.remainingRequiredPressurePa === null || current.remainingRequiredPressurePa === null
    ) continue;
    const selected = Boolean(options.selectedSegmentId && current.segmentId === options.selectedSegmentId);
    const segmentLine = document.createElementNS(SVG_NS, 'line');
    segmentLine.setAttribute('x1', String(x(previous.positionM)));
    segmentLine.setAttribute('y1', String(y(previous.remainingRequiredPressurePa)));
    segmentLine.setAttribute('x2', String(x(current.positionM)));
    segmentLine.setAttribute('y2', String(y(current.remainingRequiredPressurePa)));
    segmentLine.setAttribute('stroke', selected ? TOLUE_DESIGN_TOKENS.color.selection : TOLUE_DESIGN_TOKENS.color.focus);
    segmentLine.setAttribute('stroke-width', selected ? '5' : '2.5');
    segmentLine.setAttribute('stroke-linecap', 'round');
    segmentLine.dataset.segmentId = current.segmentId ?? '';
    if (current.segmentId && options.onSelectSegment) {
      segmentLine.style.cursor = 'pointer';
      segmentLine.addEventListener('click', () => options.onSelectSegment?.(current.segmentId!));
    }
    svg.appendChild(segmentLine);
  }

  for (const point of drawable) {
    const selected = Boolean(options.selectedSegmentId && point.segmentId === options.selectedSegmentId);
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x(point.positionM!)));
    circle.setAttribute('cy', String(y(point.remainingRequiredPressurePa!)));
    circle.setAttribute('r', selected ? '6' : '4');
    circle.setAttribute('fill', selected ? TOLUE_DESIGN_TOKENS.color.selection : TOLUE_DESIGN_TOKENS.color.focus);
    circle.setAttribute('stroke', selected ? '#fff' : 'none');
    circle.setAttribute('stroke-width', selected ? '1.5' : '0');
    if (point.segmentId) circle.dataset.segmentId = point.segmentId;
    if (point.segmentId && options.onSelectSegment) {
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', () => options.onSelectSegment?.(point.segmentId!));
    }
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `#${point.index} · ${point.segmentId ?? 'INLET'} · ${point.positionM} m · ${pressure(point.remainingRequiredPressurePa)}`;
    circle.appendChild(title);
    svg.appendChild(circle);
  }

  const caption = document.createElement('small');
  caption.textContent = options.selectedSegmentId
    ? `Segment focus: ${options.selectedSegmentId} · خط نارنجی فقط همان بازه Core-computed را برجسته می‌کند.`
    : 'محور افقی: موقعیت مسیر (m) · محور عمودی: فشار باقی‌مانده موردنیاز. فقط نقاط computed به هم متصل می‌شوند.';
  Object.assign(caption.style, { display: 'block', marginTop: TOLUE_DESIGN_TOKENS.spacing.sm, color: options.selectedSegmentId ? TOLUE_DESIGN_TOKENS.color.selection : TOLUE_DESIGN_TOKENS.color.textMuted, direction: options.selectedSegmentId ? 'ltr' : 'rtl' });
  wrapper.append(svg, caption);
  panel.appendChild(wrapper);
}

export function renderPressureProfileView(
  root: HTMLElement,
  presentation?: Readonly<PressureProfilePresentation>,
  options: Readonly<PressureProfileViewOptions> = {},
): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'پروفایل فشار خط لوله');
  styleEngineeringSection(panel, true);
  Object.assign(panel.style, { marginTop: TOLUE_DESIGN_TOKENS.spacing.lg });
  appendEngineeringSectionHeader(panel, 'پروفایل فشار مسیر', 'فقط نقاط Engineering Core نمایش داده می‌شوند؛ برای not_computed هیچ interpolation یا صفر جایگزین ساخته نمی‌شود.', 'PRESSURE PROFILE');
  const body = document.createElement('div');
  Object.assign(body.style, { padding: '14px' });
  panel.appendChild(body);

  if (!presentation) {
    const empty = document.createElement('p');
    empty.textContent = 'هنوز پروفایل فشار معتبر از تحلیل فعال دریافت نشده است.';
    empty.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    body.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const summary = document.createElement('div');
  Object.assign(summary.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: '8px' });
  for (const [label, value] of [
    ['Peak pressure', pressure(presentation.peakRequiredPressurePa)],
    ['Peak point', presentation.peakPointIndex === null ? '—' : String(presentation.peakPointIndex)],
    ['Completeness', presentation.completeness.toUpperCase()],
    ['Outlet reference', pressure(presentation.outletPressureReferencePa)],
  ] as const) {
    const card = document.createElement('article');
    Object.assign(card.style, { padding: '9px 10px', background: TOLUE_DESIGN_TOKENS.color.surfaceMuted, border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`, borderRadius: TOLUE_DESIGN_TOKENS.radius.sm });
    const key = document.createElement('small'); key.textContent = label; key.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const val = document.createElement('strong'); val.textContent = value; Object.assign(val.style, { display: 'block', marginTop: '3px', fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, direction: 'ltr' });
    card.append(key, val); summary.appendChild(card);
  }
  body.appendChild(summary);
  renderPressureChart(body, presentation, options);

  const table = document.createElement('div');
  Object.assign(table.style, { display: 'grid', gap: '7px', marginTop: TOLUE_DESIGN_TOKENS.spacing.lg });
  for (const point of presentation.points) {
    const selected = Boolean(options.selectedSegmentId && point.segmentId === options.selectedSegmentId);
    const row = document.createElement('article');
    row.dataset.segmentId = point.segmentId ?? '';
    Object.assign(row.style, {
      padding: '9px 10px',
      border: `1px solid ${selected ? TOLUE_DESIGN_TOKENS.color.selection : TOLUE_DESIGN_TOKENS.color.border}`,
      borderInlineStart: selected ? `4px solid ${TOLUE_DESIGN_TOKENS.color.selection}` : `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,
      borderRadius: TOLUE_DESIGN_TOKENS.radius.sm,
      background: point.status === 'computed' ? 'rgba(12,23,30,.76)' : TOLUE_DESIGN_TOKENS.color.surfaceMuted,
      cursor: point.segmentId && options.onSelectSegment ? 'pointer' : 'default',
    });
    if (point.segmentId && options.onSelectSegment) row.addEventListener('click', () => options.onSelectSegment?.(point.segmentId!));
    const identity = document.createElement('strong'); identity.textContent = `#${point.index} · ${point.segmentId ?? 'INLET'}`; identity.style.direction = 'ltr';
    const values = document.createElement('div');
    Object.assign(values.style, { marginTop: '4px', fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, fontSize: TOLUE_DESIGN_TOKENS.typography.fontSizeXs, direction: 'ltr' });
    values.textContent = `x=${coordinate(point.positionM, 'm')} · z=${coordinate(point.elevationM, 'm')} · cumulative=${pressure(point.cumulativeRequiredPressurePa)} · remaining=${pressure(point.remainingRequiredPressurePa)}`;
    const trace = document.createElement('small');
    Object.assign(trace.style, { display: 'block', marginTop: '4px', color: TOLUE_DESIGN_TOKENS.color.textMuted, direction: 'ltr' });
    trace.textContent = `status=${point.status} · method=${point.pressureMethod ?? '—'} · calibration=${point.calibrationId ?? '—'} · provenance=${point.provenanceEntityId ?? '—'}`;
    row.append(identity, values, trace); table.appendChild(row);
  }
  body.appendChild(table);

  const meta = document.createElement('small');
  Object.assign(meta.style, { display: 'block', marginTop: TOLUE_DESIGN_TOKENS.spacing.lg, color: TOLUE_DESIGN_TOKENS.color.textMuted, direction: 'ltr' });
  meta.textContent = `Method: ${presentation.method} · Assumption: ${presentation.assumption}`;
  body.appendChild(meta);
  root.appendChild(panel);
}
