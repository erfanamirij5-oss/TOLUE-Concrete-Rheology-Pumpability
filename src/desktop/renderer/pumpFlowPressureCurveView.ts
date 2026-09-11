import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { appendEngineeringSectionHeader, styleEngineeringSection } from './engineeringPanelStyle';
import type { PumpCapabilityPresentation } from './pumpPresentation';

const SVG_NS = 'http://www.w3.org/2000/svg';

function formatFlow(value: number): string {
  return `${(value * 3600).toFixed(2)} m³/h`;
}

function formatPressure(value: number): string {
  return `${(value / 1_000_000).toFixed(3)} MPa`;
}

export function renderPumpFlowPressureCurveView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'منحنی دبی و فشار پمپ');
  styleEngineeringSection(panel, true);
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  appendEngineeringSectionHeader(panel, 'منحنی دبی–فشار پمپ', 'فقط نقاط verified و target result تولیدشده توسط Engineering Core نمایش داده می‌شوند؛ خارج از دامنه verified هیچ extrapolation ترسیم نمی‌شود.', 'VERIFIED Q–P CURVE');
  const body = document.createElement('div');
  Object.assign(body.style, { padding: '14px' });
  panel.appendChild(body);

  if (!result || result.verifiedCapabilityCurve.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'هیچ نقطه verified برای منحنی قابلیت پمپ در دسترس نیست.';
    empty.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    body.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const points = result.verifiedCapabilityCurve;
  const minFlow = points[0]!.flowRateM3s;
  const maxFlow = points[points.length - 1]!.flowRateM3s;
  const maxPressure = Math.max(...points.map(point => point.availableConcretePressurePa), 1);
  const width = 720;
  const height = 300;
  const padX = 56;
  const padY = 38;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;
  const flowSpan = Math.max(maxFlow - minFlow, Number.EPSILON);
  const x = (flowRateM3s: number): number => padX + ((flowRateM3s - minFlow) / flowSpan) * innerWidth;
  const y = (pressurePa: number): number => height - padY - (pressurePa / maxPressure) * innerHeight;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'نمودار نقاط verified دبی و فشار پمپ');
  Object.assign(svg.style, { width: '100%', maxWidth: `${width}px`, display: 'block', margin: '0 auto', background: 'linear-gradient(180deg,rgba(10,24,32,.95),rgba(6,16,22,.98))', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`, borderRadius: TOLUE_DESIGN_TOKENS.radius.md });

  for (let i = 0; i <= 4; i += 1) {
    const gy = padY + (innerHeight * i) / 4;
    const grid = document.createElementNS(SVG_NS, 'line');
    grid.setAttribute('x1', String(padX)); grid.setAttribute('x2', String(width - padX));
    grid.setAttribute('y1', String(gy)); grid.setAttribute('y2', String(gy));
    grid.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.border); grid.setAttribute('opacity', '.35');
    svg.appendChild(grid);
  }

  const axisX = document.createElementNS(SVG_NS, 'line');
  axisX.setAttribute('x1', String(padX)); axisX.setAttribute('x2', String(width - padX));
  axisX.setAttribute('y1', String(height - padY)); axisX.setAttribute('y2', String(height - padY));
  axisX.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.borderStrong);
  const axisY = document.createElementNS(SVG_NS, 'line');
  axisY.setAttribute('x1', String(padX)); axisY.setAttribute('x2', String(padX));
  axisY.setAttribute('y1', String(padY)); axisY.setAttribute('y2', String(height - padY));
  axisY.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.borderStrong);
  svg.append(axisX, axisY);

  if (points.length > 1) {
    const polyline = document.createElementNS(SVG_NS, 'polyline');
    polyline.setAttribute('points', points.map(point => `${x(point.flowRateM3s)},${y(point.availableConcretePressurePa)}`).join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.focus);
    polyline.setAttribute('stroke-width', '3');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    polyline.dataset.curveRole = 'verified-source-segments';
    svg.appendChild(polyline);
  }

  for (const point of points) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x(point.flowRateM3s)));
    circle.setAttribute('cy', String(y(point.availableConcretePressurePa)));
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', TOLUE_DESIGN_TOKENS.color.focus);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1');
    circle.dataset.verifiedFlowRateM3s = String(point.flowRateM3s);
    circle.dataset.verifiedPressurePa = String(point.availableConcretePressurePa);
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${formatFlow(point.flowRateM3s)} · ${formatPressure(point.availableConcretePressurePa)}`;
    circle.appendChild(title);
    svg.appendChild(circle);
  }

  const targetInsideDomain = result.targetFlowRateM3s >= minFlow && result.targetFlowRateM3s <= maxFlow && result.availablePressurePa !== null;
  if (targetInsideDomain) {
    const guide = document.createElementNS(SVG_NS, 'line');
    guide.setAttribute('x1', String(x(result.targetFlowRateM3s))); guide.setAttribute('x2', String(x(result.targetFlowRateM3s)));
    guide.setAttribute('y1', String(padY)); guide.setAttribute('y2', String(height - padY));
    guide.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.selection); guide.setAttribute('stroke-dasharray', '5 5'); guide.setAttribute('opacity', '.75');
    svg.appendChild(guide);
    const marker = document.createElementNS(SVG_NS, 'circle');
    marker.setAttribute('cx', String(x(result.targetFlowRateM3s)));
    marker.setAttribute('cy', String(y(result.availablePressurePa!)));
    marker.setAttribute('r', '8');
    marker.setAttribute('fill', '#071017');
    marker.setAttribute('stroke', TOLUE_DESIGN_TOKENS.color.selection);
    marker.setAttribute('stroke-width', '3');
    marker.dataset.curveRole = 'core-target-result';
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `TARGET · ${formatFlow(result.targetFlowRateM3s)} · ${formatPressure(result.availablePressurePa!)}`;
    marker.appendChild(title);
    svg.appendChild(marker);
  }

  body.appendChild(svg);
  const cards = document.createElement('div');
  Object.assign(cards.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px', marginTop: '12px' });
  for (const [label, value] of [
    ['Verified min flow', formatFlow(minFlow)],
    ['Verified max flow', formatFlow(maxFlow)],
    ['Target flow', formatFlow(result.targetFlowRateM3s)],
    ['Core available pressure', result.availablePressurePa === null ? '—' : formatPressure(result.availablePressurePa)],
  ] as const) {
    const card = document.createElement('article');
    Object.assign(card.style, { padding: '9px 10px', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`, borderRadius: TOLUE_DESIGN_TOKENS.radius.sm, background: TOLUE_DESIGN_TOKENS.color.surfaceMuted });
    const key = document.createElement('small'); key.textContent = label; key.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const val = document.createElement('strong'); val.textContent = value; Object.assign(val.style, { display: 'block', marginTop: '3px', fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, direction: 'ltr' });
    card.append(key, val); cards.appendChild(card);
  }
  body.appendChild(cards);
  const meta = document.createElement('small');
  Object.assign(meta.style, { display: 'block', marginTop: '10px', color: TOLUE_DESIGN_TOKENS.color.textMuted, direction: 'ltr' });
  meta.textContent = `Interpolation: ${result.interpolation} · Provenance: ${result.provenance} · No extrapolation`;
  body.appendChild(meta);
  root.appendChild(panel);
}
