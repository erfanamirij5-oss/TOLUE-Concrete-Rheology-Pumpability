import { DiagnosticsResult } from './diagnostics';
import { EngineeringResultCenter } from './resultCenter';
import { SimulationRunResult } from './simulationRun';

export type VisualizationDataStatus = 'computed' | 'not_computed';

export interface VisualizationScalar {
  value: number | null;
  unit: string;
  status: VisualizationDataStatus;
  sourceResultId: string | null;
}

export interface VisualizationSegment3D {
  id: string;
  kind: 'straight' | 'elbow' | 'reducer' | 'hose' | 'valve' | 'boom' | 'other';
  startStationM: number | null;
  endStationM: number | null;
  startElevationM: number;
  endElevationM: number;
  pipeRadiusM: number | null;
  flowRateM3s: VisualizationScalar;
  frictionPressureLossPa: VisualizationScalar;
  elevationPressurePa: VisualizationScalar;
  totalPressureChangePa: VisualizationScalar;
  inletRemainingPressurePa: VisualizationScalar;
  outletRemainingPressurePa: VisualizationScalar;
  lubricationLayerThicknessM: VisualizationScalar;
  hydraulicStatus: 'computed' | 'incomplete';
  diagnosticFindingIds: string[];
}

export interface EngineeringVisualization3DData {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  segments: VisualizationSegment3D[];
  completeness: 'complete' | 'incomplete';
  representation: 'engineering_visualization';
  physicalSimulationClaim: false;
  pressureProfileAssumption: 'stationary-segment-properties';
  method: 'tolue-3d-visualization-contract-v1';
  warnings: string[];
}

function scalar(value: number | null, unit: string, sourceResultId: string | null = null): VisualizationScalar {
  return { value, unit, status: value === null ? 'not_computed' : 'computed', sourceResultId };
}

/**
 * Maps deterministic Engineering Core outputs to a renderer-neutral 3D data
 * contract. This function performs no new hydraulic/rheological inference.
 * Unknown hydraulic contributions remain not_computed. The resulting dataset
 * is explicitly an engineering visualization, not CFD/DEM or a new physical
 * simulation.
 */
export function buildEngineeringVisualization3DData(
  run: SimulationRunResult,
  center: EngineeringResultCenter,
  diagnostics: DiagnosticsResult,
): EngineeringVisualization3DData {
  if (run.runId !== center.runId || run.runId !== diagnostics.runId) throw new Error('runId mismatch between visualization sources');
  if (center.inputSnapshotHash !== diagnostics.inputSnapshotHash) throw new Error('inputSnapshotHash mismatch between visualization sources');

  const segments: VisualizationSegment3D[] = [];
  let stationKnown = true;
  let stationM = 0;
  let elevationM = 0;

  for (let i = 0; i < run.inputSnapshot.pipeline.segments.length; i++) {
    const source = run.inputSnapshot.pipeline.segments[i]!;
    const hydraulic = run.pipeline.segments[i]!;
    const inletPoint = run.pressureProfile.points[i]!;
    const outletPoint = run.pressureProfile.points[i + 1]!;
    const startStationM = stationKnown ? stationM : null;
    let endStationM: number | null = null;
    let pipeRadiusM: number | null = null;

    if (source.kind === 'straight' && stationKnown) {
      endStationM = stationM + source.lengthM;
      stationM = endStationM;
      pipeRadiusM = source.pipeRadiusM;
    } else {
      stationKnown = false;
    }

    const startElevationM = elevationM;
    elevationM += source.elevationChangeM;
    const findingIds = diagnostics.findings
      .filter(finding => finding.sourceResultIds.some(id => id === 'pipeline.requiredPressure' || id === 'pressureProfile.peakRequiredPressure'))
      .map(finding => finding.id);

    segments.push({
      id: source.id,
      kind: source.kind,
      startStationM,
      endStationM,
      startElevationM,
      endElevationM: elevationM,
      pipeRadiusM,
      flowRateM3s: scalar(run.inputSnapshot.pipeline.targetFlowRateM3s, 'm3/s'),
      frictionPressureLossPa: scalar(hydraulic.frictionPressurePa, 'Pa'),
      elevationPressurePa: scalar(hydraulic.elevationPressurePa, 'Pa'),
      totalPressureChangePa: scalar(hydraulic.totalPressurePa, 'Pa'),
      inletRemainingPressurePa: scalar(inletPoint.remainingRequiredPressurePa, 'Pa', 'pipeline.requiredPressure'),
      outletRemainingPressurePa: scalar(outletPoint.remainingRequiredPressurePa, 'Pa'),
      lubricationLayerThicknessM: scalar(source.kind === 'straight' ? run.inputSnapshot.pipeline.lubricationLayerThicknessM : null, 'm'),
      hydraulicStatus: hydraulic.status === 'computed' ? 'computed' : 'incomplete',
      diagnosticFindingIds: findingIds,
    });
  }

  return {
    runId: run.runId,
    engineVersion: run.engineVersion,
    inputSnapshotHash: center.inputSnapshotHash,
    segments,
    completeness: run.status,
    representation: 'engineering_visualization',
    physicalSimulationClaim: false,
    pressureProfileAssumption: run.pressureProfile.assumption,
    method: 'tolue-3d-visualization-contract-v1',
    warnings: [...run.warnings],
  };
}
