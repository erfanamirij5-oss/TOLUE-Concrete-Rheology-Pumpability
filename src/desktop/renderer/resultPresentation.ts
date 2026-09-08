import type { EngineeringResult } from '../../engineering/core/engineeringResult';
import type { EngineeringResultCenter } from '../../engineering/core/resultCenter';
import type { PumpabilityDecisionResult } from '../../engineering/core/pumpabilityDecision';

export interface EngineeringResultPresentation {
  readonly id: string;
  readonly label: string;
  readonly value: EngineeringResult['value'];
  readonly unit: string | null;
  readonly resultClass: EngineeringResult['resultClass'];
  readonly validationStatus: EngineeringResult['validationStatus'];
  readonly evidenceStatus: EngineeringResult['evidenceStatus'];
  readonly methodId: string;
  readonly methodVersion: string;
  readonly applicability: string;
  readonly limitations: readonly string[];
  readonly provenanceEntityIds: readonly string[];
  readonly calibrationIds: readonly string[];
}

export interface ResultCenterPresentation {
  readonly runId: string;
  readonly engineVersion: string;
  readonly inputSnapshotHash: string;
  readonly completeness: EngineeringResultCenter['completeness'];
  readonly method: EngineeringResultCenter['method'];
  readonly warnings: readonly string[];
  readonly results: readonly Readonly<EngineeringResultPresentation>[];
  readonly pumpabilityDecision: Readonly<Pick<PumpabilityDecisionResult, 'pressureFeasibility' | 'stability' | 'blockageRisk' | 'status' | 'method'>> | null;
}

function presentResult(result: EngineeringResult): Readonly<EngineeringResultPresentation> {
  return Object.freeze({
    id: result.id,
    label: result.label,
    value: result.value,
    unit: result.unit,
    resultClass: result.resultClass,
    validationStatus: result.validationStatus,
    evidenceStatus: result.evidenceStatus,
    methodId: result.methodId,
    methodVersion: result.methodVersion,
    applicability: result.applicability,
    limitations: Object.freeze([...result.limitations]),
    provenanceEntityIds: Object.freeze([...(result.provenanceEntityIds ?? [])]),
    calibrationIds: Object.freeze([...(result.calibrationIds ?? [])]),
  });
}

export function createResultCenterPresentation(
  center: EngineeringResultCenter,
  decision?: PumpabilityDecisionResult,
): Readonly<ResultCenterPresentation> {
  const pumpabilityDecision = decision ? Object.freeze({
    pressureFeasibility: decision.pressureFeasibility,
    stability: decision.stability,
    blockageRisk: decision.blockageRisk,
    status: decision.status,
    method: decision.method,
  }) : null;

  return Object.freeze({
    runId: center.runId,
    engineVersion: center.engineVersion,
    inputSnapshotHash: center.inputSnapshotHash,
    completeness: center.completeness,
    method: center.method,
    warnings: Object.freeze([...center.warnings]),
    results: Object.freeze(center.results.map(presentResult)),
    pumpabilityDecision,
  });
}
