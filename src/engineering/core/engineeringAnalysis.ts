import { diagnoseEngineeringResults, DiagnosticsResult } from './diagnostics';
import { assessEngineeringReadiness, EngineeringReadinessResult } from './readinessGate';
import { buildEngineeringResultCenter, EngineeringResultCenter } from './resultCenter';
import { assessPumpabilityDecision, PumpabilityDecisionResult } from './pumpabilityDecision';
import { executeSimulationRun, SimulationRunInput, SimulationRunResult } from './simulationRun';
import { buildEngineeringVisualization3DData, EngineeringVisualization3DData } from './visualization3d';
import { buildFinalEngineeringOutput, FinalEngineeringOutput } from './finalEngineeringOutput';

export interface ExecutedEngineeringAnalysisResult {
  runId: string;
  engineVersion: string;
  readiness: EngineeringReadinessResult;
  executionStatus: 'EXECUTED';
  inputSnapshotHash: string;
  simulation: SimulationRunResult;
  resultCenter: EngineeringResultCenter;
  diagnostics: DiagnosticsResult;
  pumpabilityDecision: PumpabilityDecisionResult;
  finalOutput: FinalEngineeringOutput;
  visualization3d: EngineeringVisualization3DData;
  completeness: 'complete' | 'incomplete';
  method: 'tolue-engineering-analysis-orchestrator-v5';
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
  pumpabilityDecision: null;
  finalOutput: null;
  visualization3d: null;
  completeness: 'incomplete';
  method: 'tolue-engineering-analysis-orchestrator-v5';
}

export type EngineeringAnalysisResult = ExecutedEngineeringAnalysisResult | BlockedEngineeringAnalysisResult;

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
      pumpabilityDecision: null,
      finalOutput: null,
      visualization3d: null,
      completeness: 'incomplete',
      method: 'tolue-engineering-analysis-orchestrator-v5',
    };
  }

  const simulation = executeSimulationRun(input);
  const pumpabilityDecision = assessPumpabilityDecision(simulation);
  const resultCenter = buildEngineeringResultCenter(simulation, pumpabilityDecision);
  const diagnostics = diagnoseEngineeringResults(resultCenter, pumpabilityDecision);
  const finalOutput = buildFinalEngineeringOutput(simulation, resultCenter, diagnostics, pumpabilityDecision);
  const visualization3d = buildEngineeringVisualization3DData(simulation, resultCenter, diagnostics, pumpabilityDecision);

  if (
    simulation.runId !== resultCenter.runId ||
    simulation.runId !== diagnostics.runId ||
    simulation.runId !== pumpabilityDecision.runId ||
    simulation.runId !== finalOutput.runId ||
    simulation.runId !== visualization3d.runId
  ) {
    throw new Error('Engineering analysis runId consistency invariant failed');
  }

  if (
    resultCenter.inputSnapshotHash !== diagnostics.inputSnapshotHash ||
    resultCenter.inputSnapshotHash !== finalOutput.traceability.inputSnapshotHash ||
    resultCenter.inputSnapshotHash !== visualization3d.inputSnapshotHash
  ) {
    throw new Error('Engineering analysis inputSnapshotHash consistency invariant failed');
  }

  if (
    simulation.engineVersion !== resultCenter.engineVersion ||
    simulation.engineVersion !== finalOutput.engineVersion ||
    simulation.engineVersion !== visualization3d.engineVersion
  ) {
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
    pumpabilityDecision,
    finalOutput,
    visualization3d,
    completeness: simulation.status,
    method: 'tolue-engineering-analysis-orchestrator-v5',
  };
}
