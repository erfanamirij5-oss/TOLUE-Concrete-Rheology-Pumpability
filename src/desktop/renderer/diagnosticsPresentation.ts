import type { DiagnosticFinding, DiagnosticsResult } from '../../engineering/core/diagnostics';

export interface DiagnosticFindingPresentation {
  readonly id: string;
  readonly kind: DiagnosticFinding['kind'];
  readonly severity: DiagnosticFinding['severity'];
  readonly title: string;
  readonly message: string;
  readonly sourceResultIds: readonly string[];
  readonly sourceRunId: string;
  readonly inputSnapshotHash: string;
  readonly ruleId: string;
  readonly ruleVersion: DiagnosticFinding['ruleVersion'];
  readonly basis: DiagnosticFinding['basis'];
  readonly validationStatus: DiagnosticFinding['validationStatus'];
  readonly recommendation: string | null;
}

export interface DiagnosticsPresentation {
  readonly runId: string;
  readonly inputSnapshotHash: string;
  readonly method: DiagnosticsResult['method'];
  readonly findings: readonly Readonly<DiagnosticFindingPresentation>[];
}

export function createDiagnosticsPresentation(result: DiagnosticsResult): Readonly<DiagnosticsPresentation> {
  return Object.freeze({
    runId: result.runId,
    inputSnapshotHash: result.inputSnapshotHash,
    method: result.method,
    findings: Object.freeze(result.findings.map(finding => Object.freeze({
      id: finding.id,
      kind: finding.kind,
      severity: finding.severity,
      title: finding.title,
      message: finding.message,
      sourceResultIds: Object.freeze([...finding.sourceResultIds]),
      sourceRunId: finding.sourceRunId,
      inputSnapshotHash: finding.inputSnapshotHash,
      ruleId: finding.ruleId,
      ruleVersion: finding.ruleVersion,
      basis: finding.basis,
      validationStatus: finding.validationStatus,
      recommendation: finding.recommendation,
    }))),
  });
}
