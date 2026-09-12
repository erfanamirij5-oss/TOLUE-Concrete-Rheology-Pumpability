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
    expect(report.keyResults[0]?.displayValueFa).toContain('۱');
    expect(report.keyResults[0]?.methodLabelFa).toBe('محاسبه فشار خط لوله');
    expect(report.keyResults[0]?.unit).toBe('Pa');
    expect(report.keyResults[0]?.validationStatus).toBe('candidate');
    expect(report.keyResults[0]?.evidenceStatus).toBe('DOCUMENTED');
    expect(report.diagnostics[0]?.title).toBe('شواهد پمپ‌پذیری در دامنه پروژه قابل قبول است.');
    expect(report.diagnostics[0]?.message).toBe('شواهد واجد شرایط پروژه در دامنه‌های ارائه‌شده قابل قبول است.');
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
    expect(a.content).toContain('@page { size: A4 portrait;');
    expect(a.content).toContain('margin: 5mm;');
    expect(a.content).toContain(report.keyResults[0]!.displayValueFa);
    expect(a.content).toContain('fnv1a32:12345678');
    expect(a.content).toContain('هیچ استنتاج، ضریب یا مدل مهندسی جدیدی اعمال نمی‌شود');
  });

  it('renders automatic stability/blockage analysis as Persian user-facing content', () => {
    const output = fixture();
    output.decision = { overallStatus: 'SCREENED_ACCEPTABLE', pressureFeasibility: 'PASS', stability: 'ACCEPTABLE', blockageRisk: 'ACCEPTABLE', qualificationScope: 'screened' };
    output.keyResults = [
      { id: 'pumpability.stabilityScreening', label: 'Automatic static stability screening', value: 'ACCEPTABLE', unit: null, validationStatus: 'preliminary', evidenceStatus: 'PRELIMINARY', resultClass: 'DERIVED_METRIC', methodId: 'tolue-static-segregation-screen-roussel-2006-v1', provenanceEntityIds: [], calibrationIds: [] },
      { id: 'pumpability.blockageScreening', label: 'Automatic aggregate-to-pipe blockage screening', value: 'ACCEPTABLE', unit: null, validationStatus: 'preliminary', evidenceStatus: 'PRELIMINARY', resultClass: 'DERIVED_METRIC', methodId: 'tolue-blockage-geometric-screen-v1', provenanceEntityIds: [], calibrationIds: [] },
    ];
    output.diagnostics = [{
      id: 'diagnostic.pumpability.screenedAcceptable', kind: 'PUMPABILITY_SCREENED_ACCEPTABLE', severity: 'info', title: 'Automatic stability and blockage engineering screens are acceptable', message: 'Pressure is feasible and the available automatic stability/blockage screening checks are acceptable. These screens are preliminary and do not replace project-qualified pumping trials or evidence.', sourceResultIds: ['pumpability.stabilityScreening','pumpability.blockageScreening'], sourceRunId: output.runId, inputSnapshotHash: output.traceability.inputSnapshotHash, ruleId: 'DX-PUMPABILITY-SCREEN-001', ruleVersion: '1.0.0', basis: 'engineering_screening', validationStatus: 'preliminary', recommendation: 'Use project-qualified trial, laboratory, or field evidence when a final project acceptance decision is required.',
    }];
    output.warnings = [];
    output.limitations = ['Stability and blockage conclusions identify whether they arise from project-qualified evidence or preliminary engineering screening; neither is a universal physical prediction.'];

    const bundle = buildEngineeringReportExportBundle(output);
    expect(bundle.report.decision.overallStatusFa).toContain('غربالگری مهندسی');
    expect(bundle.report.keyResults[0]?.labelFa).toContain('پایداری');
    expect(bundle.report.keyResults[0]?.displayValueFa).toBe('قابل قبول');
    expect(bundle.report.keyResults[0]?.resultClassFa).toBe('شاخص مشتق‌شده');
    expect(bundle.report.keyResults[0]?.methodLabelFa).toContain('راسل');
    expect(bundle.report.diagnostics[0]?.title).toContain('غربالگری خودکار');
    expect(bundle.report.diagnostics[0]?.recommendation).toContain('شواهد میدانی');
    expect(bundle.report.limitations).toContain('نتایج پایداری و انسداد مشخص می‌کنند که مبنا شواهد معتبر پروژه‌ای است یا غربالگری مهندسی مقدماتی؛ هیچ‌یک پیش‌بینی فیزیکی عمومی برای همه شرایط محسوب نمی‌شود.');
    expect(bundle.html.content).not.toContain('SCREENED_ACCEPTABLE');
    expect(bundle.html.content).not.toContain('DERIVED_METRIC');
    expect(bundle.html.content).not.toContain('Automatic stability and blockage engineering screens are acceptable');
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
