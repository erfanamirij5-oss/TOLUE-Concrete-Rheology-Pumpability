export type ProvenanceEntityKind =
  | 'measurement_result'
  | 'derived_result'
  | 'manufacturer_data'
  | 'engineering_assumption';

export type ProvenanceActivityKind =
  | 'measurement'
  | 'calibration'
  | 'derivation'
  | 'manufacturer_declaration'
  | 'assumption';

export type ProvenanceAgentKind = 'person' | 'organization' | 'equipment' | 'software';

export interface ProvenanceAgent {
  id: string;
  kind: ProvenanceAgentKind;
  label?: string;
}

export interface MeasurementUncertainty {
  standardUncertainty?: number;
  expandedUncertainty?: number;
  coverageFactor?: number;
  unit?: string;
  evaluationMethodId?: string;
}

export interface CalibrationLink {
  calibrationId: string;
  referenceId: string;
  calibratedAtIso?: string;
  uncertainty?: MeasurementUncertainty;
}

export interface ProvenanceActivity {
  id: string;
  kind: ProvenanceActivityKind;
  methodId?: string;
  standardEditionIds?: string[];
  startedAtIso?: string;
  endedAtIso?: string;
  agentIds?: string[];
  calibrationChain?: CalibrationLink[];
}

export interface EngineeringInputEvidence {
  entityId: string;
  entityKind: ProvenanceEntityKind;
  generatedByActivityId: string;
  sourceEntityIds?: string[];
  referenceIds?: string[];
  sourceDocumentId?: string;
  uncertainty?: MeasurementUncertainty;
  note?: string;
}

export interface EngineeringInputProvenanceRecord {
  evidence: EngineeringInputEvidence;
  activities: ProvenanceActivity[];
  agents: ProvenanceAgent[];
}

export interface SimulationInputProvenance {
  bulkRheology: EngineeringInputProvenanceRecord;
  lubricationLayerRheology: EngineeringInputProvenanceRecord;
  lubricationLayerThickness: EngineeringInputProvenanceRecord;
  pumpCapability: EngineeringInputProvenanceRecord;
}

export type InputEvidenceField = keyof SimulationInputProvenance;

export interface InputEvidenceFinding {
  field: InputEvidenceField;
  severity: 'warning' | 'blocking';
  ruleId: string;
  message: string;
}

export interface InputEvidenceAssessment {
  status: 'DOCUMENTED' | 'PRELIMINARY' | 'BLOCKED';
  findings: InputEvidenceFinding[];
  method: 'tolue-input-provenance-v2';
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function invalidOptionalIso(value: string | undefined): boolean {
  return value !== undefined && !Number.isFinite(Date.parse(value));
}

/**
 * Audits provenance lineage and metadata completeness only. DOCUMENTED means
 * that the lineage is structurally documented; it is deliberately not a claim
 * that the numerical value is physically valid, accurate, traceable to SI, or
 * fit for purpose. Those claims require separate scientific/metrological checks.
 */
export function assessInputEvidence(provenance: SimulationInputProvenance): InputEvidenceAssessment {
  const findings: InputEvidenceFinding[] = [];
  const warn = (field: InputEvidenceField, ruleId: string, message: string) =>
    findings.push({ field, severity: 'warning', ruleId, message });
  const block = (field: InputEvidenceField, ruleId: string, message: string) =>
    findings.push({ field, severity: 'blocking', ruleId, message });

  for (const field of Object.keys(provenance) as InputEvidenceField[]) {
    const record = provenance[field];
    const evidence = record.evidence;

    if (!nonEmpty(evidence.entityId) || !nonEmpty(evidence.generatedByActivityId)) {
      block(field, 'PROV-LINEAGE-001', `${field}: entity and generating activity IDs are required.`);
      continue;
    }

    const activityIds = new Set(record.activities.map(activity => activity.id));
    if (activityIds.size !== record.activities.length || record.activities.some(activity => !nonEmpty(activity.id))) {
      block(field, 'PROV-LINEAGE-002', `${field}: activity IDs must be non-empty and unique.`);
    }

    const generatingActivity = record.activities.find(activity => activity.id === evidence.generatedByActivityId);
    if (!generatingActivity) {
      block(field, 'PROV-LINEAGE-003', `${field}: generatedByActivityId must resolve to a recorded activity.`);
      continue;
    }

    const agentIds = new Set(record.agents.map(agent => agent.id));
    if (agentIds.size !== record.agents.length || record.agents.some(agent => !nonEmpty(agent.id))) {
      block(field, 'PROV-LINEAGE-004', `${field}: agent IDs must be non-empty and unique.`);
    }

    for (const activity of record.activities) {
      if (invalidOptionalIso(activity.startedAtIso) || invalidOptionalIso(activity.endedAtIso)) {
        block(field, 'PROV-TIME-001', `${field}: activity timestamps must be valid ISO date/time values when supplied.`);
      }
      if (activity.startedAtIso && activity.endedAtIso && Date.parse(activity.startedAtIso) > Date.parse(activity.endedAtIso)) {
        block(field, 'PROV-TIME-002', `${field}: activity start time cannot be after end time.`);
      }
      for (const agentId of activity.agentIds ?? []) {
        if (!agentIds.has(agentId)) block(field, 'PROV-AGENT-001', `${field}: activity references unknown agent '${agentId}'.`);
      }
      for (const link of activity.calibrationChain ?? []) {
        if (!nonEmpty(link.calibrationId) || !nonEmpty(link.referenceId)) {
          block(field, 'PROV-CAL-001', `${field}: calibration links require calibration and reference IDs.`);
        }
        if (invalidOptionalIso(link.calibratedAtIso)) {
          block(field, 'PROV-CAL-002', `${field}: calibration timestamps must be valid ISO date/time values when supplied.`);
        }
      }
    }

    if (evidence.entityKind === 'engineering_assumption' || generatingActivity.kind === 'assumption') {
      warn(field, 'PROV-ASSUMPTION-001', `${field}: value is an engineering assumption and must remain preliminary.`);
    }

    if (generatingActivity.kind === 'measurement') {
      if (!nonEmpty(generatingActivity.methodId)) warn(field, 'PROV-MEAS-001', `${field}: measurement activity should identify its method.`);
      if ((generatingActivity.agentIds ?? []).length === 0) warn(field, 'PROV-MEAS-002', `${field}: measurement activity should identify responsible equipment/person/software.`);
      if (!evidence.uncertainty) warn(field, 'PROV-MEAS-003', `${field}: measurement result has no documented uncertainty; no metrological traceability claim may be inferred.`);
    }

    if (generatingActivity.kind === 'derivation' && (evidence.sourceEntityIds ?? []).length === 0) {
      warn(field, 'PROV-DERIVE-001', `${field}: derived result should identify its source entities.`);
    }

    if (evidence.entityKind === 'manufacturer_data' && !nonEmpty(evidence.sourceDocumentId)) {
      warn(field, 'PROV-MFR-001', `${field}: manufacturer data should identify the source document and version.`);
    }
  }

  const blocked = findings.some(f => f.severity === 'blocking');
  const preliminary = findings.some(f => f.severity === 'warning');
  return {
    status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'DOCUMENTED',
    findings,
    method: 'tolue-input-provenance-v2',
  };
}
