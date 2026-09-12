# TOLUE Commercial Engineering Readiness Audit

Status: controlled pre-production audit
Branch: `upgrade/ux-ui-3d-functional-recovery`
Product version constraint: **keep `1.1.0-rc.3` unchanged during recovery**

## Decision

TOLUE is a real engineering-software platform with a deterministic numerical core, traceable run persistence, pump capability assessment, spatial pipeline authoring, diagnostics, reporting, licensing, and automated packaging/regression gates.

It is **not yet approved as an unqualified commercial engineering decision tool** for arbitrary concrete pumping projects. The present scientific state is `Advanced Engineering Beta / Pre-Production Engineering Platform`.

The principal gap is not software architecture. It is scientific validation, model-governance closure, field calibration, and completion of the project/material/evidence workflow.

## Non-negotiable commercial rule

A green software CI result proves that the implemented software satisfies its automated contracts. It does **not** establish field accuracy of a concrete-pumping model.

No result may be represented as production-qualified unless its model lifecycle, applicability, provenance, verification, and validation gates are closed.

## P0 — required before commercial engineering release

### P0-01 — Straight-pipe model governance synchronization

Current issue:
- the executable straight-pipe path uses `tolue-two-fluid-bingham-coaxial-v1`;
- the controlled model registry still classifies the straight-pipe production model as blocked/research-stage;
- therefore a run must not be labelled fully READY solely because input provenance is complete.

Required action:
1. Until full-scale validation is accepted, any run using the current straight-pipe two-fluid solver is classified at most `PRELIMINARY`.
2. UI/report must preserve that qualification.
3. Promotion to production requires registry synchronization and documented evidence.

Acceptance:
- readiness gate emits a model-validation warning for straight-pipe runs;
- execution remains possible for engineering evaluation;
- unqualified `READY` is impossible while the model is not production-enabled.

### P0-02 — Independent published full-scale verification

Reconstruct at least one sufficiently documented peer-reviewed/full-scale pumping dataset independently of the production solver implementation.

Priority families:
- Khatib & Khayat (2021)
- Feys et al. (2015)
- Kwon et al. (2013)

For each accepted case store:
- publication/reference ID;
- all source inputs and units;
- assumptions required to reconstruct missing quantities;
- measured pressure/pressure gradient and Q;
- TOLUE predicted pressure/pressure gradient;
- absolute error;
- relative error where meaningful;
- exclusion rationale, if excluded;
- permanent case ID and source hash/version.

Acceptance:
- at least one Tier-B family is reproducible with auditable inputs;
- expected results are independently calculated/reconstructed, not copied from TOLUE output;
- tolerance is evidence-based rather than an arbitrary universal percentage.

### P0-03 — TOLUE field-validation dataset

Create a controlled schema and collect real pumping cases containing, where available:
- full mix revision and material provenance;
- fresh-state test results and timestamps;
- rheometer raw/processed data and procedure metadata;
- lubrication/tribology measurement or calibration basis;
- pipeline geometry, IDs, elevations, fittings and hose/boom details;
- pump make/model and operating state;
- pressure sensor identity, location and calibration;
- measured flow/time series;
- concrete temperature/air/workability before and after pumping;
- uncertainty/data-quality flags.

Minimum commercial metrics:
- bias;
- MAE;
- RMSE;
- error versus flow rate;
- error versus pipe diameter/route class;
- error versus rheology range;
- accepted applicability envelope.

Acceptance:
- field accuracy is quantified for a declared domain;
- failed cases remain in the validation record unless a documented exclusion rule applies;
- calibration cases are separated from final verification cases.

### P0-04 — Lubrication-layer qualification

The current solver materially depends on LL thickness and LL rheology. These values must not be silent guesses.

Supported commercial modes shall be explicit:
- `MEASURED_TRIBOLOGY`
- `PROJECT_CALIBRATED`
- `VALIDATED_PREDICTION`
- `UNAVAILABLE`

Acceptance:
- provenance mode is stored in the run;
- unavailable LL data prevents production-qualified pressure prediction;
- assumed LL values force `PRELIMINARY` status;
- no universal LL thickness or LL rheology default is introduced.

### P0-05 — Blockage/stability claim boundary

Current blockage/stability decisions are project-qualified evidence decisions, not universal physical blockage predictions.

