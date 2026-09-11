import { describe, expect, it } from 'vitest';
import type { EngineeringAnalysisPresentation } from './analysisPresentation';
import { createEngineeringViewportKpis } from './engineeringKpiStrip';
import { createSampleEngineeringDraftState } from './applicationDataFlow';

describe('engineering viewport KPIs', () => {
  it('never invents analysis values before execution', () => {
    const input = createSampleEngineeringDraftState('sample-kpi', '2026-09-11T20:00:00.000Z').input;
    const kpis = createEngineeringViewportKpis(input, null, false);
    expect(kpis.find(k => k.id === 'flow')?.source).toBe('engineering-input');
    expect(kpis.find(k => k.id === 'required-pressure')?.value).toBe('—');
    expect(kpis.find(k => k.id === 'available-pressure')?.value).toBe('—');
    expect(kpis.find(k => k.id === 'pressure-margin')?.value).toBe('—');
  });

  it('uses only Engineering Core presentation values and hides stale results', () => {
    const input = createSampleEngineeringDraftState('sample-kpi', '2026-09-11T20:00:00.000Z').input;
    const analysis = {
      executionStatus: 'EXECUTED',
      pipeline: { components: [{ id: 'required', valuePa: 4_000_000 }] },
      pump: { availablePressurePa: 6_500_000, pressureMarginPa: 2_500_000, status: 'PASS' },
    } as unknown as EngineeringAnalysisPresentation;
    const live = createEngineeringViewportKpis(input, analysis, false);
    expect(live.find(k => k.id === 'required-pressure')?.value).toBe('4.00 MPa');
    expect(live.find(k => k.id === 'available-pressure')?.value).toBe('6.50 MPa');
    expect(live.find(k => k.id === 'pressure-margin')?.value).toBe('2.50 MPa');
    expect(live.find(k => k.id === 'pressure-margin')?.source).toBe('engineering-core');
    const stale = createEngineeringViewportKpis(input, analysis, true);
    expect(stale.find(k => k.id === 'required-pressure')?.value).toBe('—');
    expect(stale.find(k => k.id === 'pressure-margin')?.source).toBe('unavailable');
  });
});
