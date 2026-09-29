import type { PumpabilityEvidenceDomain, QualifiedEvidenceOutcome } from '../../engineering/core/projectQualifiedPumpabilityEvidence';
import { evaluateProjectQualifiedPumpabilityEvidence } from '../../engineering/core/projectQualifiedPumpabilityEvidence';
import type { PumpabilityEvidenceSetInput, SimulationRunInput } from '../../engineering/core/simulationRun';

export interface PumpabilityEvidenceDraftRecord {
  projectId: string;
  evidenceId: string;
  provenanceEntityId: string;
  methodId: string;
  referenceIds: string[];
  outcome: QualifiedEvidenceOutcome;
  qualifiedFlowRangeM3s: { min: number; max: number };
  applicabilityStatement: string;
  limitations: string[];
}

function fieldForDomain(domain: PumpabilityEvidenceDomain): keyof PumpabilityEvidenceSetInput {
  return domain === 'stability' ? 'stability' : 'blockage';
}

function normalizeStrings(values: readonly string[]): string[] {
  return values.map(value => value.trim()).filter(Boolean);
}

/**
 * Stores only explicitly authored project-qualified evidence. The helper calls
 * the Core evidence evaluator before mutating the draft so malformed evidence
 * cannot be persisted and later fail during the pumpability-decision stage.
 * OUT_OF_DOMAIN is valid evidence state and is intentionally not rejected.
 */
export function setPumpabilityEvidenceDraft(
  input: Readonly<SimulationRunInput>,
  domain: PumpabilityEvidenceDomain,
  draft: Readonly<PumpabilityEvidenceDraftRecord>,
): Readonly<SimulationRunInput> {
  const record: PumpabilityEvidenceDraftRecord = {
    projectId: draft.projectId.trim(),
    evidenceId: draft.evidenceId.trim(),
    provenanceEntityId: draft.provenanceEntityId.trim(),
    methodId: draft.methodId.trim(),
    referenceIds: normalizeStrings(draft.referenceIds),
    outcome: draft.outcome,
    qualifiedFlowRangeM3s: { ...draft.qualifiedFlowRangeM3s },
    applicabilityStatement: draft.applicabilityStatement.trim(),
    limitations: normalizeStrings(draft.limitations),
  };

  evaluateProjectQualifiedPumpabilityEvidence({
    ...record,
    domain,
    targetFlowRateM3s: input.pipeline.targetFlowRateM3s,
  });

  const next = structuredClone(input) as SimulationRunInput;
  next.pumpabilityEvidence ??= {};
  next.pumpabilityEvidence[fieldForDomain(domain)] = record;
  return Object.freeze(next);
}

export function removePumpabilityEvidenceDraft(
  input: Readonly<SimulationRunInput>,
  domain: PumpabilityEvidenceDomain,
): Readonly<SimulationRunInput> {
  const next = structuredClone(input) as SimulationRunInput;
  if (!next.pumpabilityEvidence) return Object.freeze(next);
  delete next.pumpabilityEvidence[fieldForDomain(domain)];
  if (!next.pumpabilityEvidence.stability && !next.pumpabilityEvidence.blockage) delete next.pumpabilityEvidence;
  return Object.freeze(next);
}

export function getPumpabilityEvidenceDraft(
  input: Readonly<SimulationRunInput>,
  domain: PumpabilityEvidenceDomain,
): Readonly<PumpabilityEvidenceDraftRecord> | null {
  const source = input.pumpabilityEvidence?.[fieldForDomain(domain)];
  if (!source) return null;
  return Object.freeze({
    ...structuredClone(source),
    referenceIds: [...source.referenceIds],
    limitations: [...source.limitations],
    qualifiedFlowRangeM3s: { ...source.qualifiedFlowRangeM3s },
  });
}
