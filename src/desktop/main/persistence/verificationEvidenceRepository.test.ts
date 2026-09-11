import { describe, expect, it } from 'vitest';
import type { VerificationEvidencePackage } from '../../../engineering/core/verificationEvidencePackage';
import { createVerificationEvidenceRepository, type PersistedVerificationEvidencePackageRow, type VerificationEvidencePackageRowStore } from './verificationEvidenceRepository';

function evidencePackage(id = 'VP-001'): VerificationEvidencePackage {
  return {
    schemaVersion: 'tolue-verification-evidence-package-v1',
    packageId: id,
    generatedAtIso: '2026-09-11T18:00:00.000Z',
    generatedBy: 'TOLUE QA',
    purpose: 'Persistence QA only',
    entries: [{
      tier: 'TIER_B_PUBLISHED_FULL_SCALE',
      admissionStatus: 'CANDIDATE',
      case: {
        caseId: 'TB-PERSIST-QA-001',
        source: { referenceId: 'QA', title: 'QA source', authors: ['QA'], publicationYear: 2020, doi: '10.0000/qa', sourceVersion: '1', sourceHash: 'sha256:persist-qa', peerReviewed: true, fullScalePumping: true },
        targetFlowRateM3s: 0.01,
        pipeRadiusM: 0.05,
        lubricationLayerThicknessM: 0.002,
        bulk: { yieldStressPa: 40, plasticViscosityPaS: 18 },
        lubricationLayer: { yieldStressPa: 4, plasticViscosityPaS: 2 },
        measuredPressureGradientPaPerM: 20_000,
        assumptions: ['QA fixture only'],
        sourceInputTrace: { targetFlowRateM3s:'qa:q',pipeRadiusM:'qa:r',lubricationLayerThicknessM:'qa:t',bulkYieldStressPa:'qa:bt',bulkPlasticViscosityPaS:'qa:bm',lubricationLayerYieldStressPa:'qa:lt',lubricationLayerPlasticViscosityPaS:'qa:lm',measuredPressureGradientPaPerM:'qa:p' },
      },
    }],
  };
}

function memoryStore(): VerificationEvidencePackageRowStore {
  const rows = new Map<string, PersistedVerificationEvidencePackageRow>();
  return {
    insertVerificationEvidencePackage: row => { rows.set(row.packageId, structuredClone(row)); },
    readVerificationEvidencePackage: packageId => rows.get(packageId) ?? null,
    listVerificationEvidencePackages: () => [...rows.values()].sort((a,b)=>b.importedAtIso.localeCompare(a.importedAtIso)),
  };
}

describe('verification evidence repository', () => {
  it('persists and reloads a governed package without mutation', () => {
    const repository = createVerificationEvidenceRepository(memoryStore());
    const input = evidencePackage();
    repository.save(input, '2026-09-11T19:00:00.000Z');
    const loaded = repository.findByPackageId('VP-001');
    expect(loaded).toEqual(input);
    expect(loaded).not.toBe(input);
  });

  it('keeps package IDs immutable', () => {
    const repository = createVerificationEvidenceRepository(memoryStore());
    repository.save(evidencePackage(), '2026-09-11T19:00:00.000Z');
    const changed = { ...evidencePackage(), purpose: 'Changed package content' };
    expect(() => repository.save(changed, '2026-09-11T19:10:00.000Z')).toThrow('VERIFICATION-PERSISTENCE-IMMUTABLE-001');
  });

  it('allows idempotent re-import of the exact same package', () => {
    const repository = createVerificationEvidenceRepository(memoryStore());
    const input = evidencePackage();
    repository.save(input, '2026-09-11T19:00:00.000Z');
    expect(() => repository.save(input, '2026-09-11T19:10:00.000Z')).not.toThrow();
    expect(repository.listHistory()).toHaveLength(1);
  });

  it('returns auditable recent-package metadata', () => {
    const repository = createVerificationEvidenceRepository(memoryStore());
    repository.save(evidencePackage('VP-001'), '2026-09-11T19:00:00.000Z');
    repository.save(evidencePackage('VP-002'), '2026-09-11T20:00:00.000Z');
    expect(repository.listHistory().map(item => item.packageId)).toEqual(['VP-002','VP-001']);
    expect(repository.listHistory()[0]?.entryCount).toBe(1);
  });
});
