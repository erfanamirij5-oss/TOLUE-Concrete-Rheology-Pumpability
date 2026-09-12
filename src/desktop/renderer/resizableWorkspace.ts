export interface ResizableWorkspaceOptions {
  readonly shell: HTMLElement;
  readonly work: HTMLElement;
  readonly tree: HTMLElement;
  readonly viewport: HTMLElement;
  readonly inspector: HTMLElement;
  readonly bottom: HTMLElement;
}

type WorkspaceDensity='comfortable'|'compact'|'narrow';
type WorkspaceFocus='none'|'viewport'|'inspector'|'bottom';

const clamp=(value:number,min:number,max:number):number=>Math.min(max,Math.max(min,value));
// v4 intentionally invalidates the oversized bottom-pane value persisted by v3.
const STORAGE_KEY='tolue-workspace-layout-v4';
const DEFAULT_BOTTOM_HEIGHT=112;

interface StoredWorkspaceLayout {
  readonly treeWidth?:number;
  readonly inspectorWidth?:number;
  readonly bottomHeight?:number;
  readonly treeCollapsed?:boolean;
  readonly inspectorCollapsed?:boolean;
  readonly bottomCollapsed?:boolean;
}

const readStoredLayout=():StoredWorkspaceLayout=>{
  try{
    const raw=window.localStorage?.getItem(STORAGE_KEY);
    if(!raw)return {};
    const value=JSON.parse(raw) as StoredWorkspaceLayout;
    return value&&typeof value==='object'?value:{};
  }catch{return {};}
};
const writeStoredLayout=(layout:StoredWorkspaceLayout):void=>{
  try{window.localStorage?.setItem(STORAGE_KEY,JSON.stringify(layout));}catch{/* optional */}
};

