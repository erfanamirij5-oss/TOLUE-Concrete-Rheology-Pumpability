import { SimulationRunResult } from './simulationRun';

export type PressureFeasibilityStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA';
export type EvidenceDomainStatus = 'NOT_ASSESSED';
export type PumpabilityDecisionStatus =
  | 'PRESSURE_ONLY_ACCEPTABLE'
  | 'FAIL_PRESSURE'
  | 'INSUFFICIENT_DATA';

export interface PumpabilityDecisionResult {
  runId: string;
  pressureFeasibility: PressureFeasibilityStatus;
  stability: EvidenceDomainStatus;
  blockageRisk: EvidenceDomainStatus;
  status: PumpabilityDecisionStatus;
  sourceMethodIds: string[];
  limitations: string[];
  method: 'tolue-pumpability-decision-v1';
}

/**
 * Conservative decision layer for the current validated Engineering Core.
 *
 * This function intentionally does NOT infer concrete stability or blockage risk
 * from pressure margin, slump, rheology, or any undocumented threshold. Until a
 * validated stability/blockage evidence path is implemented, those domains stay
 * NOT_ASSESSED. A pressure PASS therefore means pressure-only feasibility, not a
 * full pumpability certification.
 */
export function assessPumpabilityDecision(run: SimulationRunResult): PumpabilityDecisionResult {
  const pressureFeasibility: PressureFeasibilityStatus = run.pumpAssessment?.status ?? 'INSUFFICIENT_DATA';

  const status: PumpabilityDecisionStatus =
    pressureFeasibility === 'FAIL'
      ? 'FAIL_PRESSURE'
      : pressureFeasibility === 'PASS'
        ? 'PRESSURE_ONLY_ACCEPTABLE'
        : 'INSUFFICIENT_DATA';

  return {
    runId: run.runId,
    pressureFeasibility,
    stability: 'NOT_ASSESSED',
    blockageRisk: 'NOT_ASSESSED',
    status,
    sourceMethodIds: [...run.methods],
    limitations: [
      'Pressure feasibility alone is not a complete pumpability assessment.',
      'Concrete stability is not assessed because no validated stability evidence/model contract is active in this version.',
      'Blockage risk is not assessed because no validated universal blockage model or project-calibrated blockage evidence contract is active in this version.',
      'No arbitrary safety factor, marginal band, slump threshold, or blockage threshold is introduced by this decision layer.',
    ],
    method: 'tolue-pumpability-decision-v1',
  };
}
