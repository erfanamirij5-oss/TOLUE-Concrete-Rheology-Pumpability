import type { EngineeringInputProvenanceRecord, ProvenanceActivityKind, ProvenanceEntityKind } from '../../engineering/core/inputProvenance';
import type { PumpCapabilityProvenance, PumpOperatingEnvelopeMetadata } from '../../engineering/core/pumpCapability';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export type RheologyInputPath = 'bulk.yieldStressPa' | 'bulk.plasticViscosityPaS' | 'lubricationLayer.yieldStressPa' | 'lubricationLayer.plasticViscosityPaS';
export type RheologyProvenanceField = 'bulkRheology' | 'lubricationLayerRheology';
export type PipelineScalarPath = 'targetFlowRateM3s' | 'densityKgM3' | 'lubricationLayerThicknessM';
export type StraightSegmentNumericField = 'lengthM' | 'pipeRadiusM' | 'elevationChangeM';
export type PumpCapabilityPointField = 'flowRateM3s' | 'availableConcretePressurePa';
export type PumpOperatingEnvelopeField = keyof PumpOperatingEnvelopeMetadata;

function finite(value: number): void { if (!Number.isFinite(value)) throw new Error('ENGINEERING-INPUT-DRAFT-NUMBER-001'); }

export function updateRheologyInputDraft(input: Readonly<SimulationRunInput>, path: RheologyInputPath, value: number): Readonly<SimulationRunInput> {
  finite(value);
  if (path.endsWith('yieldStressPa') && value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-YIELD-001');
  if (path.endsWith('plasticViscosityPaS') && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');
  const next = structuredClone(input) as SimulationRunInput;
  const [family, key] = path.split('.') as ['bulk' | 'lubricationLayer', 'yieldStressPa' | 'plasticViscosityPaS'];
  next.pipeline[family][key] = value;
  return Object.freeze(next);
}

export interface RheologyProvenanceDraftInput {
  entityId: string;
  entityKind: ProvenanceEntityKind;
  activityId: string;
  activityKind: ProvenanceActivityKind;
  methodId?: string;
  equipmentId?: string;
  equipmentLabel?: string;
  sourceDocumentId?: string;
  referenceId?: string;
  note?: string;
  expandedUncertainty?: number;
  uncertaintyUnit?: string;
}

export function setRheologyProvenanceDraft(input: Readonly<SimulationRunInput>, field: RheologyProvenanceField, draft: Readonly<RheologyProvenanceDraftInput>): Readonly<SimulationRunInput> {
  if (!draft.entityId.trim() || !draft.activityId.trim()) throw new Error('ENGINEERING-INPUT-DRAFT-RHEO-PROV-ID-001');
  if (draft.expandedUncertainty !== undefined && (!Number.isFinite(draft.expandedUncertainty) || draft.expandedUncertainty < 0)) throw new Error('ENGINEERING-INPUT-DRAFT-RHEO-PROV-UNCERTAINTY-001');
  const equipmentId = draft.equipmentId?.trim() ?? '';
  const record: EngineeringInputProvenanceRecord = {
    evidence: {
      entityId: draft.entityId.trim(), entityKind: draft.entityKind, generatedByActivityId: draft.activityId.trim(),
      ...(draft.sourceDocumentId?.trim() ? { sourceDocumentId: draft.sourceDocumentId.trim() } : {}),
      ...(draft.referenceId?.trim() ? { referenceIds: [draft.referenceId.trim()] } : {}),
      ...(draft.note?.trim() ? { note: draft.note.trim() } : {}),
      ...(draft.expandedUncertainty !== undefined ? { uncertainty: { expandedUncertainty: draft.expandedUncertainty, ...(draft.uncertaintyUnit?.trim() ? { unit: draft.uncertaintyUnit.trim() } : {}) } } : {}),
    },
    activities: [{
      id: draft.activityId.trim(), kind: draft.activityKind,
      ...(draft.methodId?.trim() ? { methodId: draft.methodId.trim() } : {}),
      ...(equipmentId ? { agentIds: [equipmentId] } : {}),
    }],
    agents: equipmentId ? [{ id: equipmentId, kind: 'equipment', ...(draft.equipmentLabel?.trim() ? { label: draft.equipmentLabel.trim() } : {}) }] : [],
  };
  const next = structuredClone(input) as SimulationRunInput;
  next.provenance = next.provenance ?? {};
  next.provenance[field] = record;
  return Object.freeze(next);
}

export function removeRheologyProvenanceDraft(input: Readonly<SimulationRunInput>, field: RheologyProvenanceField): Readonly<SimulationRunInput> {
  const next = structuredClone(input) as SimulationRunInput;
  if (next.provenance) delete next.provenance[field];
  return Object.freeze(next);
}

export function updatePipelineScalarDraft(input: Readonly<SimulationRunInput>, path: PipelineScalarPath, value: number): Readonly<SimulationRunInput> {
  finite(value);
  if (path === 'targetFlowRateM3s' && value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-FLOW-001');
  if (path === 'densityKgM3' && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-DENSITY-001');
  if (path === 'lubricationLayerThicknessM') {
    if (value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-LAYER-001');
    for (const segment of input.pipeline.segments) if (segment.kind === 'straight' && value >= segment.pipeRadiusM) throw new Error('ENGINEERING-INPUT-DRAFT-LAYER-RADIUS-001');
  }
  const next = structuredClone(input) as SimulationRunInput; next.pipeline[path] = value; return Object.freeze(next);
}

export function updateStraightSegmentDraft(input: Readonly<SimulationRunInput>, segmentIndex: number, field: StraightSegmentNumericField, value: number): Readonly<SimulationRunInput> {
  finite(value); const segment = input.pipeline.segments[segmentIndex];
  if (!segment || segment.kind !== 'straight') throw new Error('ENGINEERING-INPUT-DRAFT-SEGMENT-001');
  if (field === 'lengthM' && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-LENGTH-001');
  if (field === 'pipeRadiusM') { if (value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-RADIUS-001'); if (input.pipeline.lubricationLayerThicknessM >= value) throw new Error('ENGINEERING-INPUT-DRAFT-RADIUS-LAYER-001'); }
  const next = structuredClone(input) as SimulationRunInput; const nextSegment = next.pipeline.segments[segmentIndex];
  if (!nextSegment || nextSegment.kind !== 'straight') throw new Error('ENGINEERING-INPUT-DRAFT-SEGMENT-001'); nextSegment[field] = value; return Object.freeze(next);
}

export function createPumpCapabilityDraft(input: Readonly<SimulationRunInput>, provenance: PumpCapabilityProvenance): Readonly<SimulationRunInput> {
  if (input.pumpCapability) throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-ALREADY-EXISTS-001');
  const next = structuredClone(input) as SimulationRunInput;
  next.pumpCapability = { provenance, capabilityCurve: [], operatingEnvelope: { manufacturer: '', model: '', configurationRevision: '', sourceDocumentId: '', sourceDocumentRevision: '' } };
  return Object.freeze(next);
}
export function removePumpCapabilityDraft(input: Readonly<SimulationRunInput>): Readonly<SimulationRunInput> { const next=structuredClone(input) as SimulationRunInput; delete next.pumpCapability; return Object.freeze(next); }
export function updatePumpCapabilityProvenanceDraft(input: Readonly<SimulationRunInput>, provenance: PumpCapabilityProvenance): Readonly<SimulationRunInput> { if(!input.pumpCapability)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');const next=structuredClone(input) as SimulationRunInput;next.pumpCapability!.provenance=provenance;return Object.freeze(next); }
export function updatePumpOperatingEnvelopeDraft(input: Readonly<SimulationRunInput>, field: PumpOperatingEnvelopeField, value: string): Readonly<SimulationRunInput> { if(!input.pumpCapability)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');const next=structuredClone(input) as SimulationRunInput;const envelope=next.pumpCapability!.operatingEnvelope??{manufacturer:'',model:'',configurationRevision:'',sourceDocumentId:'',sourceDocumentRevision:''};if(field==='sourceHash'){if(value.trim())envelope.sourceHash=value.trim();else delete envelope.sourceHash;}else envelope[field]=value;next.pumpCapability!.operatingEnvelope=envelope;return Object.freeze(next); }
export function addPumpCapabilityPointDraft(input: Readonly<SimulationRunInput>, flowRateM3s: number, availableConcretePressurePa: number): Readonly<SimulationRunInput> { finite(flowRateM3s);finite(availableConcretePressurePa);if(!input.pumpCapability)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');if(flowRateM3s<0)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-FLOW-001');if(availableConcretePressurePa<0)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-PRESSURE-001');const next=structuredClone(input) as SimulationRunInput;const curve=next.pumpCapability!.capabilityCurve;if(curve.some(p=>p.flowRateM3s===flowRateM3s))throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-DUPLICATE-FLOW-001');curve.push({flowRateM3s,availableConcretePressurePa});curve.sort((a,b)=>a.flowRateM3s-b.flowRateM3s);return Object.freeze(next); }
export function removePumpCapabilityPointDraft(input: Readonly<SimulationRunInput>, pointIndex: number): Readonly<SimulationRunInput> { if(!input.pumpCapability)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');if(!input.pumpCapability.capabilityCurve[pointIndex])throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-POINT-001');const next=structuredClone(input) as SimulationRunInput;next.pumpCapability!.capabilityCurve.splice(pointIndex,1);return Object.freeze(next); }
export function updatePumpCapabilityPointDraft(input: Readonly<SimulationRunInput>, pointIndex: number, field: PumpCapabilityPointField, value: number): Readonly<SimulationRunInput> { finite(value);if(!input.pumpCapability)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');if(value<0)throw new Error(field==='flowRateM3s'?'ENGINEERING-INPUT-DRAFT-PUMP-FLOW-001':'ENGINEERING-INPUT-DRAFT-PUMP-PRESSURE-001');const next=structuredClone(input) as SimulationRunInput;const point=next.pumpCapability?.capabilityCurve[pointIndex];if(!point)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-POINT-001');point[field]=value;const curve=next.pumpCapability!.capabilityCurve;for(let i=1;i<curve.length;i+=1)if(curve[i]!.flowRateM3s<=curve[i-1]!.flowRateM3s)throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-ORDER-001');return Object.freeze(next); }
