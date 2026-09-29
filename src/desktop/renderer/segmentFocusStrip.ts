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
  const tone=focus.stale?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.selection;
  Object.assign(strip.style, {
    display: 'grid',
    gridTemplateColumns: 'minmax(138px,1.22fr) repeat(4,minmax(96px,1fr)) minmax(110px,.88fr)',
    gap: '7px',
    alignItems: 'stretch',
    marginBottom: '12px',
    padding: '8px',
    border: `1px solid ${tone}88`,
    borderRadius: TOLUE_DESIGN_TOKENS.radius.md,
    background: focus.stale ? 'linear-gradient(180deg,rgba(240,180,79,.075),rgba(15,24,31,.9))' : 'linear-gradient(180deg,rgba(245,155,50,.07),rgba(15,24,31,.92))',
    boxShadow:'0 8px 20px rgba(0,0,0,.12), inset 0 1px rgba(255,255,255,.02)',
  });

  const identity = document.createElement('div');
  Object.assign(identity.style, { position:'relative',display: 'grid', alignContent: 'center', gap: '3px', padding: '6px 9px 6px 12px',borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:'rgba(8,15,20,.34)' });
  const marker=document.createElement('i');marker.setAttribute('aria-hidden','true');Object.assign(marker.style,{position:'absolute',insetInlineStart:'0',top:'7px',bottom:'7px',width:'3px',borderRadius:'4px',background:tone});
  const label = document.createElement('small');
  label.textContent = focus.stale?'قطعه انتخاب‌شده · نتیجه نیازمند اجرای مجدد':'قطعه انتخاب‌شده';
  Object.assign(label.style, { color: TOLUE_DESIGN_TOKENS.color.textMuted, fontWeight: '700', lineHeight:'1.45' });
  const id = document.createElement('strong');
  id.textContent = focus.id;
  Object.assign(id.style, { direction: 'ltr', textAlign:'right', color: tone, fontFamily: TOLUE_DESIGN_TOKENS.typography.monoFamily,fontSize:'13px' });
  identity.append(marker,label, id);

  const metric = (labelText: string, valueText: string): HTMLElement => {
    const item = document.createElement('div');
    Object.assign(item.style, { padding: '6px 8px', borderRadius: TOLUE_DESIGN_TOKENS.radius.sm, background: 'rgba(8,15,20,.48)', border: `1px solid ${TOLUE_DESIGN_TOKENS.color.border}` });
    const l = document.createElement('small');
    l.textContent = labelText;
    Object.assign(l.style,{color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:'10px',fontWeight:'650'});
    const v = document.createElement('strong');
    v.textContent = focus.stale ? '—' : valueText;
    Object.assign(v.style, { display: 'block', marginTop: '3px', direction: 'rtl', fontSize: '11px',fontWeight:'750',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:focus.stale?TOLUE_DESIGN_TOKENS.color.textMuted:TOLUE_DESIGN_TOKENS.color.text });
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
