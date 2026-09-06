import { BinghamMaterial, solveTwoFluidBingham } from './twoFluidBingham';

export interface StraightPipelineSegment {
  id: string;
  kind: 'straight';
  lengthM: number;
  pipeRadiusM: number;
  elevationChangeM: number;
}

export interface UnsupportedPipelineSegment {
  id: string;
  kind: 'elbow' | 'reducer' | 'hose' | 'valve' | 'boom' | 'other';
  elevationChangeM: number;
}

export type PipelineSegment = StraightPipelineSegment | UnsupportedPipelineSegment;

export interface PipelineAnalysisInput {
  targetFlowRateM3s: number;
  densityKgM3: number;
  lubricationLayerThicknessM: number;
  bulk: BinghamMaterial;
  lubricationLayer: BinghamMaterial;
  segments: PipelineSegment[];
  gravityMS2?: number;
}

export interface SegmentPressureResult {
  id: string;
  kind: PipelineSegment['kind'];
  frictionPressurePa: number | null;
  elevationPressurePa: number;
  totalPressurePa: number | null;
  status: 'computed' | 'not_computed';
}

export interface PipelineAnalysisResult {
  segments: SegmentPressureResult[];
  straightFrictionPressurePa: number;
  elevationPressurePa: number;
  requiredPressurePa: number | null;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-pipeline-pressure-v1';
}

export function elevationPressurePa(densityKgM3: number, elevationChangeM: number, gravityMS2 = 9.80665): number {
  if (!Number.isFinite(densityKgM3) || densityKgM3 <= 0) throw new Error('densityKgM3 must be finite and > 0');
  if (!Number.isFinite(elevationChangeM)) throw new Error('elevationChangeM must be finite');
  if (!Number.isFinite(gravityMS2) || gravityMS2 <= 0) throw new Error('gravityMS2 must be finite and > 0');
  return densityKgM3 * gravityMS2 * elevationChangeM;
}

export function analyzePipeline(input: PipelineAnalysisInput): PipelineAnalysisResult {
  if (!Array.isArray(input.segments) || input.segments.length === 0) throw new Error('segments must contain at least one segment');
  const gravity = input.gravityMS2 ?? 9.80665;
  const results: SegmentPressureResult[] = [];
  let friction = 0;
  let elevation = 0;
  let complete = true;

  for (const segment of input.segments) {
    if (!segment.id.trim()) throw new Error('segment id must not be empty');
    const elev = elevationPressurePa(input.densityKgM3, segment.elevationChangeM, gravity);
    elevation += elev;

    if (segment.kind === 'straight') {
      if (!Number.isFinite(segment.lengthM) || segment.lengthM <= 0) throw new Error(`${segment.id}.lengthM must be finite and > 0`);
      const solved = solveTwoFluidBingham({
        targetFlowRateM3s: input.targetFlowRateM3s,
        pipeRadiusM: segment.pipeRadiusM,
        lubricationLayerThicknessM: input.lubricationLayerThicknessM,
        bulk: input.bulk,
        lubricationLayer: input.lubricationLayer,
      });
      if (!solved.converged) throw new Error(`${segment.id}: straight-pipe solver did not converge`);
      const dp = solved.pressureGradientPaPerM * segment.lengthM;
      friction += dp;
      results.push({ id: segment.id, kind: segment.kind, frictionPressurePa: dp, elevationPressurePa: elev, totalPressurePa: dp + elev, status: 'computed' });
    } else {
      complete = false;
      results.push({ id: segment.id, kind: segment.kind, frictionPressurePa: null, elevationPressurePa: elev, totalPressurePa: null, status: 'not_computed' });
    }
  }

  return {
    segments: results,
    straightFrictionPressurePa: friction,
    elevationPressurePa: elevation,
    requiredPressurePa: complete ? friction + elevation : null,
    completeness: complete ? 'complete' : 'incomplete',
    method: 'tolue-pipeline-pressure-v1',
  };
}
