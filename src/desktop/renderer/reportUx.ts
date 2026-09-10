import type { ReportExportPresentation } from './reportPresentation';

export interface ReportWorkspaceSummary {
  readonly title: string;
  readonly identity: string;
  readonly formats: readonly string[];
  readonly method: string;
}

export function reportWorkspaceSummary(report: Readonly<ReportExportPresentation>): Readonly<ReportWorkspaceSummary> {
  return Object.freeze({
    title: 'گزارش مهندسی آماده صدور است',
    identity: `Run ${report.runId} · Engine ${report.engineVersion}`,
    formats: Object.freeze([report.htmlMediaType, report.jsonMediaType, report.pdfRequest.mediaType]),
    method: report.bundleMethod,
  });
}
