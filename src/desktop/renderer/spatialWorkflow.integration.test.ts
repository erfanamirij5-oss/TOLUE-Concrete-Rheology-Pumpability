import { describe, expect, it } from 'vitest';
import { executeEngineeringAnalysis } from '../../engineering/core/engineeringAnalysis';
import type { EngineeringInputProvenanceRecord, SimulationInputProvenance } from '../../engineering/core/inputProvenance';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { createEngineeringRunRepository, type PersistedEngineeringRunRow } from '../main/persistence/engineeringRunRepository';
import { hydratePersistedEngineeringRun } from './applicationDataFlow';
import { appendStraightSpatialSegmentDraft } from './pipelineAuthoring';
import { createPipelineScenePresentation } from './pipelineScenePresentation';

function measuredRecord(entityId:string):EngineeringInputProvenanceRecord {
  return {
    evidence:{entityId,entityKind:'measurement_result',generatedByActivityId:`${entityId}-measurement`,uncertainty:{expandedUncertainty:1,coverageFactor:2,unit:'Pa',evaluationMethodId:'test-uncertainty-evaluation'}},
    activities:[{id:`${entityId}-measurement`,kind:'measurement',methodId:'test-measurement-method',startedAtIso:'2026-09-06T00:00:00.000Z',endedAtIso:'2026-09-06T00:05:00.000Z',agentIds:['TEST-INSTRUMENT'],calibrationChain:[{calibrationId:'TEST-CAL-001',referenceId:'TEST-REF-001',calibratedAtIso:'2026-08-01T00:00:00.000Z'}]}],
    agents:[{id:'TEST-INSTRUMENT',kind:'equipment'}],
  };
}

function provenance():SimulationInputProvenance {
  return {
    bulkRheology:measuredRecord('bulk-rheology'),
    lubricationLayerRheology:measuredRecord('ll-rheology'),
    lubricationLayerThickness:{
      evidence:{entityId:'ll-thickness',entityKind:'derived_result',generatedByActivityId:'ll-derivation',sourceEntityIds:['test-source-data']},
      activities:[{id:'ll-derivation',kind:'derivation',methodId:'test-ll-method',agentIds:['TOLUE-TEST']}],
      agents:[{id:'TOLUE-TEST',kind:'software'}],
    },
    pumpCapability:{
      evidence:{entityId:'pump-curve',entityKind:'manufacturer_data',generatedByActivityId:'pump-declaration',sourceDocumentId:'test-pump-datasheet'},
      activities:[{id:'pump-declaration',kind:'manufacturer_declaration',agentIds:['TEST-PUMP-MFR']}],
      agents:[{id:'TEST-PUMP-MFR',kind:'organization'}],
    },
  };
}

function baseInput():SimulationRunInput {
  return {
    runId:'spatial-e2e-001',
    engineVersion:'0.1.0',
    createdAtIso:'2026-09-11T00:00:00.000Z',
    pipeline:{
      targetFlowRateM3s:0.001,
      densityKgM3:2400,
      lubricationLayerThicknessM:0.002,
      bulk:{yieldStressPa:0,plasticViscosityPaS:1},
      lubricationLayer:{yieldStressPa:0,plasticViscosityPaS:1},
      segments:[],
    },
    pumpCapability:{provenance:'manufacturer_rated_point',capabilityCurve:[{flowRateM3s:0.001,availableConcretePressurePa:5_000_000}]},
    provenance:provenance(),
  };
}

function memoryStore(rows:PersistedEngineeringRunRow[]) {
  return {
    insertEngineeringRun:(row:Readonly<PersistedEngineeringRunRow>)=>{rows.push(row);},
    readEngineeringRun:(runId:string)=>rows.find(row=>row.runId===runId)??null,
    listEngineeringRuns:()=>rows,
  };
}

describe('spatial authoring to persisted scene workflow',()=>{
  it('preserves authoritative XYZ and valid analysis overlay through authoring, analysis, save, history and load',()=>{
    const first=appendStraightSpatialSegmentDraft(baseInput(),{
      id:'S1',pipeRadiusM:0.0625,startPoint:{xM:0,yM:0,zM:0},endPoint:{xM:10,yM:0,zM:2},
    });
    const authored=appendStraightSpatialSegmentDraft(first,{
      id:'S2',pipeRadiusM:0.0625,endPoint:{xM:15,yM:5,zM:3},
    });

    const draftScene=createPipelineScenePresentation(authored,null,false);
    expect(draftScene.analysisOverlayState).toBe('none');
    expect(draftScene.spatialValidation.status).toBe('valid');
    expect(draftScene.segments[0]?.startPoint).toEqual({xM:0,yM:0,zM:0});
    expect(draftScene.segments[1]?.connectedFromSegmentId).toBe('S1');
    expect(draftScene.segments[1]?.startPoint).toEqual({xM:10,yM:0,zM:2});

    const result=executeEngineeringAnalysis(authored);
    expect(result.executionStatus).toBe('EXECUTED');
    if(result.executionStatus!=='EXECUTED')throw new Error('SPATIAL-E2E-EXECUTION-001');
    expect(result.visualization3d.method).toBe('tolue-3d-visualization-contract-v3');
    expect(result.visualization3d.spatialValidation.status).toBe('valid');
    expect(result.visualization3d.segments[1]?.spatialEndPoint).toEqual({xM:15,yM:5,zM:3});

    const rows:PersistedEngineeringRunRow[]=[];
    const repository=createEngineeringRunRepository(memoryStore(rows));
    repository.save(authored,result);
    expect(repository.listHistory()).toEqual([expect.objectContaining({runId:'spatial-e2e-001',executionStatus:'EXECUTED'})]);

    const persisted=repository.findByRunId('spatial-e2e-001');
    expect(persisted).not.toBeNull();
    if(!persisted)throw new Error('SPATIAL-E2E-PERSISTENCE-001');
    expect(persisted.input.pipeline.segments).toEqual(authored.pipeline.segments);

    const hydrated=hydratePersistedEngineeringRun({status:'SUCCESS',input:persisted.input as SimulationRunInput,result:persisted.result,errorCode:null,method:'tolue-engineering-run-load-ipc-response-v1'});
    expect(hydrated.status).toBe('SUCCEEDED');
    expect(hydrated.isStale).toBe(false);
    expect(hydrated.input?.pipeline.segments[1]?.spatial?.endPoint).toEqual({xM:15,yM:5,zM:3});

    const loadedScene=createPipelineScenePresentation(hydrated.input,hydrated.analysis?.visualization3d??null,hydrated.isStale);
    expect(loadedScene.analysisOverlayState).toBe('current');
    expect(loadedScene.spatialValidation.status).toBe('valid');
    expect(loadedScene.segments.map(segment=>segment.id)).toEqual(['S1','S2']);
    expect(loadedScene.segments[1]?.hydraulicStatus).toBe('computed');
    expect(loadedScene.segments[1]?.totalPressureChangePa).not.toBeNull();
    expect(loadedScene.segments[1]?.endPoint).toEqual({xM:15,yM:5,zM:3});
  });
});
