import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import type { EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import { createEngineeringAnalysisPresentation, type EngineeringAnalysisPresentation } from './analysisPresentation';

export type AnalysisSessionStatus = 'IDLE' | 'READY' | 'RUNNING' | 'SUCCEEDED' | 'REJECTED' | 'STALE';

export interface ApplicationDataFlowState {
  readonly status: AnalysisSessionStatus;
  readonly input: Readonly<SimulationRunInput> | null;
  readonly analysis: Readonly<EngineeringAnalysisPresentation> | null;
  readonly activeRunId: string | null;
  readonly activeInputSnapshotHash: string | null;
  readonly errorCode: string | null;
  readonly isStale: boolean;
}

function freezeInput(input: SimulationRunInput): Readonly<SimulationRunInput> { return Object.freeze(structuredClone(input)); }
const rejectedLoadState = (errorCode: string): Readonly<ApplicationDataFlowState> => Object.freeze({ status: 'REJECTED', input: null, analysis: null, activeRunId: null, activeInputSnapshotHash: null, errorCode, isStale: false });

export function createApplicationDataFlowState(analysis?: EngineeringAnalysisResult): Readonly<ApplicationDataFlowState> {
  const presentation = analysis ? createEngineeringAnalysisPresentation(analysis) : null;
  return Object.freeze({ status: analysis ? 'SUCCEEDED' : 'IDLE', input: null, analysis: presentation, activeRunId: presentation?.runId ?? null, activeInputSnapshotHash: presentation?.inputSnapshotHash ?? null, errorCode: null, isStale: false });
}

/**
 * Creates a structurally connected draft so the renderer's engineering editors are live on first launch.
 * The numeric values are explicit starter placeholders, not engineering results. With no pipeline segments,
 * Engineering Core readiness remains blocked until the user defines project geometry.
 */
export function createNewEngineeringDraftState(runId: string, createdAtIso: string): Readonly<ApplicationDataFlowState> {
  if (!runId.trim()) throw new Error('APPLICATION-DRAFT-RUN-001');
  if (!Number.isFinite(Date.parse(createdAtIso))) throw new Error('APPLICATION-DRAFT-TIME-001');
  const draft: SimulationRunInput = {
    runId,
    engineVersion: 'v1.1.0-rc.3',
    createdAtIso,
    pipeline: {
      targetFlowRateM3s: 0.01,
      densityKgM3: 2400,
      lubricationLayerThicknessM: 0.001,
      bulk: { yieldStressPa: 50, plasticViscosityPaS: 10 },
      lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 1 },
      segments: [],
    },
    assumptions: ['DRAFT_PLACEHOLDER_VALUES_REPLACE_BEFORE_ENGINEERING_USE'],
  };
  return setAnalysisInput(createApplicationDataFlowState(), draft);
}

export function setAnalysisInput(state: Readonly<ApplicationDataFlowState>, input: SimulationRunInput): Readonly<ApplicationDataFlowState> {
  return Object.freeze({ status: state.analysis ? 'STALE' : 'READY', input: freezeInput(input), analysis: state.analysis, activeRunId: state.activeRunId, activeInputSnapshotHash: state.activeInputSnapshotHash, errorCode: null, isStale: state.analysis !== null });
}

export function markAnalysisRunning(state: Readonly<ApplicationDataFlowState>): Readonly<ApplicationDataFlowState> {
  if (!state.input) throw new Error('APPLICATION-DATA-FLOW-INPUT-001');
  return Object.freeze({ ...state, status: 'RUNNING', errorCode: null });
}

export function applyEngineeringAnalysisResponse(state: Readonly<ApplicationDataFlowState>, response: EngineeringAnalysisIpcResponse): Readonly<ApplicationDataFlowState> {
  if (!state.input) throw new Error('APPLICATION-DATA-FLOW-INPUT-002');
  if (response.status === 'REJECTED') return Object.freeze({ ...state, status: 'REJECTED', analysis: null, activeRunId: null, activeInputSnapshotHash: null, errorCode: response.errorCode, isStale: false });
  if (response.result.runId !== state.input.runId) throw new Error('APPLICATION-DATA-FLOW-RUN-001');
  const analysis = createEngineeringAnalysisPresentation(response.result);
  return Object.freeze({ ...state, status: 'SUCCEEDED', analysis, activeRunId: analysis.runId, activeInputSnapshotHash: analysis.inputSnapshotHash, errorCode: null, isStale: false });
}

export function hydratePersistedEngineeringRun(response: EngineeringRunLoadIpcResponse): Readonly<ApplicationDataFlowState> {
  if (response.status === 'NOT_FOUND') return rejectedLoadState('APPLICATION-DATA-FLOW-LOAD-404');
  if (response.status === 'REJECTED') return rejectedLoadState(response.errorCode);
  if (response.input.runId !== response.result.runId) return rejectedLoadState('APPLICATION-DATA-FLOW-LOAD-RUN-001');
  if (response.input.engineVersion !== response.result.engineVersion) return rejectedLoadState('APPLICATION-DATA-FLOW-LOAD-ENGINE-001');
  const analysis = createEngineeringAnalysisPresentation(response.result);
  return Object.freeze({ status: 'SUCCEEDED', input: freezeInput(response.input), analysis, activeRunId: analysis.runId, activeInputSnapshotHash: analysis.inputSnapshotHash, errorCode: null, isStale: false });
}

export function getExportablePdfRequest(state: Readonly<ApplicationDataFlowState>) {
  if (state.status !== 'SUCCEEDED' || state.isStale || !state.analysis?.report) return null;
  if (state.analysis.report.runId !== state.activeRunId) throw new Error('APPLICATION-DATA-FLOW-PDF-RUN-001');
  if (state.analysis.report.inputSnapshotHash !== state.activeInputSnapshotHash) throw new Error('APPLICATION-DATA-FLOW-PDF-HASH-001');
  return state.analysis.report.pdfRequest;
}
