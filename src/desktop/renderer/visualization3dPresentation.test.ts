import { describe, expect, it } from 'vitest';
import { createVisualization3DPresentation } from './visualization3dPresentation';

describe('3D visualization presentation boundary',()=>{
 it('preserves Core visualization semantics and physicalSimulationClaim=false',()=>{
  const scalar=(value:number|null)=>({value,unit:'Pa',status:value===null?'not_computed' as const:'computed' as const,sourceResultId:null});
  const p=createVisualization3DPresentation({runId:'run-3d',engineVersion:'v1',inputSnapshotHash:'hash',segments:[{id:'S1',kind:'straight',startStationM:0,endStationM:10,startElevationM:0,endElevationM:2,pipeRadiusM:.05,flowRateM3s:{...scalar(.01),unit:'m3/s'},frictionPressureLossPa:scalar(1000),elevationPressurePa:scalar(200),totalPressureChangePa:scalar(1200),inletRemainingPressurePa:scalar(1200),outletRemainingPressurePa:scalar(0),lubricationLayerThicknessM:{...scalar(.002),unit:'m'},hydraulicStatus:'computed',diagnosticFindingIds:[]}],pumpabilityDecision:null,completeness:'complete',representation:'engineering_visualization',physicalSimulationClaim:false,pressureProfileAssumption:'stationary-segment-properties',method:'tolue-3d-visualization-contract-v2',warnings:[]});
  expect(p.physicalSimulationClaim).toBe(false); expect(p.representation).toBe('engineering_visualization'); expect(p.segments[0]?.totalPressureChangePa.value).toBe(1200); expect(Object.isFrozen(p.segments)).toBe(true); expect(Object.isFrozen(p.segments[0])).toBe(true);
 });
});
