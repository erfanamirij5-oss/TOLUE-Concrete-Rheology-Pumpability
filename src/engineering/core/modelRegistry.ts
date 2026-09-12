export type ModelLifecycleStatus =
  | 'research' | 'specified' | 'implemented' | 'numerically_verified' | 'calibrated' | 'production' | 'experimental' | 'deprecated' | 'blocked';

export interface ExecutableModelRegistryRecord {
  id: string;
  version: string;
  domain: string;
  status: ModelLifecycleStatus;
  classification: 'physics_based' | 'empirical' | 'project_calibrated' | 'data_contract' | 'diagnostic';
  implementationPath: string;
  productionEligible: boolean;
  requiredEvidence: readonly string[];
  knownLimitations: readonly string[];
}

export type ModelReadinessDisposition = 'QUALIFIED' | 'PRELIMINARY' | 'BLOCKED';
export interface ModelReadinessGovernanceResult {
  readonly modelId: string;
  readonly disposition: ModelReadinessDisposition;
  readonly status: ModelLifecycleStatus | 'unknown';
  readonly productionEligible: boolean;
  readonly message: string;
  readonly requiredEvidence: readonly string[];
  readonly method: 'tolue-model-registry-readiness-v1';
}

const RECORDS: readonly Readonly<ExecutableModelRegistryRecord>[] = Object.freeze([
  Object.freeze({
    id: 'PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001', version: '1', domain: 'pump_hydraulics', status: 'numerically_verified', classification: 'physics_based', implementationPath: 'src/engineering/core/twoFluidBingham.ts', productionEligible: false,
    requiredEvidence: Object.freeze(['Tier-B published/full-scale verification', 'Tier-C TOLUE field validation']),
    knownLimitations: Object.freeze(['Requires explicit lubrication-layer thickness and rheology', 'Not yet commercially validated across arbitrary concrete pumping projects']),
  }),
  Object.freeze({
    id: 'PRESSURE-LOCAL-CAL-001', version: '1', domain: 'pump_hydraulics', status: 'implemented', classification: 'project_calibrated', implementationPath: 'src/engineering/core/projectCalibratedLocalLoss.ts', productionEligible: false,
    requiredEvidence: Object.freeze(['Project-specific calibration provenance', 'In-domain target flow']),
    knownLimitations: Object.freeze(['No extrapolation', 'Not a universal component-loss law']),
  }),
  Object.freeze({
    id: 'PUMP-OPERATING-ENVELOPE-001', version: '1', domain: 'pump_capability', status: 'implemented', classification: 'data_contract', implementationPath: 'src/engineering/core/pumpOperatingEnvelope.ts', productionEligible: false,
    requiredEvidence: Object.freeze(['Manufacturer/revision-controlled Q-P data or controlled project calibration']),
    knownLimitations: Object.freeze(['Positive pressure margin is not a reliability or safety-factor certification']),
  }),
  Object.freeze({
    id: 'STABILITY-STATIC-ROUSSEL-001', version: '1', domain: 'pumpability_stability_screen', status: 'implemented', classification: 'physics_based', implementationPath: 'src/engineering/core/pumpabilityRiskScreening.ts', productionEligible: false,
    requiredEvidence: Object.freeze(['Roussel 2006 single-particle yield-stress stability criterion', 'Explicit suspending-phase yield stress and densities', 'Project/laboratory verification for final acceptance']),
    knownLimitations: Object.freeze(['Static single-particle segregation screen only', 'Not a dynamic pumping stability certification', 'Requires suspending mortar/paste yield stress rather than bulk-concrete yield stress']),
  }),
  Object.freeze({
    id: 'BLOCKAGE-GEOMETRY-ACI-001', version: '1', domain: 'pumpability_blockage_screen', status: 'implemented', classification: 'diagnostic', implementationPath: 'src/engineering/core/pumpabilityRiskScreening.ts', productionEligible: false,
    requiredEvidence: Object.freeze(['ACI 211.9R-18 pumpable-concrete aggregate/line sizing guidance', 'ACI 304.2R-17 pumping guidance', 'Known minimum pipeline inside diameter and nominal maximum aggregate size']),
    knownLimitations: Object.freeze(['Conservative geometric screen only', 'No exact plug-location or arching solver', 'Fittings without explicit inside diameter are outside the geometric screen']),
  }),
  Object.freeze({
    id: 'BLOCKAGE-001', version: '1', domain: 'pumpability_risk', status: 'blocked', classification: 'diagnostic', implementationPath: 'none', productionEligible: false,
    requiredEvidence: Object.freeze(['Validated physical or empirical blockage-location model']),
    knownLimitations: Object.freeze(['No exact physical blockage-location solver is implemented; use BLOCKAGE-GEOMETRY-ACI-001 only as a preliminary geometric screen']),
  }),
]);

export function getExecutableModelRecord(id: string): Readonly<ExecutableModelRegistryRecord> | null { return RECORDS.find(record => record.id === id) ?? null; }
export function listExecutableModelRecords(): readonly Readonly<ExecutableModelRegistryRecord>[] { return RECORDS; }

export function evaluateModelReadinessGovernance(id: string): Readonly<ModelReadinessGovernanceResult> {
  const record = getExecutableModelRecord(id);
  if (!record) return Object.freeze({ modelId: id, disposition: 'BLOCKED', status: 'unknown', productionEligible: false, message: `Model '${id}' is not present in the executable registry; execution is fail-closed.`, requiredEvidence: Object.freeze([]), method: 'tolue-model-registry-readiness-v1' });
  if (record.status === 'blocked' || record.status === 'deprecated' || record.status === 'research' || record.status === 'specified') {
    return Object.freeze({ modelId: record.id, disposition: 'BLOCKED', status: record.status, productionEligible: record.productionEligible, message: `Model '${record.id}' is registry status '${record.status}' and is not permitted to execute as an engineering prediction.`, requiredEvidence: record.requiredEvidence, method: 'tolue-model-registry-readiness-v1' });
  }
  if (record.status === 'production' && record.productionEligible) {
    return Object.freeze({ modelId: record.id, disposition: 'QUALIFIED', status: record.status, productionEligible: true, message: `Model '${record.id}' is production-qualified by the executable registry.`, requiredEvidence: record.requiredEvidence, method: 'tolue-model-registry-readiness-v1' });
  }
  return Object.freeze({ modelId: record.id, disposition: 'PRELIMINARY', status: record.status, productionEligible: record.productionEligible, message: `Model '${record.id}' is registry status '${record.status}' and is not production-qualified. Required evidence: ${record.requiredEvidence.join('; ') || 'none declared'}.`, requiredEvidence: record.requiredEvidence, method: 'tolue-model-registry-readiness-v1' });
}

export function assertModelMayProduceProductionQualifiedResult(id: string): void {
  const record = getExecutableModelRecord(id);
  if (!record) throw new Error(`MODEL-REGISTRY-UNKNOWN:${id}`);
  if (record.status !== 'production' || !record.productionEligible) throw new Error(`MODEL-REGISTRY-NOT-PRODUCTION:${id}:${record.status}`);
}
