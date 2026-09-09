import type { PipelineAnalysisResult, SegmentPressureResult } from '../../engineering/core/pipeline';

export interface PressureComponentPresentation {
  readonly id: 'straight-friction' | 'calibrated-local-friction' | 'elevation' | 'required';
  readonly label: string;
  readonly valuePa: number | null;
  readonly source: 'engineering-core';
}

export interface PipelinePresentation {
  readonly completeness: PipelineAnalysisResult['completeness'];
  readonly method: PipelineAnalysisResult['method'];
  readonly components: readonly Readonly<PressureComponentPresentation>[];
  readonly segments: readonly Readonly<SegmentPressureResult>[];
}

export function createPipelinePresentation(result: Readonly<PipelineAnalysisResult>): Readonly<PipelinePresentation> {
  return Object.freeze({
    completeness: result.completeness,
    method: result.method,
    components: Object.freeze([
      Object.freeze({ id: 'straight-friction', label: 'افت فشار اصطکاکی مسیر مستقیم', valuePa: result.straightFrictionPressurePa, source: 'engineering-core' as const }),
      Object.freeze({ id: 'calibrated-local-friction', label: 'افت فشار موضعی کالیبره‌شده', valuePa: result.calibratedLocalFrictionPressurePa, source: 'engineering-core' as const }),
      Object.freeze({ id: 'elevation', label: 'فشار ناشی از اختلاف ارتفاع', valuePa: result.elevationPressurePa, source: 'engineering-core' as const }),
      Object.freeze({ id: 'required', label: 'فشار موردنیاز', valuePa: result.requiredPressurePa, source: 'engineering-core' as const }),
    ]),
    segments: Object.freeze(result.segments.map(segment => Object.freeze({ ...segment }))),
  });
}
