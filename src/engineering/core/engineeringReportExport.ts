import { FinalEngineeringOutput, FinalEngineeringKeyResult } from './finalEngineeringOutput';
import { EngineeringReportHtmlExport, renderPersianEngineeringReportHtml } from './engineeringReportHtml';
import { mergeScientificClaimBoundaries } from './claimBoundaries';

export type EngineeringReportDirection = 'rtl';
export type EngineeringReportLocale = 'fa-IR';

export interface EngineeringReportValueRow {
  id: string;
  labelFa: string;
  rawValue: FinalEngineeringKeyResult['value'];
  displayValueFa: string;
  unit: string | null;
  validationStatus: FinalEngineeringKeyResult['validationStatus'];
  validationStatusFa: string;
  evidenceStatus: FinalEngineeringKeyResult['evidenceStatus'];
  evidenceStatusFa: string;
  resultClass: FinalEngineeringKeyResult['resultClass'];
  resultClassFa: string;
  methodId: string;
  methodLabelFa: string;
}

export interface EngineeringReportDiagnosticRow {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  severityFa: string;
  title: string;
  message: string;
  recommendation: string | null;
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
  json: { mediaType: 'application/json'; encoding: 'utf-8'; content: string; method: 'tolue-final-output-json-export-v1'; };
  method: 'tolue-engineering-report-export-bundle-v2';
}

const RESULT_LABELS_FA: Record<string, string> = {
  'pipeline.requiredPressure': 'فشار موردنیاز خط لوله',
  'pressureProfile.peakRequiredPressure': 'بیشینه فشار موردنیاز',
  'pump.availablePressure': 'فشار در دسترس پمپ در دبی هدف',
  'pump.pressureMargin': 'حاشیه فشار پمپ',
  'pump.pressureUtilization': 'نسبت استفاده از ظرفیت فشار پمپ',
  'pumpability.stabilityScreening': 'نتیجه غربالگری خودکار پایداری ایستا',
  'pumpability.stabilityCriticalYieldStress': 'تنش تسلیم بحرانی فاز معلق‌کننده برای پایداری ایستا',
  'pumpability.stabilityScreeningRatio': 'نسبت تنش تسلیم موجود به تنش تسلیم بحرانی پایداری',
  'pumpability.blockageScreening': 'نتیجه غربالگری خودکار ریسک انسداد هندسی',
  'pumpability.blockageAggregatePipeRatio': 'نسبت اندازه اسمی بیشینه سنگدانه به کوچک‌ترین قطر داخلی خط',
  'pumpability.blockageMinimumPipeDiameter': 'کوچک‌ترین قطر داخلی شناخته‌شده خط مستقیم',
  'pumpability.stabilityEvidence': 'شواهد پروژه‌ای پایداری بتن',
  'pumpability.blockageEvidence': 'شواهد پروژه‌ای ریسک انسداد',
  'pumpability.decisionStatus': 'وضعیت نهایی تصمیم پمپ‌پذیری',
};

