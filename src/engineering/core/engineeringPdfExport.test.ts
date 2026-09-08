import { describe, expect, it } from 'vitest';
import { EngineeringReportExportBundle } from './engineeringReportExport';
import { buildEngineeringPdfExportRequest } from './engineeringPdfExport';

function fixture(): EngineeringReportExportBundle {
  return {
    runId: 'RUN/PDF:001',
    engineVersion: '0.1.0',
    inputSnapshotHash: 'fnv1a32:12345678',
    report: {
      runId: 'RUN/PDF:001',
      engineVersion: '0.1.0',
      generatedAtIso: '2026-09-08T12:00:00.000Z',
      locale: 'fa-IR',
      direction: 'rtl',
      titleFa: 'گزارش مهندسی رئولوژی و پمپ‌پذیری بتن — TOLUE',
      decision: {
        overallStatus: 'PRESSURE_ONLY_ACCEPTABLE',
        overallStatusFa: 'قابل قبول فقط از نظر فشار',
        pressureFeasibility: 'PASS',
        pressureFeasibilityFa: 'قابل قبول',
        stability: 'NOT_ASSESSED',
        stabilityFa: 'ارزیابی نشده',
        blockageRisk: 'NOT_ASSESSED',
        blockageRiskFa: 'ارزیابی نشده',
        qualificationScope: 'pressure_only',
        qualificationScopeFa: 'فقط ارزیابی فشار',
      },
      keyResults: [],
      diagnostics: [],
      warnings: [],
      limitations: [],
      traceability: {
        runId: 'RUN/PDF:001',
        engineVersion: '0.1.0',
        inputSnapshotHash: 'fnv1a32:12345678',
        sourceMethodIds: [],
        provenanceEntityIds: [],
        calibrationIds: [],
        diagnosticRuleIds: [],
      },
      representation: 'persian_engineering_report_document',
      scientificClaim: 'presentation_only_no_new_engineering_inference',
      method: 'tolue-persian-engineering-report-v1',
    },
    html: {
      mediaType: 'text/html',
      encoding: 'utf-8',
      content: '<!doctype html><html lang="fa" dir="rtl"><body>report</body></html>',
      method: 'tolue-persian-engineering-report-html-v1',
    },
    json: {
      mediaType: 'application/json',
      encoding: 'utf-8',
      content: '{}',
      method: 'tolue-final-output-json-export-v1',
    },
    method: 'tolue-engineering-report-export-bundle-v2',
  };
}

describe('TOLUE engineering PDF export request', () => {
  it('builds a deterministic A4 request without performing file I/O', () => {
    const a = buildEngineeringPdfExportRequest(fixture());
    const b = buildEngineeringPdfExportRequest(fixture());

    expect(a).toEqual(b);
    expect(a.mediaType).toBe('application/pdf');
    expect(a.sourceMediaType).toBe('text/html');
    expect(a.page.format).toBe('A4');
    expect(a.page.landscape).toBe(false);
    expect(a.page.printBackground).toBe(true);
    expect(a.page.preferCssPageSize).toBe(true);
    expect(a.rendererBoundary).toBe('privileged_desktop_main_process');
    expect(a.scientificClaim).toBe('presentation_only_no_new_engineering_inference');
  });

  it('sanitizes the suggested filename while preserving run identity separately', () => {
    const request = buildEngineeringPdfExportRequest(fixture());
    expect(request.runId).toBe('RUN/PDF:001');
    expect(request.fileName).toBe('TOLUE-Engineering-Report-RUN-PDF-001.pdf');
    expect(request.fileName).not.toContain('/');
    expect(request.fileName).not.toContain(':');
  });

  it('preserves the exact HTML payload and traceability identity', () => {
    const bundle = fixture();
    const request = buildEngineeringPdfExportRequest(bundle);
    expect(request.html).toBe(bundle.html.content);
    expect(request.inputSnapshotHash).toBe(bundle.inputSnapshotHash);
    expect(request.engineVersion).toBe(bundle.engineVersion);
    expect(request.method).toBe('tolue-engineering-pdf-export-request-v1');
  });

  it('fails closed for an empty HTML source', () => {
    const bundle = fixture();
    bundle.html.content = '   ';
    expect(() => buildEngineeringPdfExportRequest(bundle)).toThrow(/HTML source/);
  });
});
