import type { PumpCapabilityProvenance } from '../../engineering/core/pumpCapability';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import {
  addPumpCapabilityPointDraft,
  createPumpCapabilityDraft,
  removePumpCapabilityDraft,
  removePumpCapabilityPointDraft,
  updatePumpCapabilityPointDraft,
  updatePumpCapabilityProvenanceDraft,
  updatePumpOperatingEnvelopeDraft,
  type PumpCapabilityPointField,
  type PumpOperatingEnvelopeField,
} from './engineeringInputDraft';
import type { PumpCapabilityPresentation } from './pumpPresentation';
import { renderPumpFlowPressureCurveView } from './pumpFlowPressureCurveView';
import { renderPumpPressureChartView } from './pumpPressureChartView';

export interface PumpViewActions { readonly updateInput: (input: Readonly<SimulationRunInput>) => void; }

function pressureText(value: number | null): string {
  return value === null ? '—' : `${(value / 1_000_000).toFixed(3)} MPa`;
}

function styledInput(type: 'text' | 'number' = 'text'): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  if (type === 'number') { input.step = 'any'; input.min = '0'; }
  input.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  input.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  input.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  input.style.fontFamily = 'inherit';
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  return input;
}

function button(text: string): HTMLButtonElement {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = text;
  control.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  control.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  control.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  control.style.cursor = 'pointer';
  control.style.fontFamily = 'inherit';
  return control;
}

function pointEditor(labelText: string, value: number, onCommit: (value: number) => void): HTMLElement {
  const label = document.createElement('label'); label.style.display = 'grid'; label.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  const caption = document.createElement('span'); caption.textContent = labelText;
  const input = styledInput('number'); input.value = String(value);
  const error = document.createElement('small'); error.style.minHeight = '1.2em'; error.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
  input.addEventListener('change', () => {
    try { onCommit(Number(input.value)); input.setAttribute('aria-invalid', 'false'); error.textContent = ''; }
    catch { input.setAttribute('aria-invalid', 'true'); error.textContent = 'مقدار معتبر نیست یا ترتیب صعودی دبی‌ها را نقض می‌کند.'; }
  });
  label.append(caption, input, error); return label;
}

function renderCreatePumpCapability(root: HTMLElement, engineeringInput: Readonly<SimulationRunInput>, actions: Readonly<PumpViewActions>): void {
  const panel = document.createElement('section');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2'); title.textContent = 'تعریف قابلیت پمپ'; title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'هیچ منحنی یا عدد پیش‌فرضی ساخته نمی‌شود. ابتدا منشأ داده را انتخاب کنید؛ سپس مشخصات پمپ و نقاط واقعی Q–P را وارد کنید.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  const select = document.createElement('select'); select.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; select.style.fontFamily = 'inherit';
  const options: readonly [PumpCapabilityProvenance, string][] = [
    ['manufacturer_curve', 'منحنی سازنده'],
    ['manufacturer_rated_point', 'نقطه نامی سازنده'],
    ['calibrated_project_data', 'داده کالیبره‌شده پروژه'],
  ];
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'انتخاب منشأ داده…'; placeholder.selected = true; placeholder.disabled = true; select.appendChild(placeholder);
  for (const [value, label] of options) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.appendChild(option); }

  const create = button('ایجاد رکورد پمپ'); create.disabled = true;
  select.addEventListener('change', () => { create.disabled = !select.value; });
  create.addEventListener('click', () => {
    if (!select.value) return;
    actions.updateInput(createPumpCapabilityDraft(engineeringInput, select.value as PumpCapabilityProvenance));
  });
  panel.append(title, note, select, create);
  root.appendChild(panel);
}