const STATUS_FA: Record<string, string> = {
  PROJECT_QUALIFIED_ACCEPTABLE: 'قابل قبول در دامنه شواهد تأییدشده پروژه',
  SCREENED_ACCEPTABLE: 'قابل قبول در غربالگری مهندسی پایداری و انسداد',
  PARTIALLY_QUALIFIED_ACCEPTABLE: 'قابل قبول با تأیید پروژه‌ای ناقص',
  PARTIALLY_SCREENED_ACCEPTABLE: 'قابل قبول با غربالگری مهندسی ناقص',
  PRESSURE_ONLY_ACCEPTABLE: 'قابل قبول فقط از نظر فشار؛ پایداری/انسداد کامل نشده است',
  FAIL_PRESSURE: 'ناموفق از نظر فشار',
  FAIL_STABILITY: 'ناموفق از نظر پایداری',
  FAIL_BLOCKAGE: 'ناموفق از نظر ریسک انسداد',
  INSUFFICIENT_DATA: 'داده ناکافی', PASS: 'قابل قبول', FAIL: 'ناموفق',
  ACCEPTABLE: 'قابل قبول', UNACCEPTABLE: 'غیرقابل قبول', NOT_ASSESSED: 'ارزیابی نشده', OUT_OF_DOMAIN: 'خارج از دامنه اعتبار',
  DOCUMENTED: 'مستندسازی‌شده', PRELIMINARY: 'شواهد مقدماتی', BLOCKED: 'مسدود',
  verified: 'تأییدشده', candidate: 'کاندید مهندسی', preliminary: 'مقدماتی', out_of_domain: 'خارج از دامنه', insufficient_data: 'داده ناکافی', blocked: 'مسدود',
  project_qualified: 'تأییدشده در دامنه پروژه', screened: 'غربالگری مهندسی کامل', partially_qualified: 'تأییدشده به‌صورت جزئی', partially_screened: 'غربالگری مهندسی ناقص', pressure_only: 'فقط ارزیابی فشار', failed: 'ناموفق',
};

const RESULT_CLASS_FA: Record<string,string> = {
  STANDARD_REQUIREMENT: 'الزام/معیار استانداردی',
  PHYSICAL_MODEL: 'مدل فیزیکی',
  EMPIRICAL_MODEL: 'مدل تجربی',
  SOURCE_DATA: 'داده منبع',
  PROJECT_CALIBRATED_DATA: 'داده کالیبره‌شده پروژه',
  COMPOSITE_ENGINEERING_RESULT: 'نتیجه ترکیبی مهندسی',
  DERIVED_METRIC: 'شاخص مشتق‌شده',
  TOLUE_ENGINEERING_INDEX: 'شاخص مهندسی طلوع',
  AI_PREDICTION: 'پیش‌بینی هوش مصنوعی',
};

const METHOD_LABELS_FA: Record<string,string> = {
  'tolue-pipeline-pressure-v2':'محاسبه فشار خط لوله',
  'tolue-pressure-profile-v1':'پروفیل فشار خط لوله',
  'tolue-pump-capability-v1':'ارزیابی ظرفیت فشار پمپ',
  'tolue-project-qualified-pumpability-evidence-v1':'ارزیابی شواهد پروژه‌ای پمپ‌پذیری',
  'tolue-static-segregation-screen-roussel-2006-v1':'غربالگری پایداری ایستا بر مبنای معیار راسل',
  'tolue-blockage-geometric-screen-v1':'غربالگری هندسی ریسک انسداد سنگدانه/خط',
  'tolue-pumpability-risk-screening-v1':'غربالگری خودکار پایداری و انسداد',
  'tolue-pumpability-decision-v3':'تصمیم سه‌محوره پمپ‌پذیری طلوع',
};

const SEVERITY_FA: Record<string,string> = { info:'اطلاع', warning:'هشدار', critical:'بحرانی' };

