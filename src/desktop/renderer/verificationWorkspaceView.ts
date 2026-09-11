import type { VerificationEvidenceEntry, VerificationEvidencePortfolioResult } from '../../engineering/core/verificationEvidencePortfolio';
import { evaluateVerificationEvidencePortfolio } from '../../engineering/core/verificationEvidencePortfolio';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

export interface VerificationWorkspaceData {
  readonly entries: readonly Readonly<VerificationEvidenceEntry>[];
}

function card(title:string,value:string,tone:string):HTMLElement{
  const el=document.createElement('div');Object.assign(el.style,{padding:'9px 12px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:TOLUE_DESIGN_TOKENS.color.surfaceMuted,minWidth:'120px'});
  const t=document.createElement('small');t.textContent=title;t.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const v=document.createElement('strong');v.textContent=value;Object.assign(v.style,{display:'block',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeLg,color:tone,direction:'ltr'});el.append(t,v);return el;
}
function sourceHash(entry:Readonly<VerificationEvidenceEntry>):string{return entry.tier==='TIER_B_PUBLISHED_FULL_SCALE'?entry.case.source.sourceHash:entry.evaluationInput.fieldCase.source.sourceHash;}
function caseId(entry:Readonly<VerificationEvidenceEntry>):string{return entry.tier==='TIER_B_PUBLISHED_FULL_SCALE'?entry.case.caseId:entry.evaluationInput.fieldCase.caseId;}
function renderMetrics(parent:HTMLElement,result:Readonly<VerificationEvidencePortfolioResult>):void{
  const m=result.tierBMetrics;if(!m)return;const title=document.createElement('h4');title.textContent='Tier-B Metrics · admitted only';title.style.margin='14px 0 6px';parent.appendChild(title);
  const row=document.createElement('div');Object.assign(row.style,{display:'flex',gap:'8px',flexWrap:'wrap'});
  const f=(x:number)=>Number.isFinite(x)?x.toFixed(2):'—';row.append(card('Cases',String(m.caseCount),TOLUE_DESIGN_TOKENS.color.info),card('Bias Pa/m',f(m.biasPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('MAE Pa/m',f(m.meanAbsoluteErrorPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('RMSE Pa/m',f(m.rootMeanSquareErrorPaPerM),TOLUE_DESIGN_TOKENS.color.text),card('MARE',m.meanAbsoluteRelativeErrorFraction===null?'—':`${(m.meanAbsoluteRelativeErrorFraction*100).toFixed(2)}%`,TOLUE_DESIGN_TOKENS.color.text),card('Converged',`${m.convergedCaseCount}/${m.caseCount}`,TOLUE_DESIGN_TOKENS.color.statusNominal));parent.appendChild(row);
}

/** Read-only evidence workspace. Admission/exclusion is deliberately not exposed here. */
export function renderVerificationWorkspaceView(root:HTMLElement,data?:Readonly<VerificationWorkspaceData>):void{
  root.replaceChildren();const h=document.createElement('div');h.innerHTML='<strong>VERIFICATION WORKSPACE</strong><br><small>Tier-B Published / Full-Scale + Tier-C TOLUE Field Evidence</small>';h.style.direction='ltr';h.style.textAlign='left';root.appendChild(h);
  const note=document.createElement('p');note.textContent='این Workspace فقط وضعیت، Trace و Metrics را نمایش می‌دهد. تغییر Candidate به Admitted/Excluded از UI عمومی مجاز نیست و باید از مسیر Controlled Review انجام شود.';note.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;root.appendChild(note);
  if(!data||data.entries.length===0){const empty=document.createElement('div');empty.textContent='هیچ Verification Evidence Package در Session فعلی بارگذاری نشده است.';Object.assign(empty.style,{padding:'14px',border:`1px dashed ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,color:TOLUE_DESIGN_TOKENS.color.textMuted});root.appendChild(empty);return;}
  let result:Readonly<VerificationEvidencePortfolioResult>;try{result=evaluateVerificationEvidencePortfolio(data.entries);}catch(error){const e=document.createElement('div');e.textContent=`Evidence governance rejected: ${error instanceof Error?error.message:'UNKNOWN'}`;Object.assign(e.style,{padding:'10px',color:TOLUE_DESIGN_TOKENS.color.statusCritical,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.statusCritical}`});root.appendChild(e);return;}
  const summary=document.createElement('div');Object.assign(summary.style,{display:'flex',gap:'8px',flexWrap:'wrap',margin:'10px 0'});summary.append(card('Candidate',String(result.candidateCount),TOLUE_DESIGN_TOKENS.color.statusWarning),card('Excluded',String(result.excludedCount),TOLUE_DESIGN_TOKENS.color.statusCritical),card('Tier-B admitted',String(result.admittedTierBResults.length),TOLUE_DESIGN_TOKENS.color.info),card('Tier-C admitted',String(result.admittedTierCResults.length),TOLUE_DESIGN_TOKENS.color.info),card('Production validation','NO',TOLUE_DESIGN_TOKENS.color.statusCritical));root.appendChild(summary);renderMetrics(root,result);
  const table=document.createElement('table');Object.assign(table.style,{width:'100%',borderCollapse:'collapse',marginTop:'12px',direction:'ltr',textAlign:'left',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm});const head=document.createElement('tr');['Case','Tier','Status','Source hash','Review'].forEach(x=>{const th=document.createElement('th');th.textContent=x;th.style.padding='7px';th.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;head.appendChild(th);});table.appendChild(head);
  for(const entry of data.entries){const tr=document.createElement('tr');const review=entry.review;const values=[caseId(entry),entry.tier,entry.admissionStatus,sourceHash(entry),review?`${review.reviewerId} · ${review.reviewedAtIso}`:'—'];values.forEach((x,i)=>{const td=document.createElement('td');td.textContent=x;td.style.padding='7px';td.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;if(i===2)td.style.color=entry.admissionStatus==='ADMITTED'?TOLUE_DESIGN_TOKENS.color.statusNominal:entry.admissionStatus==='EXCLUDED'?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.statusWarning;tr.appendChild(td);});table.appendChild(tr);}root.appendChild(table);
  const limits=document.createElement('div');limits.style.marginTop='12px';const lt=document.createElement('strong');lt.textContent='Scientific limitations';limits.appendChild(lt);const ul=document.createElement('ul');for(const item of result.limitations){const li=document.createElement('li');li.textContent=item;ul.appendChild(li);}limits.appendChild(ul);root.appendChild(limits);
}