function renderPumpEditor(root: HTMLElement, engineeringInput: Readonly<SimulationRunInput>, actions: Readonly<PumpViewActions>): void {
  const capability = engineeringInput.pumpCapability!;
  const editor = document.createElement('section');
  editor.setAttribute('aria-label', 'ورودی‌های قابلیت پمپ');
  editor.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  editor.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.lg;
  editor.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  editor.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  editor.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2'); title.textContent = 'Pump Operating Envelope'; title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'فقط داده واقعی سازنده/پروژه را وارد کنید. Extrapolation خارج از محدوده نقاط در Engineering Core ممنوع است.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  editor.append(title, note);

  const provenanceLabel = document.createElement('label'); provenanceLabel.style.display = 'grid'; provenanceLabel.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  provenanceLabel.appendChild(document.createTextNode('منشأ داده'));
  const provenanceSelect = document.createElement('select'); provenanceSelect.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; provenanceSelect.style.fontFamily = 'inherit';
  const provenanceOptions: readonly PumpCapabilityProvenance[] = ['manufacturer_curve', 'manufacturer_rated_point', 'calibrated_project_data'];
  for (const value of provenanceOptions) { const option = document.createElement('option'); option.value = value; option.textContent = value; option.selected = capability.provenance === value; provenanceSelect.appendChild(option); }
  provenanceSelect.addEventListener('change', () => actions.updateInput(updatePumpCapabilityProvenanceDraft(engineeringInput, provenanceSelect.value as PumpCapabilityProvenance)));
  provenanceLabel.appendChild(provenanceSelect);
  editor.appendChild(provenanceLabel);

  const envelope = capability.operatingEnvelope;
  const metadataGrid = document.createElement('div'); metadataGrid.style.display = 'grid'; metadataGrid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(220px,1fr))'; metadataGrid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md; metadataGrid.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const fields: readonly [PumpOperatingEnvelopeField, string][] = [
    ['manufacturer', 'سازنده'], ['model', 'مدل'], ['configurationRevision', 'Revision / Configuration'],
    ['sourceDocumentId', 'شناسه سند منبع'], ['sourceDocumentRevision', 'Revision سند'], ['sourceHash', 'Source hash (اختیاری/برای داده کالیبره‌شده مهم)'],
  ];
  for (const [field, labelText] of fields) {
    const label = document.createElement('label'); label.style.display = 'grid'; label.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
    const caption = document.createElement('span'); caption.textContent = labelText;
    const input = styledInput(); input.value = envelope?.[field] ?? '';
    input.addEventListener('change', () => actions.updateInput(updatePumpOperatingEnvelopeDraft(engineeringInput, field, input.value)));
    label.append(caption, input); metadataGrid.appendChild(label);
  }
  editor.appendChild(metadataGrid);

  const pointsTitle = document.createElement('h3'); pointsTitle.textContent = 'نقاط Q–P'; pointsTitle.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg; editor.appendChild(pointsTitle);
  if (capability.capabilityCurve.length === 0) {
    const empty = document.createElement('p'); empty.textContent = 'هنوز نقطه‌ای ثبت نشده است. بدون نقطه واقعی، تحلیل پمپ BLOCKED می‌ماند.'; empty.style.color = TOLUE_DESIGN_TOKENS.color.textMuted; editor.appendChild(empty);
  }

  capability.capabilityCurve.forEach((point, index) => {
    const fieldset = document.createElement('fieldset'); fieldset.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md; fieldset.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; fieldset.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const legend = document.createElement('legend'); legend.textContent = `نقطه ${index + 1}`; fieldset.appendChild(legend);
    const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(220px,1fr))'; grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
    const pointFields: readonly [PumpCapabilityPointField, string, number][] = [['flowRateM3s', 'دبی (m³/s)', point.flowRateM3s], ['availableConcretePressurePa', 'فشار قابل تأمین بتن (Pa)', point.availableConcretePressurePa]];
    for (const [field, label, value] of pointFields) grid.appendChild(pointEditor(label, value, next => actions.updateInput(updatePumpCapabilityPointDraft(engineeringInput, index, field, next))));
    const remove = button('حذف نقطه'); remove.addEventListener('click', () => actions.updateInput(removePumpCapabilityPointDraft(engineeringInput, index))); grid.appendChild(remove);
    fieldset.appendChild(grid); editor.appendChild(fieldset);
  });

  const addBox = document.createElement('div'); addBox.style.display = 'grid'; addBox.style.gridTemplateColumns = 'repeat(auto-fit,minmax(180px,1fr))'; addBox.style.gap = TOLUE_DESIGN_TOKENS.spacing.md; addBox.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  const flow = styledInput('number'); flow.placeholder = 'دبی واقعی m³/s';
  const pressure = styledInput('number'); pressure.placeholder = 'فشار واقعی Pa';
  const add = button('افزودن نقطه');
  const error = document.createElement('small'); error.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical; error.style.gridColumn = '1 / -1';
  add.addEventListener('click', () => {
    if (flow.value.trim() === '' || pressure.value.trim() === '') { error.textContent = 'هر دو مقدار باید صریحاً وارد شوند؛ مقدار پیش‌فرض ساخته نمی‌شود.'; return; }
    try {
      actions.updateInput(addPumpCapabilityPointDraft(engineeringInput, Number(flow.value), Number(pressure.value)));
      error.textContent = '';
    } catch {
      error.textContent = 'نقطه معتبر نیست یا دبی تکراری است.';
    }
  });
  addBox.append(flow, pressure, add, error); editor.appendChild(addBox);

  const removeCapability = button('حذف کامل رکورد پمپ'); removeCapability.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
  removeCapability.addEventListener('click', () => actions.updateInput(removePumpCapabilityDraft(engineeringInput)));
  editor.appendChild(removeCapability);
  root.appendChild(editor);
}

