import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { Visualization3DPresentation } from './visualization3dPresentation';
import { createPipelineScenePresentation } from './pipelineScenePresentation';

const input: SimulationRunInput = {
  runId:'scene-001',engineVersion:'1.1.0',createdAtIso:'2026-09-11T00:00:00.000Z',
  pipeline:{targetFlowRateM3s:0.02,densityKgM3:2400,lubricationLayerThicknessM:0.002,bulk:{yieldStressPa:80,plasticViscosityPaS:50},lubricationLayer:{yieldStressPa:10,plasticViscosityPaS:5},segments:[{
    id:'S1',kind:'straight',lengthM:5,pipeRadiusM:0.05,elevationChangeM:0,
    spatial:{startPoint:{xM:0,yM:0,zM:0},endPoint:{xM:5,yM:0,zM:0}},
  }]},
};

const analysis = {
  runId:'scene-001',inputSnapshotHash:'hash',segments:[{
    id:'S1',kind:'straight',startStationM:0,endStationM:5,startElevationM:0,endElevationM:0,pipeRadiusM:0.05,
    spatialStartPoint:{xM:0,yM:0,zM:0},spatialEndPoint:{xM:5,yM:0,zM:0},connectedFromSegmentId:null,
    flowRateM3s:{value:0.02,unit:'m3/s',status:'computed'},frictionPressureLossPa:{value:1000,unit:'Pa',status:'computed'},elevationPressurePa:{value:0,unit:'Pa',status:'computed'},totalPressureChangePa:{value:1000,unit:'Pa',status:'computed'},inletRemainingPressurePa:{value:2000,unit:'Pa',status:'computed'},outletRemainingPressurePa:{value:1000,unit:'Pa',status:'computed'},lubricationLayerThicknessM:{value:0.002,unit:'m',status:'computed'},hydraulicStatus:'computed',diagnosticFindingIds:[],
  }],spatialValidation:{status:'valid',issues:[],spatialSegmentCount:1,method:'tolue-spatial-pipeline-validation-v1'},pumpabilityDecision:null,completeness:'complete',representation:'engineering_visualization',physicalSimulationClaim:false,pressureProfileAssumption:'stationary-segment-properties',method:'tolue-3d-visualization-contract-v3',warnings:[],
} satisfies Visualization3DPresentation;

describe('pipeline scene presentation',()=>{
  it('builds geometry directly from current input before simulation',()=>{
    const scene=createPipelineScenePresentation(input,null,false);
    expect(scene.segments[0]?.startPoint).toEqual({xM:0,yM:0,zM:0});
    expect(scene.segments[0]?.endPoint).toEqual({xM:5,yM:0,zM:0});
    expect(scene.segments[0]?.hydraulicStatus).toBe('not_run');
    expect(scene.analysisOverlayState).toBe('none');
  });

  it('applies analysis overlay only when the result is current',()=>{
    const current=createPipelineScenePresentation(input,analysis,false);
    expect(current.segments[0]?.hydraulicStatus).toBe('computed');
    expect(current.segments[0]?.totalPressureChangePa).toBe(1000);
    expect(current.analysisOverlayState).toBe('current');
  });

  it('hides stale analysis values after draft geometry changes',()=>{
    const stale=createPipelineScenePresentation(input,analysis,true);
    expect(stale.segments[0]?.hydraulicStatus).toBe('not_run');
    expect(stale.segments[0]?.totalPressureChangePa).toBeNull();
    expect(stale.analysisOverlayState).toBe('stale');
  });
});
