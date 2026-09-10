import { describe, expect, it } from 'vitest';
import { DEFAULT_SPATIAL_CAMERA, orbitSpatialCamera, panSpatialCamera, projectSpatialPoint, spatialBounds, zoomSpatialCamera } from './spatialViewportProjection';

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

  it('rejects invalid camera dimensions and zoom factors',()=>{
    const bounds=spatialBounds([{xM:0,yM:0,zM:0}]);
    if(!bounds)throw new Error('missing bounds');
    expect(()=>projectSpatialPoint({xM:0,yM:0,zM:0},bounds,DEFAULT_SPATIAL_CAMERA,0,100)).toThrow('SPATIAL-VIEWPORT-CAMERA-001');
    expect(()=>zoomSpatialCamera(DEFAULT_SPATIAL_CAMERA,0)).toThrow('SPATIAL-VIEWPORT-ZOOM-001');
  });
});
