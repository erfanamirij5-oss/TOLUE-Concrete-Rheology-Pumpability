import { describe, expect, it } from 'vitest';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { appendStraightSpatialSegmentDraft, updateStraightSpatialSegmentDraft } from './pipelineAuthoring';

function emptyFixture(): SimulationRunInput {
  return {
    runId: 'authoring-001',
    engineVersion: '1.1.0',
    createdAtIso: '2026-09-11T00:00:00.000Z',
    pipeline: {
      targetFlowRateM3s: 0.02,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 80, plasticViscosityPaS: 50 },
      lubricationLayer: { yieldStressPa: 10, plasticViscosityPaS: 5 },
      segments: [],
    },
  };
}

describe('spatial pipeline authoring', () => {
  it('derives straight length and elevation from authoritative points', () => {
    const next = appendStraightSpatialSegmentDraft(emptyFixture(), {
      id: 'S1',
      pipeRadiusM: 0.05,
      startPoint: { xM: 0, yM: 0, zM: 0 },
      endPoint: { xM: 3, yM: 4, zM: 12 },
    });
    const segment = next.pipeline.segments[0];
    expect(segment?.kind).toBe('straight');
    if (!segment || segment.kind !== 'straight') throw new Error('missing segment');
    expect(segment.lengthM).toBe(13);
    expect(segment.elevationChangeM).toBe(12);
    expect(segment.spatial?.connectedFromSegmentId).toBeUndefined();
  });

  it('connects a new segment to the actual end point of the previous spatial segment', () => {
    const first = appendStraightSpatialSegmentDraft(emptyFixture(), {
      id: 'S1', pipeRadiusM: 0.05,
      startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 5, yM: 0, zM: 0 },
    });
    const second = appendStraightSpatialSegmentDraft(first, {
      id: 'S2', pipeRadiusM: 0.05,
      endPoint: { xM: 5, yM: 4, zM: 3 },
    });
    const segment = second.pipeline.segments[1];
    if (!segment || segment.kind !== 'straight') throw new Error('missing segment');
    expect(segment.spatial?.startPoint).toEqual({ xM: 5, yM: 0, zM: 0 });
    expect(segment.spatial?.connectedFromSegmentId).toBe('S1');
    expect(segment.lengthM).toBe(5);
    expect(segment.elevationChangeM).toBe(3);
  });

  it('edits geometry and deterministically re-derives hydraulic geometry values', () => {
    const first = appendStraightSpatialSegmentDraft(emptyFixture(), {
      id: 'S1', pipeRadiusM: 0.05,
      startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 3, yM: 4, zM: 0 },
    });
    const edited = updateStraightSpatialSegmentDraft(first, 0, { endPoint: { xM: 0, yM: 0, zM: 10 } });
    const segment = edited.pipeline.segments[0];
    if (!segment || segment.kind !== 'straight') throw new Error('missing segment');
    expect(segment.lengthM).toBe(10);
    expect(segment.elevationChangeM).toBe(10);
    expect(first.pipeline.segments[0]).not.toEqual(segment);
  });

  it('does not silently break a connected segment start point', () => {
    const first = appendStraightSpatialSegmentDraft(emptyFixture(), {
      id: 'S1', pipeRadiusM: 0.05,
      startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 5, yM: 0, zM: 0 },
    });
    const second = appendStraightSpatialSegmentDraft(first, {
      id: 'S2', pipeRadiusM: 0.05, endPoint: { xM: 10, yM: 0, zM: 0 },
    });
    expect(() => updateStraightSpatialSegmentDraft(second, 1, { startPoint: { xM: 6, yM: 0, zM: 0 } })).toThrow('PIPELINE-AUTHORING-CONNECTION-001');
  });

  it('rejects disconnected supplied start points and non-spatial predecessors', () => {
    const first = appendStraightSpatialSegmentDraft(emptyFixture(), {
      id: 'S1', pipeRadiusM: 0.05,
      startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 1, yM: 0, zM: 0 },
    });
    expect(() => appendStraightSpatialSegmentDraft(first, {
      id: 'S2', pipeRadiusM: 0.05,
      startPoint: { xM: 9, yM: 0, zM: 0 }, endPoint: { xM: 2, yM: 0, zM: 0 },
    })).toThrow('PIPELINE-AUTHORING-CONNECTION-001');

    const legacy = emptyFixture();
    legacy.pipeline.segments.push({ id: 'LEGACY', kind: 'straight', lengthM: 1, pipeRadiusM: 0.05, elevationChangeM: 0 });
    expect(() => appendStraightSpatialSegmentDraft(legacy, {
      id: 'S2', pipeRadiusM: 0.05, endPoint: { xM: 2, yM: 0, zM: 0 },
    })).toThrow('PIPELINE-AUTHORING-PREVIOUS-SPATIAL-001');
  });
});
