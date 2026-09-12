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

function validateDraftIdentity(runId: string, createdAtIso: string): void {
  if (!runId.trim()) throw new Error('APPLICATION-DRAFT-RUN-001');
  if (!Number.isFinite(Date.parse(createdAtIso))) throw new Error('APPLICATION-DRAFT-TIME-001');
}

export function createApplicationDataFlowState(analysis?: EngineeringAnalysisResult): Readonly<ApplicationDataFlowState> {
  const presentation = analysis ? createEngineeringAnalysisPresentation(analysis) : null;
  return Object.freeze({ status: analysis ? 'SUCCEEDED' : 'IDLE', input: null, analysis: presentation, activeRunId: presentation?.runId ?? null, activeInputSnapshotHash: presentation?.inputSnapshotHash ?? null, errorCode: null, isStale: false });
}

/** Legacy connected starter draft kept for compatibility with existing tests/workflows. */
export function createNewEngineeringDraftState(runId: string, createdAtIso: string): Readonly<ApplicationDataFlowState> {
  validateDraftIdentity(runId, createdAtIso);
  const draft: SimulationRunInput = {
    runId, engineVersion: 'v1.1.0-rc.3', createdAtIso,
    pipeline: { targetFlowRateM3s: 0.01, densityKgM3: 2400, lubricationLayerThicknessM: 0.001, bulk: { yieldStressPa: 50, plasticViscosityPaS: 10 }, lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 1 }, segments: [] },
    assumptions: ['DRAFT_PLACEHOLDER_VALUES_REPLACE_BEFORE_ENGINEERING_USE'],
  };
  return setAnalysisInput(createApplicationDataFlowState(), draft);
}

/** Default first-launch demonstration workspace. */
export function createSampleEngineeringDraftState(runId: string, createdAtIso: string): Readonly<ApplicationDataFlowState> {
  validateDraftIdentity(runId, createdAtIso);
  const sample: SimulationRunInput = {
    runId,
    engineVersion: 'v1.1.0-rc.3',
    createdAtIso,
    projectMetadata: { name: 'پروژه نمونه TOLUE - پمپاژ بتن', code: 'TOLUE-DEMO-001', location: 'نمونه آموزشی', client: 'کاربر آزمایشی' },
    materials: [
      { id: 'MAT-CEM-01', kind: 'cement', name: 'سیمان نمونه', source: 'داده نمایشی', standardReference: 'DEMO ONLY', properties: [] },
      { id: 'MAT-FA-01', kind: 'fine_aggregate', name: 'سنگدانه ریز نمونه', source: 'داده نمایشی', standardReference: 'DEMO ONLY', properties: [] },
      { id: 'MAT-CA-01', kind: 'coarse_aggregate', name: 'سنگدانه درشت نمونه ۱۹ میلی‌متر', source: 'داده نمایشی', standardReference: 'DEMO ONLY', properties: [] },
      { id: 'MAT-ADM-01', kind: 'chemical_admixture', name: 'افزودنی نمونه', source: 'داده نمایشی', standardReference: 'DEMO ONLY', properties: [] },
    ],
    pipeline: {
      targetFlowRateM3s: 0.01,
      densityKgM3: 2350,
      lubricationLayerThicknessM: 0.002,
      bulk: { yieldStressPa: 70, plasticViscosityPaS: 35 },
      lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 2 },
      segments: [
        { id: 'S-01', kind: 'straight', lengthM: 25, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 0, yM: 0, zM: 0 }, endPoint: { xM: 25, yM: 0, zM: 0 } } },
        { id: 'S-02', kind: 'straight', lengthM: 10, pipeRadiusM: 0.05, elevationChangeM: 10, spatial: { startPoint: { xM: 25, yM: 0, zM: 0 }, endPoint: { xM: 25, yM: 0, zM: 10 }, connectedFromSegmentId: 'S-01' } },
        { id: 'S-03', kind: 'straight', lengthM: 15, pipeRadiusM: 0.05, elevationChangeM: 0, spatial: { startPoint: { xM: 25, yM: 0, zM: 10 }, endPoint: { xM: 40, yM: 0, zM: 10 }, connectedFromSegmentId: 'S-02' } },
      ],
    },
    pumpCapability: {
      provenance: 'manufacturer_curve',
      capabilityCurve: [
        { flowRateM3s: 0.005, availableConcretePressurePa: 8_000_000 },
        { flowRateM3s: 0.010, availableConcretePressurePa: 7_000_000 },
        { flowRateM3s: 0.015, availableConcretePressurePa: 6_000_000 },
      ],
      operatingEnvelope: { manufacturer: 'TOLUE SAMPLE — NOT REAL EQUIPMENT', model: 'DEMO-PUMP', configurationRevision: 'DEMO-R1', sourceDocumentId: 'TOLUE-DEMO-DATA', sourceDocumentRevision: '1' },
    },
    pumpabilityRiskScreening: {
      nominalMaximumAggregateSizeM: 0.019,
      suspendingPhaseYieldStressPa: 18,
      suspendingPhaseDensityKgM3: 2200,
      coarseAggregateDensityKgM3: 2650,
    },
    assumptions: ['EXAMPLE_DATA_ONLY_NOT_FOR_ENGINEERING_DECISIONS'],
  };
  return setAnalysisInput(createApplicationDataFlowState(), sample);
}

/** Creates a clean, zero-valued editable workspace after explicit user reset. */
export function createBlankEngineeringDraftState(runId: string, createdAtIso: string): Readonly<ApplicationDataFlowState> {
  validateDraftIdentity(runId, createdAtIso);
  const blank: SimulationRunInput = {
    runId, engineVersion: 'v1.1.0-rc.3', createdAtIso,
    projectMetadata: { name: '' }, materials: [],
    pipeline: { targetFlowRateM3s: 0, densityKgM3: 0, lubricationLayerThicknessM: 0, bulk: { yieldStressPa: 0, plasticViscosityPaS: 0 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 0 }, segments: [] },
    assumptions: ['DRAFT_PLACEHOLDER_VALUES_REPLACE_BEFORE_ENGINEERING_USE'],
  };
  return setAnalysisInput(createApplicationDataFlowState(), blank);
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
