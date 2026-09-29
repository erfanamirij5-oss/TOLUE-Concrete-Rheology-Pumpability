import type { VerificationEvidenceEntry, VerificationEvidencePortfolioResult } from '../../engineering/core/verificationEvidencePortfolio';
import { evaluateVerificationEvidencePortfolio } from '../../engineering/core/verificationEvidencePortfolio';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

export interface VerificationWorkspaceData {
  readonly entries: readonly Readonly<VerificationEvidenceEntry>[];
}

function card(title:string,value:string,tone:string):HTMLElement{
  const el=document.createElement('div');Object.assign(el.style,{padding:'9px 12px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted,minWidth:'120px'});
  const t=document.createElement('small');t.textContent=title;t.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const v=document.createElement('strong');v.textContent=value;Object.assign(v.style,{display:'block',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeLg,color:tone,direction:'rtl'});el.append(t,v);return el;
}
function sourceHash(entry:Readonly<VerificationEvidenceEntry>):string{return entry.tier==='TIER_B_PUBLISHED_FULL_SCALE'?entry.case.source.sourceHash:entry.evaluationInput.fieldCase.source.sourceHash;}
function caseId(entry:Readonly<VerificationEvidenceEntry>):string{return entry.tier==='TIER_B_PUBLISHED_FULL_SCALE'?entry.case.caseId:entry.evaluationInput.fieldCase.caseId;}
const admissionFa=(value:string)=>value==='ADMITTED'?'پذیرفته‌شده':value==='EXCLUDED'?'حذف‌شده از ارزیابی':'کاندید';
const tierFa=(value:string)=>value==='TIER_B_PUBLISHED_FULL_SCALE'?'سطح B · منبع منتشرشده/تمام‌مقیاس':value==='TIER_C_TOLUE_FIELD'?'سطح C · داده میدانی طلوع':value;
function renderMetrics(parent:HTMLElement,result:Readonly<VerificationEvidencePortfolioResult>):void{
  const m=result.tierBMetrics;if(!m)return;const title=document.createElement('h4');title.textContent='شاخص‌های سطح B · فقط موارد پذیرفته‌شده';title.style.margin='14px 0 6px';parent.appendChild(title);
  const row=document.createElement('div');Object.assign(row.style,{display:'flex',gap:'8px',flexWrap:'wrap'});
  const f=(x:number)=>Number.isFinite(x)?x.toFixed(2):'—';row.append(card('تعداد موارد',String(m.caseCount),TOLUE_DESIGN_TOKENS.color.info),card('بایاس فشار بر متر',f(m.biasPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('میانگین خطای مطلق فشار بر متر',f(m.meanAbsoluteErrorPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('ریشه میانگین مربع خطا',f(m.rootMeanSquareErrorPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('میانگین خطای نسبی مطلق',m.meanAbsoluteRelativeErrorFraction===null?'—':`${(m.meanAbsoluteRelativeErrorFraction*100).toFixed(2)}٪`,TOLUE_DESIGN_TOKENS.color.text),card('حل‌های همگرا',`${m.convergedCaseCount}/${m.caseCount}`,TOLUE_DESIGN_TOKENS.color.statusNominal));parent.appendChild(row);
}

/** Read-only evidence workspace. Admission/exclusion is deliberately not exposed here. */
export function renderVerificationWorkspaceView(root:HTMLElement,data?:Readonly<VerificationWorkspaceData>):void{
  root.replaceChildren();const h=document.createElement('div');h.innerHTML='<strong>محیط اعتبارسنجی</strong><br><small>سطح B منابع منتشرشده/تمام‌مقیاس + سطح C شواهد میدانی طلوع</small>';root.appendChild(h);
  const note=document.createElement('p');note.textContent='این محیط فقط وضعیت، ردیابی و شاخص‌ها را نمایش می‌دهد. تغییر وضعیت کاندید به پذیرفته‌شده یا حذف‌شده از رابط عمومی مجاز نیست و باید از مسیر بازبینی کنترل‌شده انجام شود.';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;root.appendChild(note);
  if(!data||data.entries.length===0){const empty=document.createElement('div');empty.textContent='هیچ بسته شواهد اعتبارسنجی در نشست فعلی بارگذاری نشده است.';Object.assign(empty.style,{padding:'14px',border:`1px dashed ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,color:TOLUE_DESIGN_TOKENS.color.textMuted});root.appendChild(empty);return;}
  let result:Readonly<VerificationEvidencePortfolioResult>;try{result=evaluateVerificationEvidencePortfolio(data.entries);}catch(error){const e=document.createElement('div');e.textContent=`حاکمیت شواهد بسته را رد کرد: ${error instanceof Error?error.message:'خطای نامشخص'}`;Object.assign(e.style,{padding:'10px',color:TOLUE_DESIGN_TOKENS.color.statusCritical,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.statusCritical}`});root.appendChild(e);return;}
  const summary=document.createElement('div');Object.assign(summary.style,{display:'flex',gap:'8px',flexWrap:'wrap',margin:'10px 0'});summary.append(card('کاندید',String(result.candidateCount),TOLUE_DESIGN_TOKENS.color.statusWarning),card('حذف‌شده',String(result.excludedCount),TOLUE_DESIGN_TOKENS.color.statusCritical),card('سطح B پذیرفته‌شده',String(result.admittedTierBResults.length),TOLUE_DESIGN_TOKENS.color.info),card('سطح C پذیرفته‌شده',String(result.admittedTierCResults.length),TOLUE_DESIGN_TOKENS.color.info),card('اعتبارسنجی تولیدی','خیر',TOLUE_DESIGN_TOKENS.color.statusCritical));root.appendChild(summary);renderMetrics(root,result);
  const table=document.createElement('table');Object.assign(table.style,{width:'100%',borderCollapse:'collapse',marginTop:'12px',direction:'rtl',textAlign:'right',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm});const head=document.createElement('tr');['شناسه مورد','سطح','وضعیت','هش منبع','بازبینی'].forEach(x=>{const th=document.createElement('th');th.textContent=x;th.style.padding='7px';th.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;head.appendChild(th);});table.appendChild(head);
  for(const entry of data.entries){const tr=document.createElement('tr');const review=entry.admissionReview;const values=[caseId(entry),tierFa(entry.tier),admissionFa(entry.admissionStatus),sourceHash(entry),review?`${review.reviewerId} · ${review.reviewedAtIso}`:'—'];values.forEach((x,i)=>{const td=document.createElement('td');td.textContent=x;td.style.padding='7px';td.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;if(i===2)td.style.color=entry.admissionStatus==='ADMITTED'?TOLUE_DESIGN_TOKENS.color.statusNominal:entry.admissionStatus==='EXCLUDED'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.statusWarning;if(i===0||i===3||i===4)td.style.direction='ltr';tr.appendChild(td);});table.appendChild(tr);}root.appendChild(table);
  const limits=document.createElement('div');limits.style.marginTop='12px';const lt=document.createElement('strong');lt.textContent='محدودیت‌های علمی';limits.appendChild(lt);const ul=document.createElement('ul');for(const item of result.limitations){const li=document.createElement('li');li.textContent=item;ul.appendChild(li);}limits.appendChild(ul);root.appendChild(limits);
}
