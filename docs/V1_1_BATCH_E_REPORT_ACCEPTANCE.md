# Batch E.1 acceptance notes

Report UX remains a renderer presentation layer over the existing Engineering Core export bundle.

Acceptance:
- active Run/Engine/Snapshot identity remains exact
- HTML/JSON/PDF media types come from the existing contracts
- PDF export keeps the privileged main-process boundary
- malformed or mismatched PDF responses fail closed
- no new engineering inference, threshold, classification or calculation
