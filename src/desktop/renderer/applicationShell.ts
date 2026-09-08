import type { EngineeringPdfExportRequest } from '../../engineering/core/engineeringPdfExport';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import type { EngineeringAnalysisIpcResponse } from '../ipc/engineeringAnalysisIpc';
import type { EngineeringRunHistoryIpcResponse, EngineeringRunLoadIpcResponse } from '../ipc/engineeringRunIpc';
import { createApplicationDataFlowState, hydratePersistedEngineeringRun, type ApplicationDataFlowState } from './applicationDataFlow';
import { TOLUE_DESIGN_TOKENS } from './designSystem';
import { renderDiagnosticsView } from './diagnosticsView';
import { renderEvidenceView } from './evidenceView';
import { createNavigationState, TOLUE_SECTIONS, type TolueSectionId } from './navigation';
import { renderMaterialsView } from './materialView';
import { renderPipelineView } from './pipelineView';
import { renderProjectView } from './projectView';
import { renderPumpView } from './pumpView';
import { renderRheologyView } from './rheologyView';
import { renderReportView } from './reportView';
import { renderResultView } from './resultView';
import { renderRunHistoryView } from './runHistoryView';
import { renderVisualization3DView } from './visualization3dView';

export interface ApplicationShellActions {
  readonly executeEngineeringAnalysis: (input: SimulationRunInput) => Promise<EngineeringAnalysisIpcResponse>;
  readonly loadEngineeringRun: (runId: string) => Promise<EngineeringRunLoadIpcResponse>;
  readonly listEngineeringRuns: () => Promise<EngineeringRunHistoryIpcResponse>;
  readonly exportEngineeringPdf: (request: EngineeringPdfExportRequest) => Promise<unknown>;
}

const SECTION_DESCRIPTIONS: Readonly<Record<TolueSectionId, string>> = Object.freeze({
  project: 'تعریف و مدیریت زمینه پروژه و ورودی‌های سطح پروژه.',
  materials: 'مدیریت داده‌های مصالح بدون ایجاد تفسیر مهندسی در لایه نمایش.',
  rheology: 'ورودی و نمایش داده‌های رئولوژی؛ محاسبات فقط توسط Engineering Core انجام می‌شوند.',
  pipeline: 'تعریف هندسه مسیر و نمایش اجزای فشار محاسبه‌شده توسط Core.',
  pump: 'ثبت داده‌های قابلیت پمپ از منابع مجاز و نمایش تطابق فشار.',
  evidence: 'نمایش شواهد پروژه‌ای، دامنه اعتبار و ردیابی منشأ داده.',
  visualization: 'نمایش مهندسی مسیر و نتایج Core؛ بدون ادعای CFD/DEM یا شبیه‌سازی فیزیکی.',
  results: 'مرکز نتایج مهندسی تولیدشده توسط Engineering Core.',
  diagnostics: 'نمایش تشخیص‌ها، هشدارها و محدودیت‌های تولیدشده توسط Core.',
  report: 'آماده‌سازی و صدور گزارش از خروجی‌های معتبر بدون استنتاج جدید.',
});

