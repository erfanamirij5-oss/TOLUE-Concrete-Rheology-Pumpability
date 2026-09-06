import { PipelineAnalysisResult } from './pipeline';
import { PressureProfileResult } from './pressureProfile';

export interface HydraulicInvariantResult {
  status: 'consistent' | 'incomplete';
  checkedInvariantIds: string[];
  method: 'tolue-hydraulic-invariants-v1';
}

function assertClose(id: string, actual: number, expected: number): void {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  const tolerance = 1e-10 * scale;
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Hydraulic invariant ${id} failed: actual=${actual}, expected=${expected}`);
  }
}

/**
 * Verifies algebraic consistency between the single-source pipeline result and
 * its downstream pressure profile. This layer introduces no engineering model,
 * empirical coefficient, or acceptance threshold; the numerical tolerance is
 * only for floating-point equality checks of quantities that are algebraically
 * required to be equal.
 */
export function verifyHydraulicInvariants(
  pipeline: PipelineAnalysisResult,
  pressureProfile: PressureProfileResult,
): HydraulicInvariantResult {
  const checkedInvariantIds: string[] = [];

  if (pressureProfile.pipeline !== pipeline) {
    throw new Error('Hydraulic invariant SOURCE_IDENTITY failed: pressure profile must reference the exact pipeline result');
  }
  checkedInvariantIds.push('SOURCE_IDENTITY');

  if (pressureProfile.completeness !== pipeline.completeness) {
    throw new Error('Hydraulic invariant COMPLETENESS failed');
  }
  checkedInvariantIds.push('COMPLETENESS');

  if (pressureProfile.points.length !== pipeline.segments.length + 1) {
    throw new Error('Hydraulic invariant BOUNDARY_COUNT failed');
  }
  checkedInvariantIds.push('BOUNDARY_COUNT');

  const outlet = pressureProfile.points.at(-1)!;
  if (outlet.remainingRequiredPressurePa !== 0 || pressureProfile.outletPressureReferencePa !== 0) {
    throw new Error('Hydraulic invariant OUTLET_ZERO failed');
  }
  checkedInvariantIds.push('OUTLET_ZERO');

  const frictionSum = pipeline.segments.reduce(
    (sum, segment) => sum + (segment.frictionPressurePa ?? 0),
    0,
  );
  assertClose('FRICTION_SUM', pipeline.straightFrictionPressurePa, frictionSum);
  checkedInvariantIds.push('FRICTION_SUM');

  const elevationSum = pipeline.segments.reduce((sum, segment) => sum + segment.elevationPressurePa, 0);
  assertClose('ELEVATION_SUM', pipeline.elevationPressurePa, elevationSum);
  checkedInvariantIds.push('ELEVATION_SUM');

  for (let i = 0; i < pipeline.segments.length; i++) {
    const segment = pipeline.segments[i]!;
    if (segment.totalPressurePa === null) {
      if (segment.status !== 'not_computed') {
        throw new Error(`Hydraulic invariant SEGMENT_STATUS failed at ${segment.id}`);
      }
    } else {
      if (segment.status !== 'computed' || segment.frictionPressurePa === null) {
        throw new Error(`Hydraulic invariant SEGMENT_STATUS failed at ${segment.id}`);
      }
      assertClose(
        `SEGMENT_TOTAL:${segment.id}`,
        segment.totalPressurePa,
        segment.frictionPressurePa + segment.elevationPressurePa,
      );
    }
  }
  checkedInvariantIds.push('SEGMENT_TOTALS_AND_STATUS');

  if (pipeline.completeness === 'complete') {
    if (pipeline.requiredPressurePa === null) {
      throw new Error('Hydraulic invariant REQUIRED_PRESSURE_PRESENCE failed');
    }

    assertClose(
      'REQUIRED_COMPONENT_SUM',
      pipeline.requiredPressurePa,
      pipeline.straightFrictionPressurePa + pipeline.elevationPressurePa,
    );
    checkedInvariantIds.push('REQUIRED_COMPONENT_SUM');

    const segmentTotalSum = pipeline.segments.reduce((sum, segment) => sum + segment.totalPressurePa!, 0);
    assertClose('REQUIRED_SEGMENT_SUM', pipeline.requiredPressurePa, segmentTotalSum);
    checkedInvariantIds.push('REQUIRED_SEGMENT_SUM');

    const inlet = pressureProfile.points[0]!;
    if (inlet.remainingRequiredPressurePa === null) {
      throw new Error('Hydraulic invariant INLET_REQUIRED_PRESSURE failed');
    }
    assertClose('INLET_REQUIRED_PRESSURE', inlet.remainingRequiredPressurePa, pipeline.requiredPressurePa);
    checkedInvariantIds.push('INLET_REQUIRED_PRESSURE');

    for (let i = 0; i < pipeline.segments.length; i++) {
      const segment = pipeline.segments[i]!;
      const before = pressureProfile.points[i]!.remainingRequiredPressurePa;
      const after = pressureProfile.points[i + 1]!.remainingRequiredPressurePa;
      if (before === null || after === null || segment.totalPressurePa === null) {
        throw new Error(`Hydraulic invariant PROFILE_STEP failed at ${segment.id}`);
      }
      assertClose(`PROFILE_STEP:${segment.id}`, before - after, segment.totalPressurePa);
    }
    checkedInvariantIds.push('PROFILE_STEPS');

    return { status: 'consistent', checkedInvariantIds, method: 'tolue-hydraulic-invariants-v1' };
  }

  if (pipeline.requiredPressurePa !== null || pressureProfile.peakRequiredPressurePa !== null) {
    throw new Error('Hydraulic invariant INCOMPLETE_NULL_PROPAGATION failed');
  }
  checkedInvariantIds.push('INCOMPLETE_NULL_PROPAGATION');

  return { status: 'incomplete', checkedInvariantIds, method: 'tolue-hydraulic-invariants-v1' };
}
