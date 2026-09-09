import { describe, expect, it } from 'vitest';
import { FinalEngineeringOutput } from './finalEngineeringOutput';
import {
  buildEngineeringReportExportBundle,
  buildPersianEngineeringReportDocument,
  serializeFinalEngineeringOutputJson,
} from './engineeringReportExport';
import { renderPersianEngineeringReportHtml } from './engineeringReportHtml';

function fixture(): FinalEngineeringOutput {
  return {
    runId: 'RUN-REPORT-001',
    engineVersion: '0.1.0',
    generatedAtIso: '2026-09-08T12:00:00.000Z',
    completeness: 'complete',
    decision: {
      overallStatus: 'PROJECT_QUALIFIED_ACCEPTABLE',
      pressureFeasibility: 'PASS',
      stability: 'ACCEPTABLE',
      blockageRisk: 'ACCEPTABLE',
      qualificationScope: 'project_qualified',
    },
    keyResults: [{
      id: 'pipeline.requiredPressure',
      label: 'Required pipeline pressure',
      value: 1_250_000,
      unit: 'Pa',
      validationStatus: 'candidate',
      evidenceStatus: 'DOCUMENTED',
      resultClass: 'COMPOSITE_ENGINEERING_RESULT',
      methodId: 'tolue-pipeline-pressure-v2',
      provenanceEntityIds: ['PROV-LOCAL-001'],
      calibrationIds: ['LOCAL-CAL-001'],
    }],
    diagnostics: [{
      id: 'diagnostic.pumpability.projectQualified',
      kind: 'PUMPABILITY_PROJECT_QUALIFIED',
      severity: 'info',
      title: 'Project-qualified pumpability evidence is acceptable',
      message: 'Project-qualified evidence is acceptable for the supplied domains.',
      sourceResultIds: ['pumpability.decisionStatus'],
      sourceRunId: 'RUN-REPORT-001',
      inputSnapshotHash: 'fnv1a32:12345678',
      ruleId: 'DX-PUMPABILITY-QUALIFIED-001',
      ruleVersion: '1.0.0',
      basis: 'project_qualified_evidence',
      validationStatus: 'candidate',
      recommendation: null,
    }],
    warnings: ['Test warning'],
    limitations: ['Project-specific qualification only.'],
    traceability: {
      runId: 'RUN-REPORT-001',
      engineVersion: '0.1.0',
      inputSnapshotHash: 'fnv1a32:12345678',
      sourceMethodIds: ['tolue-pipeline-pressure-v2'],
      resultIds: ['pipeline.requiredPressure'],
      provenanceEntityIds: ['PROV-LOCAL-001'],
      calibrationIds: ['LOCAL-CAL-001'],
      diagnosticRuleIds: ['DX-PUMPABILITY-QUALIFIED-001'],
    },
    renderTargets: ['desktop_ui', 'pdf_report', 'json_export'],
    representation: 'engineering_output_contract',
    scientificClaim: 'derived_from_engineering_core_only',
    method: 'tolue-final-engineering-output-v1',
  };
}

describe('TOLUE engineering report export', () => {
  it('builds a Persian RTL report without changing raw engineering semantics', () => {
    const output = fixture();
    const report = buildPersianEngineeringReportDocument(output);

    expect(report.locale).toBe('fa-IR');
    expect(report.direction).toBe('rtl');
    expect(report.titleFa).toContain('گزارش مهندسی');
    expect(report.decision.overallStatus).toBe(output.decision.overallStatus);
    expect(report.decision.overallStatusFa).toContain('پروژه');
    expect(report.keyResults[0]?.rawValue).toBe(1_250_000);
    expect(report.keyResults[0]?.unit).toBe('Pa');
    expect(report.keyResults[0]?.validationStatus).toBe('candidate');
    expect(report.keyResults[0]?.evidenceStatus).toBe('DOCUMENTED');
    expect(report.scientificClaim).toBe('presentation_only_no_new_engineering_inference');
  });

  it('renders deterministic print-ready RTL HTML without changing report values', () => {
    const report = buildPersianEngineeringReportDocument(fixture());
    const a = renderPersianEngineeringReportHtml(report);
    const b = renderPersianEngineeringReportHtml(report);

    expect(a).toEqual(b);
    expect(a.mediaType).toBe('text/html');
    expect(a.encoding).toBe('utf-8');
    expect(a.method).toBe('tolue-persian-engineering-report-html-v1');
    expect(a.content).toContain('<html lang="fa" dir="rtl">');
    expect(a.content).toContain('@page { size: A4;');
    expect(a.content).toContain('1250000');
    expect(a.content).toContain('fnv1a32:12345678');
    expect(a.content).toContain('هیچ استنتاج، ضریب یا مدل مهندسی جدیدی اعمال نمی‌شود');
  });

  it('escapes dynamic HTML content instead of allowing markup injection', () => {
    const output = fixture();
    output.warnings = ['<script>alert("x")</script>'];
    const html = renderPersianEngineeringReportHtml(buildPersianEngineeringReportDocument(output));

    expect(html.content).not.toContain('<script>alert("x")</script>');
    expect(html.content).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('serializes the exact final output as parseable UTF-8 JSON content', () => {
    const output = fixture();
    const text = serializeFinalEngineeringOutputJson(output);
    expect(JSON.parse(text)).toEqual(output);
  });

  it('builds a deterministic export bundle with identity, HTML and traceability preserved', () => {
    const output = fixture();
    const a = buildEngineeringReportExportBundle(output);
    const b = buildEngineeringReportExportBundle(output);

    expect(a).toEqual(b);
    expect(a.runId).toBe(output.runId);
    expect(a.engineVersion).toBe(output.engineVersion);
    expect(a.inputSnapshotHash).toBe(output.traceability.inputSnapshotHash);
    expect(a.report.traceability.provenanceEntityIds).toEqual(['PROV-LOCAL-001']);
    expect(a.report.traceability.calibrationIds).toEqual(['LOCAL-CAL-001']);
    expect(a.html.mediaType).toBe('text/html');
    expect(a.html.content).toContain('گزارش مهندسی رئولوژی و پمپ‌پذیری بتن');
    expect(a.json.mediaType).toBe('application/json');
    expect(JSON.parse(a.json.content)).toEqual(output);
    expect(a.method).toBe('tolue-engineering-report-export-bundle-v2');
  });
});
