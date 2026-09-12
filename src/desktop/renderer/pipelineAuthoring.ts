import type { EngineeringPoint3D, StraightPipelineSegment } from '../../engineering/core/pipeline';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export interface AppendStraightSpatialSegmentSpec {
  readonly id: string;
  readonly pipeRadiusM: number;
  readonly startPoint?: Readonly<EngineeringPoint3D>;
  readonly endPoint: Readonly<EngineeringPoint3D>;
}

export interface UpdateStraightSpatialSegmentSpec {
  readonly pipeRadiusM?: number;
  readonly startPoint?: Readonly<EngineeringPoint3D>;
  readonly endPoint?: Readonly<EngineeringPoint3D>;
}

function finitePoint(point: Readonly<EngineeringPoint3D>): void {
  if (![point.xM, point.yM, point.zM].every(Number.isFinite)) throw new Error('PIPELINE-AUTHORING-POINT-001');
}

function samePoint(a: Readonly<EngineeringPoint3D>, b: Readonly<EngineeringPoint3D>, toleranceM = 1e-6): boolean {
  return Math.abs(a.xM - b.xM) <= toleranceM && Math.abs(a.yM - b.yM) <= toleranceM && Math.abs(a.zM - b.zM) <= toleranceM;
}

function distanceM(a: Readonly<EngineeringPoint3D>, b: Readonly<EngineeringPoint3D>): number {
  return Math.hypot(b.xM - a.xM, b.yM - a.yM, b.zM - a.zM);
}

function validateRadius(input: Readonly<SimulationRunInput>, radiusM: number): void {
  if (!Number.isFinite(radiusM) || radiusM <= 0) throw new Error('PIPELINE-AUTHORING-RADIUS-001');
  if (input.pipeline.lubricationLayerThicknessM >= radiusM) throw new Error('PIPELINE-AUTHORING-RADIUS-LAYER-001');
}

/**
 * Appends a straight segment whose hydraulic length/elevation are derived from
 * authoritative user-supplied spatial coordinates. No synthetic geometry is inferred.
 */
export function appendStraightSpatialSegmentDraft(
  input: Readonly<SimulationRunInput>,
  spec: Readonly<AppendStraightSpatialSegmentSpec>,
): Readonly<SimulationRunInput> {
  const id = spec.id.trim();
  if (!id) throw new Error('PIPELINE-AUTHORING-ID-001');
  if (input.pipeline.segments.some(segment => segment.id === id)) throw new Error('PIPELINE-AUTHORING-ID-DUPLICATE-001');
  validateRadius(input, spec.pipeRadiusM);
  finitePoint(spec.endPoint);

  const previous = input.pipeline.segments.at(-1);
  let startPoint: Readonly<EngineeringPoint3D>;
  let connectedFromSegmentId: string | undefined;

  if (previous) {
    if (!previous.spatial) throw new Error('PIPELINE-AUTHORING-PREVIOUS-SPATIAL-001');
    startPoint = previous.spatial.endPoint;
    connectedFromSegmentId = previous.id;
    if (spec.startPoint) {
      finitePoint(spec.startPoint);
      if (!samePoint(spec.startPoint, startPoint)) throw new Error('PIPELINE-AUTHORING-CONNECTION-001');
    }
  } else {
    if (!spec.startPoint) throw new Error('PIPELINE-AUTHORING-FIRST-START-001');
    finitePoint(spec.startPoint);
    startPoint = spec.startPoint;
  }

  const lengthM = distanceM(startPoint, spec.endPoint);
  if (!(lengthM > 0)) throw new Error('PIPELINE-AUTHORING-ZERO-LENGTH-001');

  const segment: StraightPipelineSegment = {
    id,
    kind: 'straight',
    lengthM,
    pipeRadiusM: spec.pipeRadiusM,
    elevationChangeM: spec.endPoint.zM - startPoint.zM,
    spatial: {
      startPoint: { ...startPoint },
      endPoint: { ...spec.endPoint },
      ...(connectedFromSegmentId ? { connectedFromSegmentId } : {}),
    },
  };

  const next = structuredClone(input) as SimulationRunInput;
  next.pipeline.segments.push(segment);
  return Object.freeze(next);
}

/**
 * Edits authoritative geometry for one existing straight segment and derives
 * hydraulic length/elevation from the edited coordinates. Connectivity is never
 * silently repaired: a connected segment must still begin at its predecessor end.
 */
export function updateStraightSpatialSegmentDraft(
  input: Readonly<SimulationRunInput>,
  segmentIndex: number,
  spec: Readonly<UpdateStraightSpatialSegmentSpec>,
): Readonly<SimulationRunInput> {
  const source = input.pipeline.segments[segmentIndex];
  if (!source || source.kind !== 'straight' || !source.spatial) throw new Error('PIPELINE-AUTHORING-EDIT-SEGMENT-001');

  const radiusM = spec.pipeRadiusM ?? source.pipeRadiusM;
  validateRadius(input, radiusM);
  const startPoint = spec.startPoint ?? source.spatial.startPoint;
  const endPoint = spec.endPoint ?? source.spatial.endPoint;
  finitePoint(startPoint);
  finitePoint(endPoint);

  if (source.spatial.connectedFromSegmentId) {
    const previous = input.pipeline.segments[segmentIndex - 1];
    if (!previous || previous.id !== source.spatial.connectedFromSegmentId || !previous.spatial) throw new Error('PIPELINE-AUTHORING-EDIT-CONNECTION-001');
    if (!samePoint(startPoint, previous.spatial.endPoint)) throw new Error('PIPELINE-AUTHORING-CONNECTION-001');
  }

  const lengthM = distanceM(startPoint, endPoint);
  if (!(lengthM > 0)) throw new Error('PIPELINE-AUTHORING-ZERO-LENGTH-001');

  const next = structuredClone(input) as SimulationRunInput;
  const target = next.pipeline.segments[segmentIndex];
  if (!target || target.kind !== 'straight' || !target.spatial) throw new Error('PIPELINE-AUTHORING-EDIT-SEGMENT-001');
  target.pipeRadiusM = radiusM;
  target.lengthM = lengthM;
  target.elevationChangeM = endPoint.zM - startPoint.zM;
  target.spatial.startPoint = { ...startPoint };
  target.spatial.endPoint = { ...endPoint };
  return Object.freeze(next);
}
