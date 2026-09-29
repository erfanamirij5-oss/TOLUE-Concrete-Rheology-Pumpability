# TOLUE Engineering Model Registry

This registry is the engineering-model allow-list. Presence in the registry does **not** imply production approval. Runtime readiness is governed by the executable registry in `src/engineering/core/modelRegistry.ts`; this document must remain synchronized with it.

## Lifecycle
`research -> specified -> implemented -> numerically_verified -> calibrated -> production`

A model may also be `experimental`, `deprecated`, or `blocked`.

Runtime policy:
- `unknown`, `research`, `specified`, `deprecated`, `blocked` -> fail closed for engineering prediction.
- `implemented`, `numerically_verified`, `calibrated`, `experimental` -> execution may be allowed only as `PRELIMINARY` when all other readiness checks pass.
- `production` + `productionEligible=true` -> may support production-qualified output, subject to all other domain/evidence gates.

## Registry
| Model ID | Domain | Status | Intended use | Production rule |
|---|---|---|---|---|
| RHEO-BINGHAM-001 | Rheology | research | Represent yield-stress + plastic-viscosity behavior where Bingham fit is applicable | Requires fit-quality/applicability criteria and verification |
| RHEO-MEASURED-001 | Rheology data | specified | Store measured rheometer-derived parameters with full provenance | Production only with test/procedure metadata |
| MIX-ABSOLUTE-VOLUME-001 | Mix composition | research | Absolute-volume and phase-fraction calculations | Requires independent numerical verification |
| PSD-COMBINED-001 | Aggregate | research | Combine multiple aggregate PSDs by controlled blend fractions | Requires unit tests and mass-fraction closure |
| PIPE-GEOMETRY-001 | Pipeline | research | Route graph and segment geometry | Requires topology/unit validation |
| PRESSURE-STRAIGHT-001 | Pump hydraulics | blocked | Legacy pre-selection placeholder for straight-pipe pressure loss | Retained only as historical governance record; it is **not** the current executable solver ID |
| PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001 | Pump hydraulics | numerically_verified | Current coaxial two-fluid Bingham straight-pipe pressure solver implemented in `twoFluidBingham.ts` | `productionEligible=false`; requires Tier-B published/full-scale verification and Tier-C TOLUE field validation before production qualification |
| PRESSURE-ELEVATION-001 | Pump hydraulics | research | Hydrostatic/elevation contribution | Requires sign convention, density basis and numerical tests |
| PRESSURE-ELBOW-001 | Pump hydraulics | research | Park et al. 2020 real-scale elbow evidence family; abstract-level evidence confirms materially increased bend loss in tested concrete-pumping systems | Evidence confirmed but equation-blocked: accessible sources do not expose exact equations, geometry normalization, coefficients or reproducible cases; the reported approximately-two-times observation is not an executable universal multiplier and must not be hard-coded |
| PRESSURE-ELBOW-002 | Pump hydraulics | numerically_verified | Gao et al. 2024 empirical bend correction-factor model; isolated lambda evaluator verified in published regression domain | Lambda utility may remain for research comparison, but full bend-pressure integration is blocked because the native Gao/Zhao base model contains an unresolved factor-of-four inconsistency; no undocumented `/4` correction is permitted |
| PRESSURE-LOCAL-CAL-001 | Pump hydraulics | implemented | Project-calibrated local component pressure-loss curve using traceable project data | Executable only in-domain with bound provenance; no extrapolation; `productionEligible=false` until higher-level release governance approves the model class |
| PRESSURE-LOCAL-001 | Pump hydraulics | blocked | Reducer/hose/valve/other generic local losses | No generic water-flow K-factor substitution without concrete-specific justification |
| LUBRICATION-001 | Interface | blocked | Legacy generic lubrication/interface-layer placeholder | Replaced in executable workflows by explicit LL rheology/thickness provenance and qualification contracts; no universal LL model is approved |
| PUMP-OPERATING-ENVELOPE-001 | Pump capability | implemented | Revision-controlled manufacturer/project-calibrated Q-P operating envelope | No extrapolation; positive pressure margin is not safety/reliability certification; `productionEligible=false` |
| BLOCKAGE-001 | Risk | blocked | Physical plugging/blockage prediction | No validated physical/empirical solver is implemented; exact physical blockage location must not be claimed |
| PUMPABILITY-SCORE-001 | Assessment | blocked | 0–100 TOLUE Pumpability Score | Weighting/gates cannot be finalized before upstream model validation |

## Current executable-registry synchronization
The following IDs are currently enforced by `modelRegistry.ts` and consumed by Readiness:
- `PRESSURE-STRAIGHT-TWOFLUID-BINGHAM-001`
- `PRESSURE-LOCAL-CAL-001`
- `PUMP-OPERATING-ENVELOPE-001`
- `BLOCKAGE-001`

The runtime must fail closed for unknown model IDs. A hard-coded readiness exception must not silently bypass registry lifecycle state.

## Mandatory model metadata
Each implemented model definition should carry or link to:
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
The application must fail closed for unsupported model/type combinations. It may permit a preliminary/experimental run only when the registry permits execution, the user is explicitly informed, and the report preserves the same non-production status.
