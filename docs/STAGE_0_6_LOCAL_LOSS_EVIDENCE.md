# Stage 0.6 — Concrete Pipeline Local-Loss Evidence Gate

## Purpose
This document defines the evidence gate for non-straight concrete-pumping pipeline segments before any pressure-loss equation is admitted to the TOLUE engineering core.

TOLUE must **not** substitute generic Newtonian-fluid minor-loss coefficients (`K v²/2g`) for fresh-concrete pumping unless a concrete-specific derivation and validated applicability domain are documented.

## Current production decision

| Segment kind | Current status | Engineering decision |
|---|---|---|
| `elbow` | candidate_for_research | Concrete-specific full-scale evidence exists. Equation implementation remains blocked until the exact published model, variables, calibration domain, and verification cases are captured from the primary source. |
| `reducer` | blocked | No production equation selected. |
| `hose` | blocked | No production equation selected. Flexible hose deformation, wall interaction, and geometry make direct reuse of rigid-pipe models unsafe without evidence. |
| `valve` | blocked | No production equation selected. Generic water-system valve coefficients are not accepted. |
| `boom` | blocked_as_composite | A boom is not a single hydraulic element; it must be represented as an ordered assembly of straight sections, bends, hoses, reducers, and elevation changes. Unknown constituent losses remain fail-closed. |
| `other` | blocked | Requires an explicitly identified component model. |

## Evidence reviewed

### E-LOCAL-001 — Park et al., 2020
**Title:** Analysis on Pressure Losses in Pipe Bends Based on Real-Scale Concrete Pumping Tests  
**Publication:** ACI Materials Journal, 117(3), 205–216  
**DOI:** 10.14359/51724616

Evidence value:
- Concrete-specific study.
- Real-scale pumping tests.
- Focuses directly on additional pressure loss in pipe bends.
- Uses rheological properties in the pressure-loss analysis.

TOLUE decision:
- This is sufficient to justify an **elbow-specific research model family**.
- It is **not yet sufficient for implementation from abstract-level evidence alone**.
- Exact equations, variable definitions, bend geometry parameters, calibration ranges, mixture/rheology domain, and validation error metrics must be transcribed from the primary paper before code is written.

### E-LOCAL-002 — Applied Sciences, 2024
**Title:** The One-Dimensional Flow Pressure Loss Correction Model Based on the Particle Flow through Concrete Bend  
**Journal:** Applied Sciences 14(19), 8824  
**DOI:** 10.3390/app14198824

Evidence value:
- Concrete-specific bend correction model.
- Explicitly studies elbow geometry and pumping flow rate.
- Useful as a second model family / comparison source.

TOLUE decision:
- Candidate for research comparison only.
- Must not be treated as a universal bend equation.
- Production use requires independent verification against published/full-scale datasets and explicit applicability limits.

### E-LOCAL-003 — Kwon et al., 2013
**Title:** Lubrication layer properties during concrete pumping  
**Journal:** Cement and Concrete Research 45, 69–78  
**DOI:** 10.1016/j.cemconres.2012.11.001

Evidence value:
- Establishes the dominant role of the lubrication layer in concrete pumping.
- Supports TOLUE's decision not to infer non-straight losses from generic single-phase Newtonian-fluid coefficients.

### E-LOCAL-004 — Zhaidarbek et al., 2023
**Title:** Analytical predictions of concrete pumping: Extending the Khatib–Khayat model to Herschel–Bulkley and modified Bingham fluids  
**Journal:** Cement and Concrete Research 163, 107035  
**DOI:** 10.1016/j.cemconres.2022.107035

Evidence value:
- Provides a rigorous two-fluid coaxial-flow basis for straight-pipe pressure-flow behavior with a lubrication layer.
- Does not by itself authorize local-loss equations for elbows, reducers, valves, or hoses.

## Admission criteria for any local-loss model
A model cannot move from `blocked` / `research` to `implemented` until all of the following are present:

1. **Concrete-specific primary source** — not merely a generic fluid-mechanics handbook coefficient.
2. **Explicit equation set** — all equations captured exactly, with symbols and units.
3. **Input contract** — every required geometric, rheological, flow, pressure, and material input identified.
4. **Applicability domain** — pipe diameter/radius, bend radius/angle or reducer geometry, flow-rate range, rheology range, concrete type, and pumping regime where available.
5. **Assumptions** — steady/transient, incompressible/compressible, LL treatment, slip assumptions, pressure dependence, temperature effects, etc.
6. **Calibration provenance** — identify which terms are derived and which are fitted.
7. **Verification vectors** — at least one reproduction of a published case and independent limiting/consistency tests.
8. **No silent extrapolation** — out-of-domain inputs must return `out_of_domain`, `insufficient_data`, or remain blocked.
9. **No double counting** — local contribution must not duplicate straight-pipe friction already computed by the base hydraulic model.
10. **Result semantics** — output must identify method ID/version, model class, validation status, evidence status, references, assumptions, limitations, and source run.

## Elbow model implementation plan

### Phase A — equation capture
Capture the full Park et al. 2020 bend model from the primary paper:
- definition of bend pressure loss;
- baseline straight-pipe subtraction/normalization, if used;
- bend radius and angle terms;
- flow-rate dependence;
- rheological parameters;
- any fitted coefficients;
- dimensional consistency;
- calibration and validation datasets.

### Phase B — model contract
Create a dedicated model contract, for example:

`PRESSURE-ELBOW-001`

Required metadata:
- classification: `EMPIRICAL_MODEL` or `PHYSICAL_MODEL` only after equation audit;
- references: `E-LOCAL-001` (+ comparison source if used);
- validity domain;
- uncertainty / residual error where published;
- implementation path;
- verification cases.

### Phase C — code
Only after A and B are complete:
- add explicit elbow geometry fields to the segment type;
- implement the isolated elbow function;
- add golden tests reproducing published cases;
- integrate it into `pipeline.ts`;
- preserve fail-closed behavior for every other unsupported segment.

## Explicitly prohibited shortcuts
- Arbitrary `K` factor for elbows/reducers/valves.
- Equivalent-length constants with no concrete-specific source and domain.
- Reusing water, air, oil, or Newtonian-slurry fitting coefficients as if valid for fresh concrete.
- Assuming boom pressure loss from boom length alone.
- Assuming unsupported losses are zero.
- Hiding empirical calibration constants as physical constants.

## Stage 0.6 gate decision
**ELBOW:** research candidate; equation capture required before implementation.  
**REDUCER / HOSE / VALVE / BOOM / OTHER:** remain blocked.  
**Pipeline solver behavior:** unchanged; unsupported local losses remain `null` / `not_computed`, and total required pressure remains incomplete.
