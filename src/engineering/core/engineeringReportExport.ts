import { FinalEngineeringOutput, FinalEngineeringKeyResult } from './finalEngineeringOutput';
import { EngineeringReportHtmlExport, renderPersianEngineeringReportHtml } from './engineeringReportHtml';
import { mergeScientificClaimBoundaries } from './claimBoundaries';

export type EngineeringReportDirection = 'rtl';
export type EngineeringReportLocale = 'fa-IR';

export interface EngineeringReportValueRow {
  id: string;
  labelFa: string;
  rawValue: FinalEngineeringKeyResult['value'];
  unit: string | null;
  validationStatus: FinalEngineeringKeyResult['validationStatus'];
  validationStatusFa: string;
  evidenceStatus: FinalEngineeringKeyResult['evidenceStatus'];
  evidenceStatusFa: string;
  resultClass: FinalEngineeringKeyResult['resultClass'];
  resultClassFa: string;
  methodId: string;
}

export interface EngineeringReportDiagnosticRow {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  severityFa: string;
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
  DOCUMENTED: 'مستندسازی‌شده',
  PRELIMINARY: 'شواهد مقدماتی',
  BLOCKED: 'مسدود',
  verified: 'تأییدشده',
  candidate: 'کاندید مهندسی',
  preliminary: 'مقدماتی',
  out_of_domain: 'خارج از دامنه',
  insufficient_data: 'داده ناکافی',
  blocked: 'مسدود',
  project_qualified: 'تأییدشده در دامنه پروژه',
  partially_qualified: 'تأییدشده به‌صورت جزئی',
  pressure_only: 'فقط ارزیابی فشار',
  failed: 'ناموفق',
};

const RESULT_CLASS_FA: Record<string,string> = {
  pressure: 'فشار',
  pumpability: 'پمپ‌پذیری',
  rheology: 'رئولوژی',
  stability: 'پایداری',
  blockage: 'ریسک انسداد',
};

const SEVERITY_FA: Record<string,string> = { info:'اطلاع', warning:'هشدار', critical:'بحرانی' };

const REPORT_TEXT_FA: Record<string,string> = {
  'Engineering analysis is incomplete':'تحلیل مهندسی کامل نیست.',
  'One or more required engineering contributions are unavailable; dependent conclusions must not be treated as complete.':'یک یا چند جزء موردنیاز تحلیل در دسترس نیست؛ نتایج وابسته نباید کامل تلقی شوند.',
  'Insufficient data for one or more results':'برای یک یا چند نتیجه، داده کافی وجود ندارد.',
  'Available pump pressure is insufficient':'فشار در دسترس پمپ کافی نیست.',
  'Modeled pump pressure is nominally adequate':'فشار مدل‌شده پمپ در دبی هدف از نظر اسمی کافی است.',
  'Project-qualified stability evidence is unacceptable':'شواهد پایداری واجد شرایط پروژه قابل قبول نیست.',
  'The supplied in-domain project-qualified stability evidence reports an unacceptable outcome. This is project-specific and is not a universal stability model.':'شواهد پایداری معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی پایداری بتن محسوب نمی‌شود.',
  'Project-qualified blockage evidence is unacceptable':'شواهد ریسک انسداد واجد شرایط پروژه قابل قبول نیست.',
  'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.':'شواهد ریسک انسداد معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی انسداد محسوب نمی‌شود.',
  'Project-qualified pumpability evidence is acceptable':'شواهد پمپ‌پذیری در دامنه پروژه قابل قبول است.',
  'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.':'کفایت فشار، شواهد پایداری و شواهد انسداد در دامنه‌های تعریف‌شده پروژه قابل قبول هستند؛ این نتیجه گواهی عمومی برای همه شرایط نیست.',
  'Pumpability evidence is only partially qualified':'شواهد پمپ‌پذیری فقط به‌صورت جزئی واجد شرایط است.',
  'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.':'فشار قابل تأمین است و یکی از حوزه‌های شواهد پروژه‌ای قابل قبول است، اما حوزه دیگر پایداری/انسداد در دامنه مربوطه به‌طور کامل ارزیابی نشده است.',
  'Pressure feasibility alone is not a complete pumpability assessment':'کفایت فشار به‌تنهایی ارزیابی کامل پمپ‌پذیری بتن محسوب نمی‌شود.',
  'Stability and blockage conclusions are project-qualified evidence statements, not universal concrete behavior models':'نتایج پایداری و انسداد بر پایه شواهد واجد شرایط پروژه هستند و مدل عمومی رفتار بتن محسوب نمی‌شوند.',
  'OUT_OF_DOMAIN evidence is not extrapolated and contributes no acceptable/unacceptable conclusion':'شواهد خارج از دامنه تعمیم داده نمی‌شوند و در نتیجه قابل قبول/غیرقابل قبول دخالت داده نمی‌شوند.',
  'No arbitrary safety factor, marginal band, slump threshold, stability threshold, or blockage threshold is introduced by this decision layer':'در این لایه تصمیم هیچ ضریب ایمنی دلخواه، ناحیه مرزی، آستانه اسلامپ، آستانه پایداری یا آستانه انسداد اضافه نمی‌شود.',
  'Stability and blockage conclusions are project-qualified evidence decisions, not universal physical predictions':'نتایج پایداری و انسداد تصمیم‌های مبتنی بر شواهد پروژه هستند و پیش‌بینی فیزیکی عمومی محسوب نمی‌شوند.',
  'The current engineering core does not compute an exact physical blockage location; any spatial blockage marker is illustrative/diagnostic only':'هسته مهندسی فعلی محل فیزیکی دقیق انسداد را محاسبه نمی‌کند؛ هر نشانگر مکانی انسداد صرفاً نمایشی/تشخیصی است.',
  'The current visualization is not CFD or DEM and must not be represented as a CFD/DEM simulation':'نمایش فعلی شبیه‌سازی CFD یا DEM نیست و نباید به‌عنوان چنین شبیه‌سازی‌ای معرفی شود.',
  'A non-negative pump pressure margin is a modeled pressure-feasibility result, not a reliability, safety-factor, or operational certification':'حاشیه فشار غیرمنفی فقط نتیجه مدل‌شده کفایت فشار است و گواهی قابلیت اطمینان، ضریب ایمنی یا تأیید عملیاتی محسوب نمی‌شود.',
};

