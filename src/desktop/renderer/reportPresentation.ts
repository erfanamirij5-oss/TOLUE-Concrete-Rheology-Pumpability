import {
  buildEngineeringReportTextExportRequest,
  type EngineeringPdfExportRequest,
  type EngineeringReportTextExportRequest,
} from '../../engineering/core/engineeringPdfExport';
import type { EngineeringReportExportBundle } from '../../engineering/core/engineeringReportExport';

export interface ReportExportPresentation {
  readonly runId: string;
  readonly engineVersion: string;
  readonly inputSnapshotHash: string;
  readonly reportLocale: EngineeringReportExportBundle['report']['locale'];
  readonly reportDirection: EngineeringReportExportBundle['report']['direction'];
  readonly htmlMediaType: EngineeringReportExportBundle['html']['mediaType'];
  readonly jsonMediaType: EngineeringReportExportBundle['json']['mediaType'];
  readonly bundleMethod: EngineeringReportExportBundle['method'];
  readonly pdfRequest: Readonly<EngineeringPdfExportRequest>;
  readonly htmlRequest: Readonly<EngineeringReportTextExportRequest>;
  readonly jsonRequest: Readonly<EngineeringReportTextExportRequest>;
}

function freezeTextRequest(request: EngineeringReportTextExportRequest): Readonly<EngineeringReportTextExportRequest> {
  return Object.freeze({ ...request });
}

export function createReportExportPresentation(
  bundle: EngineeringReportExportBundle,
  pdfRequest: EngineeringPdfExportRequest,
): Readonly<ReportExportPresentation> {
  if (bundle.runId !== pdfRequest.runId) throw new Error('REPORT-PRESENTATION-RUN-001');
  if (bundle.engineVersion !== pdfRequest.engineVersion) throw new Error('REPORT-PRESENTATION-ENGINE-001');
  if (bundle.inputSnapshotHash !== pdfRequest.inputSnapshotHash) throw new Error('REPORT-PRESENTATION-HASH-001');
  const htmlRequest = buildEngineeringReportTextExportRequest(bundle, 'html');
  const jsonRequest = buildEngineeringReportTextExportRequest(bundle, 'json');
  return Object.freeze({
    runId: bundle.runId,
    engineVersion: bundle.engineVersion,
    inputSnapshotHash: bundle.inputSnapshotHash,
    reportLocale: bundle.report.locale,
    reportDirection: bundle.report.direction,
    htmlMediaType: bundle.html.mediaType,
    jsonMediaType: bundle.json.mediaType,
    bundleMethod: bundle.method,
    pdfRequest: Object.freeze({
      ...pdfRequest,
      page: Object.freeze({
        ...pdfRequest.page,
        marginsMm: Object.freeze({ ...pdfRequest.page.marginsMm }),
      }),
    }),
    htmlRequest: freezeTextRequest(htmlRequest),
    jsonRequest: freezeTextRequest(jsonRequest),
  });
}
