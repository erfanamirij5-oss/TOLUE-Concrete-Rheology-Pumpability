import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import { createDiagnosticsPresentation, type DiagnosticsPresentation } from './diagnosticsPresentation';
import { createPipelinePresentation, type PipelinePresentation } from './pipelinePresentation';
import { createPressureProfilePresentation, type PressureProfilePresentation } from './pressureProfilePresentation';
import { createPumpCapabilityPresentation, type PumpCapabilityPresentation } from './pumpPresentation';
import { createReportExportPresentation, type ReportExportPresentation } from './reportPresentation';
import { createResultCenterPresentation, type ResultCenterPresentation } from './resultPresentation';

export interface EngineeringAnalysisPresentation {
  readonly runId: string;
  readonly engineVersion: string;
  readonly executionStatus: EngineeringAnalysisResult['executionStatus'];
  readonly completeness: EngineeringAnalysisResult['completeness'];
  readonly inputSnapshotHash: string | null;
  readonly pipeline: Readonly<PipelinePresentation> | null;
  readonly pressureProfile: Readonly<PressureProfilePresentation> | null;
  readonly pump: Readonly<PumpCapabilityPresentation> | null;
  readonly results: Readonly<ResultCenterPresentation> | null;
  readonly diagnostics: Readonly<DiagnosticsPresentation> | null;
  readonly report: Readonly<ReportExportPresentation> | null;
}

export function createEngineeringAnalysisPresentation(
  analysis: EngineeringAnalysisResult,
): Readonly<EngineeringAnalysisPresentation> {
  if (analysis.executionStatus === 'BLOCKED') {
    return Object.freeze({
      runId: analysis.runId,
      engineVersion: analysis.engineVersion,
      executionStatus: analysis.executionStatus,
      completeness: analysis.completeness,
      inputSnapshotHash: null,
      pipeline: null,
      pressureProfile: null,
      pump: null,
      results: null,
      diagnostics: null,
      report: null,
    });
  }

  return Object.freeze({
    runId: analysis.runId,
    engineVersion: analysis.engineVersion,
    executionStatus: analysis.executionStatus,
    completeness: analysis.completeness,
    inputSnapshotHash: analysis.inputSnapshotHash,
    pipeline: createPipelinePresentation(analysis.simulation.pipeline),
    pressureProfile: createPressureProfilePresentation(analysis.simulation.pressureProfile),
    pump: analysis.simulation.pumpAssessment
      ? createPumpCapabilityPresentation(analysis.simulation.pumpAssessment)
      : null,
    results: createResultCenterPresentation(analysis.resultCenter, analysis.pumpabilityDecision),
    diagnostics: createDiagnosticsPresentation(analysis.diagnostics),
    report: createReportExportPresentation(analysis.reportExport, analysis.pdfExportRequest),
  });
}
