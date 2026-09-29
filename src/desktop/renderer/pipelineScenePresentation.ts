import type { PipelineSegment } from '../../engineering/core/pipeline';
import { validateSpatialPipeline, type SpatialPipelineValidationResult } from '../../engineering/core/spatialPipeline';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { VisualizationSegment3D } from '../../engineering/core/visualization3d';
import type { Visualization3DPresentation } from './visualization3dPresentation';

export interface PipelineSceneSegmentPresentation {
  readonly id: string;
  readonly kind: PipelineSegment['kind'];
  readonly order: number;
  readonly startPoint: Readonly<{ xM:number; yM:number; zM:number }> | null;
  readonly endPoint: Readonly<{ xM:number; yM:number; zM:number }> | null;
  readonly connectedFromSegmentId: string | null;
  readonly lengthM: number | null;
  readonly pipeRadiusM: number | null;
  readonly elevationChangeM: number;
  readonly hydraulicStatus: VisualizationSegment3D['hydraulicStatus'] | 'not_run';
  readonly totalPressureChangePa: number | null;
}

export interface PipelineScenePresentation {
  readonly segments: readonly PipelineSceneSegmentPresentation[];
  readonly spatialValidation: Readonly<SpatialPipelineValidationResult>;
  readonly analysisOverlayState: 'none' | 'current' | 'stale';
}

const EMPTY_SPATIAL_VALIDATION: Readonly<SpatialPipelineValidationResult> = Object.freeze({
  status:'not_available',
  issues:Object.freeze([]),
  spatialSegmentCount:0,
  method:'tolue-spatial-pipeline-validation-v1',
});

export function createPipelineScenePresentation(
  input: Readonly<SimulationRunInput> | null,
  analysis: Readonly<Visualization3DPresentation> | null,
  isStale: boolean,
): Readonly<PipelineScenePresentation> {
  if (!input) return Object.freeze({segments:Object.freeze([]),spatialValidation:EMPTY_SPATIAL_VALIDATION,analysisOverlayState:'none'});
  const validation=validateSpatialPipeline(input.pipeline.segments);
  const overlayById=new Map((analysis?.segments??[]).map(segment=>[segment.id,segment] as const));
  const segments=input.pipeline.segments.map((segment,index)=>{
    const overlay=overlayById.get(segment.id);
    const allowOverlay=Boolean(overlay&&!isStale);
    return Object.freeze({
      id:segment.id,
      kind:segment.kind,
      order:index,
      startPoint:segment.spatial?Object.freeze({...segment.spatial.startPoint}):null,
      endPoint:segment.spatial?Object.freeze({...segment.spatial.endPoint}):null,
      connectedFromSegmentId:segment.spatial?.connectedFromSegmentId??null,
      lengthM:segment.kind==='straight'?segment.lengthM:null,
      pipeRadiusM:segment.kind==='straight'?segment.pipeRadiusM:null,
      elevationChangeM:segment.elevationChangeM,
      hydraulicStatus:allowOverlay?overlay!.hydraulicStatus:'not_run',
      totalPressureChangePa:allowOverlay?overlay!.totalPressureChangePa.value:null,
    });
  });
  return Object.freeze({
    segments:Object.freeze(segments),
    spatialValidation:Object.freeze({...validation,issues:Object.freeze(validation.issues.map(issue=>Object.freeze({...issue})))}),
    analysisOverlayState:analysis?(isStale?'stale':'current'):'none',
  });
}