function fa(value: string): string { return STATUS_FA[value] ?? value; }
function reportTextFa(value:string):string {
  if(REPORT_TEXT_FA[value])return REPORT_TEXT_FA[value];
  let match=value.match(/^(\d+) engineering result\(s\) are explicitly marked insufficient_data\.$/);
  if(match)return `${match[1]} نتیجه مهندسی صراحتاً با وضعیت «داده ناکافی» علامت‌گذاری شده است.`;
  match=value.match(/^Available pressure is below modeled required pressure by ([\d.]+) Pa at the target flow\.$/);
  if(match)return `فشار در دسترس در دبی هدف، ${match[1]} پاسکال کمتر از فشار موردنیاز مدل‌شده است.`;
  match=value.match(/^Available pressure exceeds or equals modeled required pressure by ([\d.]+) Pa at the target flow\. This is not a safety-factor or reliability certification\.$/);
  if(match)return `فشار در دسترس در دبی هدف، ${match[1]} پاسکال بیشتر یا مساوی فشار موردنیاز مدل‌شده است. این نتیجه ضریب ایمنی یا گواهی قابلیت اطمینان نیست.`;
  return value;
}
function cloneStrings(values: readonly string[]): string[] { return [...values]; }

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
      validationStatusFa: fa(result.validationStatus),
      evidenceStatus: result.evidenceStatus,
      evidenceStatusFa: fa(result.evidenceStatus),
      resultClass: result.resultClass,
      resultClassFa: RESULT_CLASS_FA[result.resultClass] ?? result.resultClass,
      methodId: result.methodId,
    })),
    diagnostics: output.diagnostics.map(finding => ({
      id: finding.id,
      severity: finding.severity,
      severityFa: SEVERITY_FA[finding.severity] ?? finding.severity,
      title: reportTextFa(finding.title),
      message: reportTextFa(finding.message),
      ruleId: finding.ruleId,
      sourceResultIds: cloneStrings(finding.sourceResultIds),
    })),
    warnings: output.warnings.map(reportTextFa),
    limitations: mergeScientificClaimBoundaries(output.limitations).map(reportTextFa),
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
