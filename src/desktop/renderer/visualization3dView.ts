import { TOLUE_DESIGN_TOKENS, statusToneColor } from './designSystem';
import type { Visualization3DPresentation } from './visualization3dPresentation';
import {
  hydraulicStatusUx,
  pressureFeasibilityUx,
  visualizationCompletenessUx,
  visualizationSegmentKindLabel,
} from './visualization3dUx';

function pressure(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

function scalar(value: number | null, unit: string): string {
  if (value === null) return '—';
  if (unit === 'm') return `${value.toFixed(4)} m`;
  if (unit === 'm3/s') return `${value.toFixed(4)} m³/s`;
  return `${value} ${unit}`;
}

export function renderVisualization3DView(root: HTMLElement, data?: Readonly<Visualization3DPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'نمایش سه‌بعدی مهندسی');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'نمایش مهندسی مسیر';
  title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'این نما شماتیک مهندسی برای خواندن مسیر، افت فشار و وضعیت هیدرولیکی است؛ CFD/DEM یا شبیه‌سازی فیزیکی سه‌بعدی نیست.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!data) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز داده معتبر Visualization از Engineering Core دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    return;
  }

  const summary = document.createElement('div');
  summary.style.display = 'grid';
  summary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
  summary.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  summary.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;

  const completeness = visualizationCompletenessUx(data.completeness);
  const completenessCard = document.createElement('article');
  completenessCard.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  completenessCard.style.border = `1px solid ${statusToneColor(completeness.tone)}`;
  completenessCard.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  const completenessLabel = document.createElement('small');
  completenessLabel.textContent = 'وضعیت داده';
  completenessLabel.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const completenessValue = document.createElement('strong');
  completenessValue.textContent = completeness.label;
  completenessValue.style.display = 'block';
  completenessValue.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs;
  completenessValue.style.color = statusToneColor(completeness.tone);
  completenessCard.append(completenessLabel, completenessValue);
  summary.appendChild(completenessCard);

  const segmentCard = document.createElement('article');
  segmentCard.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  segmentCard.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  segmentCard.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  const segmentLabel = document.createElement('small');
  segmentLabel.textContent = 'اجزای مسیر';
  segmentLabel.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const segmentValue = document.createElement('strong');
  segmentValue.textContent = `${data.segments.length} جزء`;
  segmentValue.style.display = 'block';
  segmentValue.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs;
  segmentCard.append(segmentLabel, segmentValue);
  summary.appendChild(segmentCard);

  if (data.pumpabilityDecision) {
    const pressureState = pressureFeasibilityUx(data.pumpabilityDecision.pressureFeasibility);
    const pumpCard = document.createElement('article');
    pumpCard.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    pumpCard.style.border = `1px solid ${statusToneColor(pressureState.tone)}`;
    pumpCard.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const pumpLabel = document.createElement('small');
    pumpLabel.textContent = 'امکان‌پذیری فشار پمپ';
    pumpLabel.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const pumpValue = document.createElement('strong');
    pumpValue.textContent = pressureState.label;
    pumpValue.style.display = 'block';
    pumpValue.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs;
    pumpValue.style.color = statusToneColor(pressureState.tone);
    pumpCard.append(pumpLabel, pumpValue);
    summary.appendChild(pumpCard);
  }
  panel.appendChild(summary);

  const canvasHeading = document.createElement('h3');
  canvasHeading.textContent = 'نمای شماتیک مسیر و فشار';
  panel.appendChild(canvasHeading);

  const canvas = document.createElement('div');
  canvas.style.position = 'relative';
  canvas.style.minHeight = '280px';
  canvas.style.overflow = 'auto';
  canvas.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  canvas.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  canvas.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  canvas.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;

  const route = document.createElement('div');
  route.style.display = 'flex';
  route.style.alignItems = 'center';
  route.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  route.style.minWidth = 'max-content';
  route.style.padding = '80px 10px';

  for (const [index, segment] of data.segments.entries()) {
    const hydraulic = hydraulicStatusUx(segment.hydraulicStatus);
    const item = document.createElement('article');
    item.style.minWidth = '190px';
    item.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    item.style.background = TOLUE_DESIGN_TOKENS.color.surface;
    item.style.border = `2px solid ${statusToneColor(hydraulic.tone)}`;
    item.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
    item.style.transform = `translateY(${-segment.endElevationM * 2}px)`;
    item.dataset.segmentId = segment.id;

    const sequence = document.createElement('small');
    sequence.textContent = `جزء ${index + 1}`;
    sequence.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const name = document.createElement('strong');
    name.textContent = `${segment.id} · ${visualizationSegmentKindLabel(segment.kind)}`;
    name.style.display = 'block';
    name.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.xs} 0`;
    const state = document.createElement('small');
    state.textContent = hydraulic.label;
    state.style.color = statusToneColor(hydraulic.tone);
    state.style.fontWeight = '700';

    const pressureGrid = document.createElement('div');
    pressureGrid.style.display = 'grid';
    pressureGrid.style.gap = TOLUE_DESIGN_TOKENS.spacing.xs;
    pressureGrid.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    const delta = document.createElement('small');
    delta.textContent = `تغییر فشار: ${pressure(segment.totalPressureChangePa.value)}`;
    const inlet = document.createElement('small');
    inlet.textContent = `فشار ورودی باقی‌مانده: ${pressure(segment.inletRemainingPressurePa.value)}`;
    const outlet = document.createElement('small');
    outlet.textContent = `فشار خروجی باقی‌مانده: ${pressure(segment.outletRemainingPressurePa.value)}`;
    pressureGrid.append(delta, inlet, outlet);

    const details = document.createElement('details');
    details.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    const detailsSummary = document.createElement('summary');
    detailsSummary.textContent = 'جزئیات مهندسی';
    const detailsBody = document.createElement('div');
    detailsBody.style.display = 'grid';
    detailsBody.style.gap = TOLUE_DESIGN_TOKENS.spacing.xs;
    detailsBody.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    const flow = document.createElement('small');
    flow.textContent = `دبی: ${scalar(segment.flowRateM3s.value, segment.flowRateM3s.unit)}`;
    const friction = document.createElement('small');
    friction.textContent = `افت اصطکاکی: ${pressure(segment.frictionPressureLossPa.value)}`;
    const elevation = document.createElement('small');
    elevation.textContent = `سهم ارتفاع: ${pressure(segment.elevationPressurePa.value)}`;
    const lube = document.createElement('small');
    lube.textContent = `ضخامت لایه روانکار: ${scalar(segment.lubricationLayerThicknessM.value, segment.lubricationLayerThicknessM.unit)}`;
    const diagnostics = document.createElement('small');
    diagnostics.textContent = segment.diagnosticFindingIds.length
      ? `Diagnostics مرتبط: ${segment.diagnosticFindingIds.join('، ')}`
      : 'Diagnostics مرتبط: ندارد';
    detailsBody.append(flow, friction, elevation, lube, diagnostics);
    details.append(detailsSummary, detailsBody);

    item.append(sequence, name, state, pressureGrid, details);
    route.appendChild(item);
  }
  canvas.appendChild(route);
  panel.appendChild(canvas);

  if (data.warnings.length) {
    const warningsBox = document.createElement('section');
    warningsBox.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
    warningsBox.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    warningsBox.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.statusWarning}`;
    warningsBox.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const warningTitle = document.createElement('strong');
    warningTitle.textContent = 'هشدارهای مرتبط با نمایش';
    const warnings = document.createElement('ul');
    for (const warning of data.warnings) {
      const li = document.createElement('li');
      li.textContent = warning;
      warnings.appendChild(li);
    }
    warningsBox.append(warningTitle, warnings);
    panel.appendChild(warningsBox);
  }

  const trace = document.createElement('details');
  trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const traceSummary = document.createElement('summary');
  traceSummary.textContent = 'Traceability نمایش';
  const traceBody = document.createElement('p');
  traceBody.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  traceBody.textContent = `Run: ${data.runId} · Input hash: ${data.inputSnapshotHash} · Representation: ${data.representation} · Physical simulation claim: ${String(data.physicalSimulationClaim)} · Pressure profile assumption: ${data.pressureProfileAssumption} · Method: ${data.method}`;
  trace.append(traceSummary, traceBody);
  panel.appendChild(trace);

  root.appendChild(panel);
}
