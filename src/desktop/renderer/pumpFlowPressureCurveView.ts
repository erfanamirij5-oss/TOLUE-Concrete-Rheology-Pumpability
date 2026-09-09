import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { PumpCapabilityPresentation } from './pumpPresentation';

function formatFlow(value: number): string {
  return `${(value * 3600).toFixed(2)} m³/h`;
}

function formatPressure(value: number): string {
  return `${(value / 1_000_000).toFixed(3)} MPa`;
}

export function renderPumpFlowPressureCurveView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'منحنی دبی و فشار پمپ');
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'منحنی دبی–فشار پمپ';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'این نمودار فقط نقاط verified موجود در Engineering Core را نمایش می‌دهد. اتصال بین نقاط صرفاً بازنمایی همان دامنه‌ای است که Core برای linear interpolation مجاز می‌داند؛ خارج از دامنه هیچ extrapolation ترسیم یا محاسبه نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!result || result.verifiedCapabilityCurve.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'هیچ نقطه verified برای منحنی قابلیت پمپ در دسترس نیست.';
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const points = result.verifiedCapabilityCurve;
  const minFlow = points[0]!.flowRateM3s;
  const maxFlow = points[points.length - 1]!.flowRateM3s;
  const maxPressure = Math.max(...points.map(point => point.availableConcretePressurePa), 1);
  const width = 720;
  const height = 280;
  const padX = 52;
  const padY = 34;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;
  const flowSpan = Math.max(maxFlow - minFlow, Number.EPSILON);

  const x = (flowRateM3s: number): number => padX + ((flowRateM3s - minFlow) / flowSpan) * innerWidth;
  const y = (pressurePa: number): number => height - padY - (pressurePa / maxPressure) * innerHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'نمودار نقاط verified دبی و فشار پمپ');
  svg.style.width = '100%';
  svg.style.maxWidth = `${width}px`;
  svg.style.display = 'block';

  const axisX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axisX.setAttribute('x1', String(padX)); axisX.setAttribute('x2', String(width - padX));
  axisX.setAttribute('y1', String(height - padY)); axisX.setAttribute('y2', String(height - padY));
  axisX.setAttribute('stroke', 'currentColor');
  const axisY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axisY.setAttribute('x1', String(padX)); axisY.setAttribute('x2', String(padX));
  axisY.setAttribute('y1', String(padY)); axisY.setAttribute('y2', String(height - padY));
  axisY.setAttribute('stroke', 'currentColor');
  svg.append(axisX, axisY);

  if (points.length > 1) {
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.map(point => `${x(point.flowRateM3s)},${y(point.availableConcretePressurePa)}`).join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', 'currentColor');
    polyline.setAttribute('stroke-width', '2');
    polyline.dataset.curveRole = 'verified-source-segments';
    svg.appendChild(polyline);
  }

  for (const point of points) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(x(point.flowRateM3s)));
    circle.setAttribute('cy', String(y(point.availableConcretePressurePa)));
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'currentColor');
    circle.dataset.verifiedFlowRateM3s = String(point.flowRateM3s);
    circle.dataset.verifiedPressurePa = String(point.availableConcretePressurePa);
    svg.appendChild(circle);
  }

  const targetInsideDomain = result.targetFlowRateM3s >= minFlow && result.targetFlowRateM3s <= maxFlow && result.availablePressurePa !== null;
  if (targetInsideDomain) {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', String(x(result.targetFlowRateM3s)));
    marker.setAttribute('cy', String(y(result.availablePressurePa!)));
    marker.setAttribute('r', '7');
    marker.setAttribute('fill', 'none');
    marker.setAttribute('stroke', 'currentColor');
    marker.setAttribute('stroke-width', '2');
    marker.dataset.curveRole = 'core-target-result';
    svg.appendChild(marker);
  }

  const meta = document.createElement('small');
  meta.style.display = 'block';
  meta.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;
  meta.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  meta.textContent = `Verified domain: ${formatFlow(minFlow)} تا ${formatFlow(maxFlow)} · Target: ${formatFlow(result.targetFlowRateM3s)} · Core available pressure: ${result.availablePressurePa === null ? '—' : formatPressure(result.availablePressurePa)} · ${result.provenance}`;

  panel.append(svg, meta);
  root.appendChild(panel);
}