function installResponsiveWorkspaceStyle(shell:HTMLElement):void{
  if(document.querySelector('style[data-tolue-responsive-workspace="v6"]'))return;
  const style=document.createElement('style');
  style.dataset.tolueResponsiveWorkspace='v6';
  style.textContent=`
[data-resizable-workspace="true"]{min-width:640px!important;grid-template-rows:54px minmax(220px,1fr) 6px var(--tolue-bottom-height,112px)!important;grid-auto-rows:0!important;overflow:hidden!important}
[data-resizable-workspace="true"]>header{grid-row:1!important;min-height:0!important}
[data-resizable-workspace="true"]>[data-workspace-main="true"]{grid-row:2!important;min-height:0!important;overflow:hidden!important;grid-template-columns:var(--tolue-tree-column,230px) var(--tolue-tree-grip,6px) minmax(var(--tolue-center-min,320px),1fr) var(--tolue-inspector-grip,6px) var(--tolue-inspector-column,330px)!important}
[data-resizable-workspace="true"]>[data-bottom-grip="true"]{grid-row:3!important;height:6px!important;min-height:6px!important;max-height:6px!important;overflow:hidden!important;background:transparent!important}
[data-resizable-workspace="true"]>[data-workspace-pane="bottom"]{grid-row:4!important;min-height:0!important;max-height:var(--tolue-bottom-height,112px)!important;overflow:hidden!important;position:relative!important;inset:auto!important}
[data-resizable-workspace="true"] [data-workspace-grip="true"]{transition:background-color .12s ease}
[data-resizable-workspace="true"] [data-workspace-grip="true"]:focus-visible{outline:2px solid rgba(89,184,223,.82);outline-offset:-2px}
[data-resizable-workspace="true"]>[data-workspace-main="true"]>aside{min-width:0!important;scrollbar-gutter:stable;overscroll-behavior:contain}
[data-resizable-workspace="true"]>[data-workspace-main="true"]>main{min-width:0!important;min-height:0!important;position:relative;overflow:hidden!important}
[data-resizable-workspace="true"] [data-pane-header="true"]{position:sticky!important;top:0!important;z-index:12!important;display:flex!important;align-items:center!important;gap:7px!important;min-height:36px;backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(0,0,0,.12)}
[data-resizable-workspace="true"] [data-pane-header-title="true"]{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
[data-resizable-workspace="true"] [data-pane-header-controls="true"]{display:flex;align-items:center;gap:4px;flex:0 0 auto;margin-inline-start:auto}
[data-resizable-workspace="true"] [data-pane-header-controls="true"] button{width:25px;height:24px;display:inline-grid;place-items:center;padding:0;font:inherit;font-size:12px;line-height:1;color:#b9c8cf;background:#17242d;border:1px solid #304653;border-radius:6px;cursor:pointer}
[data-resizable-workspace="true"] [data-pane-header-controls="true"] button:hover{border-color:#f59b32;color:#ffe1b9;background:#1c2c36}
[data-resizable-workspace="true"]>section>div:first-child{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin;position:relative}
[data-resizable-workspace="true"]>section>div:first-child>button{flex:0 0 auto;white-space:nowrap}
[data-resizable-workspace="true"] [data-bottom-pane-controls="true"]{position:sticky;inset-inline-start:0;z-index:8;display:flex;align-items:center;gap:4px;margin-inline-start:auto;padding-inline-start:6px;background:linear-gradient(90deg,transparent,#142029 18%)}
[data-resizable-workspace="true"] [data-bottom-pane-controls="true"] button{width:27px!important;height:26px!important;display:inline-grid!important;place-items:center;padding:0!important;flex:0 0 auto}
[data-resizable-workspace="true"] [data-engineering-kpi-strip="true"]{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"]{position:absolute;z-index:30;top:8px;inset-inline-end:8px;display:flex;align-items:center;gap:4px;padding:4px;border:1px solid rgba(60,83,98,.76);border-radius:10px;background:rgba(10,18,24,.9);backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,.28)}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button{width:30px;height:28px;display:inline-grid;place-items:center;font:inherit;font-size:14px;color:#c9d5db;background:#16242d;border:1px solid #334b5a;border-radius:7px;padding:0;cursor:pointer}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button:hover{border-color:#f59b32;color:#fff2df;background:#1e2d36}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button[data-active="true"]{border-color:rgba(245,155,50,.78);color:#ffc477;background:rgba(245,155,50,.12)}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] .tolue-toolbar-label{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
[data-resizable-workspace="true"][data-focus-mode="viewport"]>header,[data-resizable-workspace="true"][data-focus-mode="viewport"]>section,[data-resizable-workspace="true"][data-focus-mode="viewport"]>[data-bottom-grip="true"]{display:none!important}
[data-resizable-workspace="true"][data-focus-mode="viewport"]{grid-template-rows:minmax(0,1fr)!important}
[data-resizable-workspace="true"][data-focus-mode="viewport"]>[data-workspace-main="true"]{grid-row:1!important}
[data-resizable-workspace="true"][data-focus-mode="inspector"]>[data-workspace-main="true"]{grid-template-columns:0 0 0 0 minmax(320px,1fr)!important}
[data-resizable-workspace="true"][data-focus-mode="inspector"]>[data-workspace-main="true"]>main,[data-resizable-workspace="true"][data-focus-mode="inspector"]>[data-workspace-main="true"]>aside:first-of-type,[data-resizable-workspace="true"][data-focus-mode="inspector"]>[data-workspace-main="true"]>[data-workspace-grip="true"]{display:none!important}
[data-resizable-workspace="true"][data-focus-mode="bottom"]{grid-template-rows:54px 0 0 minmax(220px,1fr)!important}
[data-resizable-workspace="true"][data-focus-mode="bottom"]>[data-workspace-main="true"],[data-resizable-workspace="true"][data-focus-mode="bottom"]>[data-bottom-grip="true"]{display:none!important}
[data-resizable-workspace="true"][data-focus-mode="bottom"]>[data-workspace-pane="bottom"]{max-height:none!important}
[data-resizable-workspace="true"][data-workspace-density="compact"] [data-engineering-kpi-strip="true"],[data-resizable-workspace="true"][data-workspace-density="narrow"] [data-engineering-kpi-strip="true"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
[data-resizable-workspace="true"][data-workspace-density="compact"]>[data-workspace-main="true"]>main{padding:8px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header>[data-product-stage="true"],[data-resizable-workspace="true"][data-workspace-density="narrow"]>header>[data-sample-project-badge="true"]{display:none!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>[data-workspace-main="true"]>main{padding:6px!important}
`;
  (shell.ownerDocument.head??shell.ownerDocument.documentElement).appendChild(style);
}

