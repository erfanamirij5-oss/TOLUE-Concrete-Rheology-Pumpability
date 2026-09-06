import { diagnoseEngineeringResults, DiagnosticsResult } from './diagnostics';
import { buildEngineeringResultCenter, EngineeringResultCenter } from './resultCenter';
import { executeSimulationRun, SimulationRunInput, SimulationRunResult } from './simulationRun';
import { buildEngineeringVisualization3DData, EngineeringVisualization3DData } from './visualization3d';

export interface EngineeringAnalysisResult {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  simulation: SimulationRunResult;
  resultCenter: EngineeringResultCenter;
  diagnostics: DiagnosticsResult;
  visualization3d: EngineeringVisualization3DData;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-analysis-orchestrator-v1';
}

/**
 * Single deterministic entry point for the current TOLUE Engineering Core.
 *
 * Execution order is intentionally fixed and auditable:
 * SimulationRun -> EngineeringResultCenter -> Diagnostics -> 3D data contract.
 *
 * The orchestrator introduces no new engineering equations, thresholds, or
 * physical claims. It only coordinates existing independently testable stages
 * and enforces run/hash consistency before returning a unified analysis.
 */
export function executeEngineeringAnalysis(input: SimulationRunInput): EngineeringAnalysisResult {
  const simulation = executeSimulationRun(input);
  const resultCenter = buildEngineeringResultCenter(simulation);
  const diagnostics = diagnoseEngineeringResults(resultCenter);
  const visualization3d = buildEngineeringVisualization3DData(simulation, resultCenter, diagnostics);

  if (simulation.runId !== resultCenter.runId || simulation.runId !== diagnostics.runId || simulation.runId !== visualization3d.runId) {
    throw new Error('Engineering analysis runId consistency invariant failed');
  }

  if (
    resultCenter.inputSnapshotHash !== diagnostics.inputSnapshotHash ||
    resultCenter.inputSnapshotHash !== visualization3d.inputSnapshotHash
  ) {
    throw new Error('Engineering analysis inputSnapshotHash consistency invariant failed');
  }

  if (simulation.engineVersion !== resultCenter.engineVersion || simulation.engineVersion !== visualization3d.engineVersion) {
    throw new Error('Engineering analysis engineVersion consistency invariant failed');
  }

  return {
    runId: simulation.runId,
    engineVersion: simulation.engineVersion,
    inputSnapshotHash: resultCenter.inputSnapshotHash,
    simulation,
    resultCenter,
    diagnostics,
    visualization3d,
    completeness: simulation.status,
    method: 'tolue-engineering-analysis-orchestrator-v1',
  };
}
