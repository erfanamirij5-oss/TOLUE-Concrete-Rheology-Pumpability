import type { EngineeringAnalysisResult } from './engineeringAnalysis';
import type { PumpabilityDecisionStatus, PressureFeasibilityStatus, EvidenceDomainStatus } from './pumpabilityDecision';

export interface EngineeringRunComparisonIdentity {
  readonly runId: string;
  readonly engineVersion: string;
  readonly inputSnapshotHash: string | null;
  readonly executionStatus: 'EXECUTED' | 'BLOCKED';
  readonly completeness: 'complete' | 'incomplete';
}

export interface ComparableScalar {
  readonly baseline: number | null;
  readonly candidate: number | null;
  readonly deltaCandidateMinusBaseline: number | null;
  readonly unit: 'm3/s' | 'Pa';
}

export interface EngineeringRunComparisonDecisionAxis {
  readonly baseline: PressureFeasibilityStatus | EvidenceDomainStatus | PumpabilityDecisionStatus | null;
  readonly candidate: PressureFeasibilityStatus | EvidenceDomainStatus | PumpabilityDecisionStatus | null;
}

export interface EngineeringRunComparisonResult {
  readonly baseline: Readonly<EngineeringRunComparisonIdentity>;
  readonly candidate: Readonly<EngineeringRunComparisonIdentity>;
  readonly targetFlowRate: Readonly<ComparableScalar>;
  readonly requiredPressure: Readonly<ComparableScalar>;
  readonly availablePressure: Readonly<ComparableScalar>;
  readonly pressureMargin: Readonly<ComparableScalar>;
  readonly pressureFeasibility: Readonly<EngineeringRunComparisonDecisionAxis>;
  readonly stability: Readonly<EngineeringRunComparisonDecisionAxis>;
  readonly blockageRisk: Readonly<EngineeringRunComparisonDecisionAxis>;
  readonly pumpabilityDecision: Readonly<EngineeringRunComparisonDecisionAxis>;
  readonly interpretationClaim: 'no_automatic_better_or_worse_inference';
  readonly method: 'tolue-engineering-run-comparison-v1';
}

function identity(result: Readonly<EngineeringAnalysisResult>): Readonly<EngineeringRunComparisonIdentity> {
  return Object.freeze({
    runId: result.runId,
    engineVersion: result.engineVersion,
    inputSnapshotHash: result.inputSnapshotHash,
    executionStatus: result.executionStatus,
    completeness: result.completeness,
  });
}

function scalar(baseline: number | null, candidate: number | null, unit: ComparableScalar['unit']): Readonly<ComparableScalar> {
  const delta = baseline !== null && candidate !== null ? candidate - baseline : null;
  return Object.freeze({ baseline, candidate, deltaCandidateMinusBaseline: delta, unit });
}

function decision(baseline: EngineeringRunComparisonDecisionAxis['baseline'], candidate: EngineeringRunComparisonDecisionAxis['candidate']): Readonly<EngineeringRunComparisonDecisionAxis> {
  return Object.freeze({ baseline, candidate });
}

export function compareEngineeringRuns(
  baseline: Readonly<EngineeringAnalysisResult>,
  candidate: Readonly<EngineeringAnalysisResult>,
): Readonly<EngineeringRunComparisonResult> {
  if (!baseline.runId.trim() || !candidate.runId.trim()) throw new Error('RUN-COMPARISON-ID-001');
  if (baseline.runId === candidate.runId) throw new Error('RUN-COMPARISON-DISTINCT-001');

  const baselinePump = baseline.executionStatus === 'EXECUTED' ? baseline.simulation.pumpAssessment : null;
  const candidatePump = candidate.executionStatus === 'EXECUTED' ? candidate.simulation.pumpAssessment : null;
  const baselineDecision = baseline.executionStatus === 'EXECUTED' ? baseline.pumpabilityDecision : null;
  const candidateDecision = candidate.executionStatus === 'EXECUTED' ? candidate.pumpabilityDecision : null;

  return Object.freeze({
    baseline: identity(baseline),
    candidate: identity(candidate),
    targetFlowRate: scalar(
      baseline.executionStatus === 'EXECUTED' ? baseline.simulation.inputSnapshot.pipeline.targetFlowRateM3s : null,
      candidate.executionStatus === 'EXECUTED' ? candidate.simulation.inputSnapshot.pipeline.targetFlowRateM3s : null,
      'm3/s',
    ),
    requiredPressure: scalar(baselinePump?.requiredPressurePa ?? null, candidatePump?.requiredPressurePa ?? null, 'Pa'),
    availablePressure: scalar(baselinePump?.availablePressurePa ?? null, candidatePump?.availablePressurePa ?? null, 'Pa'),
    pressureMargin: scalar(baselinePump?.pressureMarginPa ?? null, candidatePump?.pressureMarginPa ?? null, 'Pa'),
    pressureFeasibility: decision(baselineDecision?.pressureFeasibility ?? null, candidateDecision?.pressureFeasibility ?? null),
    stability: decision(baselineDecision?.stability ?? null, candidateDecision?.stability ?? null),
    blockageRisk: decision(baselineDecision?.blockageRisk ?? null, candidateDecision?.blockageRisk ?? null),
    pumpabilityDecision: decision(baselineDecision?.status ?? null, candidateDecision?.status ?? null),
    interpretationClaim: 'no_automatic_better_or_worse_inference',
    method: 'tolue-engineering-run-comparison-v1',
  });
}
