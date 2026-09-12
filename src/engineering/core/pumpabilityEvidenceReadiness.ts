import { evaluateProjectQualifiedPumpabilityEvidence, type PumpabilityEvidenceDomain } from './projectQualifiedPumpabilityEvidence';
import type { PumpabilityEvidenceSetInput } from './simulationRun';

export interface PumpabilityEvidenceReadinessFinding {
  domain: PumpabilityEvidenceDomain;
  severity: 'warning' | 'blocking';
  ruleId: string;
  message: string;
}

export interface PumpabilityEvidenceReadinessResult {
  findings: PumpabilityEvidenceReadinessFinding[];
  method: 'tolue-pumpability-evidence-readiness-v1';
}

export function assessPumpabilityEvidenceReadiness(
  evidence: PumpabilityEvidenceSetInput | undefined,
  targetFlowRateM3s: number,
): PumpabilityEvidenceReadinessResult {
  const findings: PumpabilityEvidenceReadinessFinding[] = [];
  for (const domain of ['stability', 'blockage'] as const) {
    const record = evidence?.[domain];
    if (!record) continue;
    try {
      const result = evaluateProjectQualifiedPumpabilityEvidence({ ...record, domain, targetFlowRateM3s });
      if (result.status === 'OUT_OF_DOMAIN') {
        findings.push({
          domain,
          severity: 'warning',
          ruleId: 'RG-EVIDENCE-DOMAIN-001',
          message: `${domain} evidence is outside its declared qualified flow range at the current target flow; it will not be extrapolated or used as an acceptable/unacceptable conclusion.`,
        });
      }
    } catch (error) {
      findings.push({
        domain,
        severity: 'blocking',
        ruleId: 'RG-EVIDENCE-INTEGRITY-001',
        message: `${domain} evidence is structurally invalid: ${error instanceof Error ? error.message : 'unknown evidence validation error'}`,
      });
    }
  }
  return { findings, method: 'tolue-pumpability-evidence-readiness-v1' };
}
