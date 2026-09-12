import type { EngineeringPoint3D, PipelineSegment } from './pipeline';

export interface SpatialPipelineIssue {
  code:
    | 'SPATIAL-NON-FINITE-POINT'
    | 'SPATIAL-ZERO-LENGTH'
    | 'SPATIAL-LENGTH-MISMATCH'
    | 'SPATIAL-ELEVATION-MISMATCH'
    | 'SPATIAL-BROKEN-CONNECTION'
    | 'SPATIAL-CONNECTION-ID-MISMATCH';
  segmentId: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface SpatialPipelineValidationResult {
  status: 'not_available' | 'valid' | 'invalid';
  issues: readonly Readonly<SpatialPipelineIssue>[];
  spatialSegmentCount: number;
  method: 'tolue-spatial-pipeline-validation-v1';
}

const EPSILON_M = 1e-6;
const LENGTH_TOLERANCE_RATIO = 0.01;
const LENGTH_TOLERANCE_MIN_M = 0.01;

function finitePoint(point: Readonly<EngineeringPoint3D>): boolean {
  return Number.isFinite(point.xM) && Number.isFinite(point.yM) && Number.isFinite(point.zM);
}

function distance(a: Readonly<EngineeringPoint3D>, b: Readonly<EngineeringPoint3D>): number {
  return Math.hypot(b.xM - a.xM, b.yM - a.yM, b.zM - a.zM);
}

function pointsCoincide(a: Readonly<EngineeringPoint3D>, b: Readonly<EngineeringPoint3D>): boolean {
  return distance(a, b) <= EPSILON_M;
}

export function validateSpatialPipeline(segments: readonly Readonly<PipelineSegment>[]): Readonly<SpatialPipelineValidationResult> {
  const spatialSegments = segments.filter(segment => segment.spatial !== undefined);
  if (spatialSegments.length === 0) {
    return Object.freeze({ status: 'not_available', issues: Object.freeze([]), spatialSegmentCount: 0, method: 'tolue-spatial-pipeline-validation-v1' });
  }

  const issues: SpatialPipelineIssue[] = [];
  for (const [index, segment] of segments.entries()) {
    const spatial = segment.spatial;
    if (!spatial) continue;

    if (!finitePoint(spatial.startPoint) || !finitePoint(spatial.endPoint)) {
      issues.push({ code: 'SPATIAL-NON-FINITE-POINT', segmentId: segment.id, severity: 'error', message: `${segment.id}: spatial coordinates must be finite.` });
      continue;
    }

    const geometricLengthM = distance(spatial.startPoint, spatial.endPoint);
    if (geometricLengthM <= EPSILON_M) {
      issues.push({ code: 'SPATIAL-ZERO-LENGTH', segmentId: segment.id, severity: 'error', message: `${segment.id}: spatial start and end points cannot coincide.` });
    }

    const spatialElevationChangeM = spatial.endPoint.zM - spatial.startPoint.zM;
    if (Math.abs(spatialElevationChangeM - segment.elevationChangeM) > EPSILON_M) {
      issues.push({ code: 'SPATIAL-ELEVATION-MISMATCH', segmentId: segment.id, severity: 'error', message: `${segment.id}: spatial elevation change does not match elevationChangeM.` });
    }

    if (segment.kind === 'straight') {
      const toleranceM = Math.max(LENGTH_TOLERANCE_MIN_M, segment.lengthM * LENGTH_TOLERANCE_RATIO);
      if (Math.abs(geometricLengthM - segment.lengthM) > toleranceM) {
        issues.push({ code: 'SPATIAL-LENGTH-MISMATCH', segmentId: segment.id, severity: 'error', message: `${segment.id}: spatial geometry length does not match engineering lengthM within tolerance.` });
      }
    }

    if (index > 0) {
      const previous = segments[index - 1]!;
      if (spatial.connectedFromSegmentId && spatial.connectedFromSegmentId !== previous.id) {
        issues.push({ code: 'SPATIAL-CONNECTION-ID-MISMATCH', segmentId: segment.id, severity: 'error', message: `${segment.id}: connectedFromSegmentId does not match the preceding segment.` });
      }
      if (previous.spatial && !pointsCoincide(previous.spatial.endPoint, spatial.startPoint)) {
        issues.push({ code: 'SPATIAL-BROKEN-CONNECTION', segmentId: segment.id, severity: 'error', message: `${segment.id}: start point is disconnected from ${previous.id}.` });
      }
    }
  }

  return Object.freeze({
    status: issues.some(issue => issue.severity === 'error') ? 'invalid' : 'valid',
    issues: Object.freeze(issues.map(issue => Object.freeze({ ...issue }))),
    spatialSegmentCount: spatialSegments.length,
    method: 'tolue-spatial-pipeline-validation-v1',
  });
}
