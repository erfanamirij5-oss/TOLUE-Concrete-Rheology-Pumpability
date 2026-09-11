import { describe, expect, it } from 'vitest';
import type { PublishedFullScaleVerificationCase } from './publishedFullScaleVerification';
import { admitVerificationEvidence, type VerificationAdmissionReview, type VerificationEvidenceEntry } from './verificationEvidencePortfolio';
import { evaluateVerificationEvidencePackage, validateVerificationEvidencePackage, type VerificationEvidencePackage } from './verificationEvidencePackage';

function publishedCase(caseId='TB-PKG-001'): PublishedFullScaleVerificationCase {
  return {
    caseId,
    source: { referenceId:'PKG-REF', title:'Controlled full-scale QA source', authors:['QA'], publicationYear:2020, doi:'10.0000/pkg', sourceVersion:'copy-1', sourceHash:'sha256:pkg-source', peerReviewed:true, fullScalePumping:true },
    targetFlowRateM3s:0.01, pipeRadiusM:0.05, lubricationLayerThicknessM:0.002,
    bulk:{yieldStressPa:40,plasticViscosityPaS:18}, lubricationLayer:{yieldStressPa:4,plasticViscosityPaS:2},
    measuredPressureGradientPaPerM:20_000, assumptions:['QA package fixture only.'],
    sourceInputTrace:{ targetFlowRateM3s:'sheet:q', pipeRadiusM:'sheet:r', lubricationLayerThicknessM:'sheet:t', bulkYieldStressPa:'sheet:bt', bulkPlasticViscosityPaS:'sheet:bv', lubricationLayerYieldStressPa:'sheet:lt', lubricationLayerPlasticViscosityPaS:'sheet:lv', measuredPressureGradientPaPerM:'sheet:dpdx' },
  };
}

function candidate(caseId='TB-PKG-001'): VerificationEvidenceEntry { return { tier:'TIER_B_PUBLISHED_FULL_SCALE', admissionStatus:'CANDIDATE', case:publishedCase(caseId) }; }
const review: VerificationAdmissionReview = { reviewerId:'REVIEWER-01', reviewedAtIso:'2026-09-11T16:30:00.000Z', decisionBasis:'Controlled source trace reviewed.', sourceArtifactHash:'sha256:pkg-source' };
function pkg(entries: readonly VerificationEvidenceEntry[]): VerificationEvidencePackage { return { schemaVersion:'tolue-verification-evidence-package-v1', packageId:'PKG-001', generatedAtIso:'2026-09-11T16:35:00.000Z', generatedBy:'TOLUE QA', purpose:'Controlled verification evidence transfer.', entries }; }

describe('verification evidence package',()=>{
  it('accepts a controlled candidate package without allowing it into metrics',()=>{const result=evaluateVerificationEvidencePackage(pkg([candidate()]));expect(result.entryCount).toBe(1);expect(result.portfolio.candidateCount).toBe(1);expect(result.portfolio.tierBMetrics).toBeNull();});
  it('evaluates admitted evidence only after reviewed source-hash admission',()=>{const admitted=admitVerificationEvidence(candidate(),review);const result=evaluateVerificationEvidencePackage(pkg([admitted]));expect(result.portfolio.admittedTierBResults).toHaveLength(1);expect(result.portfolio.productionValidationComplete).toBe(false);});
  it('rejects duplicate case identity inside one package',()=>{expect(()=>validateVerificationEvidencePackage(pkg([candidate(),candidate()]))).toThrow('VERIFICATION-PACKAGE-DUPLICATE-CASE:TIER_B_PUBLISHED_FULL_SCALE:TB-PKG-001');});
  it('rejects empty packages and invalid schema versions',()=>{expect(()=>validateVerificationEvidencePackage(pkg([]))).toThrow('VERIFICATION-PACKAGE-EMPTY-001');const broken={...pkg([candidate()]),schemaVersion:'wrong'} as unknown as VerificationEvidencePackage;expect(()=>validateVerificationEvidencePackage(broken)).toThrow('VERIFICATION-PACKAGE-SCHEMA-001');});
});
