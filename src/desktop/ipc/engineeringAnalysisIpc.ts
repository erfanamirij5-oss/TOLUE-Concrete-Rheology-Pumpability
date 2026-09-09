import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export const ENGINEERING_ANALYSIS_CHANNEL = 'tolue:engineering:analysis:v1' as const;

export interface EngineeringAnalysisIpcRequest {
  channel: typeof ENGINEERING_ANALYSIS_CHANNEL;
  payload: SimulationRunInput;
}

export type EngineeringAnalysisIpcResponse =
  | { status: 'SUCCESS'; result: EngineeringAnalysisResult; errorCode: null; method: 'tolue-engineering-analysis-ipc-response-v1' }
  | { status: 'REJECTED'; result: null; errorCode: string; method: 'tolue-engineering-analysis-ipc-response-v1' };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Runtime shape validation for the untrusted renderer -> Main boundary. */
export function validateEngineeringAnalysisIpcRequest(request: unknown): asserts request is EngineeringAnalysisIpcRequest {
  if (!record(request) || request.channel !== ENGINEERING_ANALYSIS_CHANNEL || !record(request.payload)) throw new Error('ANALYSIS-IPC-SHAPE-001');
  if (Object.keys(request).some(key => !['channel', 'payload'].includes(key))) throw new Error('ANALYSIS-IPC-SHAPE-001');
  const payload = request.payload;
  if (!nonEmpty(payload.runId)) throw new Error('ANALYSIS-IPC-ID-001');
  if (!nonEmpty(payload.engineVersion)) throw new Error('ANALYSIS-IPC-ID-002');
  if (typeof payload.createdAtIso !== 'string' || !Number.isFinite(Date.parse(payload.createdAtIso))) throw new Error('ANALYSIS-IPC-DATE-001');
  if (!record(payload.pipeline)) throw new Error('ANALYSIS-IPC-PIPELINE-001');
  if (!Array.isArray(payload.pipeline.segments)) throw new Error('ANALYSIS-IPC-PIPELINE-002');
}

export function buildEngineeringAnalysisIpcRequest(payload: SimulationRunInput): EngineeringAnalysisIpcRequest {
  const request: EngineeringAnalysisIpcRequest = { channel: ENGINEERING_ANALYSIS_CHANNEL, payload };
  validateEngineeringAnalysisIpcRequest(request);
  return request;
}
