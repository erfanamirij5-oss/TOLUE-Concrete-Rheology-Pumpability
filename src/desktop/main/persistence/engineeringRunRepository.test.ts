import { describe, expect, it } from 'vitest';
import type { EngineeringAnalysisResult } from '../../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../../engineering/core/simulationRun';
import { createEngineeringRunRepository, type PersistedEngineeringRunRow } from './engineeringRunRepository';

const input = { runId: 'run-001', engineVersion: 'engine-1', createdAtIso: '2026-09-09T00:00:00.000Z' } as unknown as SimulationRunInput;
const blocked = {
  runId: 'run-001', engineVersion: 'engine-1', readiness: { status: 'BLOCKED', canExecute: false, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
  executionStatus: 'BLOCKED', inputSnapshotHash: null, simulation: null, resultCenter: null, diagnostics: null, pumpabilityDecision: null,
  finalOutput: null, reportExport: null, pdfExportRequest: null, visualization3d: null, completeness: 'incomplete', method: 'tolue-engineering-analysis-orchestrator-v6',
} as EngineeringAnalysisResult;

const store = (rows: PersistedEngineeringRunRow[]) => ({
  upsertEngineeringRun: (value: Readonly<PersistedEngineeringRunRow>) => {
    const index = rows.findIndex(row => row.runId === value.runId);
    if (index >= 0) rows[index] = value; else rows.push(value);
  },
  readEngineeringRun: (runId: string) => rows.find(row => row.runId === runId) ?? null,
  listEngineeringRuns: () => rows,
});

describe('engineering run repository', () => {
  it('persists and restores the exact input/result pair', () => {
    const rows: PersistedEngineeringRunRow[] = [];
    const repository = createEngineeringRunRepository(store(rows));
    repository.save(input, blocked);
    expect(rows[0]!.runId).toBe('run-001'); expect(rows[0]!.inputSnapshotHash).toBeNull();
    const restored = repository.findByRunId('run-001');
    expect(restored?.input.runId).toBe(input.runId); expect(restored?.result).toEqual(blocked);
  });

  it('returns detached metadata-only history in store order', () => {
    const rows: PersistedEngineeringRunRow[] = [];
    const repository = createEngineeringRunRepository(store(rows));
    repository.save(input, blocked);
    const history = repository.listHistory();
    expect(history).toEqual([{ runId: 'run-001', engineVersion: 'engine-1', createdAtIso: input.createdAtIso, inputSnapshotHash: null, executionStatus: 'BLOCKED', completeness: 'incomplete' }]);
    expect(Object.isFrozen(history)).toBe(true); expect(Object.isFrozen(history[0])).toBe(true);
    expect(history[0]).not.toHaveProperty('inputJson'); expect(history[0]).not.toHaveProperty('resultJson');
  });

  it('rejects run identity mismatch before writing', () => {
    const repository = createEngineeringRunRepository(store([]));
    expect(() => repository.save(input, { ...blocked, runId: 'other-run' })).toThrow('PERSISTENCE-RUN-ID-001');
  });

  it('detects persisted row metadata corruption on read', () => {
    const row: PersistedEngineeringRunRow = {
      runId: 'run-001', engineVersion: 'engine-corrupt', createdAtIso: input.createdAtIso, inputSnapshotHash: null,
      executionStatus: 'BLOCKED', completeness: 'incomplete', inputJson: JSON.stringify(input), resultJson: JSON.stringify(blocked), method: 'tolue-engineering-analysis-orchestrator-v6',
    };
    const repository = createEngineeringRunRepository(store([row]));
    expect(() => repository.findByRunId('run-001')).toThrow('PERSISTENCE-RUN-ROW-INTEGRITY-001');
  });
});
