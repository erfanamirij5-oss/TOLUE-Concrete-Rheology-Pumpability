import { describe, expect, it } from 'vitest';
import type { EngineeringAnalysisResult } from '../../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../../engineering/core/simulationRun';
import { createEngineeringRunRepository, type PersistedEngineeringRunRow } from './engineeringRunRepository';

const input = {
  runId: 'run-001',
  engineVersion: 'engine-1',
  createdAtIso: '2026-09-09T00:00:00.000Z',
} as unknown as SimulationRunInput;

const blocked = {
  runId: 'run-001',
  engineVersion: 'engine-1',
  readiness: { status: 'BLOCKED', canExecute: false, findings: [], method: 'tolue-engineering-readiness-gate-v2' },
  executionStatus: 'BLOCKED',
  inputSnapshotHash: null,
  simulation: null,
  resultCenter: null,
  diagnostics: null,
  pumpabilityDecision: null,
  finalOutput: null,
  reportExport: null,
  pdfExportRequest: null,
  visualization3d: null,
  completeness: 'incomplete',
  method: 'tolue-engineering-analysis-orchestrator-v6',
} as EngineeringAnalysisResult;

describe('engineering run repository', () => {
  it('persists and restores the exact input/result pair', () => {
    let row: Readonly<PersistedEngineeringRunRow> | null = null;
    const repository = createEngineeringRunRepository({
      upsertEngineeringRun: value => { row = value; },
      readEngineeringRun: () => row,
    });
    repository.save(input, blocked);
    expect(row?.runId).toBe('run-001');
    expect(row?.inputSnapshotHash).toBeNull();
    const restored = repository.findByRunId('run-001');
    expect(restored?.input.runId).toBe(input.runId);
    expect(restored?.result).toEqual(blocked);
  });

  it('rejects run identity mismatch before writing', () => {
    const repository = createEngineeringRunRepository({ upsertEngineeringRun: () => undefined, readEngineeringRun: () => null });
    expect(() => repository.save(input, { ...blocked, runId: 'other-run' })).toThrow('PERSISTENCE-RUN-ID-001');
  });

  it('detects persisted row metadata corruption on read', () => {
    const row: PersistedEngineeringRunRow = {
      runId: 'run-001', engineVersion: 'engine-corrupt', createdAtIso: input.createdAtIso,
      inputSnapshotHash: null, executionStatus: 'BLOCKED', completeness: 'incomplete',
      inputJson: JSON.stringify(input), resultJson: JSON.stringify(blocked), method: 'tolue-engineering-analysis-orchestrator-v6',
    };
    const repository = createEngineeringRunRepository({ upsertEngineeringRun: () => undefined, readEngineeringRun: () => row });
    expect(() => repository.findByRunId('run-001')).toThrow('PERSISTENCE-RUN-ROW-INTEGRITY-001');
  });
});
