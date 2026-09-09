import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

export interface LicenseClockGuardResult {
  readonly accepted: boolean;
  readonly status: 'FIRST_RUN' | 'FORWARD_OR_EQUAL' | 'ROLLBACK_DETECTED' | 'INVALID_STATE';
  readonly lastSeenIso: string | null;
  readonly nowIso: string;
  readonly method: 'tolue-license-clock-guard-v1';
}

const METHOD = 'tolue-license-clock-guard-v1' as const;
const STATE_FILE = 'tolue-license-clock.json';

function parseIso(value: string): number {
  const parsed = Date.parse(value);
  if (!value.trim() || !Number.isFinite(parsed)) throw new Error('LICENSE-CLOCK-TIME-001');
  return parsed;
}

function readLastSeen(path: string): { state: 'MISSING' | 'VALID' | 'INVALID'; value: string | null } {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { state: 'INVALID', value: null };
    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).length !== 2 || record.schemaVersion !== 'tolue-license-clock-v1' || typeof record.lastSeenIso !== 'string') {
      return { state: 'INVALID', value: null };
    }
    parseIso(record.lastSeenIso);
    return { state: 'VALID', value: record.lastSeenIso };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === 'ENOENT' ? { state: 'MISSING', value: null } : { state: 'INVALID', value: null };
  }
}

function persist(path: string, nowIso: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, JSON.stringify({ schemaVersion: 'tolue-license-clock-v1', lastSeenIso: nowIso }), { encoding: 'utf8', flag: 'w' });
  renameSync(temporary, path);
}

export function evaluateLicenseClockGuard(userDataPath: string, nowIso: string): Readonly<LicenseClockGuardResult> {
  const now = parseIso(nowIso);
  const statePath = join(userDataPath, STATE_FILE);
  const previous = readLastSeen(statePath);
  if (previous.state === 'INVALID') {
    return Object.freeze({ accepted: false, status: 'INVALID_STATE', lastSeenIso: null, nowIso, method: METHOD });
  }
  if (previous.state === 'VALID' && previous.value !== null && now < parseIso(previous.value)) {
    return Object.freeze({ accepted: false, status: 'ROLLBACK_DETECTED', lastSeenIso: previous.value, nowIso, method: METHOD });
  }
  persist(statePath, nowIso);
  return Object.freeze({
    accepted: true,
    status: previous.state === 'MISSING' ? 'FIRST_RUN' : 'FORWARD_OR_EQUAL',
    lastSeenIso: previous.value,
    nowIso,
    method: METHOD,
  });
}
