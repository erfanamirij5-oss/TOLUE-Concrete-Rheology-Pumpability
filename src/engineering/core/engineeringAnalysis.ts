import { diagnoseEngineeringResults, DiagnosticsResult } from './diagnostics';
import { assessEngineeringReadiness, EngineeringReadinessResult } from './readinessGate';
import { buildEngineeringResultCenter, EngineeringResultCenter } from './resultCenter';
import { executeSimulationRun, SimulationRunInput, SimulationRunResult } from './simulationRun';
import { buildEngineeringVisualization3DData, EngineeringVisualization3DData } from './visualization3d';

export interface ExecutedEngineeringAnalysisResult {
  runId: string;
  engineVersion: string;
  readiness: EngineeringReadinessResult;
  executionStatus: 'EXECUTED';
  inputSnapshotHash: string;
  simulation: SimulationRunResult;
  resultCenter: EngineeringResultCenter;
  diagnostics: DiagnosticsResult;
  visualization3d: EngineeringVisualization3DData;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-analysis-orchestrator-v2';
}

export interface BlockedEngineeringAnalysisResult {
  runId: string;
  engineVersion: string;
  readiness: EngineeringReadinessResult & { status: 'BLOCKED'; canExecute: false };
  executionStatus: 'BLOCKED';
  inputSnapshotHash: null;
  simulation: null;
  resultCenter: null;
  diagnostics: null;
  visualization3d: null;
  completeness: 'incomplete';
  method: 'tolue-engineering-analysis-orchestrator-v2';
}

export type EngineeringAnalysisResult = ExecutedEngineeringAnalysisResult | BlockedEngineeringAnalysisResult;

/**
 * Single deterministic entry point for the current TOLUE Engineering Core.
 *
 * Execution order is fixed and auditable:
 * Readiness Gate -> SimulationRun -> EngineeringResultCenter -> Diagnostics -> 3D data contract.
 *
 * BLOCKED readiness is a hard execution boundary: no solver or downstream
 * engineering stage is invoked. PRELIMINARY and READY inputs may execute, and
 * their readiness classification remains attached to the returned analysis.
 */
export function executeEngineeringAnalysis(input: SimulationRunInput): EngineeringAnalysisResult {
  const readiness = assessEngineeringReadiness(input);

  if (!readiness.canExecute) {
    return {
      runId: input.runId,
      engineVersion: input.engineVersion,
      readiness: readiness as EngineeringReadinessResult & { status: 'BLOCKED'; canExecute: false },
      executionStatus: 'BLOCKED',
      inputSnapshotHash: null,
      simulation: null,
      resultCenter: null,
      diagnostics: null,
      visualization3d: null,
      completeness: 'incomplete',
      method: 'tolue-engineering-analysis-orchestrator-v2',
    };
  }

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
    readiness,
    executionStatus: 'EXECUTED',
    inputSnapshotHash: resultCenter.inputSnapshotHash,
    simulation,
    resultCenter,
    diagnostics,
    visualization3d,
    completeness: simulation.status,
    method: 'tolue-engineering-analysis-orchestrator-v2',
  };
}
