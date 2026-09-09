# TOLUE Pumpability — Golden Verification Plan

## Objective
Define verification evidence before production solver code exists. Test fixtures must be independently sourced and auditable.

## Verification tiers

### Tier A — mathematical identity / limiting cases
Used to detect implementation and unit errors without relying on field calibration.
- Newtonian limit where applicable
- hydrostatic head ρgΔz
- geometric identities
- unit conversion invariance
- deterministic reproducibility

### Tier B — published analytical examples / reconstructed literature cases
Reconstruct cases from peer-reviewed pumping literature when sufficient inputs are published. Expected outputs must be independently calculated and documented with source, equation set, units and tolerances.

Priority evidence families:
- Khatib–Khayat 2021 two-fluid Bingham validation
- Feys–Khayat–Perez-Schell–Khatib 2015 full-scale highly-workable/SCC pumping study
- Kwon et al. 2013 Part II long-pipeline full-scale verification

### Tier C — TOLUE controlled laboratory/field calibration
Future commercial validation dataset should store:
- mix revision and complete material provenance
- fresh tests and timestamps
- rheometer instrument/procedure/raw data
- tribometer instrument/procedure/raw data
- pipeline geometry and internal diameter
- pump model and operating state
- pressure sensor IDs/locations/calibration
- measured Q/time series
- concrete temperature/air/workability before and after pumping
- uncertainty and data-quality flags

## Acceptance principles
- Never tune production coefficients against the same cases used as final independent verification.
- Report absolute and relative errors where meaningful.
- Define tolerances per model based on numerical precision plus experimental/model evidence; do not invent a universal ±5% threshold.
- Preserve failed cases; do not remove inconvenient validation data without documented exclusion rationale.
- Every fixture has a permanent case ID and source hash/version.

## Initial case IDs
- TOLUE-PUMP-G01 Newtonian-limit
- TOLUE-PUMP-G02 Bingham-plug
- TOLUE-PUMP-G03 Bingham-sheared-bulk
- TOLUE-PUMP-G04 Flow-rate-sensitivity
- TOLUE-PUMP-G05 Diameter-sensitivity
- TOLUE-PUMP-G06 LL-property-sensitivity
- TOLUE-PUMP-G07 Vertical-head
- TOLUE-PUMP-G08 Unit-invariance
- TOLUE-PUMP-G09 Invalid-geometry
- TOLUE-PUMP-G10 Missing-LL
- TOLUE-PUMP-G11 Out-of-domain
- TOLUE-PUMP-G12 Reproducibility

## Release gate
The first pressure solver cannot be marked production-ready until Tier A is complete and at least one relevant peer-reviewed/full-scale Tier B family has been reconstructed with adequate input provenance. Tier C becomes the basis for TOLUE-specific calibration claims and expanded concrete-type applicability.