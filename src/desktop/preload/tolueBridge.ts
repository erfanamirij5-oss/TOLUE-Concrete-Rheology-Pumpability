import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { ENGINEERING_ANALYSIS_CHANNEL, type EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import { ENGINEERING_PDF_EXPORT_CHANNEL, type EngineeringPdfIpcResponse } from '../ipc/engineeringPdfIpc';
import { ENGINEERING_RUN_COMPARISON_CHANNEL, ENGINEERING_RUN_HISTORY_CHANNEL, ENGINEERING_RUN_LOAD_CHANNEL, type EngineeringRunComparisonIpcResponse, type EngineeringRunHistoryIpcResponse, type EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';

export interface TolueBridge {
  executeEngineeringAnalysis(input: SimulationRunInput): Promise<EngineeringAnalysisIpcResponse>;
  loadEngineeringRun(runId: string): Promise<EngineeringRunLoadIpcResponse>;
  listEngineeringRuns(): Promise<EngineeringRunHistoryIpcResponse>;
  compareEngineeringRuns(baselineRunId: string, candidateRunId: string): Promise<EngineeringRunComparisonIpcResponse>;
  exportEngineeringPdf(request: EngineeringPdfExportRequest): Promise<EngineeringPdfIpcResponse>;
}

export function createTolueBridge(invoke: (channel: string, payload: unknown) => Promise<unknown>): Readonly<TolueBridge> {
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => invoke(ENGINEERING_ANALYSIS_CHANNEL, { channel: ENGINEERING_ANALYSIS_CHANNEL, payload: input }) as Promise<EngineeringAnalysisIpcResponse>,
    loadEngineeringRun: (runId: string) => invoke(ENGINEERING_RUN_LOAD_CHANNEL, { channel: ENGINEERING_RUN_LOAD_CHANNEL, runId }) as Promise<EngineeringRunLoadIpcResponse>,
    listEngineeringRuns: () => invoke(ENGINEERING_RUN_HISTORY_CHANNEL, { channel: ENGINEERING_RUN_HISTORY_CHANNEL }) as Promise<EngineeringRunHistoryIpcResponse>,
    compareEngineeringRuns: (baselineRunId: string, candidateRunId: string) => invoke(ENGINEERING_RUN_COMPARISON_CHANNEL, { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId, candidateRunId }) as Promise<EngineeringRunComparisonIpcResponse>,
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => invoke(ENGINEERING_PDF_EXPORT_CHANNEL, { channel: ENGINEERING_PDF_EXPORT_CHANNEL, payload: request }) as Promise<EngineeringPdfIpcResponse>,
  });
}
