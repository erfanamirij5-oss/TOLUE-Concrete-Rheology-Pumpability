import type { PumpabilityEvidenceDomain, QualifiedEvidenceOutcome } from '../../engineering/core/projectQualifiedPumpabilityEvidence';
import type { PumpabilityRiskScreeningInput } from '../../engineering/core/pumpabilityRiskScreening';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { getPumpabilityEvidenceDraft, removePumpabilityEvidenceDraft, setPumpabilityEvidenceDraft } from './evidenceInputDraft';
import type { PumpabilityEvidencePresentation } from './evidencePresentation';
import { assessmentStatusFa } from './persianPresentation';
import { removePumpabilityRiskScreeningDraft, setPumpabilityRiskScreeningDraft } from './riskScreeningInputDraft';

export interface EvidenceViewActions {
  readonly updateInput: (input: Readonly<SimulationRunInput>) => void;
}

function domainLabel(domain: PumpabilityEvidenceDomain): string {
  return domain === 'stability' ? 'پایداری' : 'ریسک انسداد';
}

function styleControl(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  control.style.fontFamily = 'inherit';
  control.style.padding = TOLUE_DESIGN_TOKENS.spacing.sm;
  control.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  control.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  control.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  control.style.color = TOLUE_DESIGN_TOKENS.color.text;
  control.style.width = '100%';
  control.style.boxSizing = 'border-box';
}

function field(labelText: string, control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.style.display = 'grid';
  wrapper.style.gap = TOLUE_DESIGN_TOKENS.spacing.xs;
  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  label.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  styleControl(control);
  wrapper.append(label, control);
  return wrapper;
}

function textInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  return input;
}

function numberInput(value?: number): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.min = '0';
  input.value = value === undefined ? '' : String(value);
  return input;
}

