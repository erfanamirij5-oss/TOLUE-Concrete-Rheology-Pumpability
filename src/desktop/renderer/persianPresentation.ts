export function assessmentStatusFa(value:string):string{
  switch(value){
    case 'ACCEPTABLE': return 'قابل قبول';
    case 'UNACCEPTABLE': return 'غیرقابل قبول';
    case 'NOT_ASSESSED': return 'ارزیابی نشده';
    case 'OUT_OF_DOMAIN': return 'خارج از دامنه اعتبار';
    case 'INSUFFICIENT_DATA': return 'داده ناکافی';
    case 'PROJECT_QUALIFIED_ACCEPTABLE': return 'قابل قبول با شواهد معتبر پروژه‌ای';
    case 'SCREENED_ACCEPTABLE': return 'قابل قبول در غربالگری مهندسی';
    case 'PARTIALLY_QUALIFIED_ACCEPTABLE': return 'قابل قبول با شواهد پروژه‌ای ناقص';
    case 'PARTIALLY_SCREENED_ACCEPTABLE': return 'قابل قبول با غربالگری ناقص';
    case 'PRESSURE_ONLY_ACCEPTABLE': return 'فقط از نظر فشار قابل قبول';
    case 'FAIL_PRESSURE': return 'رد به دلیل فشار';
    case 'FAIL_STABILITY': return 'رد به دلیل پایداری';
    case 'FAIL_BLOCKAGE': return 'رد به دلیل ریسک انسداد';
    case 'PASS': return 'قابل قبول';
    case 'FAIL': return 'رد شده';
    case 'complete': return 'کامل';
    case 'incomplete': return 'ناقص';
    case 'computed': return 'محاسبه شده';
    case 'not_computed': return 'محاسبه نشده';
    default:return value;
  }
}

export function resultClassFa(value:string):string{
  switch(value){
    case 'STANDARD_REQUIREMENT': return 'الزام/معیار استانداردی';
    case 'PHYSICAL_MODEL': return 'مدل فیزیکی';
    case 'EMPIRICAL_MODEL': return 'مدل تجربی';
    case 'SOURCE_DATA': return 'داده منبع';
    case 'PROJECT_CALIBRATED_DATA': return 'داده کالیبره‌شده پروژه';
    case 'COMPOSITE_ENGINEERING_RESULT': return 'نتیجه ترکیبی مهندسی';
    case 'DERIVED_METRIC': return 'شاخص مشتق‌شده';
    case 'TOLUE_ENGINEERING_INDEX': return 'شاخص مهندسی طلوع';
    case 'AI_PREDICTION': return 'پیش‌بینی هوش مصنوعی';
    default:return 'نتیجه مهندسی';
  }
}

export function unitFa(value:string|null):string|null{
  if(value===null)return null;
  switch(value){
    case 'Pa': return 'پاسکال';
    case 'kPa': return 'کیلوپاسکال';
    case 'MPa': return 'مگاپاسکال';
    case 'm': return 'متر';
    case '1': return 'بدون بعد';
    case 'kg/m³': return 'کیلوگرم بر مترمکعب';
    case 'm3/s': case 'm³/s': return 'مترمکعب بر ثانیه';
    case 'm3/h': case 'm³/h': return 'مترمکعب بر ساعت';
    case 'Pa.s': case 'Pa·s': return 'پاسکال‌ثانیه';
    default:return value;
  }
}

export function engineeringResultLabelFa(id:string,fallback:string):string{
  const labels:Record<string,string>={
    'pipeline.requiredPressure':'فشار موردنیاز خط لوله',
    'pressureProfile.peakRequiredPressure':'بیشینه فشار موردنیاز',
    'pipeline.elevationPressure':'سهم فشار ناشی از اختلاف ارتفاع',
    'pump.availablePressure':'فشار در دسترس پمپ در دبی هدف',
    'pump.pressureMargin':'حاشیه فشار پمپ',
    'pump.pressureUtilization':'نسبت استفاده از ظرفیت فشار پمپ',
    'pumpability.stabilityScreening':'غربالگری خودکار پایداری ایستا',
    'pumpability.stabilityCriticalYieldStress':'تنش تسلیم بحرانی برای پایداری ایستا',
    'pumpability.stabilityScreeningRatio':'نسبت تنش تسلیم موجود به مقدار بحرانی',
    'pumpability.blockageScreening':'غربالگری خودکار ریسک انسداد هندسی',
    'pumpability.blockageAggregatePipeRatio':'نسبت اندازه اسمی بیشینه سنگدانه به قطر داخلی خط',
    'pumpability.blockageMinimumPipeDiameter':'کوچک‌ترین قطر داخلی شناخته‌شده خط مستقیم',
    'pumpability.stabilityEvidence':'شواهد پروژه‌ای پایداری',
    'pumpability.blockageEvidence':'شواهد پروژه‌ای ریسک انسداد',
    'pumpability.decisionStatus':'وضعیت نهایی پمپ‌پذیری',
  };
  if(labels[id])return labels[id];
  if(id.startsWith('pipeline.segment.')&&id.endsWith('.calibratedLocalPressure'))return 'افت فشار موضعی کالیبره‌شده پروژه';
  return userFacingEngineeringTextFa(fallback);
}