const REPORT_TEXT_FA: Record<string,string> = {
  'Engineering analysis is incomplete':'تحلیل مهندسی کامل نیست.',
  'One or more required engineering contributions are unavailable; dependent conclusions must not be treated as complete.':'یک یا چند جزء موردنیاز تحلیل در دسترس نیست؛ نتایج وابسته نباید کامل تلقی شوند.',
  'Provide or validate the missing engineering inputs/models before relying on dependent results.':'پیش از اتکا به نتایج وابسته، ورودی‌ها یا مدل‌های مهندسی مفقود را تکمیل یا اعتبارسنجی کنید.',
  'Insufficient data for one or more results':'برای یک یا چند نتیجه، داده کافی وجود ندارد.',
  'Resolve the listed insufficient-data results; do not replace unknown contributions with assumed zero.':'موارد دارای داده ناکافی را برطرف کنید و سهم‌های ناشناخته را به‌صورت فرضی صفر در نظر نگیرید.',
  'Available pump pressure is insufficient':'فشار در دسترس پمپ کافی نیست.',
  'Modeled pump pressure is nominally adequate':'فشار مدل‌شده پمپ در دبی هدف از نظر اسمی کافی است.',
  'Reassess pump capability, target flow, pipeline geometry, or concrete/rheology inputs using validated data; no automatic design change is prescribed.':'توان پمپ، دبی هدف، هندسه خط لوله و ورودی‌های بتن/رئولوژی را با داده معتبر بازبینی کنید؛ هیچ تغییر خودکار طرح تجویز نمی‌شود.',
  'Project-qualified stability evidence is unacceptable':'شواهد پروژه‌ای پایداری قابل قبول نیست.',
  'The supplied in-domain project-qualified stability evidence reports an unacceptable outcome. This is project-specific and is not a universal stability model.':'شواهد پایداری معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی پایداری بتن محسوب نمی‌شود.',
  'Project-qualified blockage evidence is unacceptable':'شواهد پروژه‌ای ریسک انسداد قابل قبول نیست.',
  'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.':'شواهد ریسک انسداد معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی انسداد محسوب نمی‌شود.',
  'Review the documented project evidence, material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
  'Review the documented project evidence, route/material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، مسیر/سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
  'Project-qualified pumpability evidence is acceptable':'شواهد پمپ‌پذیری در دامنه پروژه قابل قبول است.',
  'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.':'کفایت فشار، شواهد پایداری و شواهد انسداد در دامنه‌های تعریف‌شده پروژه قابل قبول هستند؛ این نتیجه گواهی عمومی برای همه شرایط نیست.',
  'Pumpability evidence is only partially qualified':'شواهد پمپ‌پذیری فقط به‌صورت جزئی واجد شرایط است.',
  'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.':'فشار قابل تأمین است و یکی از حوزه‌های شواهد پروژه‌ای قابل قبول است، اما حوزه دیگر پایداری/انسداد در دامنه مربوطه به‌طور کامل ارزیابی نشده است.',
  'Obtain project-qualified evidence for the missing or out-of-domain stability/blockage domain before treating pumpability as fully qualified.':'پیش از تأیید کامل پمپ‌پذیری، برای حوزه مفقود یا خارج از دامنه پایداری/انسداد شواهد معتبر پروژه‌ای تهیه کنید.',
  'Automatic stability and blockage engineering screens are acceptable':'غربالگری خودکار مهندسی پایداری و ریسک انسداد قابل قبول است.',
  'Pressure is feasible and the available automatic stability/blockage screening checks are acceptable. These screens are preliminary and do not replace project-qualified pumping trials or evidence.':'فشار قابل تأمین است و کنترل‌های خودکار پایداری/انسداد موجود نتیجه قابل قبول دارند. این غربالگری‌ها مقدماتی هستند و جایگزین آزمون پمپاژ یا شواهد معتبر پروژه‌ای نمی‌شوند.',
  'Use project-qualified trial, laboratory, or field evidence when a final project acceptance decision is required.':'برای تصمیم نهایی پذیرش پروژه، از آزمون، داده آزمایشگاهی یا شواهد میدانی معتبر همان پروژه استفاده کنید.',
  'Automatic pumpability risk screening is incomplete':'غربالگری خودکار ریسک پمپ‌پذیری کامل نیست.',
  'Pressure is feasible and one automatic risk domain is acceptable, but the other stability/blockage domain does not have enough screening input data.':'فشار قابل تأمین است و یک حوزه ریسک خودکار قابل قبول است، اما برای حوزه دیگر پایداری/انسداد داده ورودی کافی وجود ندارد.',
  'Complete the missing automatic screening inputs and rerun the analysis before relying on the risk screen.':'ورودی‌های مفقود غربالگری خودکار را تکمیل و تحلیل را دوباره اجرا کنید.',
  'Static stability engineering screen is unacceptable':'غربالگری مهندسی پایداری ایستا قابل قبول نیست.',
  'The Roussel static segregation screen indicates that the supplied suspending-phase yield stress is below the calculated critical value for the supplied aggregate size and density contrast.':'معیار جدایش ایستای راسل نشان می‌دهد تنش تسلیم فاز معلق‌کننده از مقدار بحرانی محاسبه‌شده برای اندازه سنگدانه و اختلاف چگالی واردشده کمتر است.',
  'Review suspending-phase rheology, aggregate size/density, mixture stability measurements, and project-qualified evidence before pumping.':'پیش از پمپاژ، رئولوژی فاز معلق‌کننده، اندازه/چگالی سنگدانه، آزمون‌های پایداری مخلوط و شواهد پروژه‌ای را بازبینی کنید.',
  'Aggregate-to-pipe blockage screen is unacceptable':'غربالگری هندسی ریسک انسداد سنگدانه نسبت به خط قابل قبول نیست.',
  'The nominal maximum aggregate size exceeds the conservative one-third limit of the smallest known straight-pipe inside diameter.':'اندازه اسمی بیشینه سنگدانه از حد محافظه‌کارانه یک‌سوم کوچک‌ترین قطر داخلی شناخته‌شده لوله مستقیم بیشتر است.',
  'Review nominal maximum aggregate size and the minimum inside diameter of the complete pumping route, especially reducers, bends, hoses, valves, and boom components.':'اندازه اسمی بیشینه سنگدانه و حداقل قطر داخلی کل مسیر پمپاژ، به‌ویژه تبدیل‌ها، زانوها، شیلنگ‌ها، شیرها و اجزای بوم را بازبینی کنید.',
  'Pressure feasibility alone is not a complete pumpability assessment.':'کفایت فشار به‌تنهایی ارزیابی کامل پمپ‌پذیری بتن محسوب نمی‌شود.',
  'Project-qualified evidence has priority over engineering screening when valid in the current flow domain.':'شواهد معتبر پروژه‌ای، در صورت قرار داشتن دبی فعلی در دامنه اعتبار، بر غربالگری مهندسی اولویت دارند.',
  'Engineering screening results are preliminary engineering checks and are not universal safety or pumpability certifications.':'نتایج غربالگری مهندسی، کنترل‌های مقدماتی هستند و گواهی عمومی ایمنی یا پمپ‌پذیری محسوب نمی‌شوند.',
  'OUT_OF_DOMAIN project evidence is not extrapolated; a separately traceable engineering screen may still be reported when its required inputs are available.':'شواهد پروژه‌ای خارج از دامنه تعمیم داده نمی‌شوند؛ در صورت وجود ورودی‌های لازم، غربالگری مهندسی مستقل و قابل ردیابی می‌تواند گزارش شود.',
  'No arbitrary hidden score, safety factor, or undocumented threshold is introduced by this decision layer.':'در این لایه تصمیم هیچ امتیاز پنهان، ضریب ایمنی دلخواه یا آستانه مستندنشده‌ای وارد نمی‌شود.',
  'This is a conservative aggregate-to-pipe geometric screening criterion, not a physical plug-location or arching solver.':'این یک معیار محافظه‌کارانه غربالگری هندسی نسبت سنگدانه به لوله است و محل فیزیکی پلاگ یا قفل‌شدگی دانه‌ای را حل نمی‌کند.',
  'The screen uses the smallest known straight-pipe inside diameter; local fittings without an explicit inside diameter are not geometrically screened.':'غربالگری از کوچک‌ترین قطر داخلی شناخته‌شده لوله مستقیم استفاده می‌کند؛ اتصالات موضعی فاقد قطر داخلی صریح، در این کنترل هندسی ارزیابی نمی‌شوند.',
  'Aggregate grading, shape, concentration, lubrication loss, interruptions, bends, reducers, hose behavior, and field variability can create blockage mechanisms not represented by this ratio alone.':'دانه‌بندی، شکل و غلظت سنگدانه، افت روانکاری، توقف جریان، زانو، تبدیل، رفتار شیلنگ و تغییرپذیری کارگاهی می‌توانند مکانیزم‌های انسدادی ایجاد کنند که تنها با این نسبت پوشش داده نمی‌شوند.',
  'This is a static single-particle segregation screen based on a yield-stress suspending phase; it is not a universal dynamic pumping-stability certification.':'این غربالگری جدایش ایستای تک‌ذره بر پایه فاز معلق‌کننده دارای تنش تسلیم است و گواهی عمومی پایداری دینامیکی حین پمپاژ محسوب نمی‌شود.',
  'The supplied yield stress must represent the suspending mortar/paste phase. Bulk-concrete yield stress is not silently substituted.':'تنش تسلیم واردشده باید نماینده ملات/خمیر معلق‌کننده باشد؛ تنش تسلیم بتن حجمی به‌طور پنهانی جایگزین آن نمی‌شود.',
  'The Roussel criterion idealizes particle geometry and does not by itself represent full particle-size distribution, particle interactions, bleeding, thixotropy evolution, vibration, or pumping-induced migration.':'معیار راسل هندسه ذره را ایده‌آل می‌کند و به‌تنهایی توزیع کامل اندازه ذرات، اندرکنش ذرات، آب‌انداختگی، تحول تیکسوتروپی، ارتعاش یا مهاجرت ناشی از پمپاژ را پوشش نمی‌دهد.',
  'Pipeline contains pressure contributions that are not computed; required pressure is incomplete.':'بخشی از سهم‌های فشار خط لوله محاسبه نشده است؛ فشار موردنیاز کامل نیست.',
  'Pump capability cannot be assessed with the available pressure/flow data.':'با داده‌های فعلی فشار/دبی، ظرفیت پمپ قابل ارزیابی نیست.',
  'Pump capability data is unavailable; pressure margin was not assessed.':'داده ظرفیت پمپ در دسترس نیست؛ حاشیه فشار ارزیابی نشده است.',
  'This result is not a universal local-loss correlation and must not be transferred to another project/component without independent calibration evidence.':'این نتیجه رابطه عمومی افت موضعی نیست و بدون شواهد کالیبراسیون مستقل نباید به پروژه یا جزء دیگری تعمیم داده شود.',
  'Stability and blockage conclusions are project-qualified evidence decisions, not universal physical predictions.':'نتایج پایداری و انسداد، تصمیم‌های مبتنی بر شواهد پروژه هستند و پیش‌بینی فیزیکی عمومی محسوب نمی‌شوند.',
  'The current engineering core does not compute an exact physical blockage location; any spatial blockage marker is illustrative/diagnostic only.':'هسته مهندسی فعلی محل فیزیکی دقیق انسداد را محاسبه نمی‌کند؛ هر نشانگر مکانی انسداد صرفاً نمایشی/تشخیصی است.',
  'The current visualization is not CFD or DEM and must not be represented as a CFD/DEM simulation.':'نمایش فعلی شبیه‌سازی CFD یا DEM نیست و نباید به‌عنوان چنین شبیه‌سازی‌ای معرفی شود.',
  'A non-negative pump pressure margin is a modeled pressure-feasibility result, not a reliability, safety-factor, or operational certification.':'حاشیه فشار غیرمنفی فقط نتیجه مدل‌شده کفایت فشار است و گواهی قابلیت اطمینان، ضریب ایمنی یا تأیید عملیاتی محسوب نمی‌شود.',
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
function displayValueFa(value:FinalEngineeringKeyResult['value']):string {
  if(value===null)return '—';
  if(typeof value==='string')return fa(value);
  if(typeof value==='boolean')return value?'بله':'خیر';
  return Number.isFinite(value)?value.toLocaleString('fa-IR',{maximumFractionDigits:4}):'—';
}
function methodLabelFa(methodId:string):string {
  if(METHOD_LABELS_FA[methodId])return METHOD_LABELS_FA[methodId];
  if(methodId.includes('pressure'))return 'روش محاسبه/ارزیابی فشار';
  if(methodId.includes('rheology')||methodId.includes('bingham'))return 'روش محاسبات رئولوژی';
  if(methodId.includes('pumpability'))return 'روش ارزیابی پمپ‌پذیری';
  return 'روش مهندسی ثبت‌شده در هسته طلوع';
}
function cloneStrings(values: readonly string[]): string[] { return [...values]; }

export function buildPersianEngineeringReportDocument(output: FinalEngineeringOutput): PersianEngineeringReportDocument {
  return {
    runId: output.runId, engineVersion: output.engineVersion, generatedAtIso: output.generatedAtIso, locale: 'fa-IR', direction: 'rtl', titleFa: 'گزارش مهندسی رئولوژی و پمپ‌پذیری بتن — TOLUE',
    decision: {
      overallStatus: output.decision.overallStatus, overallStatusFa: fa(output.decision.overallStatus), pressureFeasibility: output.decision.pressureFeasibility, pressureFeasibilityFa: fa(output.decision.pressureFeasibility), stability: output.decision.stability, stabilityFa: fa(output.decision.stability), blockageRisk: output.decision.blockageRisk, blockageRiskFa: fa(output.decision.blockageRisk), qualificationScope: output.decision.qualificationScope, qualificationScopeFa: fa(output.decision.qualificationScope),
    },
    keyResults: output.keyResults.map(result => ({
      id: result.id, labelFa: RESULT_LABELS_FA[result.id] ?? reportTextFa(result.label), rawValue: result.value, displayValueFa: displayValueFa(result.value), unit: result.unit,
      validationStatus: result.validationStatus, validationStatusFa: fa(result.validationStatus), evidenceStatus: result.evidenceStatus, evidenceStatusFa: fa(result.evidenceStatus), resultClass: result.resultClass, resultClassFa: RESULT_CLASS_FA[result.resultClass] ?? 'نتیجه مهندسی', methodId: result.methodId, methodLabelFa: methodLabelFa(result.methodId),
    })),
    diagnostics: output.diagnostics.map(finding => ({ id: finding.id, severity: finding.severity, severityFa: SEVERITY_FA[finding.severity] ?? finding.severity, title: reportTextFa(finding.title), message: reportTextFa(finding.message), recommendation: finding.recommendation ? reportTextFa(finding.recommendation) : null, ruleId: finding.ruleId, sourceResultIds: cloneStrings(finding.sourceResultIds) })),
    warnings: output.warnings.map(reportTextFa),
    limitations: mergeScientificClaimBoundaries(output.limitations).map(reportTextFa),
    traceability: { runId: output.traceability.runId, engineVersion: output.traceability.engineVersion, inputSnapshotHash: output.traceability.inputSnapshotHash, sourceMethodIds: cloneStrings(output.traceability.sourceMethodIds), provenanceEntityIds: cloneStrings(output.traceability.provenanceEntityIds), calibrationIds: cloneStrings(output.traceability.calibrationIds), diagnosticRuleIds: cloneStrings(output.traceability.diagnosticRuleIds) },
    representation: 'persian_engineering_report_document', scientificClaim: 'presentation_only_no_new_engineering_inference', method: 'tolue-persian-engineering-report-v1',
  };
}

export function serializeFinalEngineeringOutputJson(output: FinalEngineeringOutput): string { return JSON.stringify(output, null, 2); }

export function buildEngineeringReportExportBundle(output: FinalEngineeringOutput): EngineeringReportExportBundle {
  const report = buildPersianEngineeringReportDocument(output);
  const html = renderPersianEngineeringReportHtml(report);
  return { runId: output.runId, engineVersion: output.engineVersion, inputSnapshotHash: output.traceability.inputSnapshotHash, report, html, json: { mediaType: 'application/json', encoding: 'utf-8', content: serializeFinalEngineeringOutputJson(output), method: 'tolue-final-output-json-export-v1' }, method: 'tolue-engineering-report-export-bundle-v2' };
}
