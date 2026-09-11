import assert from 'node:assert/strict';
import test from 'node:test';
import type { EngineeringAnalysisPresentation } from './analysisPresentation';
import { createEngineeringViewportKpis } from './engineeringKpiStrip';
import { createSampleEngineeringDraftState } from './applicationDataFlow';

test('viewport KPIs never invent analysis values before execution',()=>{
  const input=createSampleEngineeringDraftState('sample-kpi','2026-09-11T20:00:00.000Z').input;
  const kpis=createEngineeringViewportKpis(input,null,false);
  assert.equal(kpis.find(k=>k.id==='flow')?.source,'engineering-input');
  assert.equal(kpis.find(k=>k.id==='required-pressure')?.value,'—');
  assert.equal(kpis.find(k=>k.id==='available-pressure')?.value,'—');
  assert.equal(kpis.find(k=>k.id==='pressure-margin')?.value,'—');
});

test('viewport KPIs use only Engineering Core presentation values and hide stale results',()=>{
  const input=createSampleEngineeringDraftState('sample-kpi','2026-09-11T20:00:00.000Z').input;
  const analysis={executionStatus:'EXECUTED',pipeline:{components:[{id:'required',valuePa:4_000_000}]},pump:{availablePressurePa:6_500_000,pressureMarginPa:2_500_000,status:'PASS'}} as unknown as EngineeringAnalysisPresentation;
  const live=createEngineeringViewportKpis(input,analysis,false);
  assert.equal(live.find(k=>k.id==='required-pressure')?.value,'4.00 MPa');
  assert.equal(live.find(k=>k.id==='available-pressure')?.value,'6.50 MPa');
  assert.equal(live.find(k=>k.id==='pressure-margin')?.value,'2.50 MPa');
  assert.equal(live.find(k=>k.id==='pressure-margin')?.source,'engineering-core');
  const stale=createEngineeringViewportKpis(input,analysis,true);
  assert.equal(stale.find(k=>k.id==='required-pressure')?.value,'—');
  assert.equal(stale.find(k=>k.id==='pressure-margin')?.source,'unavailable');
});