export function engineeringMethodFa(value:string):string{
  const methods:Record<string,string>={
    'tolue-pipeline-pressure-v2':'محاسبه فشار خط لوله',
    'tolue-pressure-profile-v1':'پروفیل فشار خط لوله',
    'tolue-pump-capability-v1':'ارزیابی ظرفیت فشار پمپ',
    'tolue-project-qualified-pumpability-evidence-v1':'ارزیابی شواهد پروژه‌ای پمپ‌پذیری',
    'tolue-static-segregation-screen-roussel-2006-v1':'غربالگری پایداری ایستا بر مبنای معیار راسل',
    'tolue-blockage-geometric-screen-v1':'غربالگری هندسی ریسک انسداد',
    'tolue-pumpability-risk-screening-v1':'غربالگری خودکار پایداری و انسداد',
    'tolue-pumpability-decision-v3':'تصمیم سه‌محوره پمپ‌پذیری طلوع',
  };
  if(methods[value])return methods[value];
  if(value.includes('pressure'))return 'روش تحلیل فشار';
  if(value.includes('rheology')||value.includes('bingham'))return 'روش تحلیل رئولوژی';
  if(value.includes('pumpability'))return 'روش تحلیل پمپ‌پذیری';
  return 'روش مهندسی هسته طلوع';
}

export function pumpProvenanceFa(value:string):string{
  switch(value){case 'manufacturer_curve':return 'منحنی سازنده';case 'manufacturer_rated_point':return 'نقطه نامی سازنده';case 'calibrated_project_data':return 'داده کالیبره‌شده پروژه';default:return value;}
}

export function interpolationFa(value:string):string{
  switch(value){case 'linear':return 'خطی';case 'exact':return 'نقطه دقیق';case 'not_required':return 'نیاز ندارد';case 'unavailable':return 'ناموجود';default:return value;}
}

export function diagnosticKindFa(value:string):string{
  switch(value){
    case 'INCOMPLETE_ANALYSIS': return 'تحلیل ناقص';
    case 'INSUFFICIENT_DATA': return 'داده ناکافی';
    case 'PUMP_PRESSURE_INSUFFICIENT': return 'فشار ناکافی پمپ';
    case 'PUMP_PRESSURE_ADEQUATE': return 'فشار کافی پمپ';
    case 'STABILITY_UNACCEPTABLE': return 'پایداری نامطلوب';
    case 'BLOCKAGE_UNACCEPTABLE': return 'ریسک انسداد نامطلوب';
    case 'PUMPABILITY_PROJECT_QUALIFIED': return 'پمپ‌پذیری تأییدشده در دامنه پروژه';
    case 'PUMPABILITY_PARTIALLY_QUALIFIED': return 'پمپ‌پذیری با تأیید جزئی';
    case 'PUMPABILITY_SCREENED_ACCEPTABLE': return 'غربالگری پمپ‌پذیری قابل قبول';
    case 'PUMPABILITY_PARTIALLY_SCREENED': return 'غربالگری پمپ‌پذیری ناقص';
    default:return value;
  }
}

