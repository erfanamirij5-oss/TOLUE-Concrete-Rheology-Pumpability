import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EngineeringAnalysisResult } from '../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../engineering/core/simulationRun';
import { ENGINEERING_RUN_COMPARISON_CHANNEL } from '../ipc/engineeringRunIpc';

const m = vi.hoisted(() => ({ handle: vi.fn(), remove: vi.fn() }));
vi.mock('electron', () => ({
  BrowserWindow: class {},
  ipcMain: { handle: m.handle, removeHandler: m.remove },
}));

import { registerEngineeringRunLoadIpc } from './electronRunAdapter';
import type { EngineeringRunRepository } from './persistence/engineeringRunRepository';

const input = (runId: string): SimulationRunInput => ({ runId, engineVersion: 'v1', createdAtIso: '2026-09-09T00:00:00Z' } as unknown as SimulationRunInput);
const blocked = (runId: string): EngineeringAnalysisResult => ({
  runId, engineVersion: 'v1', readiness: { status: 'BLOCKED', canExecute: false, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
  executionStatus: 'BLOCKED', inputSnapshotHash: null, simulation: null, resultCenter: null, diagnostics: null, pumpabilityDecision: null,
  finalOutput: null, reportExport: null, pdfExportRequest: null, visualization3d: null, completeness: 'incomplete', method: 'tolue-engineering-analysis-orchestrator-v6',
});

const repository = (runs: Record<string, { input: SimulationRunInput; result: EngineeringAnalysisResult }>): Readonly<EngineeringRunRepository> => ({
  save: vi.fn(),
  findByRunId: vi.fn((runId: string) => runs[runId] ?? null),
  listHistory: vi.fn(() => []),
} as unknown as Readonly<EngineeringRunRepository>);

function comparisonHandler() {
  const found = m.handle.mock.calls.find(call => call[0] === ENGINEERING_RUN_COMPARISON_CHANNEL);
  if (!found) throw new Error('TEST-COMPARISON-HANDLER-001');
  return found[1] as (event: unknown, request: unknown) => Promise<unknown>;
}

describe('Electron engineering run comparison adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads both immutable persisted runs in Main and returns Core comparison without renderer payloads', async () => {
    const repo = repository({
      'run-a': { input: input('run-a'), result: blocked('run-a') },
      'run-b': { input: input('run-b'), result: blocked('run-b') },
    });
    const mainFrame = { url: 'tolue://desktop/index.html' };
    const owner = { isDestroyed: () => false, webContents: { mainFrame } };
    registerEngineeringRunLoadIpc(owner as never, mainFrame.url, repo);
    const handler = comparisonHandler();
    const response = await handler(
      { sender: owner.webContents, senderFrame: mainFrame },
      { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-b' },
    ) as { status: string; comparison: { baseline: { runId: string }; candidate: { runId: string }; interpretationClaim: string } };
    expect(response.status).toBe('SUCCESS');
    expect(response.comparison.baseline.runId).toBe('run-a');
    expect(response.comparison.candidate.runId).toBe('run-b');
    expect(response.comparison.interpretationClaim).toBe('no_automatic_better_or_worse_inference');
    expect(repo.findByRunId).toHaveBeenNthCalledWith(1, 'run-a');
    expect(repo.findByRunId).toHaveBeenNthCalledWith(2, 'run-b');
  });

  it('returns NOT_FOUND when either persisted run is absent', async () => {
    const repo = repository({ 'run-a': { input: input('run-a'), result: blocked('run-a') } });
    const mainFrame = { url: 'tolue://desktop/index.html' };
    const owner = { isDestroyed: () => false, webContents: { mainFrame } };
    registerEngineeringRunLoadIpc(owner as never, mainFrame.url, repo);
    const response = await comparisonHandler()(
      { sender: owner.webContents, senderFrame: mainFrame },
      { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'missing' },
    ) as { status: string; comparison: unknown };
    expect(response).toMatchObject({ status: 'NOT_FOUND', comparison: null });
  });

  it('rejects same-run comparison before repository lookup', async () => {
    const repo = repository({});
    const mainFrame = { url: 'tolue://desktop/index.html' };
    const owner = { isDestroyed: () => false, webContents: { mainFrame } };
    registerEngineeringRunLoadIpc(owner as never, mainFrame.url, repo);
    const response = await comparisonHandler()(
      { sender: owner.webContents, senderFrame: mainFrame },
      { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-a' },
    ) as { status: string; errorCode: string };
    expect(response).toMatchObject({ status: 'REJECTED', errorCode: 'RUN-COMPARISON-IPC-DISTINCT-001' });
    expect(repo.findByRunId).not.toHaveBeenCalled();
  });

  it('rejects untrusted sender without repository access', async () => {
    const repo = repository({});
    const mainFrame = { url: 'tolue://desktop/index.html' };
    const owner = { isDestroyed: () => false, webContents: { mainFrame } };
    registerEngineeringRunLoadIpc(owner as never, mainFrame.url, repo);
    const response = await comparisonHandler()(
      { sender: {}, senderFrame: mainFrame },
      { channel: ENGINEERING_RUN_COMPARISON_CHANNEL, baselineRunId: 'run-a', candidateRunId: 'run-b' },
    ) as { status: string; errorCode: string };
    expect(response).toMatchObject({ status: 'REJECTED', errorCode: 'RUN-COMPARISON-IPC-SENDER-001' });
    expect(repo.findByRunId).not.toHaveBeenCalled();
  });
});
