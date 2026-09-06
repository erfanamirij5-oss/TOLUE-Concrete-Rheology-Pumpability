export type EngineeringInputProvenanceKind =
  | 'measured'
  | 'calibrated'
  | 'manufacturer'
  | 'assumed';

export interface EngineeringInputEvidence {
  provenance: EngineeringInputProvenanceKind;
  methodId?: string;
  referenceIds?: string[];
  standardEditionIds?: string[];
  measuredAtIso?: string;
  equipmentId?: string;
  calibrationId?: string;
  sourceDocumentId?: string;
  note?: string;
}

export interface SimulationInputProvenance {
  bulkRheology: EngineeringInputEvidence;
  lubricationLayerRheology: EngineeringInputEvidence;
  lubricationLayerThickness: EngineeringInputEvidence;
  pumpCapability: EngineeringInputEvidence;
}

export type InputEvidenceField = keyof SimulationInputProvenance;

export interface InputEvidenceFinding {
  field: InputEvidenceField;
  severity: 'warning' | 'blocking';
  ruleId: string;
  message: string;
}

export interface InputEvidenceAssessment {
  status: 'VERIFIED' | 'PRELIMINARY' | 'BLOCKED';
  findings: InputEvidenceFinding[];
  method: 'tolue-input-evidence-contract-v1';
}

function validIso(value: string | undefined): boolean {
  return value !== undefined && Number.isFinite(Date.parse(value));
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

/**
 * Audits provenance metadata only. It does not judge the physical validity of
 * the supplied numerical value and introduces no empirical engineering rule.
 */
export function assessInputEvidence(provenance: SimulationInputProvenance): InputEvidenceAssessment {
  const findings: InputEvidenceFinding[] = [];
  const warn = (field: InputEvidenceField, ruleId: string, message: string) =>
    findings.push({ field, severity: 'warning', ruleId, message });
  const block = (field: InputEvidenceField, ruleId: string, message: string) =>
    findings.push({ field, severity: 'blocking', ruleId, message });

  for (const field of Object.keys(provenance) as InputEvidenceField[]) {
    const evidence = provenance[field];

    if (evidence.measuredAtIso !== undefined && !validIso(evidence.measuredAtIso)) {
      block(field, 'PROV-META-001', `${field}: measuredAtIso must be a valid ISO date/time when supplied.`);
    }

    if (evidence.provenance === 'assumed') {
      warn(field, 'PROV-ASSUMED-001', `${field}: value is explicitly assumed and must remain preliminary.`);
      continue;
    }

    if (evidence.provenance === 'measured') {
      if (!nonEmpty(evidence.methodId)) {
        warn(field, 'PROV-MEASURED-001', `${field}: measured evidence should identify the measurement method.`);
      }
      if (!validIso(evidence.measuredAtIso)) {
        warn(field, 'PROV-MEASURED-002', `${field}: measured evidence should identify the measurement date/time.`);
      }
    }

    if (evidence.provenance === 'calibrated') {
      if (!nonEmpty(evidence.calibrationId) && !nonEmpty(evidence.methodId)) {
        warn(field, 'PROV-CALIBRATED-001', `${field}: calibrated evidence should identify a calibration or method ID.`);
      }
    }

    if (evidence.provenance === 'manufacturer') {
      if (!nonEmpty(evidence.sourceDocumentId)) {
        warn(field, 'PROV-MANUFACTURER-001', `${field}: manufacturer evidence should identify its source document.`);
      }
    }
  }

  const blocked = findings.some(f => f.severity === 'blocking');
  const preliminary = findings.some(f => f.severity === 'warning');
  return {
    status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'VERIFIED',
    findings,
    method: 'tolue-input-evidence-contract-v1',
  };
}
