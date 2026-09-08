import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import { createEngineeringAnalysisPresentation, type EngineeringAnalysisPresentation } from './analysisPresentation';

export interface ApplicationDataFlowState {
  readonly analysis: Readonly<EngineeringAnalysisPresentation> | null;
}

export function createApplicationDataFlowState(
  analysis?: EngineeringAnalysisResult,
): Readonly<ApplicationDataFlowState> {
  return Object.freeze({
    analysis: analysis ? createEngineeringAnalysisPresentation(analysis) : null,
  });
}
