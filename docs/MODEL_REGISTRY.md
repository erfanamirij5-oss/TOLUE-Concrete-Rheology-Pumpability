# TOLUE Engineering Model Registry

This registry is the allow-list for engineering models. Presence in the registry does not imply production approval.

## Lifecycle
`research -> specified -> implemented -> numerically_verified -> calibrated -> production`

A model may also be `experimental`, `deprecated`, or `blocked`.

## Registry
| Model ID | Domain | Status | Intended use | Production rule |
|---|---|---|---|---|
| RHEO-BINGHAM-001 | Rheology | research | Represent yield-stress + plastic-viscosity behavior where Bingham fit is applicable | Requires fit-quality/applicability criteria and verification |
| RHEO-MEASURED-001 | Rheology data | specified | Store measured rheometer-derived parameters with full provenance | Production only with test/procedure metadata |
| MIX-ABSOLUTE-VOLUME-001 | Mix composition | research | Absolute-volume and phase-fraction calculations | Requires independent numerical verification |
| PSD-COMBINED-001 | Aggregate | research | Combine multiple aggregate PSDs by controlled blend fractions | Requires unit tests and mass-fraction closure |
| PIPE-GEOMETRY-001 | Pipeline | research | Route graph and segment geometry | Requires topology/unit validation |
| PRESSURE-STRAIGHT-001 | Pump hydraulics | blocked | Straight-pipe pressure loss | No formula selected until Stage 0.3 evidence review |
| PRESSURE-ELEVATION-001 | Pump hydraulics | research | Hydrostatic/elevation contribution | Requires sign convention, density basis and numerical tests |
| PRESSURE-ELBOW-001 | Pump hydraulics | research | Concrete-specific elbow pressure-loss model family based on Park et al. 2020 real-scale evidence | Implementation blocked until exact primary equations, coefficients, validity domain and published verification cases are captured; no generic K-factor substitution |
| PRESSURE-ELBOW-002 | Pump hydraulics | numerically_verified | Gao et al. 2024 empirical bend correction-factor model; isolated lambda evaluator verified in published regression domain | Lambda utility may remain for research comparison, but full bend-pressure integration is blocked: the native Gao/Zhao base model contains an unresolved factor-of-four inconsistency between the displayed Darcy/Moody equations and the paper's reported reference pressure; no undocumented `/4` correction is permitted |
| PRESSURE-LOCAL-001 | Pump hydraulics | blocked | Reducer/hose/valve/other local losses | No generic water-flow K-factor substitution without concrete-specific justification |
| LUBRICATION-001 | Interface | blocked | Lubrication/interface layer representation | Requires cited/calibrated interface model |
| BLOCKAGE-001 | Risk | blocked | Plugging/blockage risk | Requires validated physical/empirical basis or explicit TI classification |
| PUMPABILITY-SCORE-001 | Assessment | blocked | 0–100 TOLUE Pumpability Score | Weighting/gates cannot be finalized before upstream model validation |

## Mandatory model metadata
Each implemented model definition must include:
- `id`
- `version`
- `domain`
- `status`
- `classification`
- `references[]`
- `equations[]`
- `requiredInputs[]`
- `outputs[]`
- `units`
- `assumptions[]`
- `validityDomain`
- `knownLimitations[]`
- `verificationCases[]`
- `calibrationDatasetIds[]`
- `uncertaintyMethod`
- `implementationPath`
- `reviewedBy`
- `reviewDate`

## Safety rule
The application must fail closed for unsupported model/type combinations. It may offer a preliminary/experimental run only when the user is explicitly informed and the report carries the same status.