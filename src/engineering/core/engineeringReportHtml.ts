import { PersianEngineeringReportDocument } from './engineeringReportExport';

export interface EngineeringReportHtmlExport {
  mediaType: 'text/html';
  encoding: 'utf-8';
  content: string;
  method: 'tolue-persian-engineering-report-html-v1';
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderValue(value: unknown): string {
  if (value === null) return '—';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    return String(value);
  }
  return escapeHtml(value);
}

function renderList(values: readonly string[], emptyText: string): string {
  if (values.length === 0) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  return `<ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
}

/**
 * Deterministic, dependency-free, print-ready HTML renderer for the Persian
 * engineering report document. This layer performs presentation only and must
 * not introduce, recompute, infer, or strengthen any engineering conclusion.
 */
export function renderPersianEngineeringReportHtml(
  report: PersianEngineeringReportDocument,
): EngineeringReportHtmlExport {
  const resultRows = report.keyResults.map(result => `
      <tr>
        <td>${escapeHtml(result.labelFa)}</td>
        <td class="ltr">${renderValue(result.rawValue)}</td>
        <td class="ltr">${escapeHtml(result.unit ?? '—')}</td>
        <td class="ltr">${escapeHtml(result.validationStatus)}</td>
        <td class="ltr">${escapeHtml(result.evidenceStatus)}</td>
        <td class="ltr code">${escapeHtml(result.methodId)}</td>
      </tr>`).join('');

  const diagnosticRows = report.diagnostics.length === 0
    ? '<p class="muted">یافته تشخیصی ثبت نشده است.</p>'
    : report.diagnostics.map(finding => `
      <article class="diagnostic ${escapeHtml(finding.severity)}">
        <h3>${escapeHtml(finding.title)}</h3>
        <p>${escapeHtml(finding.message)}</p>
        <p class="meta ltr">Rule: ${escapeHtml(finding.ruleId)}</p>
      </article>`).join('');

  const content = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.titleFa)}</title>
  <style>
    :root { font-family: Vazirmatn, Vazir, Tahoma, Arial, sans-serif; color: #1f2937; background: #ffffff; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; line-height: 1.7; direction: rtl; }
    main { max-width: 1120px; margin: 0 auto; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { font-size: 24px; margin-bottom: 6px; }
    h2 { font-size: 17px; margin: 28px 0 12px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    h3 { font-size: 15px; margin-bottom: 6px; }
    .subtitle, .muted, .meta { color: #6b7280; }
    .decision-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .decision-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; break-inside: avoid; }
    .decision-card strong { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 700; }
    .ltr { direction: ltr; text-align: left; unicode-bidi: isolate; }
    .code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; word-break: break-all; }
    .diagnostic { border-right: 4px solid #9ca3af; padding: 10px 12px; margin-bottom: 10px; background: #f9fafb; break-inside: avoid; }
    .diagnostic.warning { border-right-color: #d97706; }
    .diagnostic.critical { border-right-color: #b91c1c; }
    .trace { font-size: 11px; word-break: break-word; }
    ul { margin: 0; padding-right: 20px; }
    footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 11px; color: #6b7280; }
    @page { size: A4; margin: 14mm; }
    @media print {
      body { padding: 0; }
      main { max-width: none; }
      h2 { break-after: avoid; }
      table, .decision-grid, .diagnostic { break-inside: avoid; }
    }
    @media (max-width: 760px) {
      .decision-grid { grid-template-columns: 1fr 1fr; }
      table { font-size: 11px; }
    }
  </style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(report.titleFa)}</h1>
    <p class="subtitle ltr">Run: ${escapeHtml(report.runId)} | Engine: ${escapeHtml(report.engineVersion)} | ${escapeHtml(report.generatedAtIso)}</p>
  </header>

  <section>
    <h2>خلاصه تصمیم مهندسی</h2>
    <div class="decision-grid">
      <div class="decision-card"><strong>وضعیت نهایی</strong>${escapeHtml(report.decision.overallStatusFa)}</div>
      <div class="decision-card"><strong>فشار</strong>${escapeHtml(report.decision.pressureFeasibilityFa)}</div>
      <div class="decision-card"><strong>پایداری</strong>${escapeHtml(report.decision.stabilityFa)}</div>
      <div class="decision-card"><strong>ریسک انسداد</strong>${escapeHtml(report.decision.blockageRiskFa)}</div>
    </div>
    <p class="meta">دامنه ارزیابی: ${escapeHtml(report.decision.qualificationScopeFa)}</p>
  </section>

  <section>
    <h2>نتایج کلیدی</h2>
    <table>
      <thead><tr><th>پارامتر</th><th>مقدار</th><th>واحد</th><th>اعتبار مدل</th><th>وضعیت شواهد</th><th>روش</th></tr></thead>
      <tbody>${resultRows}</tbody>
    </table>
  </section>

  <section>
    <h2>یافته‌های تشخیصی</h2>
    ${diagnosticRows}
  </section>

  <section>
    <h2>هشدارها</h2>
    ${renderList(report.warnings, 'هشداری ثبت نشده است.')}
  </section>

  <section>
    <h2>محدودیت‌ها</h2>
    ${renderList(report.limitations, 'محدودیت اضافی ثبت نشده است.')}
  </section>

  <section class="trace">
    <h2>ردیابی و بازتولیدپذیری</h2>
    <p class="ltr"><strong>Input snapshot:</strong> ${escapeHtml(report.traceability.inputSnapshotHash)}</p>
    <p class="ltr"><strong>Methods:</strong> ${escapeHtml(report.traceability.sourceMethodIds.join(', ')) || '—'}</p>
    <p class="ltr"><strong>Provenance entities:</strong> ${escapeHtml(report.traceability.provenanceEntityIds.join(', ')) || '—'}</p>
    <p class="ltr"><strong>Calibration IDs:</strong> ${escapeHtml(report.traceability.calibrationIds.join(', ')) || '—'}</p>
    <p class="ltr"><strong>Diagnostic rules:</strong> ${escapeHtml(report.traceability.diagnosticRuleIds.join(', ')) || '—'}</p>
  </section>

  <footer>
    این سند فقط نمایش خروجی محاسبه‌شده هسته مهندسی TOLUE است و در لایه گزارش هیچ استنتاج، ضریب یا مدل مهندسی جدیدی اعمال نمی‌شود.
  </footer>
</main>
</body>
</html>`;

  return {
    mediaType: 'text/html',
    encoding: 'utf-8',
    content,
    method: 'tolue-persian-engineering-report-html-v1',
  };
}
