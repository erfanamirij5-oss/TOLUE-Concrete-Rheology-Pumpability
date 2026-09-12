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

export function userFacingEngineeringTextFa(value:string):string{
  const exact:Record<string,string>={
    'Modeled pump pressure is nominally adequate':'فشار مدل‌شده پمپ در دبی هدف از نظر اسمی کافی است.',
    'Pressure feasibility alone is not a complete pumpability assessment':'کفایت فشار به‌تنهایی ارزیابی کامل پمپ‌پذیری بتن محسوب نمی‌شود.',
  };
  return exact[value]??value;
}
