import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import {
  addPumpCapabilityPointDraft, bindLubricationLayerQualificationToCurrentProvenance, createPumpCapabilityDraft,
  removeLubricationLayerQualificationDraft, removeLubricationLayerThicknessProvenanceDraft, removePumpCapabilityPointDraft,
  removeRheologyProvenanceDraft, setLubricationLayerQualificationModeDraft, setLubricationLayerThicknessProvenanceDraft, setRheologyProvenanceDraft,
  updateLubricationLayerQualificationDraft, updatePipelineScalarDraft, updatePumpCapabilityPointDraft, updatePumpOperatingEnvelopeDraft,
  updateRheologyInputDraft, updateStraightSegmentDraft,
} from './engineeringInputDraft';

const fixture = (): SimulationRunInput => ({
  runId: 'run-b4', engineVersion: '1.0.0', createdAtIso: '2026-09-10T12:00:00.000Z',
  pipeline: { targetFlowRateM3s: 0.02, densityKgM3: 2400, lubricationLayerThicknessM: 0.002,
    bulk: { yieldStressPa: 80, plasticViscosityPaS: 50 }, lubricationLayer: { yieldStressPa: 10, plasticViscosityPaS: 5 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 20, pipeRadiusM: 0.05, elevationChangeM: 0 }], },
  pumpCapability: { provenance: 'manufacturer_curve', capabilityCurve: [
    { flowRateM3s: 0.01, availableConcretePressurePa: 10_000_000 }, { flowRateM3s: 0.03, availableConcretePressurePa: 8_000_000 },
  ] },
});

