import type { EngineeringAnalysisResult } from '../../../engineering/core/engineeringAnalysis';
import type { SimulationRunInput } from '../../../engineering/core/simulationRun';

export interface PersistedEngineeringRunRow {
  readonly runId: string;
  readonly engineVersion: string;
  readonly createdAtIso: string;
  readonly inputSnapshotHash: string | null;
  readonly executionStatus: 'EXECUTED' | 'BLOCKED';
  readonly completeness: 'complete' | 'incomplete';
  readonly inputJson: string;
  readonly resultJson: string;
  readonly method: 'tolue-engineering-analysis-orchestrator-v6';
}

export interface EngineeringRunRowStore {
  readonly upsertEngineeringRun: (row: Readonly<PersistedEngineeringRunRow>) => void;
  readonly readEngineeringRun: (runId: string) => Readonly<PersistedEngineeringRunRow> | null;
}

export interface PersistedEngineeringRun {
  readonly input: Readonly<SimulationRunInput>;
  readonly result: Readonly<EngineeringAnalysisResult>;
}

function validatePair(input: Readonly<SimulationRunInput>, result: Readonly<EngineeringAnalysisResult>): void {
  if (!input.runId.trim() || input.runId !== result.runId) throw new Error('PERSISTENCE-RUN-ID-001');
  if (!input.engineVersion.trim() || input.engineVersion !== result.engineVersion) throw new Error('PERSISTENCE-ENGINE-VERSION-001');
  if (!Number.isFinite(Date.parse(input.createdAtIso))) throw new Error('PERSISTENCE-CREATED-AT-001');
  if (result.executionStatus === 'EXECUTED' && !result.inputSnapshotHash) throw new Error('PERSISTENCE-INPUT-HASH-001');
  if (result.executionStatus === 'BLOCKED' && result.inputSnapshotHash !== null) throw new Error('PERSISTENCE-BLOCKED-HASH-001');
}

export function createEngineeringRunRepository(store: Readonly<EngineeringRunRowStore>) {
  return Object.freeze({
    save(input: Readonly<SimulationRunInput>, result: Readonly<EngineeringAnalysisResult>): void {
      validatePair(input, result);
      store.upsertEngineeringRun(Object.freeze({
        runId: result.runId,
        engineVersion: result.engineVersion,
        createdAtIso: input.createdAtIso,
        inputSnapshotHash: result.inputSnapshotHash,
        executionStatus: result.executionStatus,
        completeness: result.completeness,
        inputJson: JSON.stringify(input),
        resultJson: JSON.stringify(result),
        method: result.method,
      }));
    },
    findByRunId(runId: string): Readonly<PersistedEngineeringRun> | null {
      if (!runId.trim()) throw new Error('PERSISTENCE-RUN-ID-LOOKUP-001');
      const row = store.readEngineeringRun(runId);
      if (!row) return null;
      const input = JSON.parse(row.inputJson) as SimulationRunInput;
      const result = JSON.parse(row.resultJson) as EngineeringAnalysisResult;
      validatePair(input, result);
      if (row.runId !== result.runId || row.engineVersion !== result.engineVersion || row.executionStatus !== result.executionStatus || row.inputSnapshotHash !== result.inputSnapshotHash || row.method !== result.method) {
        throw new Error('PERSISTENCE-RUN-ROW-INTEGRITY-001');
      }
      return Object.freeze({ input: Object.freeze(input), result: Object.freeze(result) });
    },
  });
}

export type EngineeringRunRepository = ReturnType<typeof createEngineeringRunRepository>;
