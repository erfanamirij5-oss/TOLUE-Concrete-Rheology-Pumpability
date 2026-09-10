# TOLUE Rheology License Manager

Owner-only offline Windows desktop issuer for `tolue-concrete-rheology-pumpability` licenses.

## Security contract

- The production private key is selected at runtime and is never packaged, copied, persisted, logged, or committed.
- The selected Ed25519 private key must derive the approved production public-key fingerprint.
- Privileged file and crypto operations remain in Electron Main; the sandboxed renderer receives a narrow IPC bridge.
- Output is the strict current `tolue-license-v1` envelope. No additional fields are added because the customer runtime rejects unknown fields.
- Existing output files are never overwritten.
- Every generated signature and saved document is verified before success is reported.

## Owner workflow

1. Launch the installed License Manager.
2. Choose `tolue-prod-2026-03-private.pem` from its offline owner-controlled location.
3. Enter the customer machine code, a unique license ID, and the validity window.
4. Create and save the `.tolue-license.json` file.
5. Deliver only the generated license document to the customer.

Never distribute the private key or the License Manager together with the private key.
