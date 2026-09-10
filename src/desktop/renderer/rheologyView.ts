import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { updateRheologyInputDraft, type RheologyInputPath } from './engineeringInputDraft';
import type { RheologyCurvesPresentation } from './rheologyCurvePresentation';
import { createRheologyInputPresentation, type RheologyInputPresentation } from './rheologyPresentation';

const EMPTY_RHEOLOGY_INPUTS: readonly Readonly<RheologyInputPresentation>[] = Object.freeze([
  createRheologyInputPresentation({ modelFamily: 'BINGHAM', inputId: 'yield-stress', label: 'تنش تسلیم', value: null, unit: 'Pa' }),
  createRheologyInputPresentation({ modelFamily: 'BINGHAM', inputId: 'plastic-viscosity', label: 'ویسکوزیته پلاستیک', value: null, unit: 'Pa·s' }),
]);

export interface RheologyViewActions {
  readonly updateInput: (input: Readonly<SimulationRunInput>) => void;
}

const EDITABLE_FIELDS: readonly { path: RheologyInputPath; label: string; unit: string; min: number; step: string }[] = Object.freeze([
  { path: 'bulk.yieldStressPa', label: 'تنش تسلیم بتن', unit: 'Pa', min: 0, step: 'any' },
  { path: 'bulk.plasticViscosityPaS', label: 'ویسکوزیته پلاستیک بتن', unit: 'Pa·s', min: Number.MIN_VALUE, step: 'any' },
  { path: 'lubricationLayer.yieldStressPa', label: 'تنش تسلیم لایه روانکار', unit: 'Pa', min: 0, step: 'any' },
  { path: 'lubricationLayer.plasticViscosityPaS', label: 'ویسکوزیته پلاستیک لایه روانکار', unit: 'Pa·s', min: Number.MIN_VALUE, step: 'any' },
]);

function valueAt(input: Readonly<SimulationRunInput>, path: RheologyInputPath): number {
  const [family, key] = path.split('.') as ['bulk' | 'lubricationLayer', 'yieldStressPa' | 'plasticViscosityPaS'];
  return input.pipeline[family][key];
}

export function renderRheologyView(
  root: HTMLElement,
  inputs: readonly Readonly<RheologyInputPresentation>[] = EMPTY_RHEOLOGY_INPUTS,
  curves?: Readonly<RheologyCurvesPresentation>,
  engineeringInput?: Readonly<SimulationRunInput> | null,
  actions?: Readonly<RheologyViewActions>,
): void {
  const panel=document.createElement('section'); panel.setAttribute('aria-label','ورودی‌های رئولوژی'); panel.style.padding=TOLUE_DESIGN_TOKENS.spacing.lg; panel.style.background=TOLUE_DESIGN_TOKENS.color.surface; panel.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; panel.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.md;
  const title=document.createElement('h2'); title.textContent='داده‌ها و منحنی‌های رئولوژی'; title.style.marginTop='0'; const note=document.createElement('p'); note.textContent='ویرایش ورودی‌ها فقط Session را به‌روزرسانی می‌کند و هر نتیجه قبلی را Stale می‌کند؛ محاسبات فقط توسط Engineering Core انجام می‌شوند.'; note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted; panel.append(title,note);

  if (engineeringInput && actions) {
    const form=document.createElement('div'); form.style.display='grid'; form.style.gridTemplateColumns='repeat(auto-fit, minmax(220px, 1fr))'; form.style.gap=TOLUE_DESIGN_TOKENS.spacing.md; form.dataset.engineeringInput='rheology';
    for (const field of EDITABLE_FIELDS) {
      const wrapper=document.createElement('label'); wrapper.style.display='grid'; wrapper.style.gap=TOLUE_DESIGN_TOKENS.spacing.sm;
      const caption=document.createElement('span'); caption.textContent=`${field.label} (${field.unit})`;
      const control=document.createElement('input'); control.type='number'; control.step=field.step; control.min=String(field.min); control.value=String(valueAt(engineeringInput,field.path)); control.dataset.inputPath=field.path; control.style.fontFamily='inherit'; control.style.padding=TOLUE_DESIGN_TOKENS.spacing.md; control.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; control.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;
      const feedback=document.createElement('small'); feedback.style.minHeight='1.2em'; feedback.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;
      control.addEventListener('change',()=>{const numeric=Number(control.value); try{const next=updateRheologyInputDraft(engineeringInput,field.path,numeric); feedback.textContent=''; control.setAttribute('aria-invalid','false'); actions.updateInput(next);}catch{feedback.textContent='مقدار واردشده برای این پارامتر معتبر نیست.';control.setAttribute('aria-invalid','true');}});
      wrapper.append(caption,control,feedback); form.appendChild(wrapper);
    }
    panel.appendChild(form);
  } else {
    const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit, minmax(220px, 1fr))'; grid.style.gap=TOLUE_DESIGN_TOKENS.spacing.md;
    for(const input of inputs){const card=document.createElement('article'); card.style.padding=TOLUE_DESIGN_TOKENS.spacing.md; card.style.background=TOLUE_DESIGN_TOKENS.color.surfaceMuted; card.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; card.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm; const label=document.createElement('strong'); label.textContent=input.label; const value=document.createElement('div'); value.textContent=input.value===null?`— ${input.unit}`:`${input.value} ${input.unit}`; value.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.sm; value.style.fontFamily=TOLUE_DESIGN_TOKENS.typography.monoFamily; const model=document.createElement('small'); model.textContent=`Model contract: ${input.modelFamily}`; model.style.display='block'; model.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.sm; model.style.color=TOLUE_DESIGN_TOKENS.color.textMuted; card.append(label,value,model); grid.appendChild(card);} panel.appendChild(grid);
  }

  if(curves){const chart=document.createElementNS('http://www.w3.org/2000/svg','svg'); chart.setAttribute('viewBox','0 0 640 320'); chart.setAttribute('role','img'); chart.setAttribute('aria-label','منحنی تنش برشی بر حسب نرخ برش'); chart.style.width='100%'; chart.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.lg; const all=curves.series.flatMap(series=>series.points); const maxX=Math.max(...all.map(p=>p.shearRateSInv),1); const maxY=Math.max(...all.map(p=>p.shearStressPa),1); const sx=(x:number)=>40+(x/maxX)*560; const sy=(y:number)=>280-(y/maxY)*240; curves.series.forEach((series,seriesIndex)=>{const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline'); poly.setAttribute('fill','none'); poly.setAttribute('stroke','currentColor'); poly.setAttribute('stroke-width',seriesIndex===0?'3':'2'); poly.setAttribute('stroke-dasharray',seriesIndex===0?'':'8 6'); poly.setAttribute('points',series.points.map(point=>`${sx(point.shearRateSInv)},${sy(point.shearStressPa)}`).join(' ')); chart.appendChild(poly);}); panel.appendChild(chart); const meta=document.createElement('small'); meta.textContent=`Core sampling: ${curves.samplingShearRatesSInv.join(', ')} s⁻¹ · ${curves.method}`; meta.style.display='block'; meta.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.sm; meta.style.color=TOLUE_DESIGN_TOKENS.color.textMuted; panel.appendChild(meta);}
  else {const empty=document.createElement('p'); empty.textContent='هنوز منحنی رئولوژی معتبر از تحلیل فعال دریافت نشده است.'; panel.appendChild(empty);} root.appendChild(panel);
}
