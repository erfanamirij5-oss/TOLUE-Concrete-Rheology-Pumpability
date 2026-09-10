import type { EngineeringVisualization3DData, VisualizationSegment3D } from '../../engineering/core/visualization3d';
import type { TolueStatusTone } from './designSystem';

export interface VisualizationStatusUx {
  readonly label: string;
  readonly tone: TolueStatusTone;
}

export function visualizationCompletenessUx(value: EngineeringVisualization3DData['completeness']): VisualizationStatusUx {
  return value === 'complete'
    ? { label: 'نمایش مهندسی کامل', tone: 'nominal' }
    : { label: 'نمایش مهندسی ناقص', tone: 'warning' };
}

export function hydraulicStatusUx(value: VisualizationSegment3D['hydraulicStatus']): VisualizationStatusUx {
  return value === 'computed'
    ? { label: 'محاسبه‌شده', tone: 'nominal' }
    : { label: 'داده ناکامل', tone: 'warning' };
}

export function visualizationSegmentKindLabel(kind: VisualizationSegment3D['kind']): string {
  switch (kind) {
    case 'straight': return 'خط مستقیم';
    case 'elbow': return 'زانویی';
    case 'reducer': return 'تبدیل';
    case 'hose': return 'شلنگ';
    case 'valve': return 'شیر';
    case 'boom': return 'بوم';
    default: return 'جزء دیگر';
  }
}

export function pressureFeasibilityUx(value: NonNullable<EngineeringVisualization3DData['pumpabilityDecision']>['pressureFeasibility']): VisualizationStatusUx {
  switch (value) {
    case 'PASS': return { label: 'فشار پمپ کافی', tone: 'nominal' };
    case 'FAIL': return { label: 'فشار پمپ ناکافی', tone: 'critical' };
    default: return { label: 'داده فشار ناکافی', tone: 'warning' };
  }
}
