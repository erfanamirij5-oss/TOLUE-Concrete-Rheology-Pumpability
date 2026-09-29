import type { PumpCapabilityProvenance, PumpCapabilityPoint } from './pumpCapability';

export interface PumpIdentity {
  manufacturer: string;
  model: string;
  configurationRevision: string;
}

export interface PumpEnvelopeSource {
  documentId: string;
  documentRevision: string;
  sourceHash?: string;
}

export interface PumpOperatingEnvelopeQualification {
  identity: Readonly<PumpIdentity>;
  source: Readonly<PumpEnvelopeSource>;
  provenance: PumpCapabilityProvenance;
  capabilityCurve: readonly Readonly<PumpCapabilityPoint>[];
}

export type PumpEnvelopeQualificationStatus = 'QUALIFIED' | 'PRELIMINARY' | 'BLOCKED';

export interface PumpEnvelopeQualificationResult {
  status: PumpEnvelopeQualificationStatus;
  findings: readonly string[];
  method: 'tolue-pump-operating-envelope-qualification-v1';
}

function nonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

export function qualifyPumpOperatingEnvelope(
  input: Readonly<PumpOperatingEnvelopeQualification>,
): Readonly<PumpEnvelopeQualificationResult> {
  const findings: string[] = [];

  if (!nonEmpty(input.identity.manufacturer)) findings.push('BLOCK:PUMP-IDENTITY-MANUFACTURER-MISSING');
  if (!nonEmpty(input.identity.model)) findings.push('BLOCK:PUMP-IDENTITY-MODEL-MISSING');
  if (!nonEmpty(input.identity.configurationRevision)) findings.push('BLOCK:PUMP-IDENTITY-REVISION-MISSING');
  if (!nonEmpty(input.source.documentId)) findings.push('BLOCK:PUMP-SOURCE-DOCUMENT-MISSING');
  if (!nonEmpty(input.source.documentRevision)) findings.push('BLOCK:PUMP-SOURCE-REVISION-MISSING');

  if (!Array.isArray(input.capabilityCurve) || input.capabilityCurve.length === 0) {
    findings.push('BLOCK:PUMP-CURVE-MISSING');
  } else {
    let previous = -Infinity;
    for (const point of input.capabilityCurve) {
      if (!Number.isFinite(point.flowRateM3s) || point.flowRateM3s < 0) findings.push('BLOCK:PUMP-CURVE-FLOW-INVALID');
      if (!Number.isFinite(point.availableConcretePressurePa) || point.availableConcretePressurePa < 0) findings.push('BLOCK:PUMP-CURVE-PRESSURE-INVALID');
      if (point.flowRateM3s <= previous) findings.push('BLOCK:PUMP-CURVE-NOT-STRICTLY-INCREASING');
      previous = point.flowRateM3s;
    }
  }

  if (input.provenance === 'manufacturer_rated_point' && input.capabilityCurve.length > 1) {
    findings.push('PRELIMINARY:PUMP-RATED-POINT-PROVENANCE-WITH-MULTIPOINT-CURVE');
  }

  if (input.provenance === 'calibrated_project_data' && !nonEmpty(input.source.sourceHash)) {
    findings.push('PRELIMINARY:PUMP-CALIBRATION-SOURCE-HASH-MISSING');
  }

  const blocked = findings.some(item => item.startsWith('BLOCK:'));
  const preliminary = !blocked && findings.some(item => item.startsWith('PRELIMINARY:'));

  return Object.freeze({
    status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'QUALIFIED',
    findings: Object.freeze([...findings]),
    method: 'tolue-pump-operating-envelope-qualification-v1',
  });
}
