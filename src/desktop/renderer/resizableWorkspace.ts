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
    const width=Math.max(640,work.clientWidth||window.innerWidth);
    const compact=width<900;
    const minCenter=compact?280:360;
    const sideBudget=Math.max(300,width-minCenter-12);
    treeWidth=clamp(treeWidth,compact?150:180,Math.min(360,sideBudget*.48));
    inspectorWidth=clamp(inspectorWidth,compact?220:260,Math.min(520,sideBudget-treeWidth));
    work.style.gridTemplateColumns=`${treeWidth}px 6px minmax(${minCenter}px,1fr) 6px ${inspectorWidth}px`;
    bottomHeight=clamp(bottomHeight,110,Math.max(110,Math.round(window.innerHeight*.55)));
    shell.style.gridTemplateRows=`44px minmax(220px,1fr) 6px ${bottomHeight}px`;
    shell.dataset.workspaceDensity=compact?'compact':'comfortable';
  };

  const grip=(axis:'x'|'y',label:string)=>{
    const el=document.createElement('div');
    el.setAttribute('role','separator');
    el.setAttribute('aria-label',label);
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
      el.setPointerCapture(event.pointerId);
      const move=(e:PointerEvent)=>onMove(e.clientX-startX,e.clientY-startY);
      const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);document.body.style.cursor='';};
      document.body.style.cursor=el.style.cursor;
      el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);
    });
  };

  drag(treeGrip,(dx)=>{treeWidth=treeWidth-dx;apply();});
  drag(inspectorGrip,(dx)=>{inspectorWidth=inspectorWidth+dx;apply();});
  drag(bottomGrip,(_dx,dy)=>{bottomHeight=bottomHeight-dy;apply();});

  const resize=()=>apply();
  window.addEventListener('resize',resize,{passive:true});
  apply();
}