export function userFacingEngineeringTextFa(value:string):string{
  const exact:Record<string,string>={
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
    'Review the documented project evidence, material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
    'Project-qualified blockage evidence is unacceptable':'شواهد پروژه‌ای ریسک انسداد قابل قبول نیست.',
    'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.':'شواهد ریسک انسداد معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی انسداد محسوب نمی‌شود.',
    'Review the documented project evidence, route/material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، مسیر/سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
    'Project-qualified pumpability evidence is acceptable':'شواهد پمپ‌پذیری در دامنه پروژه قابل قبول است.',
    'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.':'کفایت فشار، شواهد پایداری و شواهد انسداد در دامنه‌های تعریف‌شده پروژه قابل قبول هستند؛ این نتیجه گواهی عمومی برای همه شرایط نیست.',
    'Pumpability evidence is only partially qualified':'شواهد پمپ‌پذیری فقط به‌صورت جزئی واجد شرایط است.',
    'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.':'فشار قابل تأمین است و یکی از حوزه‌های شواهد پروژه‌ای قابل قبول است، اما حوزه دیگر پایداری/انسداد به‌طور کامل ارزیابی نشده است.',
    'Obtain project-qualified evidence for the missing or out-of-domain stability/blockage domain before treating pumpability as fully qualified.':'برای تأیید نهایی، شواهد معتبر پروژه‌ای حوزه مفقود یا خارج از دامنه را تهیه کنید.',
    'Automatic stability and blockage engineering screens are acceptable':'غربالگری خودکار مهندسی پایداری و ریسک انسداد قابل قبول است.',
    'Pressure is feasible and the available automatic stability/blockage screening checks are acceptable. These screens are preliminary and do not replace project-qualified pumping trials or evidence.':'فشار قابل تأمین است و کنترل‌های خودکار پایداری و انسداد قابل قبول‌اند؛ این غربالگری مقدماتی جایگزین آزمون پمپاژ یا شواهد واقعی پروژه نیست.',
    'Automatic pumpability risk screening is incomplete':'غربالگری خودکار ریسک پمپ‌پذیری کامل نیست.',
    'Pressure is feasible and one automatic risk domain is acceptable, but the other stability/blockage domain does not have enough screening input data.':'فشار قابل تأمین است و یک حوزه ریسک قابل قبول است، اما حوزه دیگر ورودی کافی برای غربالگری ندارد.',
    'Static stability engineering screen is unacceptable':'غربالگری مهندسی پایداری ایستا قابل قبول نیست.',
    'The Roussel static segregation screen indicates that the supplied suspending-phase yield stress is below the calculated critical value for the supplied aggregate size and density contrast.':'معیار جدایش ایستای راسل نشان می‌دهد تنش تسلیم فاز معلق‌کننده از مقدار بحرانی محاسبه‌شده کمتر است.',
    'Aggregate-to-pipe blockage screen is unacceptable':'غربالگری هندسی ریسک انسداد سنگدانه نسبت به خط قابل قبول نیست.',
    'The nominal maximum aggregate size exceeds the conservative one-third limit of the smallest known straight-pipe inside diameter.':'اندازه اسمی بیشینه سنگدانه از حد محافظه‌کارانه یک‌سوم کوچک‌ترین قطر داخلی شناخته‌شده خط بیشتر است.',
    'Pipeline contains pressure contributions that are not computed; required pressure is incomplete.':'بخشی از سهم‌های فشار خط لوله محاسبه نشده است؛ فشار موردنیاز کامل نیست.',
    'Pump capability cannot be assessed with the available pressure/flow data.':'با داده‌های فعلی فشار/دبی، ظرفیت پمپ قابل ارزیابی نیست.',
    'Pump capability data is unavailable; pressure margin was not assessed.':'داده ظرفیت پمپ در دسترس نیست؛ حاشیه فشار ارزیابی نشده است.',
    'Conservative geometric screening of nominal maximum coarse-aggregate size against the smallest known straight-pipeline inside diameter for pumped concrete.':'غربالگری محافظه‌کارانه اندازه اسمی بیشینه سنگدانه درشت نسبت به کوچک‌ترین قطر داخلی شناخته‌شده لوله مستقیم در مسیر پمپاژ.',
    'Preliminary static segregation screening for coarse particles in a yield-stress suspending mortar/paste phase using the Roussel single-particle stability criterion.':'غربالگری مقدماتی جدایش ایستای ذرات درشت در ملات/خمیر معلق‌کننده دارای تنش تسلیم، بر مبنای معیار تک‌ذره راسل.',
    'Three-axis decision using pressure feasibility, project-qualified evidence when available in-domain, and separately identified transparent engineering screening when its required inputs are supplied.':'تصمیم سه‌محوره بر پایه کفایت فشار، شواهد معتبر پروژه‌ای در صورت قرارگیری در دامنه، و غربالگری مهندسی شفاف و مستقل در صورت وجود ورودی‌های لازم.',
  };
  if(exact[value])return exact[value];
  let match=value.match(/^(\d+) engineering result\(s\) are explicitly marked insufficient_data\.$/);
  if(match)return `${match[1]} نتیجه مهندسی صراحتاً با وضعیت «داده ناکافی» علامت‌گذاری شده است.`;
  match=value.match(/^Available pressure is below modeled required pressure by ([\d.]+) Pa at the target flow\.$/);
  if(match)return `فشار در دسترس در دبی هدف، ${match[1]} پاسکال کمتر از فشار موردنیاز مدل‌شده است.`;
  match=value.match(/^Available pressure exceeds or equals modeled required pressure by ([\d.]+) Pa at the target flow\. This is not a safety-factor or reliability certification\.$/);
  if(match)return `فشار در دسترس در دبی هدف، ${match[1]} پاسکال بیشتر یا مساوی فشار موردنیاز مدل‌شده است. این نتیجه ضریب ایمنی یا گواهی قابلیت اطمینان نیست.`;
  return value;
}
