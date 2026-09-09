import {
  ProjectQualifiedPumpabilityEvidenceResult,
  evaluateProjectQualifiedPumpabilityEvidence,
} from './projectQualifiedPumpabilityEvidence';
import { PumpabilityEvidenceSetInput, SimulationRunResult } from './simulationRun';

export type PressureFeasibilityStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA';
export type EvidenceDomainStatus =
  | 'NOT_ASSESSED'
  | 'OUT_OF_DOMAIN'
  | 'ACCEPTABLE'
  | 'UNACCEPTABLE';

export type PumpabilityDecisionStatus =
  | 'PROJECT_QUALIFIED_ACCEPTABLE'
  | 'PARTIALLY_QUALIFIED_ACCEPTABLE'
  | 'PRESSURE_ONLY_ACCEPTABLE'
  | 'FAIL_PRESSURE'
  | 'FAIL_STABILITY'
  | 'FAIL_BLOCKAGE'
  | 'INSUFFICIENT_DATA';

export interface PumpabilityDecisionResult {
  runId: string;
  pressureFeasibility: PressureFeasibilityStatus;
  stability: EvidenceDomainStatus;
  blockageRisk: EvidenceDomainStatus;
  stabilityEvidence: ProjectQualifiedPumpabilityEvidenceResult | null;
  blockageEvidence: ProjectQualifiedPumpabilityEvidenceResult | null;
  status: PumpabilityDecisionStatus;
  sourceMethodIds: string[];
  limitations: string[];
  method: 'tolue-pumpability-decision-v2';
}

function evaluateDomain(
  run: SimulationRunResult,
  domain: 'stability' | 'blockage',
  evidence: PumpabilityEvidenceSetInput['stability'] | PumpabilityEvidenceSetInput['blockage'] | undefined,
): ProjectQualifiedPumpabilityEvidenceResult | null {
  if (!evidence) return null;
  return evaluateProjectQualifiedPumpabilityEvidence({
    ...evidence,
    domain,
    targetFlowRateM3s: run.inputSnapshot.pipeline.targetFlowRateM3s,
  });
}

function domainStatus(result: ProjectQualifiedPumpabilityEvidenceResult | null): EvidenceDomainStatus {
  if (!result) return 'NOT_ASSESSED';
  if (result.status === 'OUT_OF_DOMAIN') return 'OUT_OF_DOMAIN';
  return result.outcome ?? 'NOT_ASSESSED';
}

/**
 * Conservative three-axis pumpability decision layer:
 * pressure feasibility + project-qualified stability evidence +
 * project-qualified blockage evidence.
 *
 * Stability/blockage evidence is never inferred from hydraulic pressure,
 * rheology, slump, or undocumented thresholds. Project-qualified evidence is
 * accepted only inside its declared flow domain, and no extrapolation occurs.
 */
export function assessPumpabilityDecision(run: SimulationRunResult): PumpabilityDecisionResult {
  const pressureFeasibility: PressureFeasibilityStatus = run.pumpAssessment?.status ?? 'INSUFFICIENT_DATA';
  const evidence = run.inputSnapshot.pumpabilityEvidence;
  const stabilityEvidence = evaluateDomain(run, 'stability', evidence?.stability);
  const blockageEvidence = evaluateDomain(run, 'blockage', evidence?.blockage);
  const stability = domainStatus(stabilityEvidence);
  const blockageRisk = domainStatus(blockageEvidence);

  let status: PumpabilityDecisionStatus;
  if (pressureFeasibility === 'INSUFFICIENT_DATA') status = 'INSUFFICIENT_DATA';
  else if (pressureFeasibility === 'FAIL') status = 'FAIL_PRESSURE';
  else if (stability === 'UNACCEPTABLE') status = 'FAIL_STABILITY';
  else if (blockageRisk === 'UNACCEPTABLE') status = 'FAIL_BLOCKAGE';
  else if (stability === 'ACCEPTABLE' && blockageRisk === 'ACCEPTABLE') status = 'PROJECT_QUALIFIED_ACCEPTABLE';
  else if (stability === 'ACCEPTABLE' || blockageRisk === 'ACCEPTABLE') status = 'PARTIALLY_QUALIFIED_ACCEPTABLE';
  else status = 'PRESSURE_ONLY_ACCEPTABLE';

  const evidenceMethods: string[] = [];
  if (stabilityEvidence) evidenceMethods.push(stabilityEvidence.method);
  if (blockageEvidence) evidenceMethods.push(blockageEvidence.method);

  return {
    runId: run.runId,
    pressureFeasibility,
    stability,
    blockageRisk,
    stabilityEvidence,
    blockageEvidence,
    status,
    sourceMethodIds: [...new Set<string>([...run.methods, ...evidenceMethods])],
    limitations: [
      'Pressure feasibility alone is not a complete pumpability assessment.',
      'Stability and blockage conclusions are project-qualified evidence statements, not universal concrete behavior models.',
      'OUT_OF_DOMAIN evidence is not extrapolated and contributes no acceptable/unacceptable conclusion.',
      'No arbitrary safety factor, marginal band, slump threshold, stability threshold, or blockage threshold is introduced by this decision layer.',
    ],
    method: 'tolue-pumpability-decision-v2',
  };
}
