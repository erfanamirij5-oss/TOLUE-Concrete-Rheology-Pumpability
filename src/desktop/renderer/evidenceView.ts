import type { PumpabilityEvidenceDomain, QualifiedEvidenceOutcome } from '../../engineering/core/projectQualifiedPumpabilityEvidence';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { getPumpabilityEvidenceDraft, removePumpabilityEvidenceDraft, setPumpabilityEvidenceDraft } from './evidenceInputDraft';
import type { PumpabilityEvidencePresentation } from './evidencePresentation';

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
  if (!control.value.trim()) throw new Error(`${label} is required`);
  const value = Number(control.value);
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
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
  heading.textContent = `${domainLabel(domain)} — شواهد پروژه‌ای`;
  heading.style.marginTop = '0';

  const context = document.createElement('p');
  context.textContent = `دبی هدف فعلی: ${engineeringInput.pipeline.targetFlowRateM3s} m³/s. دامنه شواهد باید صریحاً توسط کاربر وارد شود؛ نرم‌افزار هیچ بازه‌ای را استنتاج نمی‌کند.`;
  context.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  context.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;

  const projectId = textInput(current?.projectId ?? '');
  const evidenceId = textInput(current?.evidenceId ?? '');
  const provenanceEntityId = textInput(current?.provenanceEntityId ?? '');
  const methodId = textInput(current?.methodId ?? '');
  const references = textInput(current?.referenceIds.join(', ') ?? '');
  const outcome = document.createElement('select');
  for (const value of ['ACCEPTABLE', 'UNACCEPTABLE'] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; outcome.appendChild(option);
  }
  outcome.value = current?.outcome ?? 'ACCEPTABLE';
  const minFlow = numberInput(current?.qualifiedFlowRangeM3s.min);
  const maxFlow = numberInput(current?.qualifiedFlowRangeM3s.max);
  const applicability = document.createElement('textarea');
  applicability.rows = 3;
  applicability.value = current?.applicabilityStatement ?? '';
  const limitations = document.createElement('textarea');
  limitations.rows = 3;
  limitations.value = current?.limitations.join('\n') ?? '';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
  grid.append(
    field('Project ID', projectId),
    field('Evidence ID', evidenceId),
    field('Provenance Entity ID', provenanceEntityId),
    field('Method / Procedure ID', methodId),
    field('Reference IDs (comma separated)', references),
    field('Outcome', outcome),
    field('حداقل دبی معتبر (m³/s)', minFlow),
    field('حداکثر دبی معتبر (m³/s)', maxFlow),
  );
  const applicabilityField = field('Applicability Statement', applicability);
  applicabilityField.style.gridColumn = '1 / -1';
  const limitationsField = field('Limitations (one per line)', limitations);
  limitationsField.style.gridColumn = '1 / -1';
  grid.append(applicabilityField, limitationsField);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;
  controls.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;
  controls.style.alignItems = 'center';

  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = current ? 'به‌روزرسانی شواهد' : 'ثبت شواهد';
  save.style.fontFamily = 'inherit';
  save.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  save.style.cursor = 'pointer';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'حذف';
  remove.disabled = !current;
  remove.style.fontFamily = 'inherit';
  remove.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.sm} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  remove.style.cursor = current ? 'pointer' : 'not-allowed';

  const feedback = document.createElement('small');
  feedback.setAttribute('aria-live', 'polite');
  feedback.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;

  save.addEventListener('click', () => {
    try {
      const next = setPumpabilityEvidenceDraft(engineeringInput, domain, {
        projectId: projectId.value,
        evidenceId: evidenceId.value,
        provenanceEntityId: provenanceEntityId.value,
        methodId: methodId.value,
        referenceIds: splitComma(references.value),
        outcome: outcome.value as QualifiedEvidenceOutcome,
        qualifiedFlowRangeM3s: { min: requiredNumber(minFlow, 'min flow'), max: requiredNumber(maxFlow, 'max flow') },
        applicabilityStatement: applicability.value,
        limitations: splitLines(limitations.value),
      });
      feedback.textContent = 'شواهد در Draft مهندسی ثبت شد. اجرای تحلیل، applicability را در دبی هدف بررسی می‌کند.';
      feedback.style.color = TOLUE_DESIGN_TOKENS.color.statusNominal;
      actions.updateInput(next);
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : 'Evidence record is invalid.';
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
  panel.setAttribute('aria-label', 'شواهد پروژه‌ای پمپ‌پذیری');
  panel.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  panel.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  panel.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  panel.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;

  const title = document.createElement('h2');
  title.textContent = 'شواهد پروژه‌ای پایداری و انسداد';
  title.style.marginTop = '0';

  const note = document.createElement('p');
  note.textContent = 'Stability و Blockage در TOLUE مدل عمومی نیستند. فقط شواهد پروژه‌ای صریح، با دامنه کاربرد مشخص، وارد تصمیم Pumpability می‌شوند. OUT_OF_DOMAIN هرگز extrapolate نمی‌شود.';
  note.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  panel.append(title, note);

  if (engineeringInput && actions) {
    renderAuthoringCard(panel, 'stability', engineeringInput, actions);
    renderAuthoringCard(panel, 'blockage', engineeringInput, actions);
  }

  if (evidence.length > 0) {
    const resultTitle = document.createElement('h3');
    resultTitle.textContent = 'نتیجه ارزیابی Core';
    resultTitle.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.lg;
    panel.appendChild(resultTitle);
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gap = TOLUE_DESIGN_TOKENS.spacing.md;
    for (const item of evidence) {
      const card = document.createElement('article');
      card.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
      card.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
      card.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
      card.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
      const heading = document.createElement('strong');
      heading.textContent = `${domainLabel(item.domain)} — ${item.status}`;
      const outcome = document.createElement('div');
      outcome.textContent = `نتیجه: ${item.outcome ?? '—'}`;
      outcome.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
      const flow = document.createElement('div');
      flow.textContent = `دبی هدف: ${item.targetFlowRateM3s} m³/s | دامنه معتبر: ${item.qualifiedFlowRangeM3s.min} تا ${item.qualifiedFlowRangeM3s.max} m³/s`;
      flow.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xs;
      flow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      const applicability = document.createElement('p');
      applicability.textContent = item.applicabilityStatement;
      applicability.style.marginBottom = '0';
      const trace = document.createElement('small');
      trace.textContent = `Evidence: ${item.evidenceId} | Provenance: ${item.provenanceEntityId} | Method: ${item.methodId}`;
      trace.style.display = 'block';
      trace.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.sm;
      trace.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
      card.append(heading, outcome, flow, applicability, trace);
      grid.appendChild(card);
    }
    panel.appendChild(grid);
  } else if (!engineeringInput) {
    const empty = document.createElement('div');
    empty.textContent = 'هنوز شواهد معتبر پروژه‌ای دریافت نشده است.';
    empty.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
    empty.style.background = TOLUE_DESIGN_TOKENS.color.surfaceMuted;
    empty.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    panel.appendChild(empty);
  }

  root.appendChild(panel);
}
