import { describe, expect, it } from 'vitest';
import { qualifyPumpOperatingEnvelope } from './pumpOperatingEnvelope';

function fixture() {
  return {
    identity: { manufacturer: 'Example Pump Co.', model: 'PX-01', configurationRevision: 'rev-a' },
    source: { documentId: 'datasheet-px01', documentRevision: '2026-01', sourceHash: 'sha256:example-controlled-source' },
    provenance: 'manufacturer_curve' as const,
    capabilityCurve: [
      { flowRateM3s: 0, availableConcretePressurePa: 10_000_000 },
      { flowRateM3s: 0.02, availableConcretePressurePa: 8_000_000 },
    ],
  };
}

describe('pump operating envelope qualification', () => {
  it('qualifies a revision-controlled manufacturer curve', () => {
    const result = qualifyPumpOperatingEnvelope(fixture());
    expect(result.status).toBe('QUALIFIED');
    expect(result.findings).toEqual([]);
  });

  it('blocks missing pump identity or source revision', () => {
    const input = fixture();
    const result = qualifyPumpOperatingEnvelope({
      ...input,
      identity: { ...input.identity, model: '' },
      source: { ...input.source, documentRevision: '' },
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.findings).toContain('BLOCK:PUMP-IDENTITY-MODEL-MISSING');
    expect(result.findings).toContain('BLOCK:PUMP-SOURCE-REVISION-MISSING');
  });

  it('keeps calibrated project data preliminary when the controlled source hash is absent', () => {
    const input = fixture();
    const result = qualifyPumpOperatingEnvelope({
      ...input,
      provenance: 'calibrated_project_data',
      source: { documentId: 'project-calibration-17', documentRevision: 'r2' },
    });
    expect(result.status).toBe('PRELIMINARY');
    expect(result.findings).toContain('PRELIMINARY:PUMP-CALIBRATION-SOURCE-HASH-MISSING');
  });

  it('blocks malformed or non-monotone curve data', () => {
    const input = fixture();
    const result = qualifyPumpOperatingEnvelope({
      ...input,
      capabilityCurve: [
        { flowRateM3s: 0.01, availableConcretePressurePa: 8_000_000 },
        { flowRateM3s: 0.01, availableConcretePressurePa: 7_000_000 },
      ],
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.findings).toContain('BLOCK:PUMP-CURVE-NOT-STRICTLY-INCREASING');
  });
});
