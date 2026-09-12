import type { PersianEngineeringReportDocument } from './engineeringReportExport';

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

function unitFa(unit:string|null):string {
  if(!unit)return '—';
  switch(unit){
    case 'Pa': return 'پاسکال';
    case 'kPa': return 'کیلوپاسکال';
    case 'MPa': return 'مگاپاسکال';
    case 'm3/s': case 'm³/s': return 'مترمکعب بر ثانیه';
    case 'm3/h': case 'm³/h': return 'مترمکعب بر ساعت';
    case 'Pa.s': case 'Pa·s': return 'پاسکال‌ثانیه';
    default:return unit;
  }
}

export function renderPersianEngineeringReportHtml(
  report: PersianEngineeringReportDocument,
): EngineeringReportHtmlExport {
  const resultRows = report.keyResults.map(result => `
      <tr>
        <td>${escapeHtml(result.labelFa)}</td>
        <td class="ltr">${renderValue(result.rawValue)}</td>
        <td>${escapeHtml(unitFa(result.unit))}</td>
        <td>${escapeHtml(result.validationStatusFa)}</td>
        <td>${escapeHtml(result.evidenceStatusFa)}</td>
        <td class="ltr code">${escapeHtml(result.methodId)}</td>
      </tr>`).join('');

  const diagnosticRows = report.diagnostics.length === 0
    ? '<p class="muted">یافته تشخیصی ثبت نشده است.</p>'
    : report.diagnostics.map(finding => `
      <article class="diagnostic ${escapeHtml(finding.severity)}">
        <div class="diag-head"><span class="severity">${escapeHtml(finding.severityFa)}</span><h3>${escapeHtml(finding.title)}</h3></div>
        <p>${escapeHtml(finding.message)}</p>
        <p class="meta">شناسه قاعده: <span class="ltr code">${escapeHtml(finding.ruleId)}</span></p>
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
    body { margin: 0; padding: 18px; line-height: 1.45; direction: rtl; font-size: 11px; }
    main { max-width: 1120px; margin: 0 auto; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { font-size: 19px; margin-bottom: 4px; }
    h2 { font-size: 13px; margin: 14px 0 7px; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
    h3 { font-size: 11px; margin: 0; }
    p { margin-bottom: 5px; }
    .subtitle, .muted, .meta { color: #6b7280; }
    .decision-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
    .decision-card { border: 1px solid #d1d5db; border-radius: 5px; padding: 6px; break-inside: avoid; }
    .decision-card strong { display: block; font-size: 9px; color: #6b7280; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
    th, td { border: 1px solid #d1d5db; padding: 3px 4px; vertical-align: top; line-height: 1.25; overflow-wrap: anywhere; }
    th { background: #f3f4f6; font-weight: 700; }
    .ltr { direction: ltr; text-align: left; unicode-bidi: isolate; }
    .code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; word-break: break-all; }
    .diagnostic { border-right: 3px solid #9ca3af; padding: 5px 7px; margin-bottom: 4px; background: #f9fafb; break-inside: avoid; }
    .diagnostic.warning { border-right-color: #d97706; }
    .diagnostic.critical { border-right-color: #b91c1c; }
    .diag-head { display:flex; align-items:center; gap:5px; margin-bottom:2px; }
    .severity { display:inline-block; border:1px solid #d1d5db; border-radius:999px; padding:0 5px; font-size:8px; }
    .trace { font-size: 8px; word-break: break-word; }
    ul { margin: 0; padding-right: 15px; }
    li { margin-bottom: 1px; }
    footer { margin-top: 8px; padding-top: 5px; border-top: 1px solid #d1d5db; font-size: 8px; color: #6b7280; }
    @page { size: A4 portrait; margin: 5mm; }
    @media print {
      html, body { width: 200mm; min-height: 287mm; }
      body { padding: 0; font-size: 8.2px; line-height: 1.18; }
      main { width: 100%; max-width: none; }
      h1 { font-size: 13px; margin-bottom: 2px; }
      h2 { font-size: 9.5px; margin: 6px 0 3px; padding-bottom: 2px; }
      h3 { font-size: 8.5px; }
      p { margin-bottom: 2px; }
      .decision-grid { gap: 3px; }
      .decision-card { padding: 3px 4px; border-radius: 3px; }
      .decision-card strong { font-size: 7px; margin-bottom: 1px; }
      table { font-size: 7px; }
      th, td { padding: 2px 2.5px; line-height: 1.12; }
      .diagnostic { padding: 3px 4px; margin-bottom: 2px; border-right-width: 2px; }
      .diag-head { gap: 3px; margin-bottom: 1px; }
      .severity { font-size: 6.5px; padding: 0 3px; }
      ul { padding-right: 11px; }
      .trace { font-size: 6.7px; }
      footer { margin-top: 4px; padding-top: 3px; font-size: 6.5px; }
      h2 { break-after: avoid; }
      table, .decision-grid, .diagnostic { break-inside: avoid; }
    }
    @media (max-width: 760px) {
      .decision-grid { grid-template-columns: 1fr 1fr; }
      table { font-size: 8px; }
    }
  </style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(report.titleFa)}</h1>
    <p class="subtitle">شناسه اجرا: <span class="ltr">${escapeHtml(report.runId)}</span> | نسخه موتور: <span class="ltr">${escapeHtml(report.engineVersion)}</span> | زمان تولید: <span class="ltr">${escapeHtml(report.generatedAtIso)}</span></p>
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
      <thead><tr><th>پارامتر</th><th>مقدار</th><th>واحد</th><th>اعتبار مدل</th><th>وضعیت شواهد</th><th>شناسه روش</th></tr></thead>
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
    <p><strong>اثر انگشت ورودی:</strong> <span class="ltr code">${escapeHtml(report.traceability.inputSnapshotHash)}</span></p>
    <p><strong>شناسه روش‌ها:</strong> <span class="ltr code">${escapeHtml(report.traceability.sourceMethodIds.join(', ')) || '—'}</span></p>
    <p><strong>شناسه موجودیت‌های منشأ:</strong> <span class="ltr code">${escapeHtml(report.traceability.provenanceEntityIds.join(', ')) || '—'}</span></p>
    <p><strong>شناسه‌های کالیبراسیون:</strong> <span class="ltr code">${escapeHtml(report.traceability.calibrationIds.join(', ')) || '—'}</span></p>
    <p><strong>شناسه قواعد تشخیصی:</strong> <span class="ltr code">${escapeHtml(report.traceability.diagnosticRuleIds.join(', ')) || '—'}</span></p>
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
