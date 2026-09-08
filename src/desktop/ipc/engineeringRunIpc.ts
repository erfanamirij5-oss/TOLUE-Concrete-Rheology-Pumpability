import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { EngineeringRunComparisonResult } from '../../engineering/core/engineeringRunComparison';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { EngineeringRunHistoryItem } from '../main/persistence/engineeringRunRepository';

export const ENGINEERING_RUN_LOAD_CHANNEL = 'tolue:engineering:run:load:v1' as const;
export const ENGINEERING_RUN_HISTORY_CHANNEL = 'tolue:engineering:run:history:v1' as const;
export const ENGINEERING_RUN_COMPARISON_CHANNEL = 'tolue:engineering:run:comparison:v1' as const;

export interface EngineeringRunLoadIpcRequest { readonly channel: typeof ENGINEERING_RUN_LOAD_CHANNEL; readonly runId: string; }
export interface EngineeringRunHistoryIpcRequest { readonly channel: typeof ENGINEERING_RUN_HISTORY_CHANNEL; }
export interface EngineeringRunComparisonIpcRequest { readonly channel: typeof ENGINEERING_RUN_COMPARISON_CHANNEL; readonly baselineRunId: string; readonly candidateRunId: string; }

export type EngineeringRunLoadIpcResponse =
  | { readonly status: 'SUCCESS'; readonly input: SimulationRunInput; readonly result: EngineeringAnalysisResult; readonly errorCode: null; readonly method: 'tolue-engineering-run-load-ipc-response-v1' }
  | { readonly status: 'NOT_FOUND'; readonly input: null; readonly result: null; readonly errorCode: null; readonly method: 'tolue-engineering-run-load-ipc-response-v1' }
  | { readonly status: 'REJECTED'; readonly input: null; readonly result: null; readonly errorCode: string; readonly method: 'tolue-engineering-run-load-ipc-response-v1' };

export type EngineeringRunHistoryIpcResponse =
  | { readonly status: 'SUCCESS'; readonly items: readonly Readonly<EngineeringRunHistoryItem>[]; readonly errorCode: null; readonly method: 'tolue-engineering-run-history-ipc-response-v1' }
  | { readonly status: 'REJECTED'; readonly items: readonly []; readonly errorCode: string; readonly method: 'tolue-engineering-run-history-ipc-response-v1' };

export type EngineeringRunComparisonIpcResponse =
  | { readonly status: 'SUCCESS'; readonly comparison: Readonly<EngineeringRunComparisonResult>; readonly errorCode: null; readonly method: 'tolue-engineering-run-comparison-ipc-response-v1' }
  | { readonly status: 'NOT_FOUND'; readonly comparison: null; readonly errorCode: null; readonly method: 'tolue-engineering-run-comparison-ipc-response-v1' }
  | { readonly status: 'REJECTED'; readonly comparison: null; readonly errorCode: string; readonly method: 'tolue-engineering-run-comparison-ipc-response-v1' };

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

export function validateEngineeringRunLoadIpcRequest(request: unknown): asserts request is EngineeringRunLoadIpcRequest {
  if (!record(request) || request.channel !== ENGINEERING_RUN_LOAD_CHANNEL || typeof request.runId !== 'string' || !request.runId.trim()) throw new Error('RUN-LOAD-IPC-SHAPE-001');
  if (Object.keys(request).some(key => !['channel', 'runId'].includes(key))) throw new Error('RUN-LOAD-IPC-SHAPE-001');
}

export function validateEngineeringRunHistoryIpcRequest(request: unknown): asserts request is EngineeringRunHistoryIpcRequest {
  if (!record(request) || request.channel !== ENGINEERING_RUN_HISTORY_CHANNEL || Object.keys(request).some(key => key !== 'channel')) throw new Error('RUN-HISTORY-IPC-SHAPE-001');
}

export function validateEngineeringRunComparisonIpcRequest(request: unknown): asserts request is EngineeringRunComparisonIpcRequest {
  if (!record(request) || request.channel !== ENGINEERING_RUN_COMPARISON_CHANNEL || typeof request.baselineRunId !== 'string' || !request.baselineRunId.trim() || typeof request.candidateRunId !== 'string' || !request.candidateRunId.trim()) throw new Error('RUN-COMPARISON-IPC-SHAPE-001');
  if (request.baselineRunId === request.candidateRunId) throw new Error('RUN-COMPARISON-IPC-DISTINCT-001');
  if (Object.keys(request).some(key => !['channel', 'baselineRunId', 'candidateRunId'].includes(key))) throw new Error('RUN-COMPARISON-IPC-SHAPE-001');
}
