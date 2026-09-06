# Stage 0.5 — Independent Reference Calculation & Solver Specification

## Purpose
Freeze the first executable mathematical target for TOLUE before implementation. This document is a verification contract, not a claim that every pumping geometry is already production-valid.

## Scientific baseline
The first straight-pipe engine uses a coaxial two-fluid viscoplastic formulation: bulk concrete plus a lubrication-layer (LL) fluid. The production candidate family is the Khatib–Khayat Bingham analytical model, with Kaplan/tribometer formulation retained as an independent comparison path where compatible measured tribological inputs exist. Nonlinear Herschel–Bulkley / modified-Bingham extensions are Stage-2 model families, not silent substitutes.

## Variables — SI only
- Q: volumetric flow rate [m3/s]
- G = ΔP/L: frictional pressure gradient [Pa/m]
- R: internal pipe radius [m]
- ell: lubrication-layer thickness [m]
- Rc = R - ell: bulk-concrete radius [m]
- tau0C: bulk concrete yield stress [Pa]
- muC: bulk concrete plastic viscosity [Pa.s]
- tau0LL: LL yield stress [Pa]
- muLL: LL plastic viscosity [Pa.s]
- rho: fresh concrete density [kg/m3]
- dz: elevation change [m]
- g = 9.80665 m/s2

All UI units must be converted at the domain boundary. No engineering solver accepts mm, m3/h, bar, MPa or mixed units internally.

## Governing constitutive law
For a Bingham material:

- if |tau| <= tau0: shear rate = 0
- if |tau| > tau0: gamma_dot = (|tau| - tau0) / mu_p, with direction opposing the stress gradient

For steady fully-developed axisymmetric pressure-driven flow in a circular pipe:

    tau(r) = G r / 2

The yield radius for a Bingham phase is therefore:

    ry = 2 tau0 / G

The solver must determine the physically admissible flow-zone topology rather than assuming plug flow globally.

## Two-fluid geometry
The LL occupies Rc <= r <= R. Bulk concrete occupies 0 <= r < Rc. At the interface:
- velocity is continuous;
- shear traction is continuous under the ideal coaxial model;
- no slip is imposed at r = R for the Khatib–Khayat baseline;
- both phases are incompressible and steady;
- pipe is straight and circular;
- temperature/time-dependent rheology is excluded from this baseline unless supplied through a separately versioned model.

## Forward problem
Given G and all rheological/geometric inputs:
1. validate inputs and model applicability;
2. compute wall/interface stresses;
3. classify yielded/unyielded regions;
4. integrate phase shear-rate fields radially;
5. enforce wall and interface velocity conditions;
6. integrate velocity over cross-sectional area;
7. return Qcalc(G), velocity profile, shear-rate profile, plug/yield radii and diagnostic metadata.

Numerical radial integration is permitted for the first implementation even when a closed form exists, provided it is independently checked against closed-form limiting cases. This reduces transcription risk and gives a common solver path for later nonlinear rheology.

## Inverse problem — production API
The normal project input is target Q. Therefore solve:

    f(G) = Qcalc(G) - Qtarget = 0

Use a deterministic bracketed root solver (Brent or bisection fallback). Newton-only solving is prohibited because regime boundaries can make derivatives unsuitable and failure modes opaque.

Required convergence contract:
- positive G only;
- establish a sign-changing bracket or return `NO_PHYSICAL_BRACKET`;
- relative Q residual target <= 1e-7 for numerical verification cases;
- maximum iterations is explicit/versioned;
- convergence metadata is persisted;
- no unconverged value may be reported as an engineering result.

## Pressure accounting
Straight-pipe friction:

    ΔP_friction = G L

Elevation is a separate term:

    ΔP_elevation = rho g dz

Total segment pressure requirement for the currently supported straight/elevation segment:

    ΔP_segment = ΔP_friction + ΔP_elevation

Local fitting losses are NOT included until their concrete-specific models pass separate evidence and verification gates.

## Independent limiting reference — Newtonian pipe flow
A non-negotiable Golden Case sets tau0C = tau0LL = 0 and identical viscosity mu in both phases. The two-fluid formulation must collapse to Hagen–Poiseuille flow:

    Q = π R^4 ΔP / (8 mu L)

or

    G = 8 mu Q / (π R^4)

This case verifies units, radial integration, pressure-gradient convention and inverse root solving without relying on a concrete-pumping publication implementation.

## Independent limiting reference — single Bingham phase
When LL properties equal bulk properties, the two-fluid solver must collapse numerically to a single Bingham material. For G R / 2 > tau0, define:

    B = 2 tau0 / (G R)

The Buckingham–Reiner laminar pipe relation is used as an independent reference:

    Q = (π R^4 G / (8 mu)) * [1 - (4/3)B + (1/3)B^4]

For B >= 1, the imposed gradient does not yield the material and Q = 0 in the ideal model.

This reference is especially important because it checks the plug region without depending on LL implementation details.

## Kaplan / tribometer comparison path
Where interface/LL tribological parameters are measured with a compatible tribometer method, Kaplan-family equations may be evaluated as a separate named model. Results must never be blended silently with Khatib–Khayat outputs. The software stores instrument/method/procedure provenance.

## LL thickness governance
LL thickness is an engineering input or calibrated parameter in the baseline Khatib–Khayat solver. Literature observations such as 2–5 mm are evidence ranges from specific experiments, not universal defaults. If ell is inferred, the inference model and uncertainty must be explicit and separately versioned.

## Required result object
Every solver run returns:
- modelId / modelVersion
- Qtarget, Qcalc, residual
- pressureGradient
- frictionPressure
- elevationPressure
- totalPressure
- wallShearStress
- interfaceShearStress
- yield/plug radii and flow-zone classification
- optional sampled velocity/shear-rate profiles
- iterationCount / convergenceStatus
- input provenance summary
- assumptions / limitations
- validationStatus

## Stage 0.5 Golden acceptance tests
1. Newtonian collapse against Hagen–Poiseuille.
2. Single-Bingham collapse against Buckingham–Reiner.
3. Zero-flow / sub-yield rejection behavior.
4. Monotonic Q increase with G for valid fixed inputs.
5. Pressure scales linearly with straight-pipe length at fixed G.
6. Elevation contribution equals rho*g*dz independently of friction.
7. Identical phase properties are insensitive to arbitrary ell within numerical tolerance.
8. Unit-conversion round trips do not change physical results.
9. Root solver reproduces forward-generated Q from known G.
10. Invalid ell >= R is blocked.
11. Non-positive viscosity is blocked.
12. Missing provenance on measured rheology triggers readiness warning/block according to project mode.

## Production boundary
Passing these cases validates implementation consistency for the defined mathematical model. It does NOT by itself establish field accuracy for arbitrary concrete, pump, elbow, reducer, hose, boom, transient behavior, segregation or blockage. Field validation remains a separate gate.
