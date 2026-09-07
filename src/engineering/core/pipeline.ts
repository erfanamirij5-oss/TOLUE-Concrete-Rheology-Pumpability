import { BinghamMaterial, solveTwoFluidBingham } from './twoFluidBingham';
import {
  CalibratedLocalLossPoint,
  evaluateProjectCalibratedLocalLoss,
} from './projectCalibratedLocalLoss';

export interface StraightPipelineSegment {
  id: string;
  kind: 'straight';
  lengthM: number;
  pipeRadiusM: number;
  elevationChangeM: number;
}

export interface ProjectCalibratedLocalLossContract {
  calibrationCurve: CalibratedLocalLossPoint[];
  provenanceEntityId: string;
  calibrationId: string;
}

export interface LocalPipelineSegment {
  id: string;
  kind: 'elbow' | 'reducer' | 'hose' | 'valve' | 'boom' | 'other';
  elevationChangeM: number;
  calibratedLocalLoss?: ProjectCalibratedLocalLossContract;
}

export type PipelineSegment = StraightPipelineSegment | LocalPipelineSegment;

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
  pressureMethod: 'two-fluid-bingham' | 'project-calibrated-local-loss' | 'not_computed';
  calibrationId: string | null;
  provenanceEntityId: string | null;
}

export interface PipelineAnalysisResult {
  segments: SegmentPressureResult[];
  straightFrictionPressurePa: number;
  calibratedLocalFrictionPressurePa: number;
  elevationPressurePa: number;
  requiredPressurePa: number | null;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-pipeline-pressure-v2';
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
  let straightFriction = 0;
  let calibratedLocalFriction = 0;
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
      straightFriction += dp;
      results.push({
        id: segment.id,
        kind: segment.kind,
        frictionPressurePa: dp,
        elevationPressurePa: elev,
        totalPressurePa: dp + elev,
        status: 'computed',
        pressureMethod: 'two-fluid-bingham',
        calibrationId: null,
        provenanceEntityId: null,
      });
      continue;
    }

    if (!segment.calibratedLocalLoss) {
      complete = false;
      results.push({
        id: segment.id,
        kind: segment.kind,
        frictionPressurePa: null,
        elevationPressurePa: elev,
        totalPressurePa: null,
        status: 'not_computed',
        pressureMethod: 'not_computed',
        calibrationId: null,
        provenanceEntityId: null,
      });
      continue;
    }

    const calibrated = evaluateProjectCalibratedLocalLoss({
      componentKind: segment.kind,
      targetFlowRateM3s: input.targetFlowRateM3s,
      calibrationCurve: segment.calibratedLocalLoss.calibrationCurve,
      provenanceEntityId: segment.calibratedLocalLoss.provenanceEntityId,
      calibrationId: segment.calibratedLocalLoss.calibrationId,
    });

    if (calibrated.status !== 'computed' || calibrated.pressureLossPa === null) {
      complete = false;
      results.push({
        id: segment.id,
        kind: segment.kind,
        frictionPressurePa: null,
        elevationPressurePa: elev,
        totalPressurePa: null,
        status: 'not_computed',
        pressureMethod: 'project-calibrated-local-loss',
        calibrationId: calibrated.calibrationId,
        provenanceEntityId: calibrated.provenanceEntityId,
      });
      continue;
    }

    calibratedLocalFriction += calibrated.pressureLossPa;
    results.push({
      id: segment.id,
      kind: segment.kind,
      frictionPressurePa: calibrated.pressureLossPa,
      elevationPressurePa: elev,
      totalPressurePa: calibrated.pressureLossPa + elev,
      status: 'computed',
      pressureMethod: 'project-calibrated-local-loss',
      calibrationId: calibrated.calibrationId,
      provenanceEntityId: calibrated.provenanceEntityId,
    });
  }

  return {
    segments: results,
    straightFrictionPressurePa: straightFriction,
    calibratedLocalFrictionPressurePa: calibratedLocalFriction,
    elevationPressurePa: elevation,
    requiredPressurePa: complete ? straightFriction + calibratedLocalFriction + elevation : null,
    completeness: complete ? 'complete' : 'incomplete',
    method: 'tolue-pipeline-pressure-v2',
  };
}
