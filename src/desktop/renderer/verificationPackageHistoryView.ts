import type { VerificationEvidenceHistoryIpcResponse } from '../ipc/verificationEvidenceIpc';
import { TOLUE_DESIGN_TOKENS } from './designSystem';

type VerificationEvidencePackageHistoryItem = VerificationEvidenceHistoryIpcResponse['items'][number];

export interface VerificationPackageHistoryActions {
  readonly loadPackage:(packageId:string)=>void;
  readonly refresh:()=>void;
}

function cell(text:string,dir:'ltr'|'rtl'='ltr'):HTMLTableCellElement{
  const td=document.createElement('td');td.textContent=text;td.style.padding='7px';td.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;td.style.direction=dir;return td;
}

export function renderVerificationPackageHistoryView(
  root:HTMLElement,
  items:readonly Readonly<VerificationEvidencePackageHistoryItem>[],
  activePackageId:string|null,
  actions:Readonly<VerificationPackageHistoryActions>,
):void{
  root.replaceChildren();
  const header=document.createElement('div');Object.assign(header.style,{display:'flex',alignItems:'center',gap:'8px',margin:'10px 0 6px'});
  const title=document.createElement('strong');title.textContent='بسته‌های اخیر اعتبارسنجی';
  const spacer=document.createElement('div');spacer.style.flex='1';
  const refresh=document.createElement('button');refresh.type='button';refresh.textContent='تازه‌سازی';refresh.addEventListener('click',actions.refresh);Object.assign(refresh.style,{font:'inherit',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm,color:TOLUE_DESIGN_TOKENS.color.text,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,padding:'5px 8px',cursor:'pointer'});
  header.append(title,spacer,refresh);root.appendChild(header);
  if(!items.length){const empty=document.createElement('div');empty.textContent='هنوز بسته اعتبارسنجی ذخیره‌شده‌ای وجود ندارد.';empty.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;empty.style.padding='8px';root.appendChild(empty);return;}
  const table=document.createElement('table');Object.assign(table.style,{width:'100%',borderCollapse:'collapse',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeSm,direction:'rtl',textAlign:'right'});
  const trh=document.createElement('tr');['شناسه بسته','زمان تولید','زمان ورود','تعداد موارد','تولیدکننده','هدف',''].forEach(text=>{const th=document.createElement('th');th.textContent=text;th.style.padding='7px';th.style.borderBottom=`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`;trh.appendChild(th);});table.appendChild(trh);
  for(const item of items){const tr=document.createElement('tr');if(item.packageId===activePackageId)tr.style.background=TOLUE_DESIGN_TOKENS.color.surfaceMuted;tr.append(cell(item.packageId),cell(item.generatedAtIso),cell(item.importedAtIso),cell(String(item.entryCount)),cell(item.generatedBy),cell(item.purpose,'rtl'));const actionCell=document.createElement('td');actionCell.style.padding='5px';const load=document.createElement('button');load.type='button';load.textContent=item.packageId===activePackageId?'فعال':'باز کردن';load.disabled=item.packageId===activePackageId;load.addEventListener('click',()=>actions.loadPackage(item.packageId));Object.assign(load.style,{font:'inherit',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.text,background:TOLUE_DESIGN_TOKENS.color.surfaceElevated,border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,padding:'4px 7px',cursor:load.disabled?'default':'pointer'});actionCell.appendChild(load);tr.appendChild(actionCell);table.appendChild(tr);}root.appendChild(table);
}
