import { describe, expect, it } from 'vitest';
import type { ReportExportPresentation } from './reportPresentation';
import { reportWorkspaceSummary } from './reportUx';

const report = {
  runId: 'run-001',
  engineVersion: 'engine-1',
  inputSnapshotHash: 'hash-001',
  reportLocale: 'fa-IR',
  reportDirection: 'rtl',
  htmlMediaType: 'text/html',
  jsonMediaType: 'application/json',
  bundleMethod: 'tolue-engineering-report-export-bundle-v2',
  pdfRequest: { mediaType: 'application/pdf' },
} as unknown as ReportExportPresentation;

describe('report workspace UX', () => {
  it('summarizes only the existing report/export contract', () => {
    const summary = reportWorkspaceSummary(report);
    expect(summary.title).toContain('آماده');
    expect(summary.identity).toContain('run-001');
    expect(summary.formats).toEqual(['text/html', 'application/json', 'application/pdf']);
    expect(summary.method).toBe('tolue-engineering-report-export-bundle-v2');
    expect(Object.isFrozen(summary)).toBe(true);
    expect(Object.isFrozen(summary.formats)).toBe(true);
  });
});
