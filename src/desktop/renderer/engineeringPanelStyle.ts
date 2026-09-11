import { TOLUE_DESIGN_TOKENS } from './designSystem';

export function styleEngineeringSection(section:HTMLElement,accent=false):void{
  Object.assign(section.style,{border:`1px solid ${accent?TOLUE_DESIGN_TOKENS.color.borderStrong:TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.md,background:'linear-gradient(180deg,rgba(29,43,54,.94),rgba(17,26,34,.96))',boxShadow:'0 12px 28px rgba(0,0,0,.14)',overflow:'hidden'});
}

export function appendEngineeringSectionHeader(section:HTMLElement,titleText:string,subtitleText?:string,badgeText?:string):HTMLElement{
  const header=document.createElement('header');Object.assign(header.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px 12px',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:'linear-gradient(90deg,rgba(36,152,197,.10),transparent 65%)'});
  const title=document.createElement('strong');title.textContent=titleText;Object.assign(title.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeLg,letterSpacing:'-.01em'});header.appendChild(title);
  if(badgeText){const badge=document.createElement('span');badge.textContent=badgeText;Object.assign(badge.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,padding:'3px 7px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.borderStrong}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,color:TOLUE_DESIGN_TOKENS.color.info,direction:'ltr'});header.appendChild(badge);}
  if(subtitleText){const subtitle=document.createElement('small');subtitle.textContent=subtitleText;Object.assign(subtitle.style,{gridColumn:'1 / -1',color:TOLUE_DESIGN_TOKENS.color.textMuted,lineHeight:'1.7'});header.appendChild(subtitle);}
  section.appendChild(header);return header;
}

export function styleEngineeringField(label:HTMLLabelElement,input:HTMLInputElement|HTMLSelectElement,caption:HTMLElement):void{
  Object.assign(label.style,{display:'grid',gap:'6px',alignContent:'start'});Object.assign(caption.style,{fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,color:TOLUE_DESIGN_TOKENS.color.textMuted,fontWeight:'600'});Object.assign(input.style,{fontFamily:'inherit',width:'100%',padding:'9px 10px',border:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,background:'#0d171e',color:TOLUE_DESIGN_TOKENS.color.text,minHeight:'38px'});
}

export function styleEngineeringButton(button:HTMLButtonElement,primary=false,danger=false):void{
  Object.assign(button.style,{fontFamily:'inherit',padding:'8px 11px',borderRadius:TOLUE_DESIGN_TOKENS.radius.sm,border:`1px solid ${danger?TOLUE_DESIGN_TOKENS.color.statusCritical:primary?TOLUE_DESIGN_TOKENS.color.accent:TOLUE_DESIGN_TOKENS.color.borderStrong}`,background:danger?'rgba(239,107,114,.10)':primary?'rgba(36,152,197,.18)':TOLUE_DESIGN_TOKENS.color.surfaceElevated,color:danger?TOLUE_DESIGN_TOKENS.color.statusCritical:TOLUE_DESIGN_TOKENS.color.text,cursor:'pointer',fontWeight:primary?'700':'500'});
}
