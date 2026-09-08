import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export const ENGINEERING_RUN_LOAD_CHANNEL = 'tolue:engineering:run:load:v1' as const;

export interface EngineeringRunLoadIpcRequest {
  readonly channel: typeof ENGINEERING_RUN_LOAD_CHANNEL;
  readonly runId: string;
}

export type EngineeringRunLoadIpcResponse =
  | { readonly status: 'SUCCESS'; readonly input: SimulationRunInput; readonly result: EngineeringAnalysisResult; readonly errorCode: null; readonly method: 'tolue-engineering-run-load-ipc-response-v1' }
  | { readonly status: 'NOT_FOUND'; readonly input: null; readonly result: null; readonly errorCode: null; readonly method: 'tolue-engineering-run-load-ipc-response-v1' }
  | { readonly status: 'REJECTED'; readonly input: null; readonly result: null; readonly errorCode: string; readonly method: 'tolue-engineering-run-load-ipc-response-v1' };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateEngineeringRunLoadIpcRequest(request: unknown): asserts request is EngineeringRunLoadIpcRequest {
  if (!record(request) || request.channel !== ENGINEERING_RUN_LOAD_CHANNEL || typeof request.runId !== 'string' || !request.runId.trim()) {
    throw new Error('RUN-LOAD-IPC-SHAPE-001');
  }
  if (Object.keys(request).some(key => !['channel', 'runId'].includes(key))) throw new Error('RUN-LOAD-IPC-SHAPE-001');
}
