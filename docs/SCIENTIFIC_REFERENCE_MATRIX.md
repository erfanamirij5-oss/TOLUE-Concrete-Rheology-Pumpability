# TOLUE Scientific Reference Matrix

Status: Stage 0.2 — controlled scientific baseline

## Purpose
This matrix is the scientific gate between product requirements and engineering implementation. No engineering output may be promoted to production unless its provenance, applicability, assumptions, limitations, and verification path are recorded here or in a linked model specification.

## Evidence classes
- **SR — Standard Requirement:** direct requirement/test/procedure from a controlled standard or code.
- **PM — Physics/Engineering Model:** equation-based model with declared assumptions and validity domain.
- **EC — Experimental/Empirical Correlation:** correlation requiring source, calibration domain and uncertainty.
- **TI — TOLUE Engineering Index:** transparent proprietary index; never presented as a standard requirement or physical law.
- **AI — AI Prediction:** model/dataset/version/confidence required; never overrides validated deterministic engineering calculations.

## Core controlled references
| ID | Reference | Role in TOLUE | Governance |
|---|---|---|---|
| ACI-211.9-18 | ACI PRC-211.9-18, Guide to Selecting Proportions for Pumpable Concrete | Pumpable mixture proportioning, aggregate/grading and constituent guidance | SR/guidance; edition locked per simulation run |
| ACI-304.2-17 | ACI PRC-304.2-17, Guide to Placing Concrete by Pumping Methods | Pumping practice, equipment/pipeline context, pumpable concrete and field considerations | SR/guidance; edition locked per run |
| ACI-238.1-26 | ACI PRC-238.1-26, Measurements of Workability and Rheology of Fresh Concrete—Report | Workability/rheology definitions, measurement landscape, field-performance interpretation | Scientific guidance; model applicability support |
| ASTM-C1749-25 | ASTM C1749-25 | Yield stress, plastic viscosity and apparent viscosity of hydraulic cementitious paste using rotational rheometry/Bingham framework | Test/procedure provenance mandatory |
| ISO-21573-1-2024 | ISO 21573-1:2024 | Concrete pump commercial specification framework | Pump library metadata/reference |
| ISO-21573-2-2020 | ISO 21573-2:2020 | Examination of technical parameters for concrete pumps | Pump technical-parameter validation/reference |

## Engine-level matrix
| Engine | Required primary inputs | Primary outputs | Evidence class | Production gate |
|---|---|---|---|---|
| Concrete Type Router | concrete type, application, fresh-state regime | applicable tests/models/standards, required inputs | SR + controlled TOLUE routing | No unsupported universal model |
| Mix Composition | constituent masses, densities/SG, air, moisture/absorption where applicable | absolute volumes, w/cm or w/b, paste/mortar/aggregate fractions, closure | PM + SR | Mass/volume closure and units verified |
| Aggregate PSD | source PSDs, blend fractions, NMSA/Dmax | combined PSD, grading metrics, continuity/gap flags | SR + PM/TI where declared | No standard-envelope claim without exact controlled reference |
| Fresh Concrete | slump/slump flow, temperature, density, air, SCC tests where applicable | measured fresh-state profile | SR | Test method, edition, time and conditions stored |
| Rheology | measured rheometer data or explicitly qualified inferred inputs | yield stress, plastic viscosity, apparent viscosity/model parameters | SR/PM/EC | Measured vs inferred must never be conflated; procedure metadata required |
| Lubrication/Interface | bulk mix/rheology, pipe/interface data, calibrated parameters | interface/lubrication parameters | PM/EC | No invented layer thickness or interface property |
| Pipeline Geometry | segment types, lengths, diameters, elevations, fittings, material/roughness where used | validated hydraulic route graph | PM | Geometry continuity + unit validation |
| Pump | pump type/model, capacity/pressure data, operating constraints | available operating envelope | SR/manufacturer data | Source and pump-data revision required |
| Pressure/Hydraulic | rheology/interface model, flow scenario, route, elevation | segment pressure losses, hydrostatic contribution, pressure profile, required pressure | PM/EC | Equation/model, parameters and validity domain recorded |
| Blocking/Plugging | PSD/Dmax, geometry, rheology/stability indicators, fittings | risk findings and critical locations | PM/EC/TI | Must state whether physical, empirical or index-based |
| Stability | fresh-state/stability tests, composition, flow scenario | segregation/bleeding/pumping stability findings | SR/EC/TI | No categorical claim outside validated domain |
| Pumpability Assessment | all validated upstream results | pumpability status, margins, limitations | PM/EC/TI | Explainable decomposition required |
| 3D Engineering View | immutable simulation result objects | spatial visualization of computed values | visualization only | Every displayed engineering color/value maps to a result object |
| Compare Engine | same scenario + multiple mix revisions | ranked/delta comparison | deterministic aggregation/TI | Identical scenario basis required |
| Diagnostics | result graph + rule/model registry | causal findings | SR/PM/EC/TI | Finding must cite triggering variables and rule/model |
| Optimization | validated baseline + bounded decision variables | candidate engineering changes | PM/EC/TI/AI | Constraints preserved; AI suggestions explicitly labeled |

