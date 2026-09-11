import { SimulationRunInput } from './simulationRun';
import { assessInputEvidence } from './inputProvenance';
import { evaluateProjectCalibratedLocalLoss } from './projectCalibratedLocalLoss';

export type ReadinessStatus = 'READY' | 'PRELIMINARY' | 'BLOCKED';
export type ReadinessSeverity = 'info' | 'warning' | 'blocking';

export interface ReadinessFinding {
  id: string;
  severity: ReadinessSeverity;
  field: string;
  message: string;
  ruleId: string;
}

export interface EngineeringReadinessResult {
  status: ReadinessStatus;
  canExecute: boolean;
  findings: ReadinessFinding[];
  method: 'tolue-engineering-readiness-gate-v2';
}

function finitePositive(value: number): boolean { return Number.isFinite(value) && value > 0; }
function finiteNonNegative(value: number): boolean { return Number.isFinite(value) && value >= 0; }

export function assessEngineeringReadiness(input: SimulationRunInput): EngineeringReadinessResult {
  const findings: ReadinessFinding[] = [];
  const block = (id: string, field: string, message: string, ruleId: string) => findings.push({ id, severity: 'blocking' as const, field, message, ruleId });
  const warn = (id: string, field: string, message: string, ruleId: string) => findings.push({ id, severity: 'warning' as const, field, message, ruleId });

  if (!input.runId.trim()) block('readiness.runId.missing', 'runId', 'runId is required.', 'RG-META-001');
  if (!input.engineVersion.trim()) block('readiness.engineVersion.missing', 'engineVersion', 'engineVersion is required.', 'RG-META-002');
  if (!Number.isFinite(Date.parse(input.createdAtIso))) block('readiness.createdAt.invalid', 'createdAtIso', 'A valid analysis timestamp is required.', 'RG-META-003');

  const p = input.pipeline;
  if (!finiteNonNegative(p.targetFlowRateM3s)) block('readiness.flow.invalid', 'pipeline.targetFlowRateM3s', 'Target flow rate must be finite and >= 0.', 'RG-PIPE-001');
  if (!finitePositive(p.densityKgM3)) block('readiness.density.invalid', 'pipeline.densityKgM3', 'Concrete density must be finite and > 0.', 'RG-PIPE-002');
  if (!finitePositive(p.lubricationLayerThicknessM)) block('readiness.llThickness.invalid', 'pipeline.lubricationLayerThicknessM', 'Lubrication-layer thickness must be explicitly supplied and > 0 for the current two-fluid model.', 'RG-LL-001');

  if (!finiteNonNegative(p.bulk.yieldStressPa) || !finitePositive(p.bulk.plasticViscosityPaS)) block('readiness.bulkRheology.invalid', 'pipeline.bulk', 'Bulk Bingham yield stress must be >= 0 and plastic viscosity must be > 0.', 'RG-RHEO-001');
  if (!finiteNonNegative(p.lubricationLayer.yieldStressPa) || !finitePositive(p.lubricationLayer.plasticViscosityPaS)) block('readiness.llRheology.invalid', 'pipeline.lubricationLayer', 'Lubrication-layer Bingham yield stress must be >= 0 and plastic viscosity must be > 0.', 'RG-RHEO-002');

  if (!Array.isArray(p.segments) || p.segments.length === 0) {
    block('readiness.pipeline.empty', 'pipeline.segments', 'At least one pipeline segment is required.', 'RG-ROUTE-001');
  } else {
    const ids = new Set<string>();
    for (const segment of p.segments) {
      if (!segment.id.trim()) block('readiness.segment.id', 'pipeline.segments', 'Every segment requires a non-empty ID.', 'RG-ROUTE-002');
      if (ids.has(segment.id)) block(`readiness.segment.duplicate.${segment.id}`, 'pipeline.segments', `Duplicate segment ID: ${segment.id}.`, 'RG-ROUTE-003');
      ids.add(segment.id);
      if (!Number.isFinite(segment.elevationChangeM)) block(`readiness.segment.elevation.${segment.id}`, `pipeline.segments.${segment.id}.elevationChangeM`, 'Segment elevation change must be finite.', 'RG-ROUTE-004');
      if (segment.kind === 'straight') {
        if (!finitePositive(segment.lengthM)) block(`readiness.segment.length.${segment.id}`, `pipeline.segments.${segment.id}.lengthM`, 'Straight-segment length must be finite and > 0.', 'RG-ROUTE-005');
        if (!finitePositive(segment.pipeRadiusM)) block(`readiness.segment.radius.${segment.id}`, `pipeline.segments.${segment.id}.pipeRadiusM`, 'Straight-segment radius must be finite and > 0.', 'RG-ROUTE-006');
        if (finitePositive(segment.pipeRadiusM) && finitePositive(p.lubricationLayerThicknessM) && p.lubricationLayerThicknessM >= segment.pipeRadiusM) block(`readiness.llGeometry.${segment.id}`, 'pipeline.lubricationLayerThicknessM', 'Lubrication-layer thickness must be smaller than every straight-pipe radius.', 'RG-LL-002');
      } else if (!segment.calibratedLocalLoss) {
        block(`readiness.unsupported.${segment.id}`, `pipeline.segments.${segment.id}`, `Friction model for segment kind '${segment.kind}' is not implemented and no project-calibrated local-loss curve is supplied; complete pressure demand cannot be computed.`, 'RG-MODEL-001');
      } else {
        try {
          const calibrated = evaluateProjectCalibratedLocalLoss({
            componentKind: segment.kind,
            targetFlowRateM3s: p.targetFlowRateM3s,
            calibrationCurve: segment.calibratedLocalLoss.calibrationCurve,
            provenanceEntityId: segment.calibratedLocalLoss.provenanceEntityId,
            calibrationId: segment.calibratedLocalLoss.calibrationId,
          });
          if (calibrated.status !== 'computed') {
            block(`readiness.localCalibration.domain.${segment.id}`, `pipeline.segments.${segment.id}.calibratedLocalLoss`, 'Target flow is outside the supplied project-calibrated local-loss curve; extrapolation is prohibited.', 'RG-LOCAL-CAL-003');
          }

          const entityId = segment.calibratedLocalLoss.provenanceEntityId;
          const record = input.provenance?.localLossCalibrations?.[entityId];
          if (!record) {
            block(`readiness.localCalibration.provenanceMissing.${segment.id}`, `provenance.localLossCalibrations.${entityId}`, 'Project-calibrated local loss requires a structured provenance record bound to its provenanceEntityId.', 'RG-LOCAL-PROV-001');
          } else if (record.evidence.entityId !== entityId) {
            block(`readiness.localCalibration.provenanceMismatch.${segment.id}`, `provenance.localLossCalibrations.${entityId}`, 'Local-loss provenance record entity ID does not match the segment provenanceEntityId.', 'RG-LOCAL-PROV-002');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Invalid project-calibrated local-loss contract.';
          block(`readiness.localCalibration.invalid.${segment.id}`, `pipeline.segments.${segment.id}.calibratedLocalLoss`, `Invalid project-calibrated local-loss contract: ${message}`, 'RG-LOCAL-CAL-002');
        }
      }
    }
  }

  if (!input.pumpCapability) {
    block('readiness.pump.missing', 'pumpCapability', 'Pump capability data is required for a complete pumpability pressure assessment.', 'RG-PUMP-001');
  } else if (!Array.isArray(input.pumpCapability.capabilityCurve) || input.pumpCapability.capabilityCurve.length === 0) {
    block('readiness.pump.curveEmpty', 'pumpCapability.capabilityCurve', 'At least one verified pump capability point is required.', 'RG-PUMP-002');
  } else {
    let previous = -Infinity;
    for (const point of input.pumpCapability.capabilityCurve) {
      if (!finiteNonNegative(point.flowRateM3s) || !finiteNonNegative(point.availableConcretePressurePa)) { block('readiness.pump.curveInvalid', 'pumpCapability.capabilityCurve', 'Pump capability points must contain finite non-negative flow and pressure values.', 'RG-PUMP-003'); break; }
      if (point.flowRateM3s <= previous) { block('readiness.pump.curveOrder', 'pumpCapability.capabilityCurve', 'Pump capability flow points must be strictly increasing.', 'RG-PUMP-004'); break; }
      previous = point.flowRateM3s;
    }
    const first = input.pumpCapability.capabilityCurve[0];
    const last = input.pumpCapability.capabilityCurve[input.pumpCapability.capabilityCurve.length - 1];
    if (first && last && Number.isFinite(p.targetFlowRateM3s) && (p.targetFlowRateM3s < first.flowRateM3s || p.targetFlowRateM3s > last.flowRateM3s)) block('readiness.pump.noExtrapolation', 'pipeline.targetFlowRateM3s', 'Target flow is outside the supplied pump capability curve; extrapolation is prohibited.', 'RG-PUMP-005');
  }

  if (input.provenance) {
    const evidence = assessInputEvidence(input.provenance);
    evidence.findings.forEach((finding, index) => {
      const id = `readiness.provenance.${finding.field}.${index}`;
      const field = `provenance.${finding.field}`;
      if (finding.severity === 'blocking') block(id, field, finding.message, finding.ruleId);
      else warn(id, field, finding.message, finding.ruleId);
    });
  } else {
    warn('readiness.provenance.missing', 'provenance', 'Structured input provenance is not supplied; execution may proceed only as PRELIMINARY unless a project-calibrated local-loss segment requires provenance binding.', 'RG-PROV-002');
  }

  if ((input.assumptions ?? []).length > 0) warn('readiness.assumptions.present', 'assumptions', 'Explicit assumptions are present; if no blocking finding exists, the run is classified PRELIMINARY and assumptions must remain traceable.', 'RG-PROV-001');

  // Commercial engineering integrity gate: the current executable straight-pipe solver is
  // mathematically verified for controlled cases, but its controlled model lifecycle has not
  // yet completed the required published full-scale (Tier B) and TOLUE field (Tier C)
  // validation gates. It may execute for engineering evaluation, but it must not silently
  // produce an unqualified READY result until that evidence is accepted and registry status
  // is promoted.
  if (p.segments.some(segment => segment.kind === 'straight')) {
    warn(
      'readiness.model.straightPipe.validationPending',
      'pipeline.segments',
      'The current two-fluid Bingham straight-pipe solver is still pending commercial Tier-B/Tier-C validation. Execution is permitted for engineering evaluation, but the run remains PRELIMINARY and must not be treated as an unqualified production prediction.',
      'RG-MODEL-STRAIGHT-VALIDATION-001',
    );
  }

  const blocked = findings.some(f => f.severity === 'blocking');
  const preliminary = !blocked && findings.some(f => f.severity === 'warning');
  return { status: blocked ? 'BLOCKED' : preliminary ? 'PRELIMINARY' : 'READY', canExecute: !blocked, findings, method: 'tolue-engineering-readiness-gate-v2' };
}