export function installResizableWorkspace(options:Readonly<ResizableWorkspaceOptions>):void{
  const {shell,work,tree,viewport,inspector,bottom}=options;
  if(shell.dataset.resizableWorkspace==='true')return;
  shell.dataset.resizableWorkspace='true';
  work.dataset.workspaceMain='true';
  tree.dataset.workspacePane='tree';viewport.dataset.workspacePane='viewport';inspector.dataset.workspacePane='inspector';bottom.dataset.workspacePane='bottom';
  installResponsiveWorkspaceStyle(shell);

  const stored=readStoredLayout();
  let treeWidth=Number.isFinite(stored.treeWidth)?Number(stored.treeWidth):230;
  let inspectorWidth=Number.isFinite(stored.inspectorWidth)?Number(stored.inspectorWidth):330;
  let bottomHeight=Number.isFinite(stored.bottomHeight)?Number(stored.bottomHeight):DEFAULT_BOTTOM_HEIGHT;
  let treeCollapsed=stored.treeCollapsed===true,inspectorCollapsed=stored.inspectorCollapsed===true,bottomCollapsed=stored.bottomCollapsed===true;
  let focusMode:WorkspaceFocus='none';
  const persist=()=>writeStoredLayout({treeWidth,inspectorWidth,bottomHeight,treeCollapsed,inspectorCollapsed,bottomCollapsed});

  const grip=(axis:'x'|'y',label:string)=>{
    const el=document.createElement('div');el.dataset.workspaceGrip='true';el.dataset.axis=axis;el.setAttribute('role','separator');el.setAttribute('aria-label',label);el.setAttribute('aria-orientation',axis==='x'?'vertical':'horizontal');el.tabIndex=0;
    Object.assign(el.style,{position:'relative',zIndex:'8',background:'transparent',cursor:axis==='x'?'col-resize':'row-resize',touchAction:'none',userSelect:'none'});
    const line=document.createElement('span');Object.assign(line.style,{position:'absolute',inset:axis==='x'?'0 2px':'2px 0',borderRadius:'3px',background:'rgba(245,155,50,.20)'});el.appendChild(line);
    el.addEventListener('pointerenter',()=>line.style.background='rgba(245,155,50,.72)');el.addEventListener('pointerleave',()=>line.style.background='rgba(245,155,50,.20)');return el;
  };
  const treeGrip=grip('x','تغییر عرض درخت پروژه'),inspectorGrip=grip('x','تغییر عرض بازرس مهندسی'),bottomGrip=grip('y','تغییر ارتفاع پنل پایین');
  bottomGrip.dataset.bottomGrip='true';Object.assign(bottomGrip.style,{height:'6px',minHeight:'6px',maxHeight:'6px',overflow:'hidden'});
  work.replaceChildren(tree,treeGrip,viewport,inspectorGrip,inspector);shell.insertBefore(bottomGrip,bottom);

  const toolbar=document.createElement('div');toolbar.dataset.workspaceToolbar='true';toolbar.setAttribute('aria-label','کنترل چیدمان محیط کاری');
  const makeButton=(icon:string,label:string,onClick:()=>void)=>{const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);const v=document.createElement('span');v.textContent=icon;v.setAttribute('aria-hidden','true');const t=document.createElement('span');t.textContent=label;t.className='tolue-toolbar-label';b.append(v,t);b.addEventListener('click',onClick);toolbar.appendChild(b);return b;};
  const treeToggle=makeButton('☰','درخت پروژه',()=>{treeCollapsed=!treeCollapsed;focusMode='none';apply();persist();});
  const inspectorToggle=makeButton('▤','بازرس مهندسی',()=>{inspectorCollapsed=!inspectorCollapsed;focusMode='none';apply();persist();});
  const bottomToggle=makeButton('▥','پنل پایین',()=>{bottomCollapsed=!bottomCollapsed;focusMode='none';apply();persist();});
  const viewportFocus=makeButton('⛶','تمرکز سه‌بعدی',()=>{focusMode=focusMode==='viewport'?'none':'viewport';apply();});
  const inspectorFocus=makeButton('↗','بیشینه‌سازی بازرس',()=>{focusMode=focusMode==='inspector'?'none':'inspector';apply();});
  const bottomFocus=makeButton('↕','بیشینه‌سازی پنل پایین',()=>{focusMode=focusMode==='bottom'?'none':'bottom';apply();});
  viewport.appendChild(toolbar);

  const paneControl=(icon:string,label:string,onClick:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=icon;b.title=label;b.setAttribute('aria-label',label);b.addEventListener('click',e=>{e.stopPropagation();onClick();});return b;};
  const decorate=(pane:HTMLElement,kind:'tree'|'inspector')=>{const header=pane.firstElementChild;if(!(header instanceof HTMLElement))return;header.dataset.paneHeader='true';const text=header.textContent??'';header.replaceChildren();const title=document.createElement('span');title.dataset.paneHeaderTitle='true';title.textContent=text;const controls=document.createElement('span');controls.dataset.paneHeaderControls='true';controls.appendChild(paneControl('—','جمع‌کردن',()=>{if(kind==='tree')treeCollapsed=true;else inspectorCollapsed=true;focusMode='none';apply();persist();}));if(kind==='inspector')controls.appendChild(paneControl('↗','بیشینه‌سازی',()=>{focusMode=focusMode==='inspector'?'none':'inspector';apply();}));header.append(title,controls);};
  decorate(tree,'tree');decorate(inspector,'inspector');
  const bottomTabs=bottom.firstElementChild;if(bottomTabs instanceof HTMLElement){const controls=document.createElement('span');controls.dataset.bottomPaneControls='true';controls.append(paneControl('—','جمع‌کردن پنل پایین',()=>{bottomCollapsed=true;focusMode='none';apply();persist();}),paneControl('↕','بیشینه‌سازی پنل پایین',()=>{focusMode=focusMode==='bottom'?'none':'bottom';apply();}));bottomTabs.appendChild(controls);}

  const apply=()=>{
    const width=Math.max(640,work.getBoundingClientRect().width||window.innerWidth);const density:WorkspaceDensity=width<760?'narrow':width<980?'compact':'comfortable';
    const minCenter=density==='narrow'?250:density==='compact'?290:360,treeMin=density==='narrow'?130:density==='compact'?155:180,inspectorMin=density==='narrow'?175:density==='compact'?220:260;
    const budget=Math.max(treeMin+inspectorMin,width-minCenter-12);treeWidth=clamp(treeWidth,treeMin,Math.min(density==='narrow'?220:360,Math.max(treeMin,budget-inspectorMin)));inspectorWidth=clamp(inspectorWidth,inspectorMin,Math.min(density==='narrow'?260:520,Math.max(inspectorMin,budget-treeWidth)));
    bottomHeight=clamp(bottomHeight,92,Math.max(112,Math.round(window.innerHeight*.45)));
    const hideTree=focusMode!=='none'||treeCollapsed,hideInspector=(focusMode==='viewport'||focusMode==='bottom')||inspectorCollapsed,hideViewport=focusMode==='inspector'||focusMode==='bottom',hideBottom=(focusMode==='viewport'||focusMode==='inspector')||bottomCollapsed;
    shell.dataset.workspaceDensity=density;shell.dataset.focusMode=focusMode;
    shell.style.setProperty('--tolue-tree-column',hideTree?'0px':`${treeWidth}px`);shell.style.setProperty('--tolue-tree-grip',hideTree?'0px':'6px');shell.style.setProperty('--tolue-inspector-column',hideInspector?'0px':`${inspectorWidth}px`);shell.style.setProperty('--tolue-inspector-grip',hideInspector?'0px':'6px');shell.style.setProperty('--tolue-center-min',`${minCenter}px`);shell.style.setProperty('--tolue-bottom-height',hideBottom?'0px':`${bottomHeight}px`);
    tree.style.display=hideTree?'none':'';treeGrip.style.display=hideTree?'none':'';viewport.style.display=hideViewport?'none':'';inspector.style.display=hideInspector?'none':'';inspectorGrip.style.display=hideInspector?'none':'';bottom.style.display=hideBottom?'none':'';bottomGrip.style.display=hideBottom?'none':'';
    treeToggle.dataset.active=treeCollapsed?'true':'false';inspectorToggle.dataset.active=inspectorCollapsed?'true':'false';bottomToggle.dataset.active=bottomCollapsed?'true':'false';viewportFocus.dataset.active=focusMode==='viewport'?'true':'false';inspectorFocus.dataset.active=focusMode==='inspector'?'true':'false';bottomFocus.dataset.active=focusMode==='bottom'?'true':'false';
    tree.dataset.paneWidth=String(Math.round(treeWidth));inspector.dataset.paneWidth=String(Math.round(inspectorWidth));bottom.dataset.paneHeight=String(Math.round(bottomHeight));
  };
  const drag=(el:HTMLElement,onMove:(dx:number,dy:number)=>void)=>el.addEventListener('pointerdown',event=>{event.preventDefault();let x=event.clientX,y=event.clientY;el.setPointerCapture(event.pointerId);const move=(e:PointerEvent)=>{const dx=e.clientX-x,dy=e.clientY-y;x=e.clientX;y=e.clientY;onMove(dx,dy);apply();};const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);document.body.style.cursor='';persist();};document.body.style.cursor=el.style.cursor;el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);});
  drag(treeGrip,dx=>{treeWidth-=dx;});drag(inspectorGrip,dx=>{inspectorWidth+=dx;});drag(bottomGrip,(_dx,dy)=>{bottomHeight-=dy;});
  const keyboard=(el:HTMLElement,handler:(delta:number)=>void)=>el.addEventListener('keydown',event=>{const step=event.shiftKey?32:12,axis=el.dataset.axis;let delta=0;if(axis==='x'&&event.key==='ArrowLeft')delta=-step;if(axis==='x'&&event.key==='ArrowRight')delta=step;if(axis==='y'&&event.key==='ArrowUp')delta=-step;if(axis==='y'&&event.key==='ArrowDown')delta=step;if(!delta)return;event.preventDefault();handler(delta);apply();persist();});
  keyboard(treeGrip,d=>{treeWidth-=d;});keyboard(inspectorGrip,d=>{inspectorWidth+=d;});keyboard(bottomGrip,d=>{bottomHeight-=d;});
  treeGrip.addEventListener('dblclick',()=>{treeWidth=230;treeCollapsed=false;focusMode='none';apply();persist();});inspectorGrip.addEventListener('dblclick',()=>{inspectorWidth=330;inspectorCollapsed=false;focusMode='none';apply();persist();});bottomGrip.addEventListener('dblclick',()=>{bottomHeight=DEFAULT_BOTTOM_HEIGHT;bottomCollapsed=false;focusMode='none';apply();persist();});
  shell.addEventListener('keydown',event=>{if(event.key==='Escape'&&focusMode!=='none'){focusMode='none';apply();}});window.addEventListener('resize',apply,{passive:true});apply();
}
