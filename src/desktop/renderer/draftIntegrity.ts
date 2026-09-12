import { DRAFT_PLACEHOLDER_ASSUMPTION } from '../../engineering/core/readinessGate';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export function hasStarterDraftPlaceholder(input: Readonly<SimulationRunInput>): boolean {
  return (input.assumptions ?? []).includes(DRAFT_PLACEHOLDER_ASSUMPTION);
}

/**
 * Explicit operator acknowledgement only. This function does not infer that values
 * are real from edits, provenance, geometry, or any other field. The caller must
 * deliberately acknowledge replacement/verification of starter engineering values.
 */
export function confirmStarterDraftInputs(
  input: Readonly<SimulationRunInput>,
  acknowledged: boolean,
): Readonly<SimulationRunInput> {
  if (!hasStarterDraftPlaceholder(input)) throw new Error('DRAFT-INTEGRITY-NO-PLACEHOLDER-001');
  if (acknowledged !== true) throw new Error('DRAFT-INTEGRITY-ACK-001');

  const next = structuredClone(input) as SimulationRunInput;
  const remaining = (next.assumptions ?? []).filter(item => item !== DRAFT_PLACEHOLDER_ASSUMPTION);
  if (remaining.length > 0) next.assumptions = remaining;
  else delete next.assumptions;
  return Object.freeze(next);
}
