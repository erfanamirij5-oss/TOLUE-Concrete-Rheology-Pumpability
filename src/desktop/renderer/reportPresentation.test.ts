import { describe, expect, it } from 'vitest';
import { createReportExportPresentation } from './reportPresentation';

const bundle = {
  runId: 'run-1',
  engineVersion: 'v1',
  inputSnapshotHash: 'hash-1',
  report: {
    runId: 'run-1', engineVersion: 'v1', generatedAtIso: '2026-09-08T00:00:00.000Z', locale: 'fa-IR' as const, direction: 'rtl' as const,
    titleFa: 'گزارش مهندسی رئولوژی و پمپ‌پذیری بتن — TOLUE' as const,
    decision: {
      overallStatus: 'INSUFFICIENT_DATA' as const, overallStatusFa: 'داده ناکافی', pressureFeasibility: 'INSUFFICIENT_DATA' as const, pressureFeasibilityFa: 'داده ناکافی',
      stability: 'NOT_ASSESSED' as const, stabilityFa: 'ارزیابی نشده', blockageRisk: 'NOT_ASSESSED' as const, blockageRiskFa: 'ارزیابی نشده',
      qualificationScope: 'insufficient_data' as const, qualificationScopeFa: 'داده ناکافی',
    },
    keyResults: [], diagnostics: [], warnings: [], limitations: [],
    traceability: { runId: 'run-1', engineVersion: 'v1', inputSnapshotHash: 'hash-1', sourceMethodIds: [], provenanceEntityIds: [], calibrationIds: [], diagnosticRuleIds: [] },
    representation: 'persian_engineering_report_document' as const,
    scientificClaim: 'presentation_only_no_new_engineering_inference' as const,
    method: 'tolue-persian-engineering-report-v1' as const,
  },
  html: { mediaType: 'text/html' as const, encoding: 'utf-8' as const, content: '<html></html>', method: 'tolue-persian-engineering-report-html-v1' as const },
  json: { mediaType: 'application/json' as const, encoding: 'utf-8' as const, content: '{}', method: 'tolue-final-output-json-export-v1' as const },
  method: 'tolue-engineering-report-export-bundle-v2' as const,
};

const pdfRequest = {
  runId: 'run-1', engineVersion: 'v1', inputSnapshotHash: 'hash-1', fileName: 'TOLUE-Engineering-Report-run-1.pdf', html: '<html></html>',
  mediaType: 'application/pdf' as const, sourceMediaType: 'text/html' as const,
  page: { format: 'A4' as const, landscape: false as const, printBackground: true as const, preferCssPageSize: true as const, displayHeaderFooter: false as const, marginsMm: { top: 14, right: 14, bottom: 14, left: 14 } },
  rendererBoundary: 'privileged_desktop_main_process' as const,
  scientificClaim: 'presentation_only_no_new_engineering_inference' as const,
  method: 'tolue-engineering-pdf-export-request-v1' as const,
};

describe('report export presentation boundary', () => {
  it('preserves HTML, JSON and PDF export identity without changing the privileged boundary', () => {
    const presentation = createReportExportPresentation(bundle, pdfRequest);
    expect(presentation.reportLocale).toBe('fa-IR');
    expect(presentation.reportDirection).toBe('rtl');
    expect(presentation.htmlMediaType).toBe('text/html');
    expect(presentation.jsonMediaType).toBe('application/json');
    expect(presentation.pdfRequest.rendererBoundary).toBe('privileged_desktop_main_process');
    expect(presentation.pdfRequest.page.marginsMm).toEqual({ top: 14, right: 14, bottom: 14, left: 14 });
    expect(Object.isFrozen(presentation.pdfRequest.page.marginsMm)).toBe(true);
  });

  it('fails closed when report bundle and PDF request identity differ', () => {
    expect(() => createReportExportPresentation(bundle, { ...pdfRequest, inputSnapshotHash: 'other-hash' })).toThrow('REPORT-PRESENTATION-HASH-001');
  });
});