export function renderPumpView(root: HTMLElement, result?: Readonly<PumpCapabilityPresentation>, engineeringInput?: Readonly<SimulationRunInput> | null, actions?: Readonly<PumpViewActions>): void {
  if (engineeringInput && actions) {
    if (engineeringInput.pumpCapability) renderPumpEditor(root, engineeringInput, actions);
    else renderCreatePumpCapability(root, engineeringInput, actions);
  }

  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'قابلیت فشار پمپ');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  const title = document.createElement('h2'); title.textContent = 'قابلیت پمپ و تطابق فشار'; title.style.marginTop = '0';
  const note = document.createElement('p'); note.textContent = 'وضعیت PASS/FAIL/INSUFFICIENT_DATA مستقیماً از Engineering Core نمایش داده می‌شود. Renderer آستانه یا حاشیه ایمنی جدید ایجاد نمی‌کند.'; note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (!result) {
    const empty = document.createElement('div');
    empty.textContent = engineeringInput?.pumpCapability ? 'بعد از اجرای تحلیل، نتیجه تطابق فشار در این بخش نمایش داده می‌شود.' : 'داده قابلیت پمپ در Session موجود نیست؛ از بخش بالا یک رکورد واقعی پمپ تعریف کنید.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted; empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty); root.appendChild(panel); renderPumpPressureChartView(root); renderPumpFlowPressureCurveView(root); return;
  }

  const values: readonly [string, string][] = [
    ['دبی هدف', `${result.targetFlowRateM3s} m³/s`], ['فشار موردنیاز', pressureText(result.requiredPressurePa)], ['فشار قابل تأمین', pressureText(result.availablePressurePa)],
    ['حاشیه فشار', pressureText(result.pressureMarginPa)], ['وضعیت', result.status], ['روش درون‌یابی', result.interpolation], ['منشأ داده', result.provenance], ['روش', result.method],
  ];
  const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))'; grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  for (const [labelText, valueText] of values) {
    const card = document.createElement('article'); card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted; card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    const label = document.createElement('small'); label.textContent = labelText; label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
    const value = document.createElement('div'); value.textContent = valueText; value.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; card.append(label, value); grid.appendChild(card);
  }
  panel.appendChild(grid); root.appendChild(panel); renderPumpPressureChartView(root, result); renderPumpFlowPressureCurveView(root, result);
}
