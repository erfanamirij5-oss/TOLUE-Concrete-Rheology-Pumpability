import type { PressureProfileResult } from '../../engineering/core/pressureProfile';

export interface PressureProfilePointPresentation {
  readonly index: number;
  readonly segmentId: string | null;
  readonly positionM: number | null;
  readonly elevationM: number;
  readonly cumulativeRequiredPressurePa: number | null;
  readonly remainingRequiredPressurePa: number | null;
  readonly status: PressureProfileResult['points'][number]['status'];
  readonly pressureMethod: PressureProfileResult['points'][number]['pressureMethod'];
  readonly calibrationId: string | null;
  readonly provenanceEntityId: string | null;
}

export interface PressureProfilePresentation {
  readonly completeness: PressureProfileResult['completeness'];
  readonly peakRequiredPressurePa: number | null;
  readonly peakPointIndex: number | null;
  readonly outletPressureReferencePa: 0;
  readonly method: PressureProfileResult['method'];
  readonly assumption: PressureProfileResult['assumption'];
  readonly points: readonly Readonly<PressureProfilePointPresentation>[];
}

export function createPressureProfilePresentation(
  result: Readonly<PressureProfileResult>,
): Readonly<PressureProfilePresentation> {
  return Object.freeze({
    completeness: result.completeness,
    peakRequiredPressurePa: result.peakRequiredPressurePa,
    peakPointIndex: result.peakPointIndex,
    outletPressureReferencePa: result.outletPressureReferencePa,
    method: result.method,
    assumption: result.assumption,
    points: Object.freeze(result.points.map(point => Object.freeze({
      index: point.index,
      segmentId: point.segmentId,
      positionM: point.positionM,
      elevationM: point.elevationM,
      cumulativeRequiredPressurePa: point.cumulativeRequiredPressurePa,
      remainingRequiredPressurePa: point.remainingRequiredPressurePa,
      status: point.status,
      pressureMethod: point.pressureMethod,
      calibrationId: point.calibrationId,
      provenanceEntityId: point.provenanceEntityId,
    }))),
  });
}
