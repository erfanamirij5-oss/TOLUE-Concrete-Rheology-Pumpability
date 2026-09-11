import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { ENGINEERING_ANALYSIS_CHANNEL, type EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import { ENGINEERING_PDF_EXPORT_CHANNEL, type EngineeringPdfIpcResponse } from '../ipc/engineeringPdfIpc';
import { ENGINEERING_RUN_COMPARISON_CHANNEL, ENGINEERING_RUN_HISTORY_CHANNEL, ENGINEERING_RUN_LOAD_CHANNEL, type EngineeringRunComparisonIpcResponse, type EngineeringRunHistoryIpcResponse, type EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import { LICENSE_IMPORT_CHANNEL, LICENSE_STATUS_CHANNEL, type LicenseImportIpcResponse, type LicenseStatusIpcResponse } from '../ipc/licenseIpc';
import { VERIFICATION_EVIDENCE_IMPORT_CHANNEL, type VerificationEvidenceImportIpcResponse } from '../ipc/verificationEvidenceIpc';

export interface TolueBridge {
  executeEngineeringAnalysis(input: SimulationRunInput): Promise<EngineeringAnalysisIpcResponse>;
  loadEngineeringRun(runId: string): Promise<EngineeringRunLoadIpcResponse>;
  listEngineeringRuns(): Promise<EngineeringRunHistoryIpcResponse>;
  compareEngineeringRuns(baselineRunId: string, candidateRunId: string): Promise<EngineeringRunComparisonIpcResponse>;
  exportEngineeringPdf(request: EngineeringPdfExportRequest): Promise<EngineeringPdfIpcResponse>;
  getLicenseStatus(): Promise<LicenseStatusIpcResponse>;
  importLicense(): Promise<LicenseImportIpcResponse>;
  importVerificationEvidence(): Promise<VerificationEvidenceImportIpcResponse>;
}

export function createTolueBridge(invoke: (channel: string, payload: unknown) => Promise<unknown>): Readonly<TolueBridge> {
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => invoke(ENGINEERING_ANALYSIS_CHANNEL, { channel: ENGINEERING_ANALYSIS_CHANNEL, payload: input }) as Promise<EngineeringAnalysisIpcResponse>,
    loadEngineeringRun: (runId: string) => invoke(ENGINEERING_RUN_LOAD_CHANNEL, { channel: ENGINEERING_RUN_LOAD_CHANNEL, runId }) as Promise<EngineeringRunLoadIpcResponse>,
    listEngineeringRuns: () => invoke(ENGINEERING_RUN_HISTORY_CHANNEL, { channel: ENGINEERING_RUN_HISTORY_CHANNEL }) as Promise<EngineeringRunHistoryIpcResponse>,
    compareEngineeringRuns: (baselineRunId: string, candidateRunId: string) => invoke(ENGINEERING_RUN_COMPARISON_CHANNEL, { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId, candidateRunId }) as Promise<EngineeringRunComparisonIpcResponse>,
    exportEngineeringPdf: (request: EngineeringPdfExportRequest) => invoke(ENGINEERING_PDF_EXPORT_CHANNEL, { channel: ENGINEERING_PDF_EXPORT_CHANNEL, payload: request }) as Promise<EngineeringPdfIpcResponse>,
    getLicenseStatus: () => invoke(LICENSE_STATUS_CHANNEL, { channel: LICENSE_STATUS_CHANNEL }) as Promise<LicenseStatusIpcResponse>,
    importLicense: () => invoke(LICENSE_IMPORT_CHANNEL, { channel: LICENSE_IMPORT_CHANNEL }) as Promise<LicenseImportIpcResponse>,
    importVerificationEvidence: () => invoke(VERIFICATION_EVIDENCE_IMPORT_CHANNEL, { channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL }) as Promise<VerificationEvidenceImportIpcResponse>,
  });
}
