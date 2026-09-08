import { FinalEngineeringOutput, FinalEngineeringKeyResult } from './finalEngineeringOutput';
import { EngineeringReportHtmlExport, renderPersianEngineeringReportHtml } from './engineeringReportHtml';

export type EngineeringReportDirection = 'rtl';
export type EngineeringReportLocale = 'fa-IR';

export interface EngineeringReportValueRow {
  id: string;
  labelFa: string;
  rawValue: FinalEngineeringKeyResult['value'];
  unit: string | null;
  validationStatus: FinalEngineeringKeyResult['validationStatus'];
  evidenceStatus: FinalEngineeringKeyResult['evidenceStatus'];
  resultClass: FinalEngineeringKeyResult['resultClass'];
  methodId: string;
}

export interface EngineeringReportDiagnosticRow {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  ruleId: string;
  sourceResultIds: string[];
}

export interface EngineeringReportTraceabilityBlock {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  sourceMethodIds: string[];
  provenanceEntityIds: string[];
  calibrationIds: string[];
  diagnosticRuleIds: string[];
}

export interface PersianEngineeringReportDocument {
  runId: string;
  engineVersion: string;
  generatedAtIso: string;
  locale: EngineeringReportLocale;
  direction: EngineeringReportDirection;
  titleFa: 'گزارش مهندسی رئولوژی و پمپ‌پذیری بتن — TOLUE';
  decision: {
    overallStatus: FinalEngineeringOutput['decision']['overallStatus'];
    overallStatusFa: string;
    pressureFeasibility: FinalEngineeringOutput['decision']['pressureFeasibility'];
    pressureFeasibilityFa: string;
    stability: FinalEngineeringOutput['decision']['stability'];
    stabilityFa: string;
    blockageRisk: FinalEngineeringOutput['decision']['blockageRisk'];
    blockageRiskFa: string;
    qualificationScope: FinalEngineeringOutput['decision']['qualificationScope'];
    qualificationScopeFa: string;
  };
  keyResults: EngineeringReportValueRow[];
  diagnostics: EngineeringReportDiagnosticRow[];
  warnings: string[];
  limitations: string[];
  traceability: EngineeringReportTraceabilityBlock;
  representation: 'persian_engineering_report_document';
  scientificClaim: 'presentation_only_no_new_engineering_inference';
  method: 'tolue-persian-engineering-report-v1';
}

export interface EngineeringReportExportBundle {
  runId: string;
  engineVersion: string;
  inputSnapshotHash: string;
  report: PersianEngineeringReportDocument;
  html: EngineeringReportHtmlExport;
  json: {
    mediaType: 'application/json';
    encoding: 'utf-8';
    content: string;
    method: 'tolue-final-output-json-export-v1';
  };
  method: 'tolue-engineering-report-export-bundle-v2';
}

const RESULT_LABELS_FA: Record<string, string> = {
  'pipeline.requiredPressure': 'فشار موردنیاز خط لوله',
  'pressureProfile.peakRequiredPressure': 'بیشینه فشار موردنیاز',
  'pump.availablePressure': 'فشار در دسترس پمپ در دبی هدف',
  'pump.pressureMargin': 'حاشیه فشار پمپ',
  'pump.pressureUtilization': 'نسبت استفاده از ظرفیت فشار پمپ',
  'pumpability.stabilityEvidence': 'شواهد پایداری بتن',
  'pumpability.blockageEvidence': 'شواهد ریسک انسداد',
  'pumpability.decisionStatus': 'وضعیت نهایی تصمیم پمپ‌پذیری',
};

const STATUS_FA: Record<string, string> = {
  PROJECT_QUALIFIED_ACCEPTABLE: 'قابل قبول در دامنه شواهد تأییدشده پروژه',
  PARTIALLY_QUALIFIED_ACCEPTABLE: 'قابل قبول با تأیید پروژه‌ای ناقص',
  PRESSURE_ONLY_ACCEPTABLE: 'قابل قبول فقط از نظر فشار',
  FAIL_PRESSURE: 'ناموفق از نظر فشار',
  FAIL_STABILITY: 'ناموفق از نظر پایداری',
  FAIL_BLOCKAGE: 'ناموفق از نظر ریسک انسداد',
  INSUFFICIENT_DATA: 'داده ناکافی',
  PASS: 'قابل قبول',
  FAIL: 'ناموفق',
  ACCEPTABLE: 'قابل قبول',
  UNACCEPTABLE: 'غیرقابل قبول',
  NOT_ASSESSED: 'ارزیابی نشده',
  OUT_OF_DOMAIN: 'خارج از دامنه اعتبار',
  project_qualified: 'تأییدشده در دامنه پروژه',
  partially_qualified: 'تأییدشده به‌صورت جزئی',
  pressure_only: 'فقط ارزیابی فشار',
  failed: 'ناموفق',
  insufficient_data: 'داده ناکافی',
};

