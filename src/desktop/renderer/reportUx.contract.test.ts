import { describe, expect, it } from 'vitest';
import type { ReportExportPresentation } from './reportPresentation';
import { reportWorkspaceSummary } from './reportUx';

describe('report UX contract boundary', () => {
  it('does not infer report formats or method outside the presentation contract', () => {
    const report = {
      runId: 'r', engineVersion: 'e', htmlMediaType: 'text/html', jsonMediaType: 'application/json',
      bundleMethod: 'tolue-engineering-report-export-bundle-v2', pdfRequest: { mediaType: 'application/pdf' },
    } as unknown as ReportExportPresentation;
    const summary = reportWorkspaceSummary(report);
    expect(summary.formats.join('|')).toBe('text/html|application/json|application/pdf');
    expect(summary.method).toBe(report.bundleMethod);
  });
});