## Concrete-type routing baseline
| Concrete type | Mandatory routing concerns | Initial reference family |
|---|---|---|
| Normal/Pumpable | proportioning, grading, fresh consistency, pipeline/pump compatibility | ACI 211.9, ACI 304.2, applicable ASTM fresh tests |
| SCC | slump-flow/workability, passing ability, segregation resistance, rheology, pumping effects | ACI 238.1 + applicable ASTM/ISO SCC tests; SCC-specific model specs required |
| HPC | rheology, viscosity, low w/cm, SCM/admixture sensitivity, pressure demand | ACI 238.1 + validated pumpability literature/models |
| UHPC | very high fines/binder, fibers, rheology, special validity limits | UHPC-specific references + validated models; no automatic normal-concrete equations |
| Lightweight | aggregate moisture/saturation, density, pressure-related water exchange and pumpability | ACI 304.2 + lightweight-specific references |
| Heavyweight | density/elevation pressure contribution, aggregate characteristics, equipment limits | heavyweight-specific references + pump model limits |
| Fiber-reinforced | fiber type/dosage/geometry, rheology, blockage/passing effects | fiber-specific test/model references required |
| Mass/SCM-rich | binder/SCM effects on fresh rheology and pumping; thermal behavior is outside pumpability scope unless separately modeled | mixture/rheology references + explicit scope boundaries |

## Rheology provenance contract
Every rheological value shall carry:
- `provenance`: measured | inferred | calibrated | assumed
- `testMethod`
- `standardEdition`
- `instrument`
- `geometry`
- `protocol`
- `temperature`
- `elapsedTimeSinceMixing`
- `model`: e.g. Bingham only where applicable
- `fitQuality`
- `units`
- `uncertaintyOrConfidence`
- `validityNotes`

A value without sufficient provenance may be stored, but it cannot silently enter a high-confidence simulation.

## Simulation result contract
Every production engineering result shall expose at minimum:
- value and unit
- result classification (SR/PM/EC/TI/AI)
- method/model ID and version
- source/reference IDs
- input snapshot hash
- assumptions
- applicability/validity status
- limitations
- warnings
- uncertainty/confidence where applicable
- verification case IDs
- engine version and simulation run ID

## Readiness gates
1. **Data completeness gate** — required inputs present and dimensionally valid.
2. **Standard applicability gate** — selected standard/test applies to the concrete type and measurement.
3. **Model applicability gate** — input state lies within declared model/calibration domain.
4. **Traceability gate** — result can be traced to inputs + method + version + reference.
5. **Verification gate** — production model has numerical verification/regression cases.
6. **Visualization integrity gate** — 3D view cannot display synthetic engineering values.

## Current research decisions
- Slump alone is not accepted as a complete rheological description.
- A single universal pumpability equation is prohibited.
- Bulk rheology, interface/lubrication behavior, pipeline geometry, elevation, flow scenario and pump capability are separate model domains that must be coupled explicitly.
- Lubrication-layer properties are not visualization parameters; they require measurement, calibration or a cited model.
- A 3D animation is not called CFD/DEM unless an actual validated numerical solver is implemented and verified.
- Historical simulation runs retain their standards/model versions and are never silently reinterpreted after an update.

## Stage 0.3 research backlog
Before pressure/pumpability code is production-enabled, create controlled model specifications for:
1. Bingham and any alternative rheology models and selection criteria.
2. Pipe/interface rheometry and lubrication-layer representation.
3. Straight-pipe pressure-loss formulation(s).
4. Elevation/hydrostatic term.
5. Elbow/reducer/hose/local-loss treatment.
6. Pump operating-envelope representation.
7. Dmax/pipe-diameter and blockage-risk models.
8. SCC, HPC, UHPC, lightweight and fiber-specific applicability.
9. Calibration dataset schema and uncertainty treatment.
10. Numerical verification cases using published/laboratory/field datasets.

## Rule for implementation
A model may exist experimentally behind a feature flag before full verification, but the UI/report must identify it as experimental. Only models with completed specification, provenance, applicability checks and verification cases may produce production-grade engineering conclusions.
