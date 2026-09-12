import type { EngineeringReportExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { VerificationEvidencePackage } from '../../engineering/core/verificationEvidencePackage';
import type { EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import type { EngineeringRunComparisonIpcResponse, EngineeringRunHistoryIpcResponse, EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import type { VerificationEvidenceHistoryIpcResponse, VerificationEvidenceImportIpcResponse, VerificationEvidenceLoadIpcResponse } from '../ipc/verificationEvidenceIpc';
import { applyEngineeringAnalysisResponse, createApplicationDataFlowState, getExportablePdfRequest, hydratePersistedEngineeringRun, markAnalysisRunning, setAnalysisInput, type ApplicationDataFlowState } from './applicationDataFlow';
import { analysisExecutionUxState } from './analysisExecutionUx';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { renderDiagnosticsView } from './diagnosticsView';
import { renderEngineeringKpiStrip } from './engineeringKpiStrip';
import { renderEvidenceView } from './evidenceView';
import { renderMaterialsView } from './materialView';
import { createPipelineScenePresentation } from './pipelineScenePresentation';
import { renderPipelineView } from './pipelineView';
import { renderProjectView } from './projectView';
import { renderPumpView } from './pumpView';
import { renderRheologyView } from './rheologyView';
import { renderReportView } from './reportView';
import { renderResultView } from './resultView';
import { renderRunComparisonView } from './runComparisonView';
import { renderRunHistoryView } from './runHistoryView';
import { renderSegmentInspectorCard } from './segmentInspectorView';
import { renderVerificationPackageHistoryView } from './verificationPackageHistoryView';
import { renderVerificationWorkspaceView } from './verificationWorkspaceView';
import { renderVisualization3DView } from './visualization3dView';
import { sessionUxCopy } from './uxCopy';

export interface ApplicationShellActions {
  readonly executeEngineeringAnalysis:(input:SimulationRunInput)=>Promise<EngineeringAnalysisIpcResponse>;
  readonly loadEngineeringRun:(runId:string)=>Promise<EngineeringRunLoadIpcResponse>;
  readonly listEngineeringRuns:()=>Promise<EngineeringRunHistoryIpcResponse>;
  readonly compareEngineeringRuns:(baselineRunId:string,candidateRunId:string)=>Promise<EngineeringRunComparisonIpcResponse>;
  readonly exportEngineeringPdf:(request:EngineeringReportExportRequest)=>Promise<unknown>;
  readonly importVerificationEvidence:()=>Promise<VerificationEvidenceImportIpcResponse>;
  readonly listVerificationEvidencePackages:()=>Promise<VerificationEvidenceHistoryIpcResponse>;
  readonly loadVerificationEvidencePackage:(packageId:string)=>Promise<VerificationEvidenceLoadIpcResponse>;
}

type InspectorMode='project'|'materials'|'rheology'|'pump'|'pipeline'|'evidence'|'segment';
type BottomMode='simulation'|'results'|'warnings'|'history'|'compare'|'report'|'verification';
const buttonStyle=(button:HTMLButtonElement,active=false)=>{button.style.font='inherit';button.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;button.style.color=active?TOLUE_DESIGN_TOKENS.color.text:TOLUE_DESIGN_TOKENS.color.textMuted;button.style.background=active?TOLUE_DESIGN_TOKENS.color.surfaceElevated:'transparent';button.style.border=`1px solid ${active?TOLUE_DESIGN_TOKENS.color.borderStrong:'transparent'}`;button.style.borderRadius=TOLUE_DESIGN_TOKENS.radius.sm;button.style.padding='6px 9px';button.style.cursor='pointer';};

export function renderApplicationShell(root:HTMLElement,dataFlow:Readonly<ApplicationDataFlowState>=createApplicationDataFlowState(),actions?:Readonly<ApplicationShellActions>):void{
  let sessionState=dataFlow;
  let inspectorMode:InspectorMode='project';
  let bottomMode:BottomMode='simulation';
  let selectedSegmentId:string|null=null;
  let verificationPackage:Readonly<VerificationEvidencePackage>|null=null;
  let verificationImportError:string|null=null;
  let verificationImportBusy=false;
  let verificationHistory:VerificationEvidenceHistoryIpcResponse['items']=Object.freeze([]);
  let verificationHistoryBusy=false;
  let verificationHistoryLoaded=false;
  let verificationHistoryError:string|null=null;
  let verificationLoadBusyPackageId:string|null=null;
  root.replaceChildren(); root.setAttribute('dir','rtl'); root.setAttribute('lang','fa');
  Object.assign(root.style,{fontFamily:TOLUE_DESIGN_TOKENS.typography.fontFamily,background:TOLUE_DESIGN_TOKENS.color.background,color:TOLUE_DESIGN_TOKENS.color.text,minHeight:'100vh',height:'100vh',overflow:'hidden'});

  const shell=document.createElement('div');
  Object.assign(shell.style,{display:'grid',gridTemplateRows:'42px minmax(0,1fr) minmax(150px,26vh)',height:'100vh',minWidth:'980px',background:TOLUE_DESIGN_TOKENS.color.background});
  const top=document.createElement('header');
  Object.assign(top.style,{display:'flex',alignItems:'center',gap:'8px',padding:'0 10px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const brand=document.createElement('strong'); brand.textContent='TOLUE'; brand.style.letterSpacing='1.5px'; brand.style.direction='ltr';
  const product=document.createElement('span'); product.textContent='Concrete Rheology & Pumpability'; product.style.direction='ltr'; product.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm; product.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const spacer=document.createElement('div'); spacer.style.flex='1';
  const projectContext=document.createElement('span'); projectContext.textContent='Engineering Workspace'; projectContext.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  const saveState=document.createElement('span'); saveState.style.fontSize=TOLUE_DESIGN_TOKENS.typography.fontSizeXs; saveState.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;
  const runTop=document.createElement('button'); runTop.type='button'; buttonStyle(runTop,true);
  top.append(brand,product,spacer,projectContext,saveState,runTop);

  const work=document.createElement('div');
  Object.assign(work.style,{display:'grid',gridTemplateColumns:'230px minmax(0,1fr) 330px',minHeight:'0',overflow:'hidden'});
  const tree=document.createElement('aside');
  Object.assign(tree.style,{minWidth:'0',overflow:'auto',borderLeft:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const treeHeader=document.createElement('div'); treeHeader.textContent='PROJECT / SCENE'; Object.assign(treeHeader.style,{padding:'9px 10px',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,fontWeight:'700',color:TOLUE_DESIGN_TOKENS.color.textMuted,borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`});
  const treeBody=document.createElement('div'); treeBody.style.padding='6px'; tree.append(treeHeader,treeBody);

  const viewport=document.createElement('main'); Object.assign(viewport.style,{minWidth:'0',minHeight:'0',overflow:'hidden',padding:'8px',background:TOLUE_DESIGN_TOKENS.color.viewport,display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:'6px'});
  const inspector=document.createElement('aside'); Object.assign(inspector.style,{minWidth:'0',overflow:'auto',borderRight:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const inspectorHeader=document.createElement('div'); Object.assign(inspectorHeader.style,{position:'sticky',top:'0',zIndex:'2',padding:'9px 10px',fontSize:TOLUE_DESIGN_TOKENS.typography.fontSizeXs,fontWeight:'700',color:TOLUE_DESIGN_TOKENS.color.textMuted,borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface}); inspectorHeader.textContent='ENGINEERING INSPECTOR';
  const inspectorBody=document.createElement('div'); inspectorBody.style.padding='10px'; inspector.append(inspectorHeader,inspectorBody);
  work.append(tree,viewport,inspector);

  const bottom=document.createElement('section'); Object.assign(bottom.style,{minHeight:'0',overflow:'hidden',display:'grid',gridTemplateRows:'34px minmax(0,1fr)',borderTop:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`,background:TOLUE_DESIGN_TOKENS.color.surface});
  const tabs=document.createElement('div'); Object.assign(tabs.style,{display:'flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderBottom:`1px solid ${TOLUE_DESIGN_TOKENS.color.border}`});
  const bottomBody=document.createElement('div'); Object.assign(bottomBody.style,{overflow:'auto',padding:'8px 10px'}); bottom.append(tabs,bottomBody);
  shell.append(top,work,bottom); root.appendChild(shell);

  const updateSessionInput=(input:Readonly<SimulationRunInput>)=>{const previousSelection=selectedSegmentId;sessionState=setAnalysisInput(sessionState,input as SimulationRunInput);selectedSegmentId=previousSelection&&input.pipeline.segments.some(segment=>segment.id===previousSelection)?previousSelection:null;renderAll();};
  const exportActiveEngineeringArtifact=async(format:'pdf'|'html'|'json'):Promise<unknown>=>{if(!actions)throw new Error('APPLICATION-EXPORT-ACTION-001');const pdfRequest=getExportablePdfRequest(sessionState);if(!pdfRequest)throw new Error('APPLICATION-EXPORT-ACTIVE-RUN-001');const report=sessionState.analysis?.report;if(!report||report.runId!==pdfRequest.runId)throw new Error('APPLICATION-EXPORT-ACTIVE-RUN-002');if(report.inputSnapshotHash!==pdfRequest.inputSnapshotHash)throw new Error('APPLICATION-EXPORT-ACTIVE-HASH-001');if(report.engineVersion!==pdfRequest.engineVersion)throw new Error('APPLICATION-EXPORT-ACTIVE-ENGINE-001');const request:EngineeringReportExportRequest=format==='pdf'?report.pdfRequest:format==='html'?report.htmlRequest:report.jsonRequest;if(request.runId!==report.runId||request.engineVersion!==report.engineVersion||request.inputSnapshotHash!==report.inputSnapshotHash)throw new Error('APPLICATION-EXPORT-REQUEST-IDENTITY-001');return actions.exportEngineeringPdf(request);};
  const refreshVerificationHistory=()=>{if(!actions||verificationHistoryBusy)return;verificationHistoryBusy=true;verificationHistoryError=null;if(bottomMode==='verification')renderBottom();void actions.listVerificationEvidencePackages().then(response=>{verificationHistoryLoaded=true;if(response.status==='SUCCESS'){verificationHistory=response.items;verificationHistoryError=null;}else verificationHistoryError=response.errorCode??'VERIFICATION-EVIDENCE-HISTORY-REJECTED';}).catch(()=>{verificationHistoryLoaded=true;verificationHistoryError='VERIFICATION-EVIDENCE-HISTORY-TRANSPORT-001';}).finally(()=>{verificationHistoryBusy=false;if(bottomMode==='verification')renderBottom();});};
  const loadVerificationPackage=(packageId:string)=>{if(!actions||verificationLoadBusyPackageId)return;verificationLoadBusyPackageId=packageId;verificationImportError=null;renderBottom();void actions.loadVerificationEvidencePackage(packageId).then(response=>{if(response.status==='SUCCESS'&&response.evidencePackage){verificationPackage=response.evidencePackage;verificationImportError=null;}else verificationImportError=response.errorCode??(response.status==='NOT_FOUND'?'VERIFICATION-EVIDENCE-PACKAGE-NOT-FOUND':'VERIFICATION-EVIDENCE-LOAD-REJECTED');}).catch(()=>{verificationImportError='VERIFICATION-EVIDENCE-LOAD-TRANSPORT-001';}).finally(()=>{verificationLoadBusyPackageId=null;renderBottom();});};
  const importVerificationEvidence=()=>{if(!actions||verificationImportBusy)return;verificationImportBusy=true;verificationImportError=null;renderBottom();void actions.importVerificationEvidence().then(response=>{if(response.status==='IMPORTED'&&response.evidencePackage){verificationPackage=response.evidencePackage;verificationImportError=null;verificationHistoryLoaded=false;}else if(response.status==='REJECTED'){verificationImportError=response.errorCode??'VERIFICATION-EVIDENCE-IMPORT-REJECTED';}}).catch(()=>{verificationImportError='VERIFICATION-EVIDENCE-IMPORT-TRANSPORT-001';}).finally(()=>{verificationImportBusy=false;if(!verificationHistoryLoaded)refreshVerificationHistory();else renderBottom();});};

  const runAnalysis=()=>{if(!actions||!sessionState.input||sessionState.status==='RUNNING')return;const input=sessionState.input as SimulationRunInput;sessionState=markAnalysisRunning(sessionState);renderAll();void actions.executeEngineeringAnalysis(input).then(response=>{sessionState=applyEngineeringAnalysisResponse(sessionState,response);}).catch(()=>{sessionState=Object.freeze({...sessionState,status:'REJECTED',analysis:null,activeRunId:null,activeInputSnapshotHash:null,errorCode:'APPLICATION-DATA-FLOW-ANALYSIS-TRANSPORT-001',isStale:false});}).finally(()=>renderAll());};
  runTop.addEventListener('click',runAnalysis);

  const selectInspector=(mode:InspectorMode)=>{inspectorMode=mode;if(mode!=='segment'&&mode!=='pipeline')selectedSegmentId=null;renderTree();renderInspector();renderViewport();};
  const treeButton=(label:string,mode:InspectorMode,indent=0)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.width='100%';b.style.textAlign='right';b.style.paddingInlineStart=`${8+indent*15}px`;b.dataset.mode=mode;buttonStyle(b,inspectorMode===mode);b.addEventListener('click',()=>selectInspector(mode));treeBody.appendChild(b);};

  function currentScene(){return createPipelineScenePresentation(sessionState.input??null,sessionState.analysis?.visualization3d??null,sessionState.isStale);}
  const selectPipelineSegment=(id:string)=>{selectedSegmentId=id;inspectorMode='pipeline';renderTree();renderInspector();renderViewport();};

  function renderTree(){treeBody.replaceChildren();treeButton('▾  پروژه', 'project');treeButton('مصالح','materials',1);treeButton('رئولوژی','rheology',1);treeButton('پمپ','pump',1);treeButton('▾  خط لوله','pipeline',1);const scene=currentScene();for(const segment of scene.segments){const b=document.createElement('button');b.type='button';const geometryState=segment.startPoint&&segment.endPoint?'3D':'legacy';b.textContent=`${segment.id} · ${segment.kind} · ${geometryState}`;b.style.width='100%';b.style.textAlign='left';b.style.direction='ltr';b.style.paddingInlineStart='38px';buttonStyle(b,selectedSegmentId===segment.id);b.addEventListener('click',()=>{selectedSegmentId=segment.id;inspectorMode='segment';renderTree();renderInspector();renderViewport();});treeBody.appendChild(b);}treeButton('شواهد','evidence',1);if(!scene.segments.length){const empty=document.createElement('small');empty.textContent='هنوز Segmentی در Draft Scene تعریف نشده است.';Object.assign(empty.style,{display:'block',padding:'8px 12px',color:TOLUE_DESIGN_TOKENS.color.textMuted});treeBody.appendChild(empty);}if(scene.spatialValidation.status==='invalid'){const warning=document.createElement('small');warning.textContent=`Spatial topology: ${scene.spatialValidation.issues.length} issue`;Object.assign(warning.style,{display:'block',padding:'8px 12px',color:TOLUE_DESIGN_TOKENS.color.statusCritical,direction:'ltr'});treeBody.appendChild(warning);}}

  function renderInspector(){inspectorBody.replaceChildren();const analysis=sessionState.analysis;const editable=sessionState.input?{updateInput:updateSessionInput}:undefined;if(inspectorMode==='project')renderProjectView(inspectorBody,sessionState.input,editable);else if(inspectorMode==='materials')renderMaterialsView(inspectorBody,sessionState.input,editable);else if(inspectorMode==='rheology')renderRheologyView(inspectorBody,undefined,analysis?.rheologyCurves??undefined,sessionState.input,editable);else if(inspectorMode==='pipeline')renderPipelineView(inspectorBody,analysis?.pipeline??undefined,analysis?.pressureProfile??undefined,analysis?.pressureComposition??undefined,sessionState.input,sessionState.input?{updateInput:updateSessionInput,selectSegment:selectPipelineSegment}:undefined,{selectedSegmentId});else if(inspectorMode==='pump')renderPumpView(inspectorBody,analysis?.pump??undefined,sessionState.input,editable);else if(inspectorMode==='evidence')renderEvidenceView(inspectorBody,undefined,sessionState.input,editable);else{const sceneSegment=currentScene().segments.find(item=>item.id===selectedSegmentId);const resultSegment=!sessionState.isStale?analysis?.visualization3d?.segments.find(item=>item.id===selectedSegmentId):undefined;if(!sceneSegment){const p=document.createElement('p');p.textContent='هیچ جزء مهندسی انتخاب نشده است.';p.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;inspectorBody.appendChild(p);return;}renderSegmentInspectorCard(inspectorBody,sceneSegment,resultSegment,sessionState.isStale);}}

  function renderViewport(){viewport.replaceChildren();const kpiRoot=document.createElement('div');renderEngineeringKpiStrip(kpiRoot,sessionState.input,sessionState.analysis,sessionState.isStale);const sceneRoot=document.createElement('div');sceneRoot.style.minHeight='0';sceneRoot.style.overflow='hidden';const scene=currentScene();renderVisualization3DView(sceneRoot,sessionState.analysis?.visualization3d??undefined,{scene,selectedSegmentId,onSelectSegment:(id)=>{selectedSegmentId=id;inspectorMode=id?'segment':'pipeline';renderTree();renderInspector();renderViewport();},compact:true});viewport.append(kpiRoot,sceneRoot);}

  const bottomLabels:ReadonlyArray<[BottomMode,string]>=[['simulation','شبیه‌سازی'],['results','نتایج'],['warnings','هشدارها'],['verification','اعتبارسنجی'],['history','تاریخچه'],['compare','مقایسه'],['report','گزارش']];
  function renderTabs(){tabs.replaceChildren();for(const [id,label] of bottomLabels){const b=document.createElement('button');b.type='button';b.textContent=label;buttonStyle(b,bottomMode===id);b.addEventListener('click',()=>{bottomMode=id;renderTabs();renderBottom();});tabs.appendChild(b);}}
  function renderBottom(){bottomBody.replaceChildren();const analysis=sessionState.analysis;if(bottomMode==='simulation'){const copy=sessionUxCopy(sessionState);const row=document.createElement('div');Object.assign(row.style,{display:'flex',alignItems:'center',gap:'16px'});const state=document.createElement('strong');state.textContent=copy.title;const detail=document.createElement('span');detail.textContent=copy.detail;detail.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;detail.style.flex='1';const action=document.createElement('button');action.type='button';const ux=analysisExecutionUxState(sessionState,Boolean(actions));action.textContent=ux.label;action.disabled=!ux.enabled;buttonStyle(action,true);action.addEventListener('click',runAnalysis);row.append(state,detail,action);bottomBody.appendChild(row);}else if(bottomMode==='results')renderResultView(bottomBody,analysis?.results??undefined);else if(bottomMode==='warnings')renderDiagnosticsView(bottomBody,analysis?.diagnostics??undefined);else if(bottomMode==='report')renderReportView(bottomBody,analysis?.report??undefined,actions?{exportActiveEngineeringArtifact}:undefined);else if(bottomMode==='verification'){const toolbar=document.createElement('div');Object.assign(toolbar.style,{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'});const importButton=document.createElement('button');importButton.type='button';importButton.textContent=verificationImportBusy?'در حال بررسی بسته…':'بارگذاری Verification Package';importButton.disabled=!actions||verificationImportBusy;buttonStyle(importButton,true);importButton.addEventListener('click',importVerificationEvidence);toolbar.appendChild(importButton);if(verificationPackage){const meta=document.createElement('span');meta.textContent=`${verificationPackage.packageId} · ${verificationPackage.entries.length} case`;meta.style.direction='ltr';meta.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;toolbar.appendChild(meta);}if(verificationLoadBusyPackageId){const loading=document.createElement('span');loading.textContent=`Loading ${verificationLoadBusyPackageId}…`;loading.style.direction='ltr';loading.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;toolbar.appendChild(loading);}bottomBody.appendChild(toolbar);if(verificationImportError){const error=document.createElement('div');error.textContent=`Verification error: ${verificationImportError}`;Object.assign(error.style,{color:TOLUE_DESIGN_TOKENS.color.statusCritical,marginBottom:'8px',direction:'ltr'});bottomBody.appendChild(error);}const workspace=document.createElement('div');bottomBody.appendChild(workspace);renderVerificationWorkspaceView(workspace,verificationPackage?{entries:verificationPackage.entries}:undefined);const historyRoot=document.createElement('div');bottomBody.appendChild(historyRoot);if(verificationHistoryError){const error=document.createElement('div');error.textContent=`History error: ${verificationHistoryError}`;Object.assign(error.style,{color:TOLUE_DESIGN_TOKENS.color.statusCritical,marginTop:'8px',direction:'ltr'});historyRoot.appendChild(error);}else if(verificationHistoryBusy&&!verificationHistoryLoaded){historyRoot.textContent='در حال دریافت بسته‌های اخیر…';historyRoot.style.color=TOLUE_DESIGN_TOKENS.color.textMuted;}else renderVerificationPackageHistoryView(historyRoot,verificationHistory,verificationPackage?.packageId??null,{loadPackage:loadVerificationPackage,refresh:refreshVerificationHistory});if(!verificationHistoryLoaded&&!verificationHistoryBusy)queueMicrotask(refreshVerificationHistory);}else if(bottomMode==='history'){const load=async(runId:string)=>{if(!actions)return;sessionState=hydratePersistedEngineeringRun(await actions.loadEngineeringRun(runId));selectedSegmentId=null;renderAll();};if(!actions){bottomBody.textContent='تاریخچه در این runtime در دسترس نیست.';return;}bottomBody.textContent='در حال دریافت تاریخچه…';void actions.listEngineeringRuns().then(response=>{bottomBody.replaceChildren();if(response.status==='SUCCESS')renderRunHistoryView(bottomBody,response.items,{loadRun:load,compareRuns:async(a,b)=>{bottomMode='compare';renderTabs();bottomBody.replaceChildren();const response=await actions.compareEngineeringRuns(a,b);if(response.status==='SUCCESS')renderRunComparisonView(bottomBody,response.comparison);else bottomBody.textContent='مقایسه قابل بارگذاری نیست.';}});else bottomBody.textContent='دریافت تاریخچه انجام نشد.';}).catch(()=>{bottomBody.textContent='ارتباط برای دریافت تاریخچه برقرار نشد.';});}else{bottomBody.textContent='دو Run را از تب تاریخچه برای مقایسه انتخاب کنید.';}}

  function refreshTop(){const copy=sessionUxCopy(sessionState);saveState.textContent=sessionState.isStale?'نتایج قدیمی / ورودی تغییر کرده':copy.title;saveState.style.color=sessionState.isStale?TOLUE_DESIGN_TOKENS.color.statusWarning:TOLUE_DESIGN_TOKENS.color.textMuted;const ux=analysisExecutionUxState(sessionState,Boolean(actions));runTop.textContent=ux.label;runTop.disabled=!ux.enabled;runTop.setAttribute('aria-busy',ux.busy?'true':'false');const projectName=sessionState.input?.projectMetadata?.name?.trim();projectContext.textContent=projectName||(sessionState.activeRunId?`Run ${sessionState.activeRunId}`:'Engineering Workspace');projectContext.style.direction=projectName?'rtl':sessionState.activeRunId?'ltr':'rtl';}
  function renderAll(){refreshTop();renderTree();renderViewport();renderInspector();renderTabs();renderBottom();}
  renderAll();
}
