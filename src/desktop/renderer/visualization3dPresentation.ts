import type { EngineeringVisualization3DData } from '../../engineering/core/visualization3d';

export interface Visualization3DPresentation {
  readonly runId: string;
  readonly inputSnapshotHash: string;
  readonly segments: EngineeringVisualization3DData['segments'];
  readonly pumpabilityDecision: EngineeringVisualization3DData['pumpabilityDecision'];
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
      flowRateM3s: Object.freeze({ ...segment.flowRateM3s }),
      frictionPressureLossPa: Object.freeze({ ...segment.frictionPressureLossPa }),
      elevationPressurePa: Object.freeze({ ...segment.elevationPressurePa }),
      totalPressureChangePa: Object.freeze({ ...segment.totalPressureChangePa }),
      inletRemainingPressurePa: Object.freeze({ ...segment.inletRemainingPressurePa }),
      outletRemainingPressurePa: Object.freeze({ ...segment.outletRemainingPressurePa }),
      lubricationLayerThicknessM: Object.freeze({ ...segment.lubricationLayerThicknessM }),
      diagnosticFindingIds: Object.freeze([...segment.diagnosticFindingIds]),
    }))),
    pumpabilityDecision: source.pumpabilityDecision ? Object.freeze({ ...source.pumpabilityDecision }) : null,
    completeness: source.completeness,
    representation: source.representation,
    physicalSimulationClaim: source.physicalSimulationClaim,
    pressureProfileAssumption: source.pressureProfileAssumption,
    method: source.method,
    warnings: Object.freeze([...source.warnings]),
  });
}