function splitComma(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function requiredNumber(control: HTMLInputElement, label: string): number {
  if (!control.value.trim()) throw new Error(`${label} الزامی است.`);
  const value = Number(control.value);
  if (!Number.isFinite(value)) throw new Error(`${label} باید عدد معتبر باشد.`);
  return value;
}

function renderAutomaticRiskScreeningCard(
  root: HTMLElement,
  engineeringInput: Readonly<SimulationRunInput>,
  actions: Readonly<EvidenceViewActions>,
): void {
  const current = engineeringInput.pumpabilityRiskScreening;
  const card = document.createElement('section');
  Object.assign(card.style, {
    padding: TOLUE_DESIGN_TOKENS.spacing.md,
    background: 'linear-gradient(180deg,rgba(36,152,197,.08),rgba(17,26,34,.96))',
    border: `1px solid ${current ? TOLUE_DESIGN_TOKENS.color.info : TOLUE_DESIGN_TOKENS.color.border}`,
    borderRadius: TOLUE_DESIGN_TOKENS.radius.sm,
    marginTop: TOLUE_DESIGN_TOKENS.spacing.md,
  });

  const heading = document.createElement('h3');
  heading.textContent = 'غربالگری خودکار پایداری و ریسک انسداد';
  heading.style.marginTop = '0';
  const description = document.createElement('p');
  description.textContent = 'با ثبت چهار ورودی زیر، هسته مهندسی در هر اجرا دو کنترل شفاف انجام می‌دهد: نسبت اندازه اسمی بیشینه سنگدانه به کوچک‌ترین قطر داخلی خط لوله بر مبنای راهنمای بتن پمپی ACI، و معیار پایداری ایستای راسل بر پایه تنش تسلیم فاز معلق‌کننده. این نتایج «غربالگری مهندسی مقدماتی» هستند و با شواهد پروژه‌ای اشتباه گرفته نمی‌شوند.';
  Object.assign(description.style,{color:TOLUE_DESIGN_TOKENS.color.textMuted,fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm,lineHeight:'1.9'});

  const nmsMm = numberInput(current ? current.nominalMaximumAggregateSizeM * 1000 : undefined);
  const suspendingYield = numberInput(current?.suspendingPhaseYieldStressPa);
  const suspendingDensity = numberInput(current?.suspendingPhaseDensityKgM3);
  const aggregateDensity = numberInput(current?.coarseAggregateDensityKgM3);
  nmsMm.placeholder = 'مثلاً 19';
  suspendingYield.placeholder = 'تنش تسلیم ملات/فاز پیوسته';
  suspendingDensity.placeholder = 'مثلاً 2200';
  aggregateDensity.placeholder = 'مثلاً 2650';

  const grid = document.createElement('div');
  Object.assign(grid.style,{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:TOLUE_DESIGN_TOKENS.spacing.md});
  grid.append(
    field('اندازه اسمی بیشینه سنگدانه NMS (میلی‌متر)', nmsMm),
    field('تنش تسلیم ملات / فاز معلق‌کننده (پاسکال)', suspendingYield),
    field('چگالی ملات / فاز معلق‌کننده (کیلوگرم بر مترمکعب)', suspendingDensity),
    field('چگالی سنگدانه درشت (کیلوگرم بر مترمکعب)', aggregateDensity),
  );

  const note = document.createElement('small');
  note.textContent = 'نکته: تنش تسلیم این بخش باید مربوط به فاز معلق‌کننده (ملات/خمیر واجد سنگدانه درشت) باشد؛ نرم‌افزار عمداً تنش تسلیم بتن حجمی را جایگزین آن نمی‌کند.';
  Object.assign(note.style,{display:'block',marginTop:'9px',color:TOLUE_DESIGN_TOKENS.color.statusWarning,lineHeight:'1.8'});

  const controls = document.createElement('div');
  Object.assign(controls.style,{display:'flex',flexWrap:'wrap',gap:TOLUE_DESIGN_TOKENS.spacing.sm,marginTop:TOLUE_DESIGN_TOKENS.spacing.md,alignItems:'center'});
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = current ? 'به‌روزرسانی ورودی‌های غربالگری' : 'فعال‌کردن تحلیل خودکار ریسک';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'حذف ورودی‌های غربالگری';
  remove.disabled = !current;
  const feedback = document.createElement('small');
  feedback.setAttribute('aria-live','polite');
  feedback.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  for (const button of [save, remove]) {
    button.style.fontFamily = 'inherit';
    button.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
    button.style.cursor = button.disabled ? 'not-allowed' : 'pointer';
  }

  save.addEventListener('click', () => {
    try {
      const draft: PumpabilityRiskScreeningInput = {
        nominalMaximumAggregateSizeM: requiredNumber(nmsMm,'اندازه اسمی بیشینه سنگدانه') / 1000,
        suspendingPhaseYieldStressPa: requiredNumber(suspendingYield,'تنش تسلیم فاز معلق‌کننده'),
        suspendingPhaseDensityKgM3: requiredNumber(suspendingDensity,'چگالی فاز معلق‌کننده'),
        coarseAggregateDensityKgM3: requiredNumber(aggregateDensity,'چگالی سنگدانه درشت'),
      };
      actions.updateInput(setPumpabilityRiskScreeningDraft(engineeringInput,draft));
      feedback.textContent = 'ورودی‌ها ثبت شد. برای محاسبه پایداری و ریسک انسداد، تحلیل را دوباره اجرا کنید.';
      feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal;
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : 'ورودی‌های غربالگری معتبر نیستند.';
      feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
    }
  });
  remove.addEventListener('click',()=>actions.updateInput(removePumpabilityRiskScreeningDraft(engineeringInput)));
  controls.append(save,remove,feedback);
  card.append(heading,description,grid,note,controls);
  root.appendChild(card);
}

function renderAuthoringCard(
  root: HTMLElement,
  domain: PumpabilityEvidenceDomain,
  engineeringInput: Readonly<SimulationRunInput>,
  actions: Readonly<EvidenceViewActions>,
): void {
  const current = getPumpabilityEvidenceDraft(engineeringInput, domain);
  const card = document.createElement('section');
  card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
  card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  card.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;

  const heading = document.createElement('h3');
  heading.textContent = `${domainLabel(domain)} — شواهد پروژه‌ای تکمیلی`;
  heading.style.marginTop = '0';
  const context = document.createElement('p');
  context.textContent = `دبی هدف فعلی: ${engineeringInput.pipeline.targetFlowRateM3s} مترمکعب بر ثانیه. این بخش برای شواهد آزمون/کالیبراسیون واقعی پروژه است و در صورت معتبر بودن در دامنه دبی، بر غربالگری خودکار اولویت دارد.`;
  context.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  context.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;

  const projectId = textInput(current?.projectId ?? '');
  const evidenceId = textInput(current?.evidenceId ?? '');
  const provenanceEntityId = textInput(current?.provenanceEntityId ?? '');
  const methodId = textInput(current?.methodId ?? '');
  const references = textInput(current?.referenceIds.join(', ') ?? '');
  const outcome = document.createElement('select');
  for (const value of ['ACCEPTABLE', 'UNACCEPTABLE'] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = assessmentStatusFa(value); outcome.appendChild(option);
  }
  outcome.value = current?.outcome ?? 'ACCEPTABLE';
  const minFlow = numberInput(current?.qualifiedFlowRangeM3s.min);
  const maxFlow = numberInput(current?.qualifiedFlowRangeM3s.max);
  const applicability = document.createElement('textarea'); applicability.rows = 3; applicability.value = current?.applicabilityStatement ?? '';
  const limitations = document.createElement('textarea'); limitations.rows = 3; limitations.value = current?.limitations.join('\n') ?? '';

  const grid = document.createElement('div');
  grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))'; grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  grid.append(
    field('شناسه پروژه', projectId), field('شناسه شواهد', evidenceId), field('شناسه منشأ داده', provenanceEntityId),
    field('شناسه روش / دستورالعمل', methodId), field('شناسه منابع (با ویرگول جدا شود)', references), field('نتیجه شواهد', outcome),
    field('حداقل دبی معتبر (مترمکعب بر ثانیه)', minFlow), field('حداکثر دبی معتبر (مترمکعب بر ثانیه)', maxFlow),
  );
  const applicabilityField = field('بیانیه دامنه کاربرد', applicability); applicabilityField.style.gridColumn = '1 / -1';
  const limitationsField = field('محدودیت‌ها (هر مورد در یک خط)', limitations); limitationsField.style.gridColumn = '1 / -1';
  grid.append(applicabilityField, limitationsField);

  const controls = document.createElement('div');
  controls.style.display = 'flex'; controls.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm; controls.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md; controls.style.alignItems = 'center';
  const save = document.createElement('button'); save.type = 'button'; save.textContent = current ? 'به‌روزرسانی شواهد' : 'ثبت شواهد'; save.style.fontFamily = 'inherit'; save.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`; save.style.cursor = 'pointer';
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'حذف'; remove.disabled = !current; remove.style.fontFamily = 'inherit'; remove.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`; remove.style.cursor = current ? 'pointer' : 'not-allowed';
  const feedback = document.createElement('small'); feedback.setAttribute('aria-live', 'polite'); feedback.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  save.addEventListener('click', () => {
    try {
      const next = setPumpabilityEvidenceDraft(engineeringInput, domain, {
        projectId: projectId.value, evidenceId: evidenceId.value, provenanceEntityId: provenanceEntityId.value, methodId: methodId.value,
        referenceIds: splitComma(references.value), outcome: outcome.value as QualifiedEvidenceOutcome,
        qualifiedFlowRangeM3s: { min: requiredNumber(minFlow, 'حداقل دبی'), max: requiredNumber(maxFlow, 'حداکثر دبی') },
        applicabilityStatement: applicability.value, limitations: splitLines(limitations.value),
      });
      feedback.textContent = 'شواهد در پیش‌نویس مهندسی ثبت شد. هنگام اجرای تحلیل، دامنه کاربرد در دبی هدف بررسی می‌شود.';
      feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal;
      actions.updateInput(next);
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : 'رکورد شواهد معتبر نیست.';
      feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusCritical;
    }
  });
  remove.addEventListener('click', () => actions.updateInput(removePumpabilityEvidenceDraft(engineeringInput, domain)));
  controls.append(save, remove, feedback);
  card.append(heading, context, grid, controls);
  root.appendChild(card);
}

