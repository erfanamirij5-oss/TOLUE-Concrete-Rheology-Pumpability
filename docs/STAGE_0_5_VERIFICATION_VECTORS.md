# Stage 0.5 — Independent Numerical Verification Vectors

These vectors are frozen before implementation. Values are derived from independent limiting equations, not from the future TOLUE solver.

## V-001 Newtonian / Hagen–Poiseuille
Inputs:
- R = 0.0625 m (125 mm ID)
- L = 100 m
- mu = 1.0 Pa.s
- tau0 = 0 Pa
- Q = 0.010 m3/s = 36 m3/h

Reference:
G = 8 mu Q / (pi R^4)

Expected approximately:
- G = 1668.861 Pa/m
- ΔP_friction = 166886.1 Pa = 0.166886 MPa

Acceptance: relative error <= 1e-6 against the reference equation.

## V-002 Newtonian radius sensitivity
Same as V-001 except ID = 100 mm (R=0.05 m).
Expected approximately:
- G = 4074.367 Pa/m
- ΔP_friction over 100 m = 0.407437 MPa

The ratio G_100mm / G_125mm must equal (0.0625/0.05)^4 = 2.44140625 within tolerance.

## V-003 Elevation isolation
Inputs:
- rho = 2400 kg/m3
- dz = +50 m
- g = 9.80665 m/s2

Expected:
- ΔP_elevation = 1,176,798 Pa = 1.176798 MPa

This value is independent of pipe friction in the baseline accounting contract.

## V-004 Single Bingham forward case
Inputs:
- R = 0.0625 m
- G = 5000 Pa/m
- tau0 = 50 Pa
- mu = 20 Pa.s

Compute:
- wall stress = G R / 2 = 156.25 Pa
- B = 2 tau0/(G R) = 0.32
- bracket factor = 1 - 4B/3 + B^4/3

Reference Q:
Q = (pi R^4 G/(8 mu)) * bracket factor

Expected approximately:
- factor = 0.5768285867
- Q = 0.0008642 m3/s (about 3.111 m3/h; implementation test should use the equation-evaluated high-precision fixture rather than this rounded display value)

## V-005 Single Bingham sub-yield
Inputs:
- R = 0.0625 m
- G = 1000 Pa/m
- tau0 = 50 Pa
- mu = 20 Pa.s

wall stress = 31.25 Pa < tau0.
Expected ideal-model Q = 0.

## V-006 Inverse round-trip
Generate Qref from V-004 using the independent Buckingham–Reiner expression, then ask the inverse TOLUE solver for G.
Expected G = 5000 Pa/m within relative tolerance <= 1e-7 after solver convergence.

## V-007 Identical two-phase collapse
Use any valid 0 < ell < R, but set tau0LL=tau0C and muLL=muC. For the same G, two-fluid numerical integration must reproduce the single-fluid Buckingham–Reiner result within the numerical-integration tolerance. Repeat for ell/R = 0.02, 0.05 and 0.10.

## V-008 Invalid geometry
ell = R or ell > R must return validation error before solving.

## Precision rule
Rounded values in this Markdown file are human-readable checks. Automated tests must compute high-precision expected values directly from the independent reference formulas encoded in a dedicated test-fixture module, with comments identifying the reference equation. Do not copy values from the production solver into fixtures.
