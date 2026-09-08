import { describe, expect, it } from 'vitest';
import { createDiagnosticsPresentation } from './diagnosticsPresentation';

describe('diagnostics presentation boundary', () => {
  it('preserves Core severity, basis, rule identity, validation and recommendation', () => {
    const presentation = createDiagnosticsPresentation({
      runId: 'run-1', inputSnapshotHash: 'hash-1', method: 'tolue-diagnostics-v2',
      findings: [{
        id: 'diagnostic.pump.pressureInsufficient', kind: 'PUMP_PRESSURE_INSUFFICIENT', severity: 'critical', title: 'Pressure insufficient',
        message: 'Core diagnostic', sourceResultIds: ['pump.pressureMargin'], sourceRunId: 'run-1', inputSnapshotHash: 'hash-1', ruleId: 'DX-PUMP-MARGIN-001',
        ruleVersion: '1.0.0', basis: 'exact_mathematical_relation', validationStatus: 'candidate', recommendation: 'Review validated inputs.',
      }],
    });
    const finding = presentation.findings[0];
    expect(finding?.severity).toBe('critical');
    expect(finding?.basis).toBe('exact_mathematical_relation');
    expect(finding?.ruleId).toBe('DX-PUMP-MARGIN-001');
    expect(finding?.recommendation).toBe('Review validated inputs.');
    expect(Object.isFrozen(presentation.findings)).toBe(true);
    expect(Object.isFrozen(finding?.sourceResultIds)).toBe(true);
  });

  it('preserves null recommendations without inventing UI advice', () => {
    const presentation = createDiagnosticsPresentation({
      runId: 'run-2', inputSnapshotHash: 'hash-2', method: 'tolue-diagnostics-v2',
      findings: [{
        id: 'diagnostic.pump.pressureAdequate', kind: 'PUMP_PRESSURE_ADEQUATE', severity: 'info', title: 'Pressure adequate', message: 'Not a certification.',
        sourceResultIds: [], sourceRunId: 'run-2', inputSnapshotHash: 'hash-2', ruleId: 'DX-PUMP-MARGIN-002', ruleVersion: '1.0.0',
        basis: 'exact_mathematical_relation', validationStatus: 'candidate', recommendation: null,
      }],
    });
    expect(presentation.findings[0]?.recommendation).toBeNull();
  });
});