describe('engineering input draft', () => {
  it('updates one rheology value without mutating the source input', () => { const source=fixture();const next=updateRheologyInputDraft(source,'bulk.yieldStressPa',95);expect(next.pipeline.bulk.yieldStressPa).toBe(95);expect(source.pipeline.bulk.yieldStressPa).toBe(80);expect(next.pipeline.lubricationLayer.plasticViscosityPaS).toBe(5); });
  it('rejects non-finite and domain-invalid rheology values', () => { const source=fixture();expect(()=>updateRheologyInputDraft(source,'bulk.yieldStressPa',-1)).toThrow('ENGINEERING-INPUT-DRAFT-YIELD-001');expect(()=>updateRheologyInputDraft(source,'bulk.plasticViscosityPaS',0)).toThrow('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');expect(()=>updateRheologyInputDraft(source,'bulk.yieldStressPa',Number.NaN)).toThrow('ENGINEERING-INPUT-DRAFT-NUMBER-001'); });
  it('authors bulk rheology provenance only from explicit user fields', () => {
    const source=fixture();
    const next=setRheologyProvenanceDraft(source,'bulkRheology',{entityId:'rheo-bulk-001',entityKind:'measurement_result',activityId:'rheo-test-001',activityKind:'measurement',methodId:'ASTM-CUSTOM-PROCEDURE-01',equipmentId:'rheometer-01',equipmentLabel:'ICAR Rheometer',sourceDocumentId:'LAB-2026-44',referenceId:'RAW-44'});
    expect(next.provenance?.bulkRheology?.evidence.entityId).toBe('rheo-bulk-001');
    expect(next.provenance?.bulkRheology?.activities[0]?.methodId).toBe('ASTM-CUSTOM-PROCEDURE-01');
    expect(next.provenance?.bulkRheology?.agents[0]?.label).toBe('ICAR Rheometer');
    expect(next.provenance?.lubricationLayerRheology).toBeUndefined();
    expect(source.provenance).toBeUndefined();
  });
  it('does not fabricate provenance and supports removing an authored rheology record', () => {
    const source=fixture(); expect(source.provenance).toBeUndefined();
    const authored=setRheologyProvenanceDraft(source,'lubricationLayerRheology',{entityId:'ll-rheo-01',entityKind:'engineering_assumption',activityId:'ll-assumption-01',activityKind:'assumption'});
    const removed=removeRheologyProvenanceDraft(authored,'lubricationLayerRheology');
    expect(removed.provenance?.lubricationLayerRheology).toBeUndefined();
    expect(()=>setRheologyProvenanceDraft(source,'bulkRheology',{entityId:'',entityKind:'measurement_result',activityId:'x',activityKind:'measurement'})).toThrow('ENGINEERING-INPUT-DRAFT-RHEO-PROV-ID-001');
  });
  it('authors LL thickness provenance independently and binds qualification to exact entity IDs', () => {
    const source=fixture();
    const withRheo=setRheologyProvenanceDraft(source,'lubricationLayerRheology',{entityId:'ll-rheo-01',entityKind:'measurement_result',activityId:'tribo-01',activityKind:'measurement',methodId:'TRIBO-01'});
    const withThickness=setLubricationLayerThicknessProvenanceDraft(withRheo,{entityId:'ll-thk-01',entityKind:'measurement_result',activityId:'thk-meas-01',activityKind:'measurement',methodId:'ULTRASONIC-01',equipmentId:'sensor-01'});
    const qualified=setLubricationLayerQualificationModeDraft(withThickness,'MEASURED_TRIBOLOGY');
    const bound=bindLubricationLayerQualificationToCurrentProvenance(qualified);
    expect(bound.lubricationLayerQualification?.rheologyEvidenceEntityId).toBe('ll-rheo-01');
    expect(bound.lubricationLayerQualification?.thicknessEvidenceEntityId).toBe('ll-thk-01');
    expect(bound.provenance?.lubricationLayerThickness?.evidence.entityId).toBe('ll-thk-01');
    expect(source.provenance).toBeUndefined();
  });
  it('does not fabricate LL binding and supports controlled qualification metadata removal', () => {
    const source=fixture();
    const q=setLubricationLayerQualificationModeDraft(source,'PROJECT_CALIBRATED');
    expect(()=>bindLubricationLayerQualificationToCurrentProvenance(q)).toThrow('ENGINEERING-INPUT-DRAFT-LLQ-BIND-001');
    const withMethod=updateLubricationLayerQualificationDraft(q,'methodId','LL-CAL-01');
    const withRef=updateLubricationLayerQualificationDraft(withMethod,'referenceId','CAL-REPORT-22');
    expect(withRef.lubricationLayerQualification?.methodId).toBe('LL-CAL-01');
    expect(withRef.lubricationLayerQualification?.referenceId).toBe('CAL-REPORT-22');
    const removed=removeLubricationLayerQualificationDraft(withRef);
    expect(removed.lubricationLayerQualification).toBeUndefined();
    const withThickness=setLubricationLayerThicknessProvenanceDraft(source,{entityId:'thk',entityKind:'engineering_assumption',activityId:'assume',activityKind:'assumption'});
    expect(removeLubricationLayerThicknessProvenanceDraft(withThickness).provenance?.lubricationLayerThickness).toBeUndefined();
  });
  it('updates pipeline scalars and straight-segment geometry immutably', () => { const source=fixture();const flow=updatePipelineScalarDraft(source,'targetFlowRateM3s',0.025);const radius=updateStraightSegmentDraft(flow,0,'pipeRadiusM',0.06);expect(radius.pipeline.targetFlowRateM3s).toBe(0.025);expect((radius.pipeline.segments[0] as {pipeRadiusM:number}).pipeRadiusM).toBe(0.06);expect(source.pipeline.targetFlowRateM3s).toBe(0.02); });
  it('mirrors existing core geometry and density constraints', () => { const source=fixture();expect(()=>updatePipelineScalarDraft(source,'densityKgM3',0)).toThrow('ENGINEERING-INPUT-DRAFT-DENSITY-001');expect(()=>updatePipelineScalarDraft(source,'lubricationLayerThicknessM',0.05)).toThrow('ENGINEERING-INPUT-DRAFT-LAYER-RADIUS-001');expect(()=>updateStraightSegmentDraft(source,0,'lengthM',0)).toThrow('ENGINEERING-INPUT-DRAFT-LENGTH-001');expect(()=>updateStraightSegmentDraft(source,0,'pipeRadiusM',0.002)).toThrow('ENGINEERING-INPUT-DRAFT-RADIUS-LAYER-001'); });
  it('updates verified pump-curve points and preserves strict flow ordering', () => { const source=fixture();const next=updatePumpCapabilityPointDraft(source,1,'availableConcretePressurePa',8_500_000);expect(next.pumpCapability?.capabilityCurve[1]?.availableConcretePressurePa).toBe(8_500_000);expect(source.pumpCapability?.capabilityCurve[1]?.availableConcretePressurePa).toBe(8_000_000);expect(()=>updatePumpCapabilityPointDraft(source,1,'flowRateM3s',0.005)).toThrow('ENGINEERING-INPUT-DRAFT-PUMP-ORDER-001'); });
  it('creates an empty pump record without inventing Q-P points or equipment identity', () => { const source=fixture();delete source.pumpCapability;const next=createPumpCapabilityDraft(source,'manufacturer_curve');expect(next.pumpCapability?.capabilityCurve).toEqual([]);expect(next.pumpCapability?.operatingEnvelope).toEqual({manufacturer:'',model:'',configurationRevision:'',sourceDocumentId:'',sourceDocumentRevision:''}); });
  it('authors pump metadata and points only from explicit values', () => { const source=fixture();delete source.pumpCapability;const created=createPumpCapabilityDraft(source,'calibrated_project_data');const withMake=updatePumpOperatingEnvelopeDraft(created,'manufacturer','Putzmeister');const withHash=updatePumpOperatingEnvelopeDraft(withMake,'sourceHash','sha256:abc');const withPoint=addPumpCapabilityPointDraft(withHash,0.02,9_000_000);expect(withPoint.pumpCapability?.operatingEnvelope?.manufacturer).toBe('Putzmeister');expect(withPoint.pumpCapability?.operatingEnvelope?.sourceHash).toBe('sha256:abc');expect(withPoint.pumpCapability?.capabilityCurve).toEqual([{flowRateM3s:0.02,availableConcretePressurePa:9_000_000}]); });
  it('rejects duplicate flow points and can remove an authored point', () => { const source=fixture();expect(()=>addPumpCapabilityPointDraft(source,0.01,7_000_000)).toThrow('ENGINEERING-INPUT-DRAFT-PUMP-DUPLICATE-FLOW-001');const next=removePumpCapabilityPointDraft(source,0);expect(next.pumpCapability?.capabilityCurve).toEqual([{flowRateM3s:0.03,availableConcretePressurePa:8_000_000}]);expect(source.pumpCapability?.capabilityCurve).toHaveLength(2); });
});
