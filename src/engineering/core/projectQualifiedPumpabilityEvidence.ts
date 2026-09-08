export type PumpabilityEvidenceDomain = 'stability' | 'blockage';
export type QualifiedEvidenceOutcome = 'ACCEPTABLE' | 'UNACCEPTABLE';

export interface ProjectQualifiedPumpabilityEvidenceInput {
  domain: PumpabilityEvidenceDomain;
  projectId: string;
  evidenceId: string;
  provenanceEntityId: string;
  methodId: string;
  referenceIds: string[];
  outcome: QualifiedEvidenceOutcome;
  qualifiedFlowRangeM3s: {
    min: number;
    max: number;
  };
  targetFlowRateM3s: number;
  applicabilityStatement: string;
  limitations: string[];
}

export interface ProjectQualifiedPumpabilityEvidenceResult {
  domain: PumpabilityEvidenceDomain;
  status: 'APPLICABLE' | 'OUT_OF_DOMAIN';
  outcome: QualifiedEvidenceOutcome | null;
  projectId: string;
  evidenceId: string;
  provenanceEntityId: string;
  methodId: string;
  referenceIds: string[];
  targetFlowRateM3s: number;
  qualifiedFlowRangeM3s: { min: number; max: number };
  applicabilityStatement: string;
  limitations: string[];
  method: 'tolue-project-qualified-pumpability-evidence-v1';
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates whether project-qualified evidence can be applied at the requested
 * flow. This is an evidence-domain gate, not a universal stability/blockage
 * model. It does not extrapolate, compute a probability, or infer an outcome
 * from unrelated hydraulic/rheology variables.
 */
export function evaluateProjectQualifiedPumpabilityEvidence(
  input: ProjectQualifiedPumpabilityEvidenceInput,
): ProjectQualifiedPumpabilityEvidenceResult {
  if (!nonEmpty(input.projectId)) throw new Error('projectId must not be empty');
  if (!nonEmpty(input.evidenceId)) throw new Error('evidenceId must not be empty');
  if (!nonEmpty(input.provenanceEntityId)) throw new Error('provenanceEntityId must not be empty');
  if (!nonEmpty(input.methodId)) throw new Error('methodId must not be empty');
  if (!nonEmpty(input.applicabilityStatement)) throw new Error('applicabilityStatement must not be empty');
  if (input.referenceIds.some(id => !nonEmpty(id))) throw new Error('referenceIds must not contain empty IDs');
  if (input.limitations.some(text => !nonEmpty(text))) throw new Error('limitations must not contain empty values');

  const { min, max } = input.qualifiedFlowRangeM3s;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    throw new Error('qualified flow range must be finite, non-negative, and ordered');
  }
  if (!Number.isFinite(input.targetFlowRateM3s) || input.targetFlowRateM3s < 0) {
    throw new Error('targetFlowRateM3s must be finite and non-negative');
  }

  const inDomain = input.targetFlowRateM3s >= min && input.targetFlowRateM3s <= max;
  return {
    domain: input.domain,
    status: inDomain ? 'APPLICABLE' : 'OUT_OF_DOMAIN',
    outcome: inDomain ? input.outcome : null,
    projectId: input.projectId,
    evidenceId: input.evidenceId,
    provenanceEntityId: input.provenanceEntityId,
    methodId: input.methodId,
    referenceIds: [...input.referenceIds],
    targetFlowRateM3s: input.targetFlowRateM3s,
    qualifiedFlowRangeM3s: { min, max },
    applicabilityStatement: input.applicabilityStatement,
    limitations: [...input.limitations],
    method: 'tolue-project-qualified-pumpability-evidence-v1',
  };
}
