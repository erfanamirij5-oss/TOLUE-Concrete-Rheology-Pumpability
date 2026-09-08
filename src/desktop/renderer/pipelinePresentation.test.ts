import { describe, expect, it } from 'vitest';
import type { PipelineAnalysisResult } from '../../engineering/core/pipeline';
import { createPipelinePresentation } from './pipelinePresentation';

describe('pipeline pressure presentation boundary', () => {
  it('preserves separate Engineering Core pressure components without recomputation', () => {
    const result: PipelineAnalysisResult = {
      segments: [],
      straightFrictionPressurePa: 100,
      calibratedLocalFrictionPressurePa: 20,
      elevationPressurePa: 30,
      requiredPressurePa: 150,
      completeness: 'complete',
      method: 'tolue-pipeline-pressure-v2',
    };
    const presentation = createPipelinePresentation(result);
    expect(presentation.components.map(component => [component.id, component.valuePa])).toEqual([
      ['straight-friction', 100],
      ['calibrated-local-friction', 20],
      ['elevation', 30],
      ['required', 150],
    ]);
    expect(presentation.completeness).toBe('complete');
    expect(presentation.method).toBe('tolue-pipeline-pressure-v2');
  });

  it('preserves incomplete required pressure as null instead of inventing zero', () => {
    const result: PipelineAnalysisResult = {
      segments: [{
        id: 'elbow-1', kind: 'elbow', frictionPressurePa: null, elevationPressurePa: 10,
        totalPressurePa: null, status: 'not_computed', pressureMethod: 'not_computed', calibrationId: null, provenanceEntityId: null,
      }],
      straightFrictionPressurePa: 100,
      calibratedLocalFrictionPressurePa: 0,
      elevationPressurePa: 10,
      requiredPressurePa: null,
      completeness: 'incomplete',
      method: 'tolue-pipeline-pressure-v2',
    };
    const presentation = createPipelinePresentation(result);
    expect(presentation.components.find(component => component.id === 'required')?.valuePa).toBeNull();
    expect(presentation.segments[0]?.status).toBe('not_computed');
  });
});
