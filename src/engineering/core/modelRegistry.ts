export type ModelLifecycleStatus =
  | 'research'
  | 'specified'
  | 'implemented'
  | 'numerically_verified'
  | 'calibrated'
  | 'production'
  | 'experimental'
  | 'deprecated'
  | 'blocked';

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

const RECORDS: readonly Readonly<ExecutableModelRegistryRecord>[] = Object.freeze([
  Object.freeze({
    id: 'PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001',
    version: '1',
    domain: 'pump_hydraulics',
    status: 'numerically_verified',
    classification: 'physics_based',
    implementationPath: 'src/engineering/core/twoFluidBingham.ts',
    productionEligible: false,
    requiredEvidence: Object.freeze(['Tier-B published/full-scale verification', 'Tier-C TOLUE field validation']),
    knownLimitations: Object.freeze(['Requires explicit lubrication-layer thickness and rheology', 'Not yet commercially validated across arbitrary concrete pumping projects']),
  }),
  Object.freeze({
    id: 'PRESSURE-LOCAL-CAL-001',
    version: '1',
    domain: 'pump_hydraulics',
    status: 'implemented',
    classification: 'project_calibrated',
    implementationPath: 'src/engineering/core/projectCalibratedLocalLoss.ts',
    productionEligible: false,
    requiredEvidence: Object.freeze(['Project-specific calibration provenance', 'In-domain target flow']),
    knownLimitations: Object.freeze(['No extrapolation', 'Not a universal component-loss law']),
  }),
  Object.freeze({
    id: 'PUMP-OPERATING-ENVELOPE-001',
    version: '1',
    domain: 'pump_capability',
    status: 'implemented',
    classification: 'data_contract',
    implementationPath: 'src/engineering/core/pumpOperatingEnvelope.ts',
    productionEligible: false,
    requiredEvidence: Object.freeze(['Manufacturer/revision-controlled Q-P data or controlled project calibration']),
    knownLimitations: Object.freeze(['Positive pressure margin is not a reliability or safety-factor certification']),
  }),
  Object.freeze({
    id: 'BLOCKAGE-001',
    version: '1',
    domain: 'pumpability_risk',
    status: 'blocked',
    classification: 'diagnostic',
    implementationPath: 'none',
    productionEligible: false,
    requiredEvidence: Object.freeze(['Validated physical or empirical blockage model']),
    knownLimitations: Object.freeze(['No physical blockage-location solver is implemented']),
  }),
]);

export function getExecutableModelRecord(id: string): Readonly<ExecutableModelRegistryRecord> | null {
  return RECORDS.find(record => record.id === id) ?? null;
}

export function listExecutableModelRecords(): readonly Readonly<ExecutableModelRegistryRecord>[] {
  return RECORDS;
}

export function assertModelMayProduceProductionQualifiedResult(id: string): void {
  const record = getExecutableModelRecord(id);
  if (!record) throw new Error(`MODEL-REGISTRY-UNKNOWN:${id}`);
  if (record.status !== 'production' || !record.productionEligible) {
    throw new Error(`MODEL-REGISTRY-NOT-PRODUCTION:${id}:${record.status}`);
  }
}
