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

export interface ProvenanceAgent { id: string; kind: ProvenanceAgentKind; label?: string; }
export interface MeasurementUncertainty { standardUncertainty?: number; expandedUncertainty?: number; coverageFactor?: number; unit?: string; evaluationMethodId?: string; }
export interface CalibrationLink { calibrationId: string; referenceId: string; calibratedAtIso?: string; uncertainty?: MeasurementUncertainty; }
export interface ProvenanceActivity { id: string; kind: ProvenanceActivityKind; methodId?: string; standardEditionIds?: string[]; startedAtIso?: string; endedAtIso?: string; agentIds?: string[]; calibrationChain?: CalibrationLink[]; }
export interface EngineeringInputEvidence { entityId: string; entityKind: ProvenanceEntityKind; generatedByActivityId: string; sourceEntityIds?: string[]; referenceIds?: string[]; sourceDocumentId?: string; uncertainty?: MeasurementUncertainty; note?: string; }
export interface EngineeringInputProvenanceRecord { evidence: EngineeringInputEvidence; activities: ProvenanceActivity[]; agents: ProvenanceAgent[]; }

/**
 * Provenance is intentionally incremental. Missing records mean "not authored yet"
 * and must never be auto-filled with synthetic lineage.
 */
export interface SimulationInputProvenance {
  bulkRheology?: EngineeringInputProvenanceRecord;
  lubricationLayerRheology?: EngineeringInputProvenanceRecord;
  lubricationLayerThickness?: EngineeringInputProvenanceRecord;
  pumpCapability?: EngineeringInputProvenanceRecord;
  localLossCalibrations?: Record<string, EngineeringInputProvenanceRecord>;
}

export type CoreInputEvidenceField = 'bulkRheology' | 'lubricationLayerRheology' | 'lubricationLayerThickness' | 'pumpCapability';
export type InputEvidenceField = CoreInputEvidenceField | `localLossCalibrations.${string}`;
export interface InputEvidenceFinding { field: InputEvidenceField; severity: 'warning' | 'blocking'; ruleId: string; message: string; }
export interface InputEvidenceAssessment { status: 'DOCUMENTED' | 'PRELIMINARY' | 'BLOCKED'; findings: InputEvidenceFinding[]; method: 'tolue-input-provenance-v3'; }

function nonEmpty(value: string | undefined): boolean { return value !== undefined && value.trim().length > 0; }
function invalidOptionalIso(value: string | undefined): boolean { return value !== undefined && !Number.isFinite(Date.parse(value)); }

function assessRecord(field: InputEvidenceField, record: EngineeringInputProvenanceRecord, findings: InputEvidenceFinding[]): void {
  const warn = (ruleId: string, message: string) => findings.push({ field, severity: 'warning', ruleId, message });
  const block = (ruleId: string, message: string) => findings.push({ field, severity: 'blocking', ruleId, message });
  const evidence = record.evidence;
  if (!nonEmpty(evidence.entityId) || !nonEmpty(evidence.generatedByActivityId)) { block('PROV-LINEAGE-001', `${field}: entity and generating activity IDs are required.`); return; }
  const activityIds = new Set(record.activities.map(activity => activity.id));
  if (activityIds.size !== record.activities.length || record.activities.some(activity => !nonEmpty(activity.id))) block('PROV-LINEAGE-002', `${field}: activity IDs must be non-empty and unique.`);
  const generatingActivity = record.activities.find(activity => activity.id === evidence.generatedByActivityId);
  if (!generatingActivity) { block('PROV-LINEAGE-003', `${field}: generatedByActivityId must resolve to a recorded activity.`); return; }
  const agentIds = new Set(record.agents.map(agent => agent.id));
  if (agentIds.size !== record.agents.length || record.agents.some(agent => !nonEmpty(agent.id))) block('PROV-LINEAGE-004', `${field}: agent IDs must be non-empty and unique.`);
  for (const activity of record.activities) {
    if (invalidOptionalIso(activity.startedAtIso) || invalidOptionalIso(activity.endedAtIso)) block('PROV-TIME-001', `${field}: activity timestamps must be valid ISO date/time values when supplied.`);
    if (activity.startedAtIso && activity.endedAtIso && Date.parse(activity.startedAtIso) > Date.parse(activity.endedAtIso)) block('PROV-TIME-002', `${field}: activity start time cannot be after end time.`);
    for (const agentId of activity.agentIds ?? []) if (!agentIds.has(agentId)) block('PROV-AGENT-001', `${field}: activity references unknown agent '${agentId}'.`);
    for (const link of activity.calibrationChain ?? []) {
      if (!nonEmpty(link.calibrationId) || !nonEmpty(link.referenceId)) block('PROV-CAL-001', `${field}: calibration links require calibration and reference IDs.`);
      if (invalidOptionalIso(link.calibratedAtIso)) block('PROV-CAL-002', `${field}: calibration timestamps must be valid ISO date/time values when supplied.`);
    }
  }
  if (evidence.entityKind === 'engineering_assumption' || generatingActivity.kind === 'assumption') warn('PROV-ASSUMPTION-001', `${field}: value is an engineering assumption and must remain preliminary.`);
  if (generatingActivity.kind === 'measurement') {
    if (!nonEmpty(generatingActivity.methodId)) warn('PROV-MEAS-001', `${field}: measurement activity should identify its method.`);
    if ((generatingActivity.agentIds ?? []).length === 0) warn('PROV-MEAS-002', `${field}: measurement activity should identify responsible equipment/person/software.`);
    if (!evidence.uncertainty) warn('PROV-MEAS-003', `${field}: measurement result has no documented uncertainty; no metrological traceability claim may be inferred.`);
  }
  if (generatingActivity.kind === 'derivation' && (evidence.sourceEntityIds ?? []).length === 0) warn('PROV-DERIVE-001', `${field}: derived result should identify its source entities.`);
  if (evidence.entityKind === 'manufacturer_data' && !nonEmpty(evidence.sourceDocumentId)) warn('PROV-MFR-001', `${field}: manufacturer data should identify the source document and version.`);
}

export function assessInputEvidence(provenance: SimulationInputProvenance): InputEvidenceAssessment {
  const findings: InputEvidenceFinding[] = [];
  const coreFields: CoreInputEvidenceField[] = ['bulkRheology','lubricationLayerRheology','lubricationLayerThickness','pumpCapability'];
  for (const field of coreFields) {
    const record = provenance[field];
    if (!record) findings.push({ field, severity: 'warning', ruleId: 'PROV-MISSING-001', message: `${field}: structured provenance has not been authored.` });
    else assessRecord(field, record, findings);
  }
  for (const [entityId, record] of Object.entries(provenance.localLossCalibrations ?? {})) {
    const field: InputEvidenceField = `localLossCalibrations.${entityId}`;
    if (!nonEmpty(entityId)) { findings.push({ field, severity: 'blocking', ruleId: 'PROV-LOCAL-001', message: `${field}: local-loss provenance map key must be non-empty.` }); continue; }
    if (record.evidence.entityId !== entityId) findings.push({ field, severity: 'blocking', ruleId: 'PROV-LOCAL-002', message: `${field}: map key must exactly match evidence.entityId.` });
    assessRecord(field, record, findings);
  }
  const blocked = findings.some(f => f.severity === 'blocking');
  const preliminary = findings.some(f => f.severity === 'warning');
  return { status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'DOCUMENTED', findings, method: 'tolue-input-provenance-v3' };
}
