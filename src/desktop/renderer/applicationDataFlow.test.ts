import { describe, expect, it } from 'vitest';
import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import type { EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import {
  applyEngineeringAnalysisResponse,
  createApplicationDataFlowState,
  getExportablePdfRequest,
  hydratePersistedEngineeringRun,
  markAnalysisRunning,
  setAnalysisInput,
} from './applicationDataFlow';

const input: SimulationRunInput = {
  runId: 'run-session-1',
  engineVersion: 'v1',
  createdAtIso: '2026-09-09T00:00:00Z',
  pipeline: {
    targetFlowRateM3s: 0.01,
    densityKgM3: 2400,
    lubricationLayerThicknessM: 0.001,
    bulk: { yieldStressPa: 50, plasticViscosityPaS: 10 },
    lubricationLayer: { yieldStressPa: 5, plasticViscosityPaS: 1 },
    segments: [{ id: 'S1', kind: 'straight', lengthM: 10, pipeRadiusM: 0.05, elevationChangeM: 0 }],
  },
};

const blockedResult: EngineeringAnalysisResult = {
  runId: 'run-session-1',
  engineVersion: 'v1',
  readiness: { status: 'BLOCKED', canExecute: false, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
  executionStatus: 'BLOCKED',
  inputSnapshotHash: null,
  simulation: null,
  resultCenter: null,
  diagnostics: null,
  pumpabilityDecision: null,
  finalOutput: null,
  reportExport: null,
  pdfExportRequest: null,
  visualization3d: null,
  completeness: 'incomplete',
  method: 'tolue-engineering-analysis-orchestrator-v6',
};

const blockedSuccess: EngineeringAnalysisIpcResponse = {
  status: 'SUCCESS', errorCode: null, method: 'tolue-engineering-analysis-ipc-response-v1', result: blockedResult,
};

describe('application data flow session lifecycle', () => {
  it('moves deterministically from IDLE to READY to RUNNING', () => {
    const idle = createApplicationDataFlowState();
    expect(idle.status).toBe('IDLE');
    const ready = setAnalysisInput(idle, input);
    expect(ready.status).toBe('READY');
    expect(ready.input).toEqual(input);
    expect(ready.input).not.toBe(input);
    const running = markAnalysisRunning(ready);
    expect(running.status).toBe('RUNNING');
    expect(Object.isFrozen(running)).toBe(true);
  });

  it('preserves run identity for a successful IPC response', () => {
    const running = markAnalysisRunning(setAnalysisInput(createApplicationDataFlowState(), input));
    const completed = applyEngineeringAnalysisResponse(running, blockedSuccess);
    expect(completed.status).toBe('SUCCEEDED');
    expect(completed.activeRunId).toBe(input.runId);
    expect(completed.analysis?.runId).toBe(input.runId);
    expect(completed.isStale).toBe(false);
    expect(getExportablePdfRequest(completed)).toBeNull();
  });

  it('hydrates an exact persisted run without recomputation or stale state', () => {
    const response: EngineeringRunLoadIpcResponse = {
      status: 'SUCCESS', input, result: blockedResult, errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1',
    };
    const hydrated = hydratePersistedEngineeringRun(response);
    expect(hydrated.status).toBe('SUCCEEDED');
    expect(hydrated.input).toEqual(input);
    expect(hydrated.input).not.toBe(input);
    expect(hydrated.activeRunId).toBe('run-session-1');
    expect(hydrated.analysis?.runId).toBe('run-session-1');
    expect(hydrated.isStale).toBe(false);
  });

  it('fails closed when persisted input/result identities differ', () => {
    const response: EngineeringRunLoadIpcResponse = {
      status: 'SUCCESS', input: { ...input, runId: 'other-run' }, result: blockedResult,
      errorCode: null, method: 'tolue-engineering-run-load-ipc-response-v1',
    };
    expect(() => hydratePersistedEngineeringRun(response)).toThrow('APPLICATION-DATA-FLOW-LOAD-RUN-001');
  });

  it('fails closed on rejected analysis without manufacturing outputs', () => {
    const running = markAnalysisRunning(setAnalysisInput(createApplicationDataFlowState(), input));
    const rejected = applyEngineeringAnalysisResponse(running, {
      status: 'REJECTED', result: null, errorCode: 'ANALYSIS-TEST-REJECT', method: 'tolue-engineering-analysis-ipc-response-v1',
    });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.analysis).toBeNull();
    expect(rejected.activeRunId).toBeNull();
    expect(rejected.errorCode).toBe('ANALYSIS-TEST-REJECT');
  });

  it('marks prior outputs stale when inputs change', () => {
    const completed = applyEngineeringAnalysisResponse(markAnalysisRunning(setAnalysisInput(createApplicationDataFlowState(), input)), blockedSuccess);
    const changed = setAnalysisInput(completed, { ...input, runId: 'run-session-2' });
    expect(changed.status).toBe('STALE');
    expect(changed.isStale).toBe(true);
    expect(changed.analysis?.runId).toBe('run-session-1');
    expect(getExportablePdfRequest(changed)).toBeNull();
  });

  it('rejects a response whose runId does not match the active input', () => {
    const running = markAnalysisRunning(setAnalysisInput(createApplicationDataFlowState(), { ...input, runId: 'run-session-other' }));
    expect(() => applyEngineeringAnalysisResponse(running, blockedSuccess)).toThrow('APPLICATION-DATA-FLOW-RUN-001');
  });
});
