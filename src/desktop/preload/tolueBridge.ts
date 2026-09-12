import type { EngineeringReportExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { ENGINEERING_ANALYSIS_CHANNEL, type EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import {
  ENGINEERING_PDF_EXPORT_CHANNEL,
  ENGINEERING_REPORT_TEXT_EXPORT_CHANNEL,
  type EngineeringPdfIpcResponse,
  type EngineeringReportTextIpcResponse,
} from '../ipc/engineeringPdfIpc';
import { ENGINEERING_RUN_COMPARISON_CHANNEL, ENGINEERING_RUN_HISTORY_CHANNEL, ENGINEERING_RUN_LOAD_CHANNEL, type EngineeringRunComparisonIpcResponse, type EngineeringRunHistoryIpcResponse, type EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import { LICENSE_IMPORT_CHANNEL, LICENSE_STATUS_CHANNEL, type LicenseImportIpcResponse, type LicenseStatusIpcResponse } from '../ipc/licenseIpc';
import {
  VERIFICATION_EVIDENCE_HISTORY_CHANNEL,
  VERIFICATION_EVIDENCE_IMPORT_CHANNEL,
  VERIFICATION_EVIDENCE_LOAD_CHANNEL,
  type VerificationEvidenceHistoryIpcResponse,
  type VerificationEvidenceImportIpcResponse,
  type VerificationEvidenceLoadIpcResponse,
} from '../ipc/verificationEvidenceIpc';

export interface TolueBridge {
  executeEngineeringAnalysis(input: SimulationRunInput): Promise<EngineeringAnalysisIpcResponse>;
  loadEngineeringRun(runId: string): Promise<EngineeringRunLoadIpcResponse>;
  listEngineeringRuns(): Promise<EngineeringRunHistoryIpcResponse>;
  compareEngineeringRuns(baselineRunId: string, candidateRunId: string): Promise<EngineeringRunComparisonIpcResponse>;
  exportEngineeringPdf(request: EngineeringReportExportRequest): Promise<EngineeringPdfIpcResponse | EngineeringReportTextIpcResponse>;
  getLicenseStatus(): Promise<LicenseStatusIpcResponse>;
  importLicense(): Promise<LicenseImportIpcResponse>;
  importVerificationEvidence(): Promise<VerificationEvidenceImportIpcResponse>;
  listVerificationEvidencePackages(): Promise<VerificationEvidenceHistoryIpcResponse>;
  loadVerificationEvidencePackage(packageId: string): Promise<VerificationEvidenceLoadIpcResponse>;
}

export function createTolueBridge(invoke: (channel: string, payload: unknown) => Promise<unknown>): Readonly<TolueBridge> {
  return Object.freeze({
    executeEngineeringAnalysis: (input: SimulationRunInput) => invoke(ENGINEERING_ANALYSIS_CHANNEL, { channel: ENGINEERING_ANALYSIS_CHANNEL, payload: input }) as Promise<EngineeringAnalysisIpcResponse>,
    loadEngineeringRun: (runId: string) => invoke(ENGINEERING_RUN_LOAD_CHANNEL, { channel: ENGINEERING_RUN_LOAD_CHANNEL, runId }) as Promise<EngineeringRunLoadIpcResponse>,
    listEngineeringRuns: () => invoke(ENGINEERING_RUN_HISTORY_CHANNEL, { channel: ENGINEERING_RUN_HISTORY_CHANNEL }) as Promise<EngineeringRunHistoryIpcResponse>,
    compareEngineeringRuns: (baselineRunId: string, candidateRunId: string) => invoke(ENGINEERING_RUN_COMPARISON_CHANNEL, { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId, candidateRunId }) as Promise<EngineeringRunComparisonIpcResponse>,
    exportEngineeringPdf: (request: EngineeringReportExportRequest) => {
      const channel = request.mediaType === 'application/pdf' ? ENGINEERING_PDF_EXPORT_CHANNEL : ENGINEERING_REPORT_TEXT_EXPORT_CHANNEL;
      return invoke(channel, { channel, payload: request }) as Promise<EngineeringPdfIpcResponse | EngineeringReportTextIpcResponse>;
    },
    getLicenseStatus: () => invoke(LICENSE_STATUS_CHANNEL, { channel: LICENSE_STATUS_CHANNEL }) as Promise<LicenseStatusIpcResponse>,
    importLicense: () => invoke(LICENSE_IMPORT_CHANNEL, { channel: LICENSE_IMPORT_CHANNEL }) as Promise<LicenseImportIpcResponse>,
    importVerificationEvidence: () => invoke(VERIFICATION_EVIDENCE_IMPORT_CHANNEL, { channel: VERIFICATION_EVIDENCE_IMPORT_CHANNEL }) as Promise<VerificationEvidenceImportIpcResponse>,
    listVerificationEvidencePackages: () => invoke(VERIFICATION_EVIDENCE_HISTORY_CHANNEL, { channel: VERIFICATION_EVIDENCE_HISTORY_CHANNEL }) as Promise<VerificationEvidenceHistoryIpcResponse>,
    loadVerificationEvidencePackage: (packageId: string) => invoke(VERIFICATION_EVIDENCE_LOAD_CHANNEL, { channel: VERIFICATION_EVIDENCE_LOAD_CHANNEL, packageId }) as Promise<VerificationEvidenceLoadIpcResponse>,
  });
}
