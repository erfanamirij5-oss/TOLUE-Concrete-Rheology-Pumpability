import { TOLUE_DESIGN_TOKENS, statusToneColor } from './designSystem';
import type { PipelineScenePresentation } from './pipelineScenePresentation';
import type { Visualization3DPresentation } from './visualization3dPresentation';
import { hydraulicStatusUx, pressureFeasibilityUx, visualizationCompletenessUx, visualizationSegmentKindLabel } from './visualization3dUx';

export interface Visualization3DViewOptions {
  readonly selectedSegmentId?: string | null;
  readonly onSelectSegment?: (segmentId: string | null) => void;
  readonly compact?: boolean;
  readonly scene?: Readonly<PipelineScenePresentation>;
}

function pressure(value: number | null): string { return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`; }
function scalar(value: number | null, unit: string): string {
  if (value === null) return '—';
  if (unit === 'm') return `${value.toFixed(4)} m`;
  if (unit === 'm3/s') return `${value.toFixed(4)} m³/s`;
  return `${value} ${unit}`;
}

function scenePointText(point: Readonly<{xM:number;yM:number;zM:number}> | null): string {
  return point ? `(${point.xM}, ${point.yM}, ${point.zM}) m` : 'geometry unavailable';
}

export function renderVisualization3DView(root: HTMLElement, data?: Readonly<Visualization3DPresentation>, options: Readonly<Visualization3DViewOptions> = {}): void {
  const scene=options.scene;
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'نمای مهندسی سیستم پمپاژ');
  panel.style.height = '100%';
  panel.style.minHeight = options.compact ? '320px' : '460px';
  panel.style.display = 'grid';
  panel.style.gridTemplateRows = 'auto minmax(0,1fr) auto';
  panel.style.background = TOLUE_DESIGN_TOKENS.color.viewport;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.overflow = 'hidden';

  const toolbar = document.createElement('header');
  toolbar.style.minHeight = '38px';
  toolbar.style.display = 'flex';
  toolbar.style.alignItems = 'center';
  toolbar.style.justifyContent = 'space-between';
  toolbar.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  toolbar.style.padding = `0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  toolbar.style.borderBottom = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  toolbar.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  const title = document.createElement('strong');
  title.textContent = 'Engineering Viewport';
  title.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  const scope = document.createElement('span');
  scope.textContent = scene?.segments.length ? 'Draft Scene · geometry از ورودی جاری · results فقط به‌صورت overlay معتبر' : 'Engineering Scene';
  scope.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXs;
  scope.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  toolbar.append(title, scope);
  panel.appendChild(toolbar);

  const canvas = document.createElement('div');
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'نمای قابل انتخاب مسیر پمپاژ');
  canvas.style.position = 'relative';
  canvas.style.minHeight = '0';
  canvas.style.overflow = 'auto';
  canvas.style.padding = '36px 28px';
  canvas.style.backgroundImage = 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px, transparent 1px)';
  canvas.style.backgroundSize = '24px 24px';
  canvas.addEventListener('click', event => { if (event.target === canvas) options.onSelectSegment?.(null); });

  const sceneSegments=scene?.segments??[];
  if (!sceneSegments.length) {
    const empty = document.createElement('div');
    empty.style.height = '100%';
    empty.style.minHeight = '260px';
    empty.style.display = 'grid';
    empty.style.placeItems = 'center';
    empty.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    empty.textContent = 'برای ساخت Scene، مسیر مهندسی تعریف شود. اجرای Simulation برای نمایش geometry لازم نیست.';
    canvas.appendChild(empty);
  } else {
    const route = document.createElement('div');
    route.style.position = 'relative';
    route.style.display = 'flex';
    route.style.alignItems = 'center';
    route.style.gap = '18px';
    route.style.minWidth = 'max-content';
    route.style.padding = '80px 18px 100px';

    for (const [index, segment] of sceneSegments.entries()) {
      const hydraulic = segment.hydraulicStatus==='not_run' ? null : hydraulicStatusUx(segment.hydraulicStatus);
      const selected = options.selectedSegmentId === segment.id;
      const item = document.createElement('button');
      item.type = 'button';
      item.dataset.segmentId = segment.id;
      item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      item.style.position = 'relative';
      item.style.minWidth = '172px';
      item.style.maxWidth = '230px';
      item.style.padding = '12px';
      item.style.textAlign = 'right';
      item.style.fontFamily = 'inherit';
      item.style.color = TOLUE_DESIGN_TOKENS.color.text;
      item.style.background = selected ? TOLUE_DESIGN_TOKENS.color.surfaceElevated : TOLUE_DESIGN_TOKENS.color.surface;
      item.style.border = `2px solid ${selected ? TOLUE_DESIGN_TOKENS.color.selection : hydraulic ? statusToneColor(hydraulic.tone) : TOLUE_DESIGN_TOKENS.color.borderStrong}`;
      item.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
      item.style.cursor = 'pointer';
      item.style.transform = `translateY(${Math.max(-100, Math.min(100, -segment.elevationChangeM * 2))}px)`;
      item.style.boxShadow = selected ? `0 0 0 2px ${TOLUE_DESIGN_TOKENS.color.selection}33` : 'none';
      item.addEventListener('click', event => { event.stopPropagation(); options.onSelectSegment?.(segment.id); });

      const seq = document.createElement('small');
      seq.textContent = `#${String(index + 1).padStart(2, '0')} · ${visualizationSegmentKindLabel(segment.kind)}`;
      seq.style.display = 'block';
      seq.style.direction = 'ltr';
      seq.style.textAlign = 'left';
      seq.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      const name = document.createElement('strong');
      name.textContent = segment.id;
      name.style.display = 'block';
      name.style.margin = '5px 0';
      name.style.direction = 'ltr';
      name.style.textAlign = 'left';
      name.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
      const geometry = document.createElement('small');
      geometry.textContent = `${scenePointText(segment.startPoint)} → ${scenePointText(segment.endPoint)}`;
      geometry.style.display='block';geometry.style.direction='ltr';geometry.style.textAlign='left';geometry.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
      const status = document.createElement('small');
      status.textContent = hydraulic ? hydraulic.label : scene?.analysisOverlayState==='stale' ? 'Result overlay stale' : 'Not simulated';
      status.style.color = hydraulic ? statusToneColor(hydraulic.tone) : scene?.analysisOverlayState==='stale' ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.textMuted;
      const p = document.createElement('div');
      p.textContent = `ΔP ${pressure(segment.totalPressureChangePa)}`;
      p.style.marginTop = '8px';
      p.style.direction = 'ltr';
      p.style.textAlign = 'left';
      p.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.monoFamily;
      p.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
      item.append(seq, name, geometry, status, p);
      route.appendChild(item);

      if (index < sceneSegments.length - 1) {
        const connector = document.createElement('div');
        connector.setAttribute('aria-hidden', 'true');
        connector.style.width = '42px';
        connector.style.height = '3px';
        connector.style.background = TOLUE_DESIGN_TOKENS.color.borderStrong;
        route.appendChild(connector);
      }
    }
    canvas.appendChild(route);
  }
  panel.appendChild(canvas);

  const footer = document.createElement('footer');
  footer.style.minHeight = '34px';
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.gap = TOLUE_DESIGN_TOKENS.spacing.lg;
  footer.style.padding = `0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  footer.style.borderTop = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  footer.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  footer.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXs;
  footer.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const count=document.createElement('span');count.textContent=`${sceneSegments.length} scene objects`;
  const spatial=document.createElement('span');spatial.textContent=`Spatial: ${scene?.spatialValidation.status??'not_available'}`;
  spatial.style.color=scene?.spatialValidation.status==='invalid'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.textMuted;
  footer.append(count,spatial);
  if (scene?.analysisOverlayState==='stale') { const stale=document.createElement('span');stale.textContent='Overlay: stale / hidden';stale.style.color=TOLUE_DESIGN_TOKENS.color.statusWarning;footer.appendChild(stale); }
  else if (data) {
    const complete = visualizationCompletenessUx(data.completeness);
    const pressureState = data.pumpabilityDecision ? pressureFeasibilityUx(data.pumpabilityDecision.pressureFeasibility) : null;
    const run = document.createElement('span'); run.textContent = `Run: ${data.runId}`; run.style.direction = 'ltr';
    const state = document.createElement('span'); state.textContent = complete.label; state.style.color = statusToneColor(complete.tone);
    footer.append(run, state);
    if (pressureState) { const pump = document.createElement('span'); pump.textContent = `Pump: ${pressureState.label}`; pump.style.color = statusToneColor(pressureState.tone); footer.appendChild(pump); }
  }
  panel.appendChild(footer);

  if (scene && options.selectedSegmentId) {
    const selected = scene.segments.find(segment => segment.id === options.selectedSegmentId);
    if (selected) {
      panel.dataset.selectedSegmentId = selected.id;
      const overlay=data?.segments.find(segment=>segment.id===selected.id);
      panel.title = `${selected.id} | ${scenePointText(selected.startPoint)} → ${scenePointText(selected.endPoint)}${overlay?` | Q=${scalar(overlay.flowRateM3s.value, overlay.flowRateM3s.unit)}`:''}`;
    }
  }
  root.appendChild(panel);
}
