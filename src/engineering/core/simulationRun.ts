import { PipelineAnalysisInput, PipelineAnalysisResult, analyzePipeline } from './pipeline';
import { PressureProfileResult, buildPressureProfile } from './pressureProfile';
import { PumpCapabilityInput, PumpCapabilityResult, assessPumpCapability } from './pumpCapability';
import { HydraulicInvariantResult, verifyHydraulicInvariants } from './hydraulicInvariants';
import { SimulationInputProvenance } from './inputProvenance';
import { ProjectQualifiedPumpabilityEvidenceInput } from './projectQualifiedPumpabilityEvidence';
import { buildBinghamRheologyCurve, type RheologyCurveResult } from './rheologyCurve';

export type SimulationRunStatus = 'complete' | 'incomplete';
export interface PumpabilityEvidenceSetInput { stability?: Omit<ProjectQualifiedPumpabilityEvidenceInput, 'domain' | 'targetFlowRateM3s'>; blockage?: Omit<ProjectQualifiedPumpabilityEvidenceInput, 'domain' | 'targetFlowRateM3s'>; }
export interface SimulationRunInput { runId:string; engineVersion:string; createdAtIso:string; pipeline:PipelineAnalysisInput; pumpCapability?:Omit<PumpCapabilityInput,'targetFlowRateM3s'|'requiredPressurePa'|'pipelineCompleteness'>; pumpabilityEvidence?:PumpabilityEvidenceSetInput; provenance?:SimulationInputProvenance; assumptions?:string[]; }
export interface SimulationRheologyCurves { readonly bulk: Readonly<RheologyCurveResult>; readonly lubricationLayer: Readonly<RheologyCurveResult>; readonly samplingShearRatesSInv: readonly number[]; readonly method: 'tolue-simulation-rheology-curves-v1'; }
export interface SimulationRunResult { runId:string; engineVersion:string; createdAtIso:string; status:SimulationRunStatus; inputSnapshot:SimulationRunInput; pipeline:PipelineAnalysisResult; pressureProfile:PressureProfileResult; hydraulicInvariants:HydraulicInvariantResult; pumpAssessment:PumpCapabilityResult|null; rheologyCurves: Readonly<SimulationRheologyCurves>; warnings:string[]; assumptions:string[]; methods:string[]; }
function validateRunMetadata(input:SimulationRunInput):void { if(!input.runId.trim())throw new Error('runId must not be empty'); if(!input.engineVersion.trim())throw new Error('engineVersion must not be empty'); if(!Number.isFinite(Date.parse(input.createdAtIso)))throw new Error('createdAtIso must be a valid ISO date/time'); }
const RHEOLOGY_VISUALIZATION_SHEAR_RATES_S_INV = Object.freeze([1,5,10,20,50,100] as const);
export function executeSimulationRun(input:SimulationRunInput):SimulationRunResult {
 validateRunMetadata(input); const warnings:string[]=[]; const assumptions=[...(input.assumptions??[])]; const pipeline=analyzePipeline(input.pipeline); const pressureProfile=buildPressureProfile(input.pipeline,pipeline); const hydraulicInvariants=verifyHydraulicInvariants(pipeline,pressureProfile);
 const rheologyCurves = Object.freeze({
  bulk: buildBinghamRheologyCurve(input.pipeline.bulk,RHEOLOGY_VISUALIZATION_SHEAR_RATES_S_INV),
  lubricationLayer: buildBinghamRheologyCurve(input.pipeline.lubricationLayer,RHEOLOGY_VISUALIZATION_SHEAR_RATES_S_INV),
  samplingShearRatesSInv: RHEOLOGY_VISUALIZATION_SHEAR_RATES_S_INV,
  method: 'tolue-simulation-rheology-curves-v1' as const,
 });
 if(pipeline.completeness==='incomplete')warnings.push('Pipeline contains pressure contributions that are not computed; required pressure is incomplete.'); let pumpAssessment:PumpCapabilityResult|null=null;
 if(input.pumpCapability){pumpAssessment=assessPumpCapability({targetFlowRateM3s:input.pipeline.targetFlowRateM3s,requiredPressurePa:pipeline.requiredPressurePa,pipelineCompleteness:pipeline.completeness,capabilityCurve:input.pumpCapability.capabilityCurve,provenance:input.pumpCapability.provenance}); if(pumpAssessment.status==='INSUFFICIENT_DATA')warnings.push('Pump capability cannot be assessed with the available pressure/flow data.');} else warnings.push('Pump capability data is unavailable; pressure margin was not assessed.');
 const status:SimulationRunStatus=pipeline.completeness==='complete'&&pumpAssessment!==null&&pumpAssessment.status!=='INSUFFICIENT_DATA'?'complete':'incomplete'; const usesProjectCalibratedLocalLoss=pipeline.segments.some(segment=>segment.pressureMethod==='project-calibrated-local-loss');
 return {runId:input.runId,engineVersion:input.engineVersion,createdAtIso:input.createdAtIso,status,inputSnapshot:structuredClone(input),pipeline,pressureProfile,hydraulicInvariants,pumpAssessment,rheologyCurves,warnings,assumptions,methods:[pipeline.method,...(usesProjectCalibratedLocalLoss?['tolue-project-calibrated-local-loss-v1']:[]),pressureProfile.method,hydraulicInvariants.method,rheologyCurves.method,rheologyCurves.bulk.method,...(pumpAssessment?[pumpAssessment.method]:[])]};
}
