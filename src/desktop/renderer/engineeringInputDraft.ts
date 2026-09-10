import type { SimulationRunInput } from '../../engineering/core/simulationRun';

export type RheologyInputPath =
  | 'bulk.yieldStressPa'
  | 'bulk.plasticViscosityPaS'
  | 'lubricationLayer.yieldStressPa'
  | 'lubricationLayer.plasticViscosityPaS';

export type PipelineScalarPath =
  | 'targetFlowRateM3s'
  | 'densityKgM3'
  | 'lubricationLayerThicknessM';

export type StraightSegmentNumericField = 'lengthM' | 'pipeRadiusM' | 'elevationChangeM';
export type PumpCapabilityPointField = 'flowRateM3s' | 'availableConcretePressurePa';

function finite(value: number): void {
  if (!Number.isFinite(value)) throw new Error('ENGINEERING-INPUT-DRAFT-NUMBER-001');
}

/**
 * Renderer-side draft editing only. These helpers mirror constraints already
 * enforced by Engineering Core; they do not infer defaults or acceptance criteria.
 */
export function updateRheologyInputDraft(
  input: Readonly<SimulationRunInput>,
  path: RheologyInputPath,
  value: number,
): Readonly<SimulationRunInput> {
  finite(value);
  if (path.endsWith('yieldStressPa') && value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-YIELD-001');
  if (path.endsWith('plasticViscosityPaS') && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-VISCOSITY-001');

  const next = structuredClone(input) as SimulationRunInput;
  const [family, key] = path.split('.') as ['bulk' | 'lubricationLayer', 'yieldStressPa' | 'plasticViscosityPaS'];
  next.pipeline[family][key] = value;
  return Object.freeze(next);
}

export function updatePipelineScalarDraft(
  input: Readonly<SimulationRunInput>,
  path: PipelineScalarPath,
  value: number,
): Readonly<SimulationRunInput> {
  finite(value);
  if (path === 'targetFlowRateM3s' && value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-FLOW-001');
  if (path === 'densityKgM3' && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-DENSITY-001');
  if (path === 'lubricationLayerThicknessM') {
    if (value < 0) throw new Error('ENGINEERING-INPUT-DRAFT-LAYER-001');
    for (const segment of input.pipeline.segments) {
      if (segment.kind === 'straight' && value >= segment.pipeRadiusM) throw new Error('ENGINEERING-INPUT-DRAFT-LAYER-RADIUS-001');
    }
  }

  const next = structuredClone(input) as SimulationRunInput;
  next.pipeline[path] = value;
  return Object.freeze(next);
}

export function updateStraightSegmentDraft(
  input: Readonly<SimulationRunInput>,
  segmentIndex: number,
  field: StraightSegmentNumericField,
  value: number,
): Readonly<SimulationRunInput> {
  finite(value);
  const segment = input.pipeline.segments[segmentIndex];
  if (!segment || segment.kind !== 'straight') throw new Error('ENGINEERING-INPUT-DRAFT-SEGMENT-001');
  if (field === 'lengthM' && value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-LENGTH-001');
  if (field === 'pipeRadiusM') {
    if (value <= 0) throw new Error('ENGINEERING-INPUT-DRAFT-RADIUS-001');
    if (input.pipeline.lubricationLayerThicknessM >= value) throw new Error('ENGINEERING-INPUT-DRAFT-RADIUS-LAYER-001');
  }

  const next = structuredClone(input) as SimulationRunInput;
  const nextSegment = next.pipeline.segments[segmentIndex];
  if (!nextSegment || nextSegment.kind !== 'straight') throw new Error('ENGINEERING-INPUT-DRAFT-SEGMENT-001');
  nextSegment[field] = value;
  return Object.freeze(next);
}

export function updatePumpCapabilityPointDraft(
  input: Readonly<SimulationRunInput>,
  pointIndex: number,
  field: PumpCapabilityPointField,
  value: number,
): Readonly<SimulationRunInput> {
  finite(value);
  if (!input.pumpCapability) throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-001');
  if (value < 0) throw new Error(field === 'flowRateM3s' ? 'ENGINEERING-INPUT-DRAFT-PUMP-FLOW-001' : 'ENGINEERING-INPUT-DRAFT-PUMP-PRESSURE-001');

  const next = structuredClone(input) as SimulationRunInput;
  const point = next.pumpCapability?.capabilityCurve[pointIndex];
  if (!point) throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-POINT-001');
  point[field] = value;

  const curve = next.pumpCapability!.capabilityCurve;
  for (let index = 1; index < curve.length; index += 1) {
    if (curve[index]!.flowRateM3s <= curve[index - 1]!.flowRateM3s) throw new Error('ENGINEERING-INPUT-DRAFT-PUMP-ORDER-001');
  }
  return Object.freeze(next);
}