export function renderEvidenceView(
  root: HTMLElement,
  evidence: readonly Readonly<PumpabilityEvidencePresentation>[] = [],
  engineeringInput?: Readonly<SimulationRunInput> | null,
  actions?: Readonly<EvidenceViewActions>,
): void {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'تحلیل پایداری و ریسک انسداد');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2'); title.textContent = 'پایداری و ریسک انسداد'; title.style.marginTop = '0';
  const note = document.createElement('p');
  note.textContent = 'طلوع ابتدا غربالگری مهندسی شفاف را از ورودی‌های واقعی انجام می‌دهد. اگر شواهد معتبر پروژه‌ای نیز ثبت شده باشد، نتیجه پروژه‌ایِ داخل دامنه بر غربالگری مقدماتی اولویت دارد. هیچ نتیجه‌ای از فشار یا اسلامپ به‌صورت پنهانی به پایداری/انسداد تعمیم داده نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (engineeringInput && actions) {
    renderAutomaticRiskScreeningCard(panel, engineeringInput, actions);
    renderAuthoringCard(panel, 'stability', engineeringInput, actions);
    renderAuthoringCard(panel, 'blockage', engineeringInput, actions);
  }

  if (evidence.length > 0) {
    const resultTitle = document.createElement('h3'); resultTitle.textContent = 'نتیجه شواهد پروژه‌ای'; resultTitle.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg; panel.appendChild(resultTitle);
    const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
    for (const item of evidence) {
      const card = document.createElement('article'); card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md; card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted; card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`; card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
      const heading = document.createElement('strong'); heading.textContent = `${domainLabel(item.domain)} — ${assessmentStatusFa(item.status)}`;
      const outcome = document.createElement('div'); outcome.textContent = `نتیجه: ${item.outcome ? assessmentStatusFa(item.outcome) : '—'}`; outcome.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
      const flow = document.createElement('div'); flow.textContent = `دبی هدف: ${item.targetFlowRateM3s} مترمکعب بر ثانیه | دامنه معتبر: ${item.qualifiedFlowRangeM3s.min} تا ${item.qualifiedFlowRangeM3s.max} مترمکعب بر ثانیه`; flow.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs; flow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      const applicability = document.createElement('p'); applicability.textContent = item.applicabilityStatement; applicability.style.marginBottom = '0';
      const trace = document.createElement('small'); trace.textContent = `شناسه شواهد: ${item.evidenceId} | منشأ داده: ${item.provenanceEntityId} | روش: ${item.methodId}`; trace.style.display = 'block'; trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm; trace.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      card.append(heading, outcome, flow, applicability, trace); grid.appendChild(card);
    }
    panel.appendChild(grid);
  }
  root.appendChild(panel);
}
