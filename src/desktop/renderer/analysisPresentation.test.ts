import { describe, expect, it } from 'vitest';
import { createEngineeringAnalysisPresentation } from './analysisPresentation';

describe('engineering analysis presentation data flow', () => {
  it('fails closed for a blocked analysis without manufacturing downstream outputs', () => {
    const presentation = createEngineeringAnalysisPresentation({
      runId: 'run-blocked', engineVersion: 'v1', executionStatus: 'BLOCKED', inputSnapshotHash: null,
      simulation: null, resultCenter: null, diagnostics: null, pumpabilityDecision: null, finalOutput: null,
      reportExport: null, pdfExportRequest: null, visualization3d: null, completeness: 'incomplete',
      method: 'tolue-engineering-analysis-orchestrator-v6',
      readiness: { status: 'BLOCKED', canExecute: false, issues: [], method: 'tolue-engineering-readiness-gate-v2' },
    });
    expect(presentation.executionStatus).toBe('BLOCKED');
    expect(presentation.inputSnapshotHash).toBeNull();
    expect(presentation.pipeline).toBeNull();
    expect(presentation.pump).toBeNull();
    expect(presentation.results).toBeNull();
    expect(presentation.diagnostics).toBeNull();
    expect(presentation.report).toBeNull();
    expect(Object.isFrozen(presentation)).toBe(true);
  });
});
