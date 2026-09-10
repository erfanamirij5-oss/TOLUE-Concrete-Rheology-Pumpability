import type { EngineeringVisualization3DData, VisualizationSegment3D } from '../../engineering/core/visualization3d';

export type Visualization3DSegmentPresentation = Readonly<Omit<VisualizationSegment3D,
  | 'flowRateM3s'
  | 'frictionPressureLossPa'
  | 'elevationPressurePa'
  | 'totalPressureChangePa'
  | 'inletRemainingPressurePa'
  | 'outletRemainingPressurePa'
  | 'lubricationLayerThicknessM'
  | 'diagnosticFindingIds'
> & {
  readonly flowRateM3s: Readonly<VisualizationSegment3D['flowRateM3s']>;
  readonly frictionPressureLossPa: Readonly<VisualizationSegment3D['frictionPressureLossPa']>;
  readonly elevationPressurePa: Readonly<VisualizationSegment3D['elevationPressurePa']>;
  readonly totalPressureChangePa: Readonly<VisualizationSegment3D['totalPressureChangePa']>;
  readonly inletRemainingPressurePa: Readonly<VisualizationSegment3D['inletRemainingPressurePa']>;
  readonly outletRemainingPressurePa: Readonly<VisualizationSegment3D['outletRemainingPressurePa']>;
  readonly lubricationLayerThicknessM: Readonly<VisualizationSegment3D['lubricationLayerThicknessM']>;
  readonly diagnosticFindingIds: readonly string[];
}>;

export interface Visualization3DPresentation {
  readonly runId: string;
  readonly inputSnapshotHash: string;
  readonly segments: readonly Visualization3DSegmentPresentation[];
  readonly spatialValidation: Readonly<EngineeringVisualization3DData['spatialValidation']>;
  readonly pumpabilityDecision: Readonly<NonNullable<EngineeringVisualization3DData['pumpabilityDecision']>> | null;
  readonly completeness: EngineeringVisualization3DData['completeness'];
  readonly representation: 'engineering_visualization';
  readonly physicalSimulationClaim: false;
  readonly pressureProfileAssumption: EngineeringVisualization3DData['pressureProfileAssumption'];
  readonly method: EngineeringVisualization3DData['method'];
  readonly warnings: readonly string[];
}

export function createVisualization3DPresentation(source: EngineeringVisualization3DData): Readonly<Visualization3DPresentation> {
  return Object.freeze({
    runId: source.runId,
    inputSnapshotHash: source.inputSnapshotHash,
    segments: Object.freeze(source.segments.map(segment => Object.freeze({
      ...segment,
      spatialStartPoint: segment.spatialStartPoint ? Object.freeze({ ...segment.spatialStartPoint }) : null,
      spatialEndPoint: segment.spatialEndPoint ? Object.freeze({ ...segment.spatialEndPoint }) : null,
      flowRateM3s: Object.freeze({ ...segment.flowRateM3s }),
      frictionPressureLossPa: Object.freeze({ ...segment.frictionPressureLossPa }),
      elevationPressurePa: Object.freeze({ ...segment.elevationPressurePa }),
      totalPressureChangePa: Object.freeze({ ...segment.totalPressureChangePa }),
      inletRemainingPressurePa: Object.freeze({ ...segment.inletRemainingPressurePa }),
      outletRemainingPressurePa: Object.freeze({ ...segment.outletRemainingPressurePa }),
      lubricationLayerThicknessM: Object.freeze({ ...segment.lubricationLayerThicknessM }),
      diagnosticFindingIds: Object.freeze([...segment.diagnosticFindingIds]),
    }))),
    spatialValidation: Object.freeze({
      ...source.spatialValidation,
      issues: Object.freeze(source.spatialValidation.issues.map(issue => Object.freeze({ ...issue }))),
    }),
    pumpabilityDecision: source.pumpabilityDecision ? Object.freeze({ ...source.pumpabilityDecision }) : null,
    completeness: source.completeness,
    representation: source.representation,
    physicalSimulationClaim: source.physicalSimulationClaim,
    pressureProfileAssumption: source.pressureProfileAssumption,
    method: source.method,
    warnings: Object.freeze([...source.warnings]),
  });
}
