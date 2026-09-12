import type { SimulationInputProvenance, EngineeringInputProvenanceRecord } from './inputProvenance';

export type LubricationLayerQualificationMode =
  | 'MEASURED_TRIBOLOGY'
  | 'PROJECT_CALIBRATED'
  | 'VALIDATED_PREDICTION'
  | 'UNAVAILABLE';

export interface LubricationLayerQualificationInput {
  readonly mode: LubricationLayerQualificationMode;
  readonly rheologyEvidenceEntityId?: string;
  readonly thicknessEvidenceEntityId?: string;
  readonly methodId?: string;
  readonly referenceId?: string;
  readonly note?: string;
}

export interface LubricationLayerQualificationFinding {
  readonly severity: 'warning' | 'blocking';
  readonly ruleId: string;
  readonly message: string;
}

export interface LubricationLayerQualificationResult {
  readonly status: 'QUALIFIED' | 'PRELIMINARY' | 'BLOCKED';
  readonly findings: readonly LubricationLayerQualificationFinding[];
  readonly method: 'tolue-lubrication-layer-qualification-v1';
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function generatingActivityKind(record: EngineeringInputProvenanceRecord): string | null {
  return record.activities.find(activity => activity.id === record.evidence.generatedByActivityId)?.kind ?? null;
}

function checkBoundEvidence(
  label: 'rheology' | 'thickness',
  expectedEntityId: string | undefined,
  record: EngineeringInputProvenanceRecord | undefined,
  findings: LubricationLayerQualificationFinding[],
): void {
  if (!nonEmpty(expectedEntityId)) {
    findings.push({ severity: 'blocking', ruleId: `LLQ-${label.toUpperCase()}-ENTITY-001`, message: `Lubrication-layer ${label} qualification requires a provenance entity ID.` });
    return;
  }
  if (!record) {
    findings.push({ severity: 'blocking', ruleId: `LLQ-${label.toUpperCase()}-PROV-001`, message: `Lubrication-layer ${label} provenance is unavailable.` });
    return;
  }
  if (record.evidence.entityId !== expectedEntityId) {
    findings.push({ severity: 'blocking', ruleId: `LLQ-${label.toUpperCase()}-PROV-002`, message: `Lubrication-layer ${label} provenance entity does not match the qualification contract.` });
  }
  if (record.evidence.entityKind === 'engineering_assumption' || generatingActivityKind(record) === 'assumption') {
    findings.push({ severity: 'warning', ruleId: `LLQ-${label.toUpperCase()}-ASSUMED-001`, message: `Lubrication-layer ${label} is based on an engineering assumption and cannot support production-qualified prediction.` });
  }
}

export function assessLubricationLayerQualification(
  qualification: Readonly<LubricationLayerQualificationInput> | undefined,
  provenance: Readonly<SimulationInputProvenance> | undefined,
): Readonly<LubricationLayerQualificationResult> {
  const findings: LubricationLayerQualificationFinding[] = [];

  if (!qualification) {
    findings.push({ severity: 'warning', ruleId: 'LLQ-MODE-001', message: 'Lubrication-layer qualification mode is not declared; pressure prediction remains preliminary.' });
    return { status: 'PRELIMINARY', findings, method: 'tolue-lubrication-layer-qualification-v1' };
  }

  if (qualification.mode === 'UNAVAILABLE') {
    findings.push({ severity: 'blocking', ruleId: 'LLQ-UNAVAILABLE-001', message: 'Lubrication-layer data is declared unavailable; the current two-fluid pressure model must not execute as a physical pressure prediction.' });
    return { status: 'BLOCKED', findings, method: 'tolue-lubrication-layer-qualification-v1' };
  }

  if (!provenance) {
    findings.push({ severity: 'blocking', ruleId: 'LLQ-PROV-001', message: 'Declared lubrication-layer qualification requires structured provenance.' });
    return { status: 'BLOCKED', findings, method: 'tolue-lubrication-layer-qualification-v1' };
  }

  const rheologyRecord = provenance.lubricationLayerRheology;
  const thicknessRecord = provenance.lubricationLayerThickness;
  checkBoundEvidence('rheology', qualification.rheologyEvidenceEntityId, rheologyRecord, findings);
  checkBoundEvidence('thickness', qualification.thicknessEvidenceEntityId, thicknessRecord, findings);

  if (qualification.mode === 'PROJECT_CALIBRATED' || qualification.mode === 'VALIDATED_PREDICTION') {
    if (!nonEmpty(qualification.methodId)) findings.push({ severity: 'blocking', ruleId: 'LLQ-METHOD-001', message: `${qualification.mode} requires a controlled method ID.` });
    if (!nonEmpty(qualification.referenceId)) findings.push({ severity: 'blocking', ruleId: 'LLQ-REFERENCE-001', message: `${qualification.mode} requires a calibration/validation reference ID.` });
  }

  if (qualification.mode === 'MEASURED_TRIBOLOGY' && rheologyRecord) {
    const rheologyKind = generatingActivityKind(rheologyRecord);
    if (rheologyKind !== 'measurement' && rheologyKind !== 'calibration') {
      findings.push({ severity: 'warning', ruleId: 'LLQ-TRIBOLOGY-ACTIVITY-001', message: 'MEASURED_TRIBOLOGY should be bound to a measurement or calibration activity for lubrication-layer rheology.' });
    }
  }

  const blocked = findings.some(finding => finding.severity === 'blocking');
  const preliminary = findings.some(finding => finding.severity === 'warning');
  return {
    status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'QUALIFIED',
    findings,
    method: 'tolue-lubrication-layer-qualification-v1',
  };
}
