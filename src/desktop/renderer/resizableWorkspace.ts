export interface ResizableWorkspaceOptions {
  readonly shell: HTMLElement;
  readonly work: HTMLElement;
  readonly tree: HTMLElement;
  readonly viewport: HTMLElement;
  readonly inspector: HTMLElement;
  readonly bottom: HTMLElement;
}

type WorkspaceDensity='comfortable'|'compact'|'narrow';

const clamp=(value:number,min:number,max:number):number=>Math.min(max,Math.max(min,value));
const STORAGE_KEY='tolue-workspace-layout-v2';

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
  try{window.localStorage?.setItem(STORAGE_KEY,JSON.stringify(layout));}catch{/* persistence is optional */}
};

function installResponsiveWorkspaceStyle(shell:HTMLElement):void{
  if(document.querySelector('style[data-tolue-responsive-workspace="v2"]'))return;
  const style=document.createElement('style');
  style.dataset.tolueResponsiveWorkspace='v2';
  style.textContent=`
[data-resizable-workspace="true"]{min-width:640px!important;grid-template-rows:54px minmax(220px,1fr) 6px var(--tolue-bottom-height,220px)!important}
[data-resizable-workspace="true"]>[data-workspace-main="true"]{grid-template-columns:var(--tolue-tree-column,230px) var(--tolue-tree-grip,6px) minmax(var(--tolue-center-min,320px),1fr) var(--tolue-inspector-grip,6px) var(--tolue-inspector-column,330px)!important}
[data-resizable-workspace="true"] [data-workspace-grip="true"]{transition:background-color .12s ease}
[data-resizable-workspace="true"] [data-workspace-grip="true"]:focus-visible{outline:2px solid rgba(89,184,223,.82);outline-offset:-2px}
[data-resizable-workspace="true"]>[data-workspace-main="true"]>aside{min-width:0!important}
[data-resizable-workspace="true"]>[data-workspace-main="true"]>main{min-width:0!important;position:relative}
[data-resizable-workspace="true"]>section>div:first-child{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}
[data-resizable-workspace="true"]>section>div:first-child>button{flex:0 0 auto;white-space:nowrap}
[data-resizable-workspace="true"] [data-engineering-kpi-strip="true"]{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"]{position:absolute;z-index:20;top:8px;inset-inline-end:8px;display:flex;gap:5px;padding:5px;border:1px solid rgba(60,83,98,.72);border-radius:9px;background:rgba(10,18,24,.88);backdrop-filter:blur(8px);box-shadow:0 7px 22px rgba(0,0,0,.24)}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button{font:inherit;font-size:11px;line-height:1;color:#c9d5db;background:#16242d;border:1px solid #334b5a;border-radius:7px;padding:5px 8px;cursor:pointer;white-space:nowrap}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button:hover{border-color:#f59b32;color:#fff2df;background:#1e2d36}
[data-resizable-workspace="true"] [data-workspace-toolbar="true"] button[data-active="true"]{border-color:rgba(245,155,50,.72);color:#ffc477;background:rgba(245,155,50,.12)}
[data-resizable-workspace="true"][data-focus-viewport="true"]>header,
[data-resizable-workspace="true"][data-focus-viewport="true"]>section,
[data-resizable-workspace="true"][data-focus-viewport="true"]>[data-bottom-grip="true"]{display:none!important}
[data-resizable-workspace="true"][data-focus-viewport="true"]{grid-template-rows:minmax(0,1fr)!important}
[data-resizable-workspace="true"][data-focus-viewport="true"]>[data-workspace-main="true"]{grid-row:1!important}
[data-resizable-workspace="true"][data-workspace-density="compact"]>header{gap:6px!important;padding-inline:9px!important}
[data-resizable-workspace="true"][data-workspace-density="compact"]>header>[data-product-stage="true"]{display:none!important}
[data-resizable-workspace="true"][data-workspace-density="compact"] [data-engineering-kpi-strip="true"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
[data-resizable-workspace="true"][data-workspace-density="compact"]>[data-workspace-main="true"]>main{padding:8px!important}
[data-resizable-workspace="true"][data-workspace-density="compact"]>[data-workspace-main="true"]>aside>div:last-child{padding:8px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header{gap:5px!important;padding-inline:7px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header>span:nth-of-type(1){display:none!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header>[data-product-stage="true"],
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header>[data-sample-project-badge="true"]{display:none!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>header button{padding-inline:7px!important;min-width:0!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"] [data-engineering-kpi-strip="true"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;padding-bottom:5px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"] [data-engineering-kpi-strip="true"] article{padding:7px 8px 6px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>[data-workspace-main="true"]>main{padding:6px!important;gap:4px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>section>div:first-child{padding-inline:5px!important;gap:3px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"]>section>div:first-child>button{padding:4px 8px!important}
[data-resizable-workspace="true"][data-workspace-density="narrow"] [data-workspace-toolbar="true"]{top:5px;inset-inline-end:5px;padding:4px;gap:3px}
[data-resizable-workspace="true"][data-workspace-density="narrow"] [data-workspace-toolbar="true"] button{padding:4px 6px;font-size:10px}
`;
  (shell.ownerDocument.head??shell.ownerDocument.documentElement).appendChild(style);
}

