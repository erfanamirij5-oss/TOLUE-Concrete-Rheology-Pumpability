import { describe, expect, it } from 'vitest';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectedSegmentDepth, projectSpatialPoint, spatialBounds, spatialReferenceGrid, zoomSpatialCamera } from './spatialViewportProjection';

describe('spatial viewport projection',()=>{
  it('computes deterministic bounds and projection from real XYZ points',()=>{
    const bounds=spatialBounds([{xM:0,yM:0,zM:0},{xM:10,yM:4,zM:2}]);
    expect(bounds).not.toBeNull();
    if(!bounds)throw new Error('missing bounds');
    expect(bounds.center).toEqual({xM:5,yM:2,zM:1});
    expect(bounds.spanM).toBe(10);
    const a=projectSpatialPoint({xM:10,yM:4,zM:2},bounds,DEFAULT_SPATIAL_CAMERA,800,600);
    const b=projectSpatialPoint({xM:10,yM:4,zM:2},bounds,DEFAULT_SPATIAL_CAMERA,800,600);
    expect(a).toEqual(b);
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Number.isFinite(a.y)).toBe(true);
  });

  it('orbits, pans and zooms without mutating the source camera',()=>{
    const source=DEFAULT_SPATIAL_CAMERA;
    const orbit=orbitSpatialCamera(source,0.2,0.1);
    const zoom=zoomSpatialCamera(orbit,2);
    const pan=panSpatialCamera(zoom,20,-10);
    expect(source.zoom).toBe(1);
    expect(orbit.yawRad).toBeCloseTo(source.yawRad+0.2);
    expect(zoom.zoom).toBe(2);
    expect(pan.panXPx).toBe(20);
    expect(pan.panYPx).toBe(-10);
  });

  it('builds a deterministic XY reference grid centered on the real scene bounds',()=>{
    const bounds=spatialBounds([{xM:0,yM:0,zM:2},{xM:10,yM:10,zM:8}]);
    if(!bounds)throw new Error('missing bounds');
    const grid=spatialReferenceGrid(bounds,4);
    expect(grid).toHaveLength(10);
    expect(grid.every(line=>line.start.zM===bounds.center.zM&&line.end.zM===bounds.center.zM)).toBe(true);
    expect(grid[0]?.axis).toBe('x');
    expect(grid[1]?.axis).toBe('y');
  });

  it('computes projected segment depth from the active camera',()=>{
    const bounds=spatialBounds([{xM:-5,yM:-5,zM:-5},{xM:5,yM:5,zM:5}]);
    if(!bounds)throw new Error('missing bounds');
    const near=projectedSegmentDepth({xM:4,yM:4,zM:4},{xM:5,yM:5,zM:5},bounds,DEFAULT_SPATIAL_CAMERA,800,600);
    const far=projectedSegmentDepth({xM:-5,yM:-5,zM:-5},{xM:-4,yM:-4,zM:-4},bounds,DEFAULT_SPATIAL_CAMERA,800,600);
    expect(near).not.toBe(far);
    expect(Number.isFinite(near)).toBe(true);
    expect(Number.isFinite(far)).toBe(true);
  });

  it('rejects invalid camera dimensions, zoom factors and grid divisions',()=>{
    const bounds=spatialBounds([{xM:0,yM:0,zM:0}]);
    if(!bounds)throw new Error('missing bounds');
    expect(()=>projectSpatialPoint({xM:0,yM:0,zM:0},bounds,DEFAULT_SPATIAL_CAMERA,0,100)).toThrow('SPATIAL-VIEWPORT-CAMERA-001');
    expect(()=>zoomSpatialCamera(DEFAULT_SPATIAL_CAMERA,0)).toThrow('SPATIAL-VIEWPORT-ZOOM-001');
    expect(()=>spatialReferenceGrid(bounds,1)).toThrow('SPATIAL-VIEWPORT-GRID-001');
  });
});
