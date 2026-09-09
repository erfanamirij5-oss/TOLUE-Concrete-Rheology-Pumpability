import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateLicenseClockGuard } from './licenseClockGuard';

describe('license clock rollback guard', () => {
  it('records first run and accepts forward or equal time', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-clock-'));
    expect(evaluateLicenseClockGuard(root, '2026-09-09T10:00:00.000Z').status).toBe('FIRST_RUN');
    const second = evaluateLicenseClockGuard(root, '2026-09-09T10:00:00.000Z');
    expect(second.accepted).toBe(true);
    expect(second.status).toBe('FORWARD_OR_EQUAL');
    expect(second.lastSeenIso).toBe('2026-09-09T10:00:00.000Z');
    expect(evaluateLicenseClockGuard(root, '2026-09-09T11:00:00.000Z').accepted).toBe(true);
  });

  it('fails closed when wall clock moves behind the persisted observation', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-clock-'));
    evaluateLicenseClockGuard(root, '2026-09-09T10:00:00.000Z');
    const result = evaluateLicenseClockGuard(root, '2026-09-09T09:59:59.999Z');
    expect(result.accepted).toBe(false);
    expect(result.status).toBe('ROLLBACK_DETECTED');
    expect(result.lastSeenIso).toBe('2026-09-09T10:00:00.000Z');
  });

  it('fails closed on malformed persisted state instead of resetting trust', () => {
    const root = mkdtempSync(join(tmpdir(), 'tolue-license-clock-'));
    writeFileSync(join(root, 'tolue-license-clock.json'), '{broken', 'utf8');
    const result = evaluateLicenseClockGuard(root, '2026-09-09T10:00:00.000Z');
    expect(result.accepted).toBe(false);
    expect(result.status).toBe('INVALID_STATE');
  });
});
