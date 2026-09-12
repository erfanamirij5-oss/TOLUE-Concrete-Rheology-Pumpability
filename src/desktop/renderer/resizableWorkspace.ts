export interface ResizableWorkspaceOptions {
  readonly shell: HTMLElement;
  readonly work: HTMLElement;
  readonly tree: HTMLElement;
  readonly viewport: HTMLElement;
  readonly inspector: HTMLElement;
  readonly bottom: HTMLElement;
}

const clamp=(value:number,min:number,max:number):number=>Math.min(max,Math.max(min,value));

export function installResizableWorkspace(options:Readonly<ResizableWorkspaceOptions>):void{
  const {shell,work,tree,viewport,inspector,bottom}=options;
  let treeWidth=230;
  let inspectorWidth=330;
  let bottomHeight=Math.round(window.innerHeight*.26);

  const apply=()=>{
    const width=Math.max(640,rootWidth(work));
    const compact=width<900;
    const minCenter=compact?260:360;
    const sideBudget=Math.max(300,width-minCenter-12);
    treeWidth=clamp(treeWidth,compact?140:180,Math.min(360,sideBudget*.48));
    inspectorWidth=clamp(inspectorWidth,compact?200:260,Math.min(520,Math.max(200,sideBudget-treeWidth)));
    work.style.setProperty('grid-template-columns',`${treeWidth}px 6px minmax(${minCenter}px,1fr) 6px ${inspectorWidth}px`,'important');
    bottomHeight=clamp(bottomHeight,110,Math.max(110,Math.round(window.innerHeight*.55)));
    shell.style.setProperty('grid-template-rows',`44px minmax(220px,1fr) 6px ${bottomHeight}px`,'important');
    shell.style.setProperty('min-width','640px','important');
    shell.dataset.workspaceDensity=compact?'compact':'comfortable';
    tree.dataset.paneWidth=String(Math.round(treeWidth));
    inspector.dataset.paneWidth=String(Math.round(inspectorWidth));
    bottom.dataset.paneHeight=String(Math.round(bottomHeight));
  };

  const grip=(axis:'x'|'y',label:string)=>{
    const el=document.createElement('div');
    el.dataset.workspaceGrip=axis;
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
  work.replaceChildren(tree,treeGrip,viewport,inspectorGrip,inspector);
  shell.insertBefore(bottomGrip,bottom);

  const drag=(el:HTMLElement,onMove:(dx:number,dy:number)=>void)=>{
    el.addEventListener('pointerdown',(event)=>{
      event.preventDefault();
      const startX=event.clientX,startY=event.clientY;
      const initialTree=treeWidth,initialInspector=inspectorWidth,initialBottom=bottomHeight;
      el.setPointerCapture(event.pointerId);
      const move=(e:PointerEvent)=>onMoveFromInitial(e.clientX-startX,e.clientY-startY,initialTree,initialInspector,initialBottom,onMove);
      const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);document.body.style.cursor='';};
      document.body.style.cursor=el.style.cursor;
      el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);
    });
  };

  const onMoveFromInitial=(dx:number,dy:number,initialTree:number,initialInspector:number,initialBottom:number,handler:(dx:number,dy:number)=>void)=>{
    treeWidth=initialTree;inspectorWidth=initialInspector;bottomHeight=initialBottom;handler(dx,dy);
  };
  drag(treeGrip,(dx)=>{treeWidth=treeWidth-dx;apply();});
  drag(inspectorGrip,(dx)=>{inspectorWidth=inspectorWidth+dx;apply();});
  drag(bottomGrip,(_dx,dy)=>{bottomHeight=bottomHeight-dy;apply();});

  treeGrip.addEventListener('keydown',(event)=>{if(event.key==='ArrowLeft'){treeWidth+=12;apply();}else if(event.key==='ArrowRight'){treeWidth-=12;apply();}});
  inspectorGrip.addEventListener('keydown',(event)=>{if(event.key==='ArrowLeft'){inspectorWidth-=12;apply();}else if(event.key==='ArrowRight'){inspectorWidth+=12;apply();}});
  bottomGrip.addEventListener('keydown',(event)=>{if(event.key==='ArrowUp'){bottomHeight+=12;apply();}else if(event.key==='ArrowDown'){bottomHeight-=12;apply();}});

  window.addEventListener('resize',apply,{passive:true});
  apply();
}

function rootWidth(work:HTMLElement):number{return work.getBoundingClientRect().width||window.innerWidth;}
