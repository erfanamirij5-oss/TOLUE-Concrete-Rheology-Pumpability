export function assessmentStatusFa(value:string):string{
  switch(value){
    case 'ACCEPTABLE': return 'قابل قبول';
    case 'UNACCEPTABLE': return 'غیرقابل قبول';
    case 'NOT_ASSESSED': return 'ارزیابی نشده';
    case 'INSUFFICIENT_DATA': return 'داده ناکافی';
    case 'PASS': return 'قابل قبول';
    case 'FAIL': return 'رد شده';
    case 'complete': return 'کامل';
    case 'incomplete': return 'ناقص';
    default:return value;
  }
}

export function resultClassFa(value:string):string{
  switch(value){
    case 'pressure': return 'فشار';
    case 'pumpability': return 'پمپ‌پذیری';
    case 'rheology': return 'رئولوژی';
    case 'stability': return 'پایداری';
    case 'blockage': return 'ریسک انسداد';
    default:return value;
  }
}

export function unitFa(value:string|null):string|null{
  if(value===null)return null;
  switch(value){
    case 'Pa': return 'پاسکال';
    case 'kPa': return 'کیلوپاسکال';
    case 'MPa': return 'مگاپاسکال';
    case 'm3/s': case 'm³/s': return 'مترمکعب بر ثانیه';
    case 'm3/h': case 'm³/h': return 'مترمکعب بر ساعت';
    case 'Pa.s': case 'Pa·s': return 'پاسکال‌ثانیه';
    default:return value;
  }
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
    'Project-qualified stability evidence is unacceptable':'شواهد پایداری واجد شرایط پروژه قابل قبول نیست.',
    'The supplied in-domain project-qualified stability evidence reports an unacceptable outcome. This is project-specific and is not a universal stability model.':'شواهد پایداری معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی پایداری بتن محسوب نمی‌شود.',
    'Review the documented project evidence, material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
    'Project-qualified blockage evidence is unacceptable':'شواهد ریسک انسداد واجد شرایط پروژه قابل قبول نیست.',
    'The supplied in-domain project-qualified blockage evidence reports an unacceptable outcome. This is project-specific and is not a universal blockage model.':'شواهد ریسک انسداد معتبر در دامنه پروژه نتیجه نامطلوب گزارش کرده‌اند؛ این نتیجه مختص همین پروژه است و مدل عمومی انسداد محسوب نمی‌شود.',
    'Review the documented project evidence, route/material system, target flow, and qualification scope before proceeding.':'پیش از ادامه، شواهد مستند پروژه، مسیر/سامانه مصالح، دبی هدف و دامنه اعتبار را بازبینی کنید.',
    'Project-qualified pumpability evidence is acceptable':'شواهد پمپ‌پذیری در دامنه پروژه قابل قبول است.',
    'Pressure feasibility, stability evidence, and blockage evidence are acceptable for the supplied project-qualified domains. This is not a universal certification.':'کفایت فشار، شواهد پایداری و شواهد انسداد در دامنه‌های تعریف‌شده پروژه قابل قبول هستند؛ این نتیجه گواهی عمومی برای همه شرایط نیست.',
    'Pumpability evidence is only partially qualified':'شواهد پمپ‌پذیری فقط به‌صورت جزئی واجد شرایط است.',
    'Pressure is feasible and one project-qualified evidence domain is acceptable, but the other stability/blockage domain is not fully assessed in-domain.':'فشار قابل تأمین است و یکی از حوزه‌های شواهد پروژه‌ای قابل قبول است، اما حوزه دیگر پایداری/انسداد در دامنه مربوطه به‌طور کامل ارزیابی نشده است.',
    'Obtain project-qualified evidence for the missing or out-of-domain stability/blockage domain before treating pumpability as fully qualified.':'پیش از تأیید کامل پمپ‌پذیری، برای حوزه مفقود یا خارج از دامنه پایداری/انسداد شواهد معتبر پروژه‌ای تهیه کنید.',
    'Pressure feasibility alone is not a complete pumpability assessment':'کفایت فشار به‌تنهایی ارزیابی کامل پمپ‌پذیری بتن محسوب نمی‌شود.',
    'Stability and blockage conclusions are project-qualified evidence statements, not universal concrete behavior models':'نتایج پایداری و انسداد بر پایه شواهد واجد شرایط پروژه هستند و مدل عمومی رفتار بتن محسوب نمی‌شوند.',
    'OUT_OF_DOMAIN evidence is not extrapolated and contributes no acceptable/unacceptable conclusion':'شواهد خارج از دامنه تعمیم داده نمی‌شوند و در نتیجه قابل قبول/غیرقابل قبول دخالت داده نمی‌شوند.',
    'No arbitrary safety factor, marginal band, slump threshold, stability threshold, or blockage threshold is introduced by this decision layer':'در این لایه تصمیم هیچ ضریب ایمنی دلخواه، ناحیه مرزی، آستانه اسلامپ، آستانه پایداری یا آستانه انسداد اضافه نمی‌شود.',
    'Stability and blockage conclusions are project-qualified evidence decisions, not universal physical predictions':'نتایج پایداری و انسداد تصمیم‌های مبتنی بر شواهد پروژه هستند و پیش‌بینی فیزیکی عمومی محسوب نمی‌شوند.',
    'The current engineering core does not compute an exact physical blockage location; any spatial blockage marker is illustrative/diagnostic only':'هسته مهندسی فعلی محل فیزیکی دقیق انسداد را محاسبه نمی‌کند؛ هر نشانگر مکانی انسداد صرفاً نمایشی/تشخیصی است.',
    'The current visualization is not CFD or DEM and must not be represented as a CFD/DEM simulation':'نمایش فعلی شبیه‌سازی CFD یا DEM نیست و نباید به‌عنوان چنین شبیه‌سازی‌ای معرفی شود.',
    'A non-negative pump pressure margin is a modeled pressure-feasibility result, not a reliability, safety-factor, or operational certification':'حاشیه فشار غیرمنفی فقط نتیجه مدل‌شده کفایت فشار است و گواهی قابلیت اطمینان، ضریب ایمنی یا تأیید عملیاتی محسوب نمی‌شود.',
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
