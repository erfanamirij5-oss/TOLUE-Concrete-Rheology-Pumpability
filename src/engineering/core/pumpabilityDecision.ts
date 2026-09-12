import {
  ProjectQualifiedPumpabilityEvidenceResult,
  evaluateProjectQualifiedPumpabilityEvidence,
} from './projectQualifiedPumpabilityEvidence';
import {
  assessPumpabilityRiskScreening,
  type PumpabilityRiskScreeningResult,
  type PumpabilityRiskScreenStatus,
} from './pumpabilityRiskScreening';
import { PumpabilityEvidenceSetInput, SimulationRunResult } from './simulationRun';

export type PressureFeasibilityStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_DATA';
export type EvidenceDomainStatus =
  | 'NOT_ASSESSED'
  | 'OUT_OF_DOMAIN'
  | 'ACCEPTABLE'
  | 'UNACCEPTABLE';

export type PumpabilityDecisionBasis =
  | 'PROJECT_QUALIFIED_EVIDENCE'
  | 'ENGINEERING_SCREENING'
  | 'OUT_OF_DOMAIN_PROJECT_EVIDENCE'
  | 'NOT_ASSESSED';

export type PumpabilityDecisionStatus =
  | 'PROJECT_QUALIFIED_ACCEPTABLE'
  | 'SCREENED_ACCEPTABLE'
  | 'PARTIALLY_QUALIFIED_ACCEPTABLE'
  | 'PARTIALLY_SCREENED_ACCEPTABLE'
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
  stabilityBasis: PumpabilityDecisionBasis;
  blockageBasis: PumpabilityDecisionBasis;
  stabilityEvidence: ProjectQualifiedPumpabilityEvidenceResult | null;
  blockageEvidence: ProjectQualifiedPumpabilityEvidenceResult | null;
  riskScreening: PumpabilityRiskScreeningResult | null;
  status: PumpabilityDecisionStatus;
  sourceMethodIds: string[];
  limitations: string[];
  method: 'tolue-pumpability-decision-v3';
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

function projectDomainStatus(result: ProjectQualifiedPumpabilityEvidenceResult | null): EvidenceDomainStatus {
  if (!result) return 'NOT_ASSESSED';
  if (result.status === 'OUT_OF_DOMAIN') return 'OUT_OF_DOMAIN';
  return result.outcome ?? 'NOT_ASSESSED';
}

function resolveDomain(
  projectEvidence: ProjectQualifiedPumpabilityEvidenceResult | null,
  screenStatus: PumpabilityRiskScreenStatus | undefined,
): { status: EvidenceDomainStatus; basis: PumpabilityDecisionBasis } {
  const projectStatus = projectDomainStatus(projectEvidence);
  if (projectStatus === 'ACCEPTABLE' || projectStatus === 'UNACCEPTABLE') {
    return { status: projectStatus, basis: 'PROJECT_QUALIFIED_EVIDENCE' };
  }
  if (screenStatus === 'ACCEPTABLE' || screenStatus === 'UNACCEPTABLE') {
    return { status: screenStatus, basis: 'ENGINEERING_SCREENING' };
  }
  if (projectStatus === 'OUT_OF_DOMAIN') {
    return { status: 'OUT_OF_DOMAIN', basis: 'OUT_OF_DOMAIN_PROJECT_EVIDENCE' };
  }
  return { status: 'NOT_ASSESSED', basis: 'NOT_ASSESSED' };
}

/**
 * Three-axis pumpability decision layer:
 * pressure feasibility + stability + blockage risk.
 *
 * Explicit in-domain project-qualified evidence has priority. When such evidence
 * is absent or out of domain, the engine can use transparent, separately
 * traceable engineering screening results. Screening is never promoted to
 * project-qualified evidence and is never represented as a universal safety
 * certification.
 */
export function assessPumpabilityDecision(run: SimulationRunResult): PumpabilityDecisionResult {
  const pressureFeasibility: PressureFeasibilityStatus = run.pumpAssessment?.status ?? 'INSUFFICIENT_DATA';
  const evidence = run.inputSnapshot.pumpabilityEvidence;
  const stabilityEvidence = evaluateDomain(run, 'stability', evidence?.stability);
  const blockageEvidence = evaluateDomain(run, 'blockage', evidence?.blockage);
  const riskScreening = run.inputSnapshot.pumpabilityRiskScreening
    ? assessPumpabilityRiskScreening(run.inputSnapshot.pipeline, run.inputSnapshot.pumpabilityRiskScreening)
    : null;

  const stabilityResolved = resolveDomain(stabilityEvidence, riskScreening?.stability.status);
  const blockageResolved = resolveDomain(blockageEvidence, riskScreening?.blockage.status);
  const stability = stabilityResolved.status;
  const blockageRisk = blockageResolved.status;

  let status: PumpabilityDecisionStatus;
  if (pressureFeasibility === 'INSUFFICIENT_DATA') status = 'INSUFFICIENT_DATA';
  else if (pressureFeasibility === 'FAIL') status = 'FAIL_PRESSURE';
  else if (stability === 'UNACCEPTABLE') status = 'FAIL_STABILITY';
  else if (blockageRisk === 'UNACCEPTABLE') status = 'FAIL_BLOCKAGE';
  else if (stability === 'ACCEPTABLE' && blockageRisk === 'ACCEPTABLE') {
    status = stabilityResolved.basis === 'PROJECT_QUALIFIED_EVIDENCE' && blockageResolved.basis === 'PROJECT_QUALIFIED_EVIDENCE'
      ? 'PROJECT_QUALIFIED_ACCEPTABLE'
      : 'SCREENED_ACCEPTABLE';
  } else if (stability === 'ACCEPTABLE' || blockageRisk === 'ACCEPTABLE') {
    status = stabilityResolved.basis === 'PROJECT_QUALIFIED_EVIDENCE' || blockageResolved.basis === 'PROJECT_QUALIFIED_EVIDENCE'
      ? 'PARTIALLY_QUALIFIED_ACCEPTABLE'
      : 'PARTIALLY_SCREENED_ACCEPTABLE';
  } else status = 'PRESSURE_ONLY_ACCEPTABLE';

  const evidenceMethods: string[] = [];
  if (stabilityEvidence) evidenceMethods.push(stabilityEvidence.method);
  if (blockageEvidence) evidenceMethods.push(blockageEvidence.method);
  if (riskScreening) evidenceMethods.push(riskScreening.method, riskScreening.stability.method, riskScreening.blockage.method);

  return {
    runId: run.runId,
    pressureFeasibility,
    stability,
    blockageRisk,
    stabilityBasis: stabilityResolved.basis,
    blockageBasis: blockageResolved.basis,
    stabilityEvidence,
    blockageEvidence,
    riskScreening,
    status,
    sourceMethodIds: [...new Set<string>([...run.methods, ...evidenceMethods])],
    limitations: [
      'Pressure feasibility alone is not a complete pumpability assessment.',
      'Project-qualified evidence has priority over engineering screening when valid in the current flow domain.',
      'Engineering screening results are preliminary engineering checks and are not universal safety or pumpability certifications.',
      'OUT_OF_DOMAIN project evidence is not extrapolated; a separately traceable engineering screen may still be reported when its required inputs are available.',
      'No arbitrary hidden score, safety factor, or undocumented threshold is introduced by this decision layer.',
    ],
    method: 'tolue-pumpability-decision-v3',
  };
}
