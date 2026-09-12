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

const pressure = (value: number | null): string => value === null ? '—' : `${(value / 1_000_000).toFixed(3)} مگاپاسکال`;
const flow = (value: number | null): string => value === null ? '—' : `${(value * 3600).toFixed(1)} مترمکعب بر ساعت`;

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
  label.textContent = 'قطعه انتخاب‌شده';
  Object.assign(label.style, { color: TOLUE_DESIGN_TOKENS.color.textMuted, fontWeight: '700' });
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
    Object.assign(v.style, { display: 'block', marginTop: '2px', direction: 'rtl', fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily, fontSize: '11px' });
    item.append(l, v);
    return item;
  };

  strip.append(
    identity,
    metric('افت فشار کل', pressure(focus.totalPressurePa)),
    metric('افت اصطکاکی', pressure(focus.frictionPressurePa)),
    metric('اثر ارتفاع', pressure(focus.elevationPressurePa)),
    metric('دبی', flow(focus.flowRateM3s)),
    metric('یافته‌های مرتبط', String(focus.diagnosticFindingIds.length)),
  );
}

export function appendLiveSegmentFocusStrip(parent: HTMLElement): HTMLElement {
  const strip = document.createElement('aside');
  strip.setAttribute('aria-label', 'خلاصه قطعه انتخاب‌شده');
  parent.appendChild(strip);
  renderStrip(strip, activeSegmentFocusSnapshot());
  return strip;
}
