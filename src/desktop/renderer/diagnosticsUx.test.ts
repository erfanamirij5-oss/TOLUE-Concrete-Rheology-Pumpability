import { describe, expect, it } from 'vitest';
import { diagnosticBasisLabel, diagnosticKindLabel, diagnosticSeverityUx, diagnosticValidationLabel, sortDiagnosticFindings } from './diagnosticsUx';

describe('diagnostics UX semantics', () => {
  it('maps Core severity without inventing a new engineering classification', () => {
    expect(diagnosticSeverityUx('critical')).toEqual({ label: 'بحرانی', tone: 'critical', priority: 0 });
    expect(diagnosticSeverityUx('warning')).toEqual({ label: 'هشدار', tone: 'warning', priority: 1 });
    expect(diagnosticSeverityUx('info')).toEqual({ label: 'اطلاع', tone: 'nominal', priority: 2 });
  });

  it('orders findings by existing Core severity only', () => {
    const findings = [
      { severity: 'info' as const, id: 'i' },
      { severity: 'critical' as const, id: 'c' },
      { severity: 'warning' as const, id: 'w' },
    ];
    expect(sortDiagnosticFindings(findings).map(item => item.id)).toEqual(['c', 'w', 'i']);
    expect(findings.map(item => item.id)).toEqual(['i', 'c', 'w']);
  });

  it('provides user-facing labels for established Core contracts', () => {
    expect(diagnosticKindLabel('PUMP_PRESSURE_INSUFFICIENT')).toBe('فشار پمپ ناکافی');
    expect(diagnosticBasisLabel('exact_mathematical_relation')).toBe('رابطه ریاضی صریح');
    expect(diagnosticValidationLabel('insufficient_data')).toBe('داده ناکافی');
  });
});
