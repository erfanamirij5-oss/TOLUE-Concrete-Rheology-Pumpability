import { describe, expect, it } from 'vitest';
import { buildEngineeringAnalysisIpcRequest, validateEngineeringAnalysisIpcRequest } from './engineeringAnalysisIpc';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';

const input = {
  runId: 'run-1', engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00Z',
  pipeline: { targetFlowRateM3s: 0, densityKgM3: 2400, lubricationLayerThicknessM: 0.001,
    bulk: { yieldStressPa: 0, plasticViscosityPaS: 1 }, lubricationLayer: { yieldStressPa: 0, plasticViscosityPaS: 1 }, segments: [] },
} as SimulationRunInput;

describe('engineering analysis IPC boundary', () => {
  it('builds the fixed analysis channel envelope without changing the payload', () => {
    const snapshot = structuredClone(input);
    const request = buildEngineeringAnalysisIpcRequest(input);
    expect(request.channel).toBe('tolue:engineering:analysis:v1');
    expect(request.payload).toBe(input);
    expect(input).toEqual(snapshot);
  });

  it('rejects malformed metadata and non-array pipeline segments', () => {
    expect(() => validateEngineeringAnalysisIpcRequest({ channel: 'tolue:engineering:analysis:v1', payload: { ...input, runId: '' } })).toThrow('ANALYSIS-IPC-ID-001');
    expect(() => validateEngineeringAnalysisIpcRequest({ channel: 'tolue:engineering:analysis:v1', payload: { ...input, pipeline: { ...input.pipeline, segments: {} } } })).toThrow('ANALYSIS-IPC-PIPELINE-002');
  });
});