Acceptance:
- 3D plug indication is explicitly diagnostic/illustrative unless a validated spatial blockage model exists;
- no exact blockage location is claimed without a model that computes it;
- no CFD/DEM terminology is used unless a validated CFD/DEM solver is actually implemented;
- report wording distinguishes `project-qualified evidence` from `physical prediction`.

### P0-06 — Pump operating-envelope integrity

Commercial pump selection must use manufacturer/revision-controlled Q-P capability data rather than a single nominal maximum pressure.

Acceptance:
- pump make/model/revision/provenance are persistent;
- target flow outside capability curve is blocked from extrapolation;
- available pressure at target Q is computed only inside documented curve domain;
- result states that positive pressure margin is not a reliability/safety-factor certification.

### P0-07 — Model Registry as executable governance

Model lifecycle:
`research -> specified -> implemented -> numerically_verified -> calibrated -> production`

Acceptance:
- every engineering model used in a production-qualified result has a registry record;
- registry status and runtime readiness cannot contradict each other;
- blocked/research models cannot silently produce production-qualified conclusions;
- each production model has references, equations, required inputs, validity domain, verification cases, known limitations and review metadata.

## P1 — required for a complete commercial workflow

### P1-01 — Real Project entity
Persist:
`Project -> Mix Revision -> Pipeline Scenario -> Pump Scenario -> Simulation Runs`.

Project metadata must no longer be presentation-only.

### P1-02 — Material Intelligence
Persist real cement, water, aggregate, SCM, admixture, fiber and other-addition records with supplier/source/standard/density/SG/absorption/moisture where applicable.

### P1-03 — Mix composition and aggregate PSD
Implement traceable composition, combined PSD and engineering descriptors needed by future pumpability/blockage models. No grading claim without exact reference/version.

### P1-04 — Rheology provenance and model fitting
Store instrument, geometry, protocol, temperature, elapsed time, constitutive family, fit quality, units and uncertainty. Add advanced rheology families only after separate model specification and verification.

### P1-05 — Evidence authoring workflow
The application must allow controlled creation/import of stability and blockage evidence with provenance, qualified flow range, method ID and applicability statement. Current display-only evidence UI is insufficient.

### P1-06 — Pump library
Add persistent manufacturer-controlled pump definitions and capability-curve revisions.

### P1-07 — Engineering uncertainty
Separate and expose:
- measurement uncertainty;
- calibration/model error;
- numerical error;
- scenario/assumption uncertainty.

## P2 — commercial maturity / scale

- multi-project search and archive;
- comparison and optimization workflows with explicit constraints;
- organization/company profiles;
- standards/profile version management;
- controlled calibration dataset import/export;
- signed engineering report release workflow;
- optional online license/customer administration without weakening offline trust boundaries;
- telemetry only if explicitly opted in and non-sensitive.

## Current component assessment

| Domain | Current state | Commercial interpretation |
|---|---|---|
| Desktop architecture | strong | production-capable foundation |
| Licensing | strong | usable, keep trust root unchanged during recovery |
| Persistence/traceability | strong | suitable foundation for engineering audit trail |
| Straight-pipe solver | real numerical implementation | preliminary until Tier-B/field validation and registry promotion |
| Elevation pressure | deterministic physical relation | production-capable with valid density/elevation provenance |
| Local losses | fail-closed or project-calibrated | correct governance pattern; generic universal loss remains blocked |
| Pump capability | real curve-domain assessment | usable with manufacturer/revision provenance |
| Blockage/stability | project-evidence based | not universal prediction |
| Materials | mostly display-level | incomplete |
| Project metadata | presentation-level | incomplete |
| 3D | engineering visualization | not CFD/DEM |
| CI/package | strong software QA | not evidence of field accuracy |

## Release terminology

Until all P0 gates are accepted, use:

**Advanced Engineering Beta / Pre-Production Engineering Platform**

Do not use:
- certified pumping simulator;
- validated universal pumpability predictor;
- CFD/DEM simulator;
- guaranteed blockage-location predictor.

## Commercial release sign-off criteria

Commercial engineering sign-off requires all of the following:
1. all P0 gates accepted;
2. model registry and runtime governance synchronized;
3. published/full-scale verification evidence auditable;
4. TOLUE field validation establishes a declared applicability domain;
5. reports expose assumptions, limitations, provenance and validation state;
6. complete install/licensing/restart/persistence gates pass;
7. manual engineering acceptance is completed on representative real projects.

This document is a release-control artifact. UI polish, green CI, or successful packaging alone cannot waive these criteria.
