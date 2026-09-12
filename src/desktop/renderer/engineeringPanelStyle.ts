import { TOLUE_DESIGN_TOKENS } from './designSystem';

const COLLAPSE_STORAGE_KEY='tolue-engineering-section-collapse-v1';

function installCollapsibleSectionStyle():void{
  if(document.querySelector('style[data-tolue-collapsible-sections="v1"]'))return;
  const style=document.createElement('style');
  style.dataset.tolueCollapsibleSections='v1';
  style.textContent=`
[data-engineering-collapsible="true"]>[data-engineering-section-header="true"]{position:relative}
[data-engineering-collapsible="true"]>[data-engineering-section-header="true"]>[data-section-collapse="true"]{width:28px;height:28px;display:inline-grid;place-items:center;border:1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong};border-radius:7px;background:rgba(12,22,29,.62);color:${TOLUE_DESIGN_TOKENS.color.textMuted};font:inherit;font-size:13px;cursor:pointer;transition:background-color .12s ease,border-color .12s ease,color .12s ease,transform .12s ease}
[data-engineering-collapsible="true"]>[data-engineering-section-header="true"]>[data-section-collapse="true"]:hover{border-color:${TOLUE_DESIGN_TOKENS.color.accent};color:${TOLUE_DESIGN_TOKENS.color.text};background:rgba(245,155,50,.08)}
[data-engineering-collapsible="true"]>[data-engineering-section-header="true"]>[data-section-collapse="true"]:focus-visible{outline:2px solid ${TOLUE_DESIGN_TOKENS.color.info};outline-offset:2px}
[data-engineering-collapsible="true"][data-collapsed="true"]>:not([data-engineering-section-header="true"]):not(i){display:none!important}
[data-engineering-collapsible="true"][data-collapsed="true"]>[data-engineering-section-header="true"]{border-bottom-color:transparent!important}
`;
  (document.head??document.documentElement).appendChild(style);
}

function readCollapsedSections():Readonly<Record<string,boolean>>{
  try{
    const raw=window.localStorage?.getItem(COLLAPSE_STORAGE_KEY);
    if(!raw)return {};
    const parsed=JSON.parse(raw) as Record<string,boolean>;
    return parsed&&typeof parsed==='object'?parsed:{};
  }catch{return {};}
}

function writeCollapsedSection(key:string,collapsed:boolean):void{
  try{
    const current={...readCollapsedSections(),[key]:collapsed};
    window.localStorage?.setItem(COLLAPSE_STORAGE_KEY,JSON.stringify(current));
  }catch{/* section persistence is optional */}
}

export function styleEngineeringSection(section:HTMLElement,accent=false):void{
  Object.assign(section.style,{
    position:'relative',
    border:`1px solid ${accent?TOLUE_DESIGN_TOKENS.color.borderStrong:TOLUE_DESIGN_TOKENS.color.border}`,
    borderRadius:TOLUE_DESIGN_TOKENS.radius.md,
    background:'linear-gradient(180deg,rgba(28,42,53,.97) 0%,rgba(15,24,31,.98) 100%)',
    boxShadow:accent?'0 14px 34px rgba(0,0,0,.20), inset 0 1px rgba(255,255,255,.025)':'0 10px 26px rgba(0,0,0,.15), inset 0 1px rgba(255,255,255,.018)',
    overflow:'hidden',
  });
  if(accent){
    const marker=document.createElement('i');
    marker.setAttribute('aria-hidden','true');
    Object.assign(marker.style,{position:'absolute',insetInlineStart:'0',top:'0',bottom:'0',width:'3px',background:`linear-gradient(180deg,${TOLUE_DESIGN_TOKENS.color.selection},rgba(245,155,50,.18))`,zIndex:'1',pointerEvents:'none'});
    section.appendChild(marker);
  }
}