export function renderApplicationShell(
  root: HTMLElement,
  dataFlow: Readonly<ApplicationDataFlowState> = createApplicationDataFlowState(),
  actions?: Readonly<ApplicationShellActions>,
): void {
  let navigationState = createNavigationState();
  let sessionState = dataFlow;
  root.replaceChildren();
  root.setAttribute('dir', 'rtl');
  root.setAttribute('lang', 'fa');
  root.style.fontFamily = TOLUE_DESIGN_TOKENS.typography.fontFamily;
  root.style.background = TOLUE_DESIGN_TOKENS.color.background;
  root.style.color = TOLUE_DESIGN_TOKENS.color.text;
  root.style.minHeight = '100vh';

  const layout = document.createElement('div');
  layout.style.display = 'grid';
  layout.style.gridTemplateColumns = '240px minmax(0, 1fr)';
  layout.style.minHeight = '100vh';
  const sidebar = document.createElement('aside');
  sidebar.setAttribute('aria-label', 'ناوبری اصلی');
  sidebar.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  sidebar.style.borderLeft = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  sidebar.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  const brand = document.createElement('div');
  brand.textContent = 'TOLUE';
  brand.style.fontWeight = '800';
  brand.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;
  brand.style.marginBottom = TOLUE_DESIGN_TOKENS.spacing.xl;
  sidebar.appendChild(brand);
  const navigation = document.createElement('nav');
  navigation.style.display = 'grid';
  navigation.style.gap = TOLUE_DESIGN_TOKENS.spacing.sm;

  const main = document.createElement('main');
  main.style.padding = TOLUE_DESIGN_TOKENS.spacing.xl;
  const eyebrow = document.createElement('div');
  eyebrow.textContent = 'TOLUE Concrete Rheology & Pumpability';
  eyebrow.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  eyebrow.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeSm;
  const heading = document.createElement('h1');
  heading.style.margin = `${TOLUE_DESIGN_TOKENS.spacing.sm} 0 ${TOLUE_DESIGN_TOKENS.spacing.md}`;
  heading.style.fontSize = TOLUE_DESIGN_TOKENS.typography.fontSizeXl;
  const intro = document.createElement('p');
  intro.style.maxWidth = '760px';
  intro.style.lineHeight = TOLUE_DESIGN_TOKENS.typography.lineHeight;
  intro.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  const content = document.createElement('div');
  content.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;

  const status = document.createElement('section');
  status.setAttribute('aria-label', 'وضعیت محیط');
  status.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;
  status.style.padding = TOLUE_DESIGN_TOKENS.spacing.lg;
  status.style.background = TOLUE_DESIGN_TOKENS.color.surface;
  status.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  status.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.md;
  const statusTitle = document.createElement('strong');
  const statusText = document.createElement('p');
  statusText.style.marginBottom = '0';
  statusText.style.color = TOLUE_DESIGN_TOKENS.color.textMuted;
  status.append(statusTitle, statusText);

  const history = document.createElement('section');
  history.setAttribute('aria-label', 'تاریخچه تحلیل‌ها');
  history.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.xl;
  const historyButton = document.createElement('button');
  historyButton.type = 'button';
  historyButton.textContent = 'نمایش تاریخچه Runها';
  historyButton.style.fontFamily = 'inherit';
  historyButton.style.padding = TOLUE_DESIGN_TOKENS.spacing.md;
  historyButton.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
  historyButton.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
  const historyContent = document.createElement('div');
  historyContent.style.marginTop = TOLUE_DESIGN_TOKENS.spacing.md;
  history.append(historyButton, historyContent);

  const refreshStatus = (): void => {
    statusTitle.textContent = `Session: ${sessionState.status}`;
    statusText.textContent = sessionState.analysis
      ? `Run: ${sessionState.analysis.runId} · completeness: ${sessionState.analysis.completeness}${sessionState.isStale ? ' · STALE' : ''}`
      : 'صفحات خروجی تا دریافت EngineeringAnalysisResult معتبر، داده مهندسی تولید نمی‌کنند.';
  };

  const renderSection = (): void => {
    const section = TOLUE_SECTIONS.find(item => item.id === navigationState.activeSection);
    if (!section) throw new Error('RENDERER-NAV-001');
    heading.textContent = section.label;
    intro.textContent = SECTION_DESCRIPTIONS[section.id];
    content.replaceChildren();
    const analysis = sessionState.analysis;
    if (section.id === 'project') renderProjectView(content);
    else if (section.id === 'materials') renderMaterialsView(content);
    else if (section.id === 'rheology') renderRheologyView(content, undefined, analysis?.rheologyCurves ?? undefined);
    else if (section.id === 'pipeline') renderPipelineView(content, analysis?.pipeline ?? undefined, analysis?.pressureProfile ?? undefined, analysis?.pressureComposition ?? undefined);
    else if (section.id === 'pump') renderPumpView(content, analysis?.pump ?? undefined);
    else if (section.id === 'evidence') renderEvidenceView(content);
    else if (section.id === 'visualization') renderVisualization3DView(content, analysis?.visualization3d ?? undefined);
    else if (section.id === 'results') renderResultView(content, analysis?.results ?? undefined);
    else if (section.id === 'diagnostics') renderDiagnosticsView(content, analysis?.diagnostics ?? undefined);
    else if (section.id === 'report') renderReportView(content, analysis?.report ?? undefined, actions);
    for (const element of Array.from(navigation.querySelectorAll('button'))) {
      const active = element.dataset.section === navigationState.activeSection;
      element.setAttribute('aria-current', active ? 'page' : 'false');
      element.style.background = active ? TOLUE_DESIGN_TOKENS.color.surface : TOLUE_DESIGN_TOKENS.color.surfaceMuted;
      element.style.color = active ? TOLUE_DESIGN_TOKENS.color.text : TOLUE_DESIGN_TOKENS.color.textMuted;
      element.style.borderColor = active ? TOLUE_DESIGN_TOKENS.color.focus : TOLUE_DESIGN_TOKENS.color.border;
    }
    refreshStatus();
  };

  const loadPersistedRun = async (runId: string): Promise<void> => {
    if (!actions) return;
    const response = await actions.loadEngineeringRun(runId);
    try {
      sessionState = hydratePersistedEngineeringRun(response);
      renderSection();
    } catch (error) {
      statusTitle.textContent = 'Session: REJECTED';
      statusText.textContent = error instanceof Error ? error.message : 'APPLICATION-DATA-FLOW-LOAD-001';
    }
  };

  historyButton.addEventListener('click', () => {
    if (!actions) return;
    void actions.listEngineeringRuns().then(response => {
      if (response.status === 'SUCCESS') renderRunHistoryView(historyContent, response.items, { loadRun: loadPersistedRun });
      else {
        historyContent.replaceChildren();
        const error = document.createElement('p');
        error.textContent = response.errorCode;
        historyContent.appendChild(error);
      }
    });
  });

  for (const section of TOLUE_SECTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = section.label;
    button.dataset.section = section.id;
    button.style.textAlign = 'right';
    button.style.padding = `${TOLUE_DESIGN_TOKENS.spacing.md} ${TOLUE_DESIGN_TOKENS.spacing.md}`;
    button.style.border = `1px solid ${TOLUE_DESIGN_TOKENS.color.border}`;
    button.style.borderRadius = TOLUE_DESIGN_TOKENS.radius.sm;
    button.style.fontFamily = 'inherit';
    button.addEventListener('click', () => { navigationState = createNavigationState(section.id); renderSection(); });
    navigation.appendChild(button);
  }

  sidebar.appendChild(navigation);
  main.append(eyebrow, heading, intro, content, status, history);
  layout.append(sidebar, main);
  root.appendChild(layout);
  renderSection();
}
