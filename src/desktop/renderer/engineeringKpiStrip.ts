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

const pressure = (value: number | null | undefined): string => value === null || value === undefined || !Number.isFinite(value) ? '—' : `${(value / 1_000_000).toFixed(2)} MPa`;
const flow = (value: number | null | undefined): string => value === null || value === undefined || !Number.isFinite(value) ? '—' : `${(value * 3600).toFixed(1)} m³/h`;

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
    Object.freeze({ id:'required-pressure', label:'فشار موردنیاز', value:pressure(required), detail:live?'Engineering Core':'پس از اجرای تحلیل', tone:required === null?'neutral':'warning', source:required === null?'unavailable':'engineering-core' }),
    Object.freeze({ id:'available-pressure', label:'فشار قابل تأمین پمپ', value:pressure(available), detail:live?'Pump envelope':'پس از اجرای تحلیل', tone:available === null?'neutral':pumpStatus === 'PASS'?'nominal':'warning', source:available === null?'unavailable':'engineering-core' }),
    Object.freeze({ id:'pressure-margin', label:'حاشیه فشار', value:pressure(margin), detail:live?'Available − Required':'پس از اجرای تحلیل', tone:margin === null?'neutral':margin >= 0?'nominal':'critical', source:margin === null?'unavailable':'engineering-core' }),
  ]);
}

export function renderEngineeringKpiStrip(root: HTMLElement, input: Readonly<SimulationRunInput> | null, analysis: Readonly<EngineeringAnalysisPresentation> | null, stale: boolean): void {
  const kpis=createEngineeringViewportKpis(input,analysis,stale);
  const strip=document.createElement('section');
  strip.dataset.engineeringKpiStrip='true';
  strip.setAttribute('aria-label','شاخص‌های اصلی تحلیل مهندسی');
  Object.assign(strip.style,{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:'8px',padding:'8px',direction:'rtl'});
  const toneColor=(tone:EngineeringViewportKpi['tone'])=>tone==='nominal'?TOLUE_DESIGN_TOKENS.color.statusNominal:tone==='warning'?TOLUE_DESIGN_TOKENS.color.statusWarning:tone==='critical'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.info;
  for(const kpi of kpis){
    const card=document.createElement('article');card.dataset.kpiId=kpi.id;
    Object.assign(card.style,{minWidth:'0',padding:'9px 11px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderTop:`2px solid ${toneColor(kpi.tone)}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'linear-gradient(180deg,rgba(29,43,54,.96),rgba(17,26,34,.96))',boxShadow:'0 8px 22px rgba(0,0,0,.16)'});
    const label=document.createElement('div');label.textContent=kpi.label;Object.assign(label.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
    const value=document.createElement('strong');value.textContent=kpi.value;Object.assign(value.style,{display:'block',marginTop:'2px',fontFamily:TOLUE_DESIGN_TOKENS.typography.monoFamily,fontSize:'15px',direction:'ltr',textAlign:'right',color:kpi.value==='—'?TOLUE_DESIGN_TOKENS.color.textMuted:TOLUE_DESIGN_TOKENS.color.text});
    const detail=document.createElement('small');detail.textContent=kpi.detail;Object.assign(detail.style,{display:'block',marginTop:'2px',fontSize:'9px',color:toneColor(kpi.tone),whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
    card.append(label,value,detail);strip.appendChild(card);
  }
  root.appendChild(strip);
}
