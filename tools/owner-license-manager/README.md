# TOLUE Rheology License Manager

Owner-only offline Windows desktop issuer for `tolue-concrete-rheology-pumpability` licenses.

## Security contract

- The production private key is selected at runtime and is never packaged, copied, persisted, logged, or committed.
- The selected Ed25519 private key must derive the approved `tolue-prod-2026-03` production public-key fingerprint.
- Privileged file and crypto operations remain in Electron Main; the sandboxed renderer receives a narrow IPC bridge.
- Output is the strict current `tolue-license-v2` envelope. It carries only the production key ID and public key derived from the selected private key; the private key is never embedded.
- The customer runtime pins the approved production public-key SHA-256 fingerprint before accepting the embedded public key, then verifies the Ed25519 signature, machine binding, and validity window.
- Existing legacy `tolue-license-v1` verification remains available only for backward compatibility and CI smoke coverage.
- Existing output files are never overwritten.
- Every generated signature and saved document is verified before success is reported.

## Owner workflow

1. Launch TOLUE Rheology License Manager 1.0.3 or newer.
2. Choose `tolue-prod-2026-03-private.pem` from its offline owner-controlled location.
3. Enter the customer machine code, a unique license ID, and the validity window.
4. Create and save the new `.tolue-license.json` file.
5. Deliver only the generated license document to the customer.
6. In the paired TOLUE Rheology build, import that generated file from the activation screen.

Do not reuse an older v1 license when validating the v2 production pairing. Never distribute the private key or the License Manager together with the private key.