export function installResizableWorkspace(options:Readonly<ResizableWorkspaceOptions>):void{
  const {shell,work,tree,viewport,inspector,bottom}=options;
  if(shell.dataset.resizableWorkspace==='true')return;
  shell.dataset.resizableWorkspace='true';
  work.dataset.workspaceMain='true';
  tree.dataset.workspacePane='tree';
  viewport.dataset.workspacePane='viewport';
  inspector.dataset.workspacePane='inspector';
  bottom.dataset.workspacePane='bottom';
  installResponsiveWorkspaceStyle(shell);

  const stored=readStoredLayout();
  let treeWidth=Number.isFinite(stored.treeWidth)?Number(stored.treeWidth):230;
  let inspectorWidth=Number.isFinite(stored.inspectorWidth)?Number(stored.inspectorWidth):330;
  let bottomHeight=Number.isFinite(stored.bottomHeight)?Number(stored.bottomHeight):Math.round(window.innerHeight*.26);
  let treeCollapsed=stored.treeCollapsed===true;
  let inspectorCollapsed=stored.inspectorCollapsed===true;
  let bottomCollapsed=stored.bottomCollapsed===true;
  let focusViewport=false;

  const persist=()=>writeStoredLayout({treeWidth,inspectorWidth,bottomHeight,treeCollapsed,inspectorCollapsed,bottomCollapsed});

  const grip=(axis:'x'|'y',label:string)=>{
    const el=document.createElement('div');
    el.dataset.workspaceGrip='true';
    el.dataset.axis=axis;
    el.setAttribute('role','separator');
    el.setAttribute('aria-label',label);
    el.setAttribute('aria-orientation',axis==='x'?'vertical':'horizontal');
    el.tabIndex=0;
    Object.assign(el.style,{position:'relative',zIndex:'8',background:'transparent',cursor:axis==='x'?'col-resize':'row-resize',touchAction:'none',userSelect:'none'});
    const line=document.createElement('span');
    Object.assign(line.style,{position:'absolute',inset:axis==='x'?'0 2px':'2px 0',borderRadius:'3px',background:'rgba(245,155,50,.20)',transition:'background .12s ease'});
    el.appendChild(line);
    el.addEventListener('pointerenter',()=>line.style.background='rgba(245,155,50,.72)');
    el.addEventListener('pointerleave',()=>line.style.background='rgba(245,155,50,.20)');
    return el;
  };

  const treeGrip=grip('x','تغییر عرض درخت پروژه');
  const inspectorGrip=grip('x','تغییر عرض بازرس مهندسی');
  const bottomGrip=grip('y','تغییر ارتفاع پنل پایین');
  bottomGrip.dataset.bottomGrip='true';
  work.replaceChildren(tree,treeGrip,viewport,inspectorGrip,inspector);
  shell.insertBefore(bottomGrip,bottom);

  const toolbar=document.createElement('div');
  toolbar.dataset.workspaceToolbar='true';
  toolbar.setAttribute('aria-label','کنترل چیدمان محیط کاری');
  const makeButton=(label:string,title:string,onClick:()=>void)=>{
    const button=document.createElement('button');
    button.type='button';
    button.textContent=label;
    button.title=title;
    button.addEventListener('click',onClick);
    toolbar.appendChild(button);
    return button;
  };
  const treeToggle=makeButton('درخت','نمایش یا جمع‌کردن درخت پروژه',()=>{treeCollapsed=!treeCollapsed;focusViewport=false;apply();persist();});
  const inspectorToggle=makeButton('بازرس','نمایش یا جمع‌کردن بازرس مهندسی',()=>{inspectorCollapsed=!inspectorCollapsed;focusViewport=false;apply();persist();});
  const bottomToggle=makeButton('پنل پایین','نمایش یا جمع‌کردن پنل پایین',()=>{bottomCollapsed=!bottomCollapsed;focusViewport=false;apply();persist();});
  const focusToggle=makeButton('تمرکز 3D','بیشینه‌سازی فضای نمای سه‌بعدی',()=>{focusViewport=!focusViewport;apply();});
  viewport.appendChild(toolbar);

  const apply=()=>{
    const width=Math.max(640,work.getBoundingClientRect().width||window.innerWidth);
    const density:WorkspaceDensity=width<760?'narrow':width<980?'compact':'comfortable';
    const minCenter=density==='narrow'?250:density==='compact'?290:360;
    const treeMin=density==='narrow'?130:density==='compact'?155:180;
    const inspectorMin=density==='narrow'?175:density==='compact'?220:260;
    const totalGrip=12;
    const sideBudget=Math.max(treeMin+inspectorMin,width-minCenter-totalGrip);
    const treeMax=Math.min(density==='narrow'?220:360,Math.max(treeMin,sideBudget-inspectorMin));
    treeWidth=clamp(treeWidth,treeMin,treeMax);
    const inspectorMax=Math.min(density==='narrow'?260:520,Math.max(inspectorMin,sideBudget-treeWidth));
    inspectorWidth=clamp(inspectorWidth,inspectorMin,inspectorMax);
    bottomHeight=clamp(bottomHeight,110,Math.max(110,Math.round(window.innerHeight*.55)));

    const hideTree=focusViewport||treeCollapsed;
    const hideInspector=focusViewport||inspectorCollapsed;
    const hideBottom=focusViewport||bottomCollapsed;

    shell.dataset.workspaceDensity=density;
    shell.dataset.focusViewport=focusViewport?'true':'false';
    shell.style.setProperty('--tolue-tree-column',hideTree?'0px':`${treeWidth}px`);
    shell.style.setProperty('--tolue-tree-grip',hideTree?'0px':'6px');
    shell.style.setProperty('--tolue-inspector-column',hideInspector?'0px':`${inspectorWidth}px`);
    shell.style.setProperty('--tolue-inspector-grip',hideInspector?'0px':'6px');
    shell.style.setProperty('--tolue-center-min',`${minCenter}px`);
    shell.style.setProperty('--tolue-bottom-height',hideBottom?'0px':`${bottomHeight}px`);

    tree.style.display=hideTree?'none':'';
    treeGrip.style.display=hideTree?'none':'';
    inspector.style.display=hideInspector?'none':'';
    inspectorGrip.style.display=hideInspector?'none':'';
    bottom.style.display=hideBottom?'none':'';
    bottomGrip.style.display=hideBottom?'none':'';

    treeToggle.dataset.active=hideTree?'true':'false';
    inspectorToggle.dataset.active=hideInspector?'true':'false';
    bottomToggle.dataset.active=hideBottom?'true':'false';
    focusToggle.dataset.active=focusViewport?'true':'false';
    treeToggle.textContent=hideTree?'نمایش درخت':'درخت';
    inspectorToggle.textContent=hideInspector?'نمایش بازرس':'بازرس';
    bottomToggle.textContent=hideBottom?'نمایش پنل':'پنل پایین';
    focusToggle.textContent=focusViewport?'خروج از تمرکز':'تمرکز 3D';

    tree.dataset.paneWidth=String(Math.round(treeWidth));
    inspector.dataset.paneWidth=String(Math.round(inspectorWidth));
    bottom.dataset.paneHeight=String(Math.round(bottomHeight));
  };

  const drag=(el:HTMLElement,onMove:(dx:number,dy:number)=>void)=>{
    el.addEventListener('pointerdown',(event)=>{
      event.preventDefault();
      let lastX=event.clientX,lastY=event.clientY;
      el.setPointerCapture(event.pointerId);
      const move=(e:PointerEvent)=>{
        const dx=e.clientX-lastX,dy=e.clientY-lastY;
        lastX=e.clientX;lastY=e.clientY;
        onMove(dx,dy);
      };
      const up=()=>{
        el.removeEventListener('pointermove',move);
        el.removeEventListener('pointerup',up);
        document.body.style.cursor='';
        persist();
      };
      document.body.style.cursor=el.style.cursor;
      el.addEventListener('pointermove',move);
      el.addEventListener('pointerup',up);
    });
  };

  drag(treeGrip,(dx)=>{treeWidth=treeWidth-dx;apply();});
  drag(inspectorGrip,(dx)=>{inspectorWidth=inspectorWidth+dx;apply();});
  drag(bottomGrip,(_dx,dy)=>{bottomHeight=bottomHeight-dy;apply();});

  const keyboardResize=(el:HTMLElement,handler:(delta:number)=>void)=>{
    el.addEventListener('keydown',(event)=>{
      const step=event.shiftKey?32:12;
      const axis=el.dataset.axis;
      let delta=0;
      if(axis==='x'&&event.key==='ArrowLeft')delta=-step;
      if(axis==='x'&&event.key==='ArrowRight')delta=step;
      if(axis==='y'&&event.key==='ArrowUp')delta=-step;
      if(axis==='y'&&event.key==='ArrowDown')delta=step;
      if(!delta)return;
      event.preventDefault();handler(delta);apply();persist();
    });
  };
  keyboardResize(treeGrip,(delta)=>{treeWidth=treeWidth-delta;});
  keyboardResize(inspectorGrip,(delta)=>{inspectorWidth=inspectorWidth+delta;});
  keyboardResize(bottomGrip,(delta)=>{bottomHeight=bottomHeight-delta;});

  treeGrip.addEventListener('dblclick',()=>{treeWidth=230;treeCollapsed=false;apply();persist();});
  inspectorGrip.addEventListener('dblclick',()=>{inspectorWidth=330;inspectorCollapsed=false;apply();persist();});
  bottomGrip.addEventListener('dblclick',()=>{bottomHeight=Math.round(window.innerHeight*.26);bottomCollapsed=false;apply();persist();});

  window.addEventListener('resize',apply,{passive:true});
  apply();
}
