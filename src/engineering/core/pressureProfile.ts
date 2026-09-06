import { PipelineAnalysisInput, PipelineAnalysisResult, analyzePipeline } from './pipeline';

export interface PressureProfilePoint {
  index: number;
  segmentId: string | null;
  positionM: number | null;
  elevationM: number;
  cumulativeRequiredPressurePa: number | null;
  remainingRequiredPressurePa: number | null;
  status: 'computed' | 'not_computed';
}

export interface PressureProfileResult {
  pipeline: PipelineAnalysisResult;
  points: PressureProfilePoint[];
  peakRequiredPressurePa: number | null;
  peakPointIndex: number | null;
  outletPressureReferencePa: 0;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-pressure-profile-v1';
  assumption: 'stationary-segment-properties';
}

/**
 * Builds the pressure demand profile along the route.
 *
 * Convention: outlet pressure is the zero-gauge reference. For a complete
 * route, remainingRequiredPressurePa at each boundary equals the pressure
 * still required from that boundary to the outlet. The inlet value therefore
 * equals total required pump pressure for the modeled route.
 *
 * Unsupported local-loss components intentionally break the quantitative
 * profile: values downstream/upstream that depend on an unknown contribution
 * are reported as null rather than treating the missing loss as zero.
 */
export function buildPressureProfile(input: PipelineAnalysisInput): PressureProfileResult {
  const pipeline = analyzePipeline(input);
  const n = pipeline.segments.length;
  const boundaryLosses: Array<number | null> = new Array(n);
  const cumulativeFromInlet: Array<number | null> = new Array(n + 1);
  const remainingToOutlet: Array<number | null> = new Array(n + 1);
  const positions: Array<number | null> = new Array(n + 1);
  const elevations = new Array<number>(n + 1).fill(0);

  cumulativeFromInlet[0] = 0;
  positions[0] = 0;
  let positionKnown = true;
  let cumulativeKnown = true;

  for (let i = 0; i < n; i++) {
    const source = input.segments[i]!;
    const result = pipeline.segments[i]!;
    boundaryLosses[i] = result.totalPressurePa;
    elevations[i + 1] = elevations[i]! + source.elevationChangeM;

    if (source.kind === 'straight' && positionKnown) positions[i + 1] = positions[i]! + source.lengthM;
    else { positionKnown = false; positions[i + 1] = null; }

    if (cumulativeKnown && result.totalPressurePa !== null) cumulativeFromInlet[i + 1] = cumulativeFromInlet[i]! + result.totalPressurePa;
    else { cumulativeKnown = false; cumulativeFromInlet[i + 1] = null; }
  }

  remainingToOutlet[n] = 0;
  let remainingKnown = true;
  for (let i = n - 1; i >= 0; i--) {
    const loss = boundaryLosses[i]!;
    if (remainingKnown && loss !== null) remainingToOutlet[i] = remainingToOutlet[i + 1]! + loss;
    else { remainingKnown = false; remainingToOutlet[i] = null; }
  }

  const points: PressureProfilePoint[] = [];
  for (let i = 0; i <= n; i++) {
    points.push({
      index: i,
      segmentId: i === 0 ? null : pipeline.segments[i - 1]!.id,
      positionM: positions[i]!,
      elevationM: elevations[i]!,
      cumulativeRequiredPressurePa: cumulativeFromInlet[i]!,
      remainingRequiredPressurePa: remainingToOutlet[i]!,
      status: cumulativeFromInlet[i] !== null && remainingToOutlet[i] !== null ? 'computed' : 'not_computed',
    });
  }

  let peakRequiredPressurePa: number | null = null;
  let peakPointIndex: number | null = null;
  if (pipeline.completeness === 'complete') {
    for (const point of points) {
      const p = point.remainingRequiredPressurePa!;
      if (peakRequiredPressurePa === null || p > peakRequiredPressurePa) {
        peakRequiredPressurePa = p;
        peakPointIndex = point.index;
      }
    }
  }

  return {
    pipeline,
    points,
    peakRequiredPressurePa,
    peakPointIndex,
    outletPressureReferencePa: 0,
    completeness: pipeline.completeness,
    method: 'tolue-pressure-profile-v1',
    assumption: 'stationary-segment-properties',
  };
}
