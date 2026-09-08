import type { PipelineAnalysisResult } from '../../engineering/core/pipeline';

export interface PressureCompositionItem {
  readonly id: 'straight-friction' | 'calibrated-local-friction' | 'elevation';
  readonly label: string;
  readonly valuePa: number;
  readonly source: 'engineering-core';
}

export interface PressureCompositionPresentation {
  readonly completeness: PipelineAnalysisResult['completeness'];
  readonly requiredPressurePa: number | null;
  readonly items: readonly Readonly<PressureCompositionItem>[];
  readonly method: PipelineAnalysisResult['method'];
}

export function createPressureCompositionPresentation(
  result: Readonly<PipelineAnalysisResult>,
): Readonly<PressureCompositionPresentation> {
  return Object.freeze({
    completeness: result.completeness,
    requiredPressurePa: result.requiredPressurePa,
    items: Object.freeze([
      Object.freeze({ id: 'straight-friction', label: 'اصطکاک مسیر مستقیم', valuePa: result.straightFrictionPressurePa, source: 'engineering-core' as const }),
      Object.freeze({ id: 'calibrated-local-friction', label: 'افت موضعی کالیبره‌شده', valuePa: result.calibratedLocalFrictionPressurePa, source: 'engineering-core' as const }),
      Object.freeze({ id: 'elevation', label: 'اختلاف ارتفاع', valuePa: result.elevationPressurePa, source: 'engineering-core' as const }),
    ]),
    method: result.method,
  });
}
