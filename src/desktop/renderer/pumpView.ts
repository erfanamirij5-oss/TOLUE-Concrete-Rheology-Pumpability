import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { updatePumpCapabilityPointDraft, type PumpCapabilityPointField } from './engineeringInputDraft';
import type { PumpCapabilityPresentation } from './pumpPresentation';
import { renderPumpFlowPressureCurveView } from './pumpFlowPressureCurveView';
import { renderPumpPressureChartView } from './pumpPressureChartView';

export interface PumpViewActions { readonly updateInput: (input: Readonly<SimulationRunInput>) => void; }

function pressureText(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

function pointEditor(labelText:string,value:number,onCommit:(value:number)=>void):HTMLElement {
  const label=document.createElement('label');label.style.display='grid';label.style.gap=TOLUE_DESIGN_TOKENS.spacing.sm;
  const caption=document.createElement('span');caption.textContent=labelText;
  const input=document.createElement('input');input.type='number';input.step='any';input.min='0';input.value=String(value);input.style.padding=TOLUE_DESIGN_TOKENS.spacing.md;input.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;input.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;input.style.fontFamily='inherit';
  const error=document.createElement('small');error.style.minHeight='1.2em';error.style.color=TOLUE_DESIGN_TOKENS.color.statusCritical;
  input.addEventListener('change',()=>{try{onCommit(Number(input.value));input.setAttribute('aria-invalid','false');error.textContent='';}catch{input.setAttribute('aria-invalid','true');error.textContent='نقطه منحنی معتبر نیست؛ دبی‌ها باید نامنفی و به‌ترتیب صعودی باشند.';}});
  label.append(caption,input,error);return label;
}

export function renderPumpView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<PumpViewActions>): void {
  if(engineeringInput?.pumpCapability&&actions){const editor=document.createElement('section');editor.setAttribute('aria-label','ورودی‌های قابلیت پمپ');editor.style.padding=TOLUE_DESIGN_TOKENS.spacing.lg;editor.style.marginBottom=TOLUE_DESIGN_TOKENS.spacing.lg;editor.style.background=TOLUE_DESIGN_TOKENS.color.surface;editor.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;editor.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.md;const title=document.createElement('h2');title.textContent='منحنی قابلیت پمپ';title.style.marginTop='0';const note=document.createElement('p');note.textContent=`منشأ داده: ${engineeringInput.pumpCapability.provenance}. نقاط فقط همان داده‌های تأییدشده ورودی هستند؛ Renderer درون‌یابی یا extrapolation جدیدی انجام نمی‌دهد.`;note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;editor.append(title,note);engineeringInput.pumpCapability.capabilityCurve.forEach((point,index)=>{const fieldset=document.createElement('fieldset');fieldset.style.marginTop=TOLUE_DESIGN_TOKENS.spacing.md;fieldset.style.border=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;fieldset.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;const legend=document.createElement('legend');legend.textContent=`نقطه ${index+1}`;fieldset.appendChild(legend);const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(auto-fit,minmax(220px,1fr))';grid.style.gap=TOLUE_DESIGN_TOKENS.spacing.md;const fields:readonly [PumpCapabilityPointField,string,number][]=[['flowRateM3s','دبی (m³/s)',point.flowRateM3s],['availableConcretePressurePa','فشار قابل تأمین بتن (Pa)',point.availableConcretePressurePa]];for(const [field,label,value] of fields){grid.appendChild(pointEditor(label,value,next=>actions.updateInput(updatePumpCapabilityPointDraft(engineeringInput,index,field,next))));}fieldset.appendChild(grid);editor.appendChild(fieldset);});root.appendChild(editor);}

  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'قابلیت فشار پمپ');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'قابلیت پمپ و تطابق فشار';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'وضعیت PASS/FAIL/INSUFFICIENT_DATA مستقیماً از Engineering Core نمایش داده می‌شود. Renderer آستانه یا حاشیه ایمنی جدید ایجاد نمی‌کند.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!result) {
    const empty = document.createElement('div');
    empty.textContent = engineeringInput?.pumpCapability ? 'بعد از اجرای تحلیل، نتیجه تطابق فشار در این بخش نمایش داده می‌شود.' : 'داده قابلیت پمپ در Session موجود نیست؛ نتیجه تطابق فشار قابل ارزیابی نیست.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
    root.appendChild(panel);
    renderPumpPressureChartView(root);
    renderPumpFlowPressureCurveView(root);
    return;
  }

  const values: readonly [string, string][] = [
    ['دبی هدف', `${result.targetFlowRateM3s} m³/s`],
    ['فشار موردنیاز', pressureText(result.requiredPressurePa)],
    ['فشار قابل تأمین', pressureText(result.availablePressurePa)],
    ['حاشیه فشار', pressureText(result.pressureMarginPa)],
    ['وضعیت', result.status],
    ['روش درون‌یابی', result.interpolation],
    ['منشأ داده', result.provenance],
    ['روش', result.method],
  ];

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const [labelText, valueText] of values) {
    const card = document.createElement('article');
    card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small');
    label.textContent = labelText;
    label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const value = document.createElement('div');
    value.textContent = valueText;
    value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
    card.append(label, value);
    grid.appendChild(card);
  }
  panel.appendChild(grid);
  root.appendChild(panel);
  renderPumpPressureChartView(root, result);
  renderPumpFlowPressureCurveView(root, result);
}
