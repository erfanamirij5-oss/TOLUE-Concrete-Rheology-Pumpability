import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { ENGINEERING_ANALYSIS_CHANNEL, type EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import { ENGINEERING_PDF_EXPORT_CHANNEL, type EngineeringPdfIpcResponse } from '../ipc/engineeringPdfIpc';

export interface TolueBridge {
  executeEngineeringAnalysis(input: SimulationRunInput): Promise<EngineeringAnalysisIpcResponse>;
  exportEngineeringPdf(request: EngineeringPdfExportRequest): Promise<EngineeringPdfIpcResponse>;
}

export function createTolueBridge(invoke: (channel: string, payload: unknown) => Promise<unknown>): Readonly<TolueBridge> {
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => invoke(ENGINEERING_ANALYSIS_CHANNEL, {
      channel: ENGINEERING_ANALYSIS_CHANNEL, payload: input,
    }) as Promise<EngineeringAnalysisIpcResponse>,
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => invoke(ENGINEERING_PDF_EXPORT_CHANNEL, {
      channel: ENGINEERING_PDF_EXPORT_CHANNEL, payload: request,
    }) as Promise<EngineeringPdfIpcResponse>,
  });
}
