import { TOLUE_DESIGN_TOKENS } from './designSystem';

interface SegmentFocusSnapshot {
  readonly id: string;
  readonly stale: boolean;
  readonly totalPressurePa: number | null;
  readonly frictionPressurePa: number | null;
  readonly elevationPressurePa: number | null;
  readonly flowRateM3s: number | null;
  readonly diagnosticFindingIds: readonly string[];
}

const numeric = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pressure = (value: number | null): string => value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
const flow = (value: number | null): string => value === null ? '—' : `${(value * 3600).toFixed(1)} m³/h`;

export function activeSegmentFocusSnapshot(doc: Document = document): Readonly<SegmentFocusSnapshot> | null {
  const card = doc.querySelector<HTMLElement>('[data-segment-inspector-card="true"]');
  if (!card?.dataset.segmentId) return null;
  return Object.freeze({
    id: card.dataset.segmentId,
    stale: card.dataset.segmentStale === 'true',
    totalPressurePa: numeric(card.dataset.segmentTotalPressurePa),
    frictionPressurePa: numeric(card.dataset.segmentFrictionPressurePa),
    elevationPressurePa: numeric(card.dataset.segmentElevationPressurePa),
    flowRateM3s: numeric(card.dataset.segmentFlowRateM3s),
    diagnosticFindingIds: Object.freeze((card.dataset.segmentDiagnosticFindingIds ?? '').split('|').filter(Boolean)),
  });
}

function renderStrip(strip: HTMLElement, focus: Readonly<SegmentFocusSnapshot> | null): void {
  strip.replaceChildren();
  if (!focus) {
    strip.hidden = true;
    return;
  }
  strip.hidden = false;
  strip.dataset.focusedSegmentId = focus.id;
  Object.assign(strip.style, {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px,1.15fr) repeat(4,minmax(95px,1fr)) minmax(105px,.9fr)',
    gap: '7px',
    alignItems: 'stretch',
    marginBottom: '12px',
    padding: '8px',
    border: `1px solid ${focus.stale ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.selection}`,
    borderRadius: TOLUE_DESIGN_TOKENS.radius.sm,
    background: focus.stale ? 'rgba(240,180,79,.055)' : 'rgba(245,155,50,.055)',
  });

  const identity = document.createElement('div');
  Object.assign(identity.style, { display: 'grid', alignContent: 'center', gap: '2px', padding: '4px 6px' });
  const label = document.createElement('small');
  label.textContent = 'SEGMENT FOCUS';
  Object.assign(label.style, { direction: 'ltr', color: TOLUE_DESIGN_TOKENS.color.textMuted, fontWeight: '700', letterSpacing: '.05em' });
  const id = document.createElement('strong');
  id.textContent = focus.id;
  Object.assign(id.style, { direction: 'ltr', color: focus.stale ? TOLUE_DESIGN_TOKENS.color.statusWarning : TOLUE_DESIGN_TOKENS.color.selection, fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily });
  identity.append(label, id);

  const metric = (labelText: string, valueText: string): HTMLElement => {
    const item = document.createElement('div');
    Object.assign(item.style, { padding: '5px 7px', borderRadius: TOLUE_DESIGN_TOKENS.radius.sm, background: 'rgba(10,18,24,.62)', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}` });
    const l = document.createElement('small');
    l.textContent = labelText;
    l.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const v = document.createElement('strong');
    v.textContent = focus.stale ? '—' : valueText;
    Object.assign(v.style, { display: 'block', marginTop: '2px', direction: 'ltr', fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, fontSize: '11px' });
    item.append(l, v);
    return item;
  };

  const diagnostics = metric('Linked findings', String(focus.diagnosticFindingIds.length));
  strip.append(
    identity,
    metric('ΔP', pressure(focus.totalPressurePa)),
    metric('Friction', pressure(focus.frictionPressurePa)),
    metric('Elevation', pressure(focus.elevationPressurePa)),
    metric('Flow', flow(focus.flowRateM3s)),
    diagnostics,
  );
}

export function appendLiveSegmentFocusStrip(parent: HTMLElement): HTMLElement {
  const strip = document.createElement('aside');
  strip.setAttribute('aria-label', 'خلاصه Segment انتخاب‌شده');
  parent.appendChild(strip);
  renderStrip(strip, activeSegmentFocusSnapshot());

  if (typeof MutationObserver !== 'undefined' && document.body) {
    const observer = new MutationObserver(() => {
      if (!strip.isConnected) {
        observer.disconnect();
        return;
      }
      renderStrip(strip, activeSegmentFocusSnapshot());
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-segment-id', 'data-segment-stale', 'data-segment-total-pressure-pa', 'data-segment-friction-pressure-pa', 'data-segment-elevation-pressure-pa', 'data-segment-flow-rate-m3s', 'data-segment-diagnostic-finding-ids'] });
  }
  return strip;
}