export function appendEngineeringSectionHeader(section:HTMLElement,titleText:string,subtitleText?:string,badgeText?:string):HTMLElement{
  installCollapsibleSectionStyle();
  section.dataset.engineeringCollapsible='true';
  const collapseKey=(section.getAttribute('aria-label')||titleText).trim();
  const collapsed=readCollapsedSections()[collapseKey]===true;
  section.dataset.collapsed=collapsed?'true':'false';

  const header=document.createElement('header');
  header.dataset.engineeringSectionHeader='true';
  Object.assign(header.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:'6px 10px',alignItems:'center',padding:'12px 14px 11px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'linear-gradient(90deg,rgba(36,152,197,.105),rgba(245,155,50,.025) 48%,transparent 78%)'});
  const title=document.createElement('strong');title.textContent=titleText;Object.assign(title.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeLg,letterSpacing:'-.012em',lineHeight:'1.45',color:TOLUE_DESIGN_TOKENS.color.text,minWidth:'0'});header.appendChild(title);
  if(badgeText){const badge=document.createElement('span');badge.textContent=badgeText;Object.assign(badge.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,padding:'3px 8px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:'999px',color:TOLUE_DESIGN_TOKENS.color.info,background:'rgba(97,183,218,.055)',direction:'auto',whiteSpace:'nowrap',fontWeight:'700'});header.appendChild(badge);}
  else{const spacer=document.createElement('span');spacer.setAttribute('aria-hidden','true');header.appendChild(spacer);}
  const toggle=document.createElement('button');toggle.type='button';toggle.dataset.sectionCollapse='true';toggle.setAttribute('aria-label',collapsed?`باز کردن بخش ${titleText}`:`جمع کردن بخش ${titleText}`);toggle.setAttribute('aria-expanded',collapsed?'false':'true');toggle.title=collapsed?'باز کردن این بخش':'جمع کردن این بخش';toggle.textContent=collapsed?'⌄':'⌃';toggle.addEventListener('click',()=>{const next=section.dataset.collapsed!=='true';section.dataset.collapsed=next?'true':'false';toggle.textContent=next?'⌄':'⌃';toggle.setAttribute('aria-expanded',next?'false':'true');toggle.setAttribute('aria-label',next?`باز کردن بخش ${titleText}`:`جمع کردن بخش ${titleText}`);toggle.title=next?'باز کردن این بخش':'جمع کردن این بخش';writeCollapsedSection(collapseKey,next);});header.appendChild(toggle);
  if(subtitleText){const subtitle=document.createElement('small');subtitle.textContent=subtitleText;Object.assign(subtitle.style,{gridColumn:'1 / -1',color:TOLUE_DESIGN_TOKENS.color.textMuted,lineHeight:'1.75',maxWidth:'92%'});header.appendChild(subtitle);}
  section.appendChild(header);return header;
}

export function styleEngineeringField(label:HTMLLabelElement,input:HTMLInputElement|HTMLSelectElement,caption:HTMLElement):void{
  Object.assign(label.style,{display:'grid',gap:'6px',alignContent:'start'});
  Object.assign(caption.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted,fontWeight:'650',lineHeight:'1.5'});
  Object.assign(input.style,{fontFamily:'inherit',width:'100%',padding:'9px 10px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:'linear-gradient(180deg,#0e1920,#0b141a)',color:TOLUE_DESIGN_TOKENS.color.text,minHeight:'38px',boxShadow:'inset 0 1px 0 rgba(255,255,255,.018)',transition:'border-color .15s ease,box-shadow .15s ease,background-color .15s ease'});
}

export function styleEngineeringButton(button:HTMLButtonElement,primary=false,danger=false):void{
  Object.assign(button.style,{fontFamily:'inherit',padding:'8px 12px',minHeight:'36px',borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,border:`1px solid ${danger?TOLUE_DESIGN_TOKENS.color.statusCritical:primary?TOLUE_DESIGN_TOKENS.color.accent:TOLUE_DESIGN_TOKENS.color.borderStrong}`,background:danger?'linear-gradient(180deg,rgba(239,107,114,.13),rgba(239,107,114,.07))':primary?'linear-gradient(180deg,rgba(36,152,197,.24),rgba(36,152,197,.13))':'linear-gradient(180deg,#1d2b36,#17232d)',color:danger?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.text,cursor:'pointer',fontWeight:primary?'750':'550',boxShadow:primary?'0 5px 14px rgba(0,0,0,.12), inset 0 1px rgba(255,255,255,.035)':'inset 0 1px rgba(255,255,255,.025)',transition:'background-color .15s ease,border-color .15s ease,transform .12s ease,box-shadow .15s ease'});
}