function fa(value: string): string {
  return STATUS_FA[value] ?? value;
}

function cloneStrings(values: readonly string[]): string[] {
  return [...values];
}

/**
 * Builds a Persian RTL presentation contract from the already-computed final
 * engineering output. This layer is intentionally presentation-only: it does
 * not recompute pressure, classify stability/blockage, apply thresholds, or
 * strengthen validation/evidence claims.
 */
export function buildPersianEngineeringReportDocument(output: FinalEngineeringOutput): PersianEngineeringReportDocument {
  return {
    runId: output.runId,
    engineVersion: output.engineVersion,
    generatedAtIso: output.generatedAtIso,
    locale: 'fa-IR',
    direction: 'rtl',
    titleFa: 'گزارش مهندسی رئولوژی و پمپ‌پذیری بتن — TOLUE',
    decision: {
      overallStatus: output.decision.overallStatus,
      overallStatusFa: fa(output.decision.overallStatus),
      pressureFeasibility: output.decision.pressureFeasibility,
      pressureFeasibilityFa: fa(output.decision.pressureFeasibility),
      stability: output.decision.stability,
      stabilityFa: fa(output.decision.stability),
      blockageRisk: output.decision.blockageRisk,
      blockageRiskFa: fa(output.decision.blockageRisk),
      qualificationScope: output.decision.qualificationScope,
      qualificationScopeFa: fa(output.decision.qualificationScope),
    },
    keyResults: output.keyResults.map(result => ({
      id: result.id,
      labelFa: RESULT_LABELS_FA[result.id] ?? result.label,
      rawValue: result.value,
      unit: result.unit,
      validationStatus: result.validationStatus,
      evidenceStatus: result.evidenceStatus,
      resultClass: result.resultClass,
      methodId: result.methodId,
    })),
    diagnostics: output.diagnostics.map(finding => ({
      id: finding.id,
      severity: finding.severity,
      title: finding.title,
      message: finding.message,
      ruleId: finding.ruleId,
      sourceResultIds: cloneStrings(finding.sourceResultIds),
    })),
    warnings: cloneStrings(output.warnings),
    limitations: cloneStrings(output.limitations),
    traceability: {
      runId: output.traceability.runId,
      engineVersion: output.traceability.engineVersion,
      inputSnapshotHash: output.traceability.inputSnapshotHash,
      sourceMethodIds: cloneStrings(output.traceability.sourceMethodIds),
      provenanceEntityIds: cloneStrings(output.traceability.provenanceEntityIds),
      calibrationIds: cloneStrings(output.traceability.calibrationIds),
      diagnosticRuleIds: cloneStrings(output.traceability.diagnosticRuleIds),
    },
    representation: 'persian_engineering_report_document',
    scientificClaim: 'presentation_only_no_new_engineering_inference',
    method: 'tolue-persian-engineering-report-v1',
  };
}

/** Machine-readable export of the exact FinalEngineeringOutput contract. */
export function serializeFinalEngineeringOutputJson(output: FinalEngineeringOutput): string {
  return JSON.stringify(output, null, 2);
}

export function buildEngineeringReportExportBundle(output: FinalEngineeringOutput): EngineeringReportExportBundle {
  const report = buildPersianEngineeringReportDocument(output);
  const html = renderPersianEngineeringReportHtml(report);
  return {
    runId: output.runId,
    engineVersion: output.engineVersion,
    inputSnapshotHash: output.traceability.inputSnapshotHash,
    report,
    html,
    json: {
      mediaType: 'application/json',
      encoding: 'utf-8',
      content: serializeFinalEngineeringOutputJson(output),
      method: 'tolue-final-output-json-export-v1',
    },
    method: 'tolue-engineering-report-export-bundle-v2',
  };
}
