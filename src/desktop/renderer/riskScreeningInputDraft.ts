import type { PumpabilityRiskScreeningInput } from '../../engineering/core/pumpabilityRiskScreening';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

function finitePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} باید عددی بزرگ‌تر از صفر باشد.`);
}

function finiteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} باید عددی نامنفی باشد.`);
}

export function setPumpabilityRiskScreeningDraft(
  input: Readonly<SimulationRunInput>,
  draft: Readonly<PumpabilityRiskScreeningInput>,
): Readonly<SimulationRunInput> {
  finitePositive(draft.nominalMaximumAggregateSizeM, 'اندازه اسمی بیشینه سنگدانه');
  finiteNonNegative(draft.suspendingPhaseYieldStressPa, 'تنش تسلیم فاز معلق‌کننده');
  finitePositive(draft.suspendingPhaseDensityKgM3, 'چگالی فاز معلق‌کننده');
  finitePositive(draft.coarseAggregateDensityKgM3, 'چگالی سنگدانه درشت');
  const next = structuredClone(input) as SimulationRunInput;
  next.pumpabilityRiskScreening = { ...draft };
  return Object.freeze(next);
}

export function removePumpabilityRiskScreeningDraft(
  input: Readonly<SimulationRunInput>,
): Readonly<SimulationRunInput> {
  const next = structuredClone(input) as SimulationRunInput;
  delete next.pumpabilityRiskScreening;
  return Object.freeze(next);
}
