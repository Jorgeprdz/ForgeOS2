# SG-018 - Legacy Reintroduction Guard

Canonical order: 4.

Layer: `LEGACY_CONTROL`.

Status: `READY`.

Depends on: `SG-001`, `SG-002`.

Produces:

- `LegacyReintroductionDenylist`
- `LegacyAbsenceValidationPolicy`

Materializes:

- `scaffolds/policies/legacy-reintroduction-denylist.json`
- `scaffolds/policies/legacy-absence-validation-policy.json`

This stage defines the paths, file patterns and source behaviors that must
never be reintroduced from Forge OS legacy implementations.

It also defines the fail-closed validation policy used to prove that forbidden
legacy files, copied implementations and historical runtime entrypoints remain
absent from the Forge OS 2 rewrite.

The stage must be selected through the artifact dependency DAG rather than by
numeric SG order.
