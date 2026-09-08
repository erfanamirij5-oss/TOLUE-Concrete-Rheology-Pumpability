import type { ProjectQualifiedPumpabilityEvidenceResult } from '../../engineering/core/projectQualifiedPumpabilityEvidence';

export interface PumpabilityEvidencePresentation {
  readonly domain: ProjectQualifiedPumpabilityEvidenceResult['domain'];
  readonly status: ProjectQualifiedPumpabilityEvidenceResult['status'];
  readonly outcome: ProjectQualifiedPumpabilityEvidenceResult['outcome'];
  readonly projectId: string;
  readonly evidenceId: string;
  readonly provenanceEntityId: string;
  readonly methodId: string;
  readonly referenceIds: readonly string[];
  readonly targetFlowRateM3s: number;
  readonly qualifiedFlowRangeM3s: Readonly<{ min: number; max: number }>;
  readonly applicabilityStatement: string;
  readonly limitations: readonly string[];
  readonly method: ProjectQualifiedPumpabilityEvidenceResult['method'];
}

export function createEvidencePresentation(
  result: ProjectQualifiedPumpabilityEvidenceResult,
): Readonly<PumpabilityEvidencePresentation> {
  return Object.freeze({
    domain: result.domain,
    status: result.status,
    outcome: result.outcome,
    projectId: result.projectId,
    evidenceId: result.evidenceId,
    provenanceEntityId: result.provenanceEntityId,
    methodId: result.methodId,
    referenceIds: Object.freeze([...result.referenceIds]),
    targetFlowRateM3s: result.targetFlowRateM3s,
    qualifiedFlowRangeM3s: Object.freeze({ ...result.qualifiedFlowRangeM3s }),
    applicabilityStatement: result.applicabilityStatement,
    limitations: Object.freeze([...result.limitations]),
    method: result.method,
  });
}
