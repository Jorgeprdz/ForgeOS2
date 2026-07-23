# Carrier Scope Naming Convention

Status: `RATIFIED`

Decision ID: `SG008-ADR-001`

Stage: `SG-008`

Module: `MOD-CARRIER-SCOPE`

## Canonical dimensions

`CarrierScopeContract` declares the evidenced applicability of product or rule
information through these semantic dimensions:

- `carrier`
- `channel`
- `effective_period`
- `source_snapshot`

The canonical scope identity is the governed combination:

`carrier + channel + effective_period + source_snapshot`

These names define contract semantics only. They do not prescribe database
columns, migrations, UI fields, external identifiers or runtime storage.

## Boundary

Carrier Scope declares applicability and remains outside universal Forge Core.

It does not define benefits, coverage, exclusions, eligibility, calculations,
premiums, compensation, suitability, policy state, recommendation authority or
production-write authority.

Missing, stale, conflicting or unsupported dimensions result in an unknown or
blocked scope. Unknown scope remains unknown.

## Authority

Derived from:

- `adr/ADR-005 — Product Truth Boundary.txt`
- `adr/ADR-008 — Economic Evidence Boundary.txt`
- `docs/product/FORGE_PRODUCT_SPEC.md`
- `scaffolds/manifest/product-semantics-decision-record.json`
- `governance/constitution/CONSTITUTION_UNIFIED.md`

This ratification authorizes contract materialization and validation only. It
does not authorize product code, production writes, external side effects,
database changes or restoration of legacy runtime.
