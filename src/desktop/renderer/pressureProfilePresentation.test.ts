import { describe, expect, it } from 'vitest';
import { createPressureProfilePresentation } from './pressureProfilePresentation';

describe('pressure profile presentation boundary', () => {
  it('preserves computed and unknown profile points without manufacturing values', () => {
    const presentation = createPressureProfilePresentation({
      pipeline: {
        segments: [], straightFrictionPressurePa: 0, calibratedLocalFrictionPressurePa: 0,
        elevationPressurePa: 0, requiredPressurePa: null, completeness: 'incomplete', method: 'tolue-pipeline-pressure-v2',
      },
      points: [
        { index: 0, segmentId: null, positionM: 0, elevationM: 0, cumulativeRequiredPressurePa: 0,
          remainingRequiredPressurePa: null, status: 'not_computed', pressureMethod: null, calibrationId: null, provenanceEntityId: null },
        { index: 1, segmentId: 'S1', positionM: 10, elevationM: 1, cumulativeRequiredPressurePa: 1200,
          remainingRequiredPressurePa: 500, status: 'computed', pressureMethod: 'two-fluid-bingham', calibrationId: null, provenanceEntityId: null },
      ],
      peakRequiredPressurePa: null,
      peakPointIndex: null,
      outletPressureReferencePa: 0,
      completeness: 'incomplete',
      method: 'tolue-pressure-profile-v2',
      assumption: 'stationary-segment-properties',
    });

    expect(presentation.completeness).toBe('incomplete');
    expect(presentation.peakRequiredPressurePa).toBeNull();
    expect(presentation.points[0]?.remainingRequiredPressurePa).toBeNull();
    expect(presentation.points[0]?.status).toBe('not_computed');
    expect(presentation.points[1]?.remainingRequiredPressurePa).toBe(500);
    expect(presentation.points[1]?.pressureMethod).toBe('two-fluid-bingham');
    expect(Object.isFrozen(presentation)).toBe(true);
    expect(Object.isFrozen(presentation.points)).toBe(true);
    expect(Object.isFrozen(presentation.points[0])).toBe(true);
  });
});
