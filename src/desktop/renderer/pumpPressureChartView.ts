import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { appendEngineeringSectionHeader, styleEngineeringSection } from './engineeringPanelStyle';
import type { PumpCapabilityPresentation } from './pumpPresentation';
import { assessmentStatusFa, interpolationFa, pumpProvenanceFa } from './persianPresentation';

function pressure(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} مگاپاسکال`;
}

export function renderPumpPressureChartView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'نمودار فشار موردنیاز و قابل تأمین پمپ');
  styleEngineeringSection(panel, true);
  panel.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  appendEngineeringSectionHeader(panel, 'فشار موردنیاز در برابر فشار قابل تأمین', 'ارتفاع میله‌ها فقط مقیاس بصری دو مقدار محاسبه‌شده است و هیچ ضریب اطمینان یا ظرفیت اضافی در این نما ساخته نمی‌شود.', 'مقایسه فشار پمپ');
  const body = document.createElement('div');
  Object.assign(body.style, { padding: '14px' });
  panel.appendChild(body);

  if (!result || result.requiredPressurePa === null || result.availablePressurePa === null) {
    const unavailable = document.createElement('p');
    unavailable.textContent = result ? `در وضعیت «${assessmentStatusFa(result.status)}» یکی از فشارهای موردنیاز برای ترسیم نمودار در دسترس نیست.` : 'هنوز نتیجه معتبر قابلیت پمپ دریافت نشده است.';
    unavailable.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    body.appendChild(unavailable); root.appendChild(panel); return;
  }

  const maxPressure = Math.max(1, result.requiredPressurePa, result.availablePressurePa);
  const chart = document.createElement('div');
  Object.assign(chart.style, { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(140px,1fr))', gap: '14px', alignItems: 'end' });
  const values = [
    { id: 'required', label: 'فشار موردنیاز', valuePa: result.requiredPressurePa, tone: TOLUE_DESIGN_TOKENS.color.statusWarning },
    { id: 'available', label: 'فشار قابل تأمین', valuePa: result.availablePressurePa, tone: result.status === 'PASS' ? TOLUE_DESIGN_TOKENS.color.statusNominal : TOLUE_DESIGN_TOKENS.color.statusCritical },
  ] as const;
  for (const item of values) {
    const column = document.createElement('article'); Object.assign(column.style, { display:'grid', gridTemplateRows:'180px auto auto', gap:'6px' });
    const track = document.createElement('div'); Object.assign(track.style,{display:'flex',alignItems:'flex-end',background:'#071017',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,overflow:'hidden',position:'relative'});
    for(let i=1;i<4;i+=1){const grid=document.createElement('i');Object.assign(grid.style,{position:'absolute',insetInline:'0',bottom:`${i*25}%`,height:'1px',background:TOLUE_DESIGN_TOKENS.color.border,opacity:'.32'});track.appendChild(grid);}
    const bar=document.createElement('div');bar.dataset.pressureRole=item.id;Object.assign(bar.style,{width:'100%',height:`${(item.valuePa/maxPressure)*100}%`,background:`linear-gradient(180deg,${item.tone},${item.tone}99)`,boxShadow:`0 0 20px ${item.tone}33`});track.appendChild(bar);
    const value=document.createElement('strong');value.textContent=pressure(item.valuePa);Object.assign(value.style,{fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,direction:'rtl',color:item.tone});
    const label=document.createElement('span');label.textContent=item.label;column.append(track,value,label);chart.appendChild(column);
  }
  body.appendChild(chart);
  const status=document.createElement('div');Object.assign(status.style,{marginTop:'12px',padding:'10px 12px',border:`1px solid ${result.status==='PASS'?TOLUE_DESIGN_TOKENS.color.statusNominal:result.status==='FAIL'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.statusWarning}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:'rgba(12,23,30,.76)'});
  const primary=document.createElement('strong');primary.textContent=`وضعیت: ${assessmentStatusFa(result.status)} · حاشیه فشار: ${pressure(result.pressureMarginPa)}`;Object.assign(primary.style,{color:result.status==='PASS'?TOLUE_DESIGN_TOKENS.color.statusNominal:result.status==='FAIL'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.statusWarning});
  const meta=document.createElement('small');Object.assign(meta.style,{display:'block',marginTop:'4px',color:TOLUE_DESIGN_TOKENS.color.textMuted});meta.textContent=`روش درون‌یابی: ${interpolationFa(result.interpolation)} · منشأ داده: ${pumpProvenanceFa(result.provenance)}`;
  status.append(primary,meta);body.appendChild(status);root.appendChild(panel);
}
