import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import type { EngineeringAnalysisPresentation } from './analysisPresentation';

export interface EngineeringViewportKpi {
  readonly id: 'flow' | 'required-pressure' | 'available-pressure' | 'pressure-margin';
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: 'neutral' | 'nominal' | 'warning' | 'critical';
  readonly source: 'engineering-input' | 'engineering-core' | 'unavailable';
}

const pressure = (value: number | null | undefined): string => value === null || value === undefined || !Number.isFinite(value) ? '—' : `${(value / 1_000_000).toFixed(2)} مگاپاسکال`;
const flow = (value: number | null | undefined): string => value === null || value === undefined || !Number.isFinite(value) ? '—' : `${(value * 3600).toFixed(1)} مترمکعب بر ساعت`;

export function createEngineeringViewportKpis(
  input: Readonly<SimulationRunInput> | null,
  analysis: Readonly<EngineeringAnalysisPresentation> | null,
  stale: boolean,
): readonly Readonly<EngineeringViewportKpi>[] {
  const live = !stale && analysis?.executionStatus === 'EXECUTED';
  const required = live ? analysis.pipeline?.components.find(item => item.id === 'required')?.valuePa ?? null : null;
  const available = live ? analysis.pump?.availablePressurePa ?? null : null;
  const margin = live ? analysis.pump?.pressureMarginPa ?? null : null;
  const pumpStatus = live ? analysis.pump?.status : undefined;
  return Object.freeze([
    Object.freeze({ id:'flow', label:'دبی هدف', value:flow(input?.pipeline.targetFlowRateM3s), detail:'ورودی پروژه', tone:'neutral', source:input?'engineering-input':'unavailable' }),
    Object.freeze({ id:'required-pressure', label:'فشار موردنیاز', value:pressure(required), detail:live?'هسته مهندسی':'پس از اجرای تحلیل', tone:required === null?'neutral':'warning', source:required === null?'unavailable':'engineering-core' }),
    Object.freeze({ id:'available-pressure', label:'فشار قابل تأمین پمپ', value:pressure(available), detail:live?'دامنه عملکرد پمپ':'پس از اجرای تحلیل', tone:available === null?'neutral':pumpStatus === 'PASS'?'nominal':'warning', source:available === null?'unavailable':'engineering-core' }),
    Object.freeze({ id:'pressure-margin', label:'حاشیه فشار', value:pressure(margin), detail:live?'قابل تأمین − موردنیاز':'پس از اجرای تحلیل', tone:margin === null?'neutral':margin >= 0?'nominal':'critical', source:margin === null?'unavailable':'engineering-core' }),
  ]);
}

export function renderEngineeringKpiStrip(root: HTMLElement, input: Readonly<SimulationRunInput> | null, analysis: Readonly<EngineeringAnalysisPresentation> | null, stale: boolean): void {
  const kpis=createEngineeringViewportKpis(input,analysis,stale);
  const strip=document.createElement('section');
  strip.dataset.engineeringKpiStrip='true';
  strip.setAttribute('aria-label','شاخص‌های اصلی تحلیل مهندسی');
  Object.assign(strip.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'8px',padding:'4px 2px 8px',direction:'rtl',minWidth:'0'});
  const toneColor=(tone:EngineeringViewportKpi['tone'])=>tone==='nominal'?TOLUE_DESIGN_TOKENS.color.statusNominal:tone==='warning'?TOLUE_DESIGN_TOKENS.color.statusWarning:tone==='critical'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.info;
  for(const kpi of kpis){
    const tone=toneColor(kpi.tone);
    const card=document.createElement('article');card.dataset.kpiId=kpi.id;card.title=`${kpi.label}: ${kpi.value} — ${kpi.detail}`;
    Object.assign(card.style,{position:'relative',minWidth:'0',minHeight:'66px',padding:'10px 12px 9px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'linear-gradient(180deg,rgba(27,41,51,.98),rgba(15,24,31,.98))',boxShadow:'0 8px 20px rgba(0,0,0,.15), inset 0 1px rgba(255,255,255,.02)',overflow:'hidden'});
    const accent=document.createElement('i');accent.setAttribute('aria-hidden','true');Object.assign(accent.style,{position:'absolute',insetInlineStart:'0',top:'0',bottom:'0',width:'3px',background:tone,opacity:kpi.value==='—'?'.35':'.9'});
    const top=document.createElement('div');Object.assign(top.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',minWidth:'0'});
    const label=document.createElement('div');label.textContent=kpi.label;Object.assign(label.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted,fontWeight:'650',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:'0'});
    const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');Object.assign(dot.style,{width:'6px',height:'6px',borderRadius:'50%',background:tone,boxShadow:kpi.value==='—'?'none':`0 0 9px ${tone}88`,flex:'0 0 auto'});top.append(label,dot);
    const value=document.createElement('strong');value.textContent=kpi.value;Object.assign(value.style,{display:'block',marginTop:'4px',fontSize:'clamp(12px,1.35vw,14px)',direction:'rtl',textAlign:'right',fontWeight:'800',lineHeight:'1.45',color:kpi.value==='—'?TOLUE_DESIGN_TOKENS.color.textMuted:TOLUE_DESIGN_TOKENS.color.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
    const detail=document.createElement('small');detail.textContent=kpi.detail;Object.assign(detail.style,{display:'block',marginTop:'3px',fontSize:'9px',lineHeight:'1.35',color:tone,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',opacity:kpi.value==='—'?'.72':'.96'});
    card.append(accent,top,value,detail);strip.appendChild(card);
  }
  root.appendChild(strip);
}
