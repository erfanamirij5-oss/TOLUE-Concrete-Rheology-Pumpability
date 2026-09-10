import { describe, expect, it } from 'vitest';
import type { PipelineSegment } from './pipeline';
import { validateSpatialPipeline } from './spatialPipeline';

describe('spatial pipeline validation', () => {
  it('returns not_available when engineering segments have no spatial metadata', () => {
    const segments: PipelineSegment[] = [{ id: 'S1', kind: 'straight', lengthM: 5, pipeRadiusM: 0.05, elevationChangeM: 0 }];
    expect(validateSpatialPipeline(segments)).toMatchObject({ status: 'not_available', spatialSegmentCount: 0, issues: [] });
  });

  it('accepts a connected spatial chain that matches engineering geometry', () => {
    const segments: PipelineSegment[] = [
      { id: 'S1', kind: 'straight', lengthM: 5, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 5, yM: 0, zM: 0 } } },
      { id: 'S2', kind: 'straight', lengthM: 5, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 5, yM: 0, zM: 0 }, endPoint: { xM: 10, yM: 0, zM: 0 }, connectedFromSegmentId: 'S1' } },
    ];
    expect(validateSpatialPipeline(segments)).toMatchObject({ status: 'valid', spatialSegmentCount: 2, issues: [] });
  });

  it('rejects broken connectivity and inconsistent engineering length', () => {
    const segments: PipelineSegment[] = [
      { id: 'S1', kind: 'straight', lengthM: 5, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 5, yM: 0, zM: 0 } } },
      { id: 'S2', kind: 'straight', lengthM: 5, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 6, yM: 0, zM: 0 }, endPoint: { xM: 16, yM: 0, zM: 0 }, connectedFromSegmentId: 'WRONG' } },
    ];
    const result = validateSpatialPipeline(segments);
    expect(result.status).toBe('invalid');
    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(['SPATIAL-LENGTH-MISMATCH', 'SPATIAL-BROKEN-CONNECTION', 'SPATIAL-CONNECTION-ID-MISMATCH']));
  });
});
