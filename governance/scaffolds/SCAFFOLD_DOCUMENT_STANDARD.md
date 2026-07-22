# SG-001 Scaffold Document Standard

## Purpose

Define the single documentary structure and fail-closed completion rules for every canonical scaffold created under SG-001.

## Scope

Applies only to Markdown scaffolds registered in `docs/architecture/scaffolds/` and their SG-001 governance records.

## Responsibilities

- Require the same twelve canonical sections in the same order.
- Require constitutional, ADR, historical and Source of Truth evidence.
- Prevent placeholders from being mistaken for ratified content.
- Require `UNKNOWN / BLOCKED` when ownership or authority is not demonstrated.

## Authority

`CONSTITUTION_UNIFIED.md`, ADR-001, ADR-002, ADR-003, ADR-004, ADR-020 and `governance/constitutional/SCAFFOLD_GENERATION_GATE_001.md`.

## Boundaries

This standard structures documents. It does not create domains, owners, authority, rules, implementation readiness or software permission.

## Dependencies

- Unified Constitution v4.0.
- Active ADR status lineage.
- Governance Registry and lifecycle policy.
- Current Build Tree.
- SG-001 Gate.

## Source of Truth

This file owns only the SG-001 scaffold document structure. Normative meaning remains with the cited Constitution, ADR or governance source.

## Related Documents

- `docs/architecture/scaffolds/SCAFFOLD_CATALOG.md`
- `governance/scaffolds/SCAFFOLD_INVENTORY.md`
- `governance/scaffolds/INDEX.md`

## Related ADRs

ADR-001, ADR-002, ADR-003, ADR-004 and ADR-020. Additional ADRs are mandatory when a scaffold touches their bounded subject matter.

## Constitutional References

Articles 0, II, III, IV, V, VIII, IX and X.

## Status

`RATIFIED BY SG-001 / ACTIVE DOCUMENT STANDARD`

## Version

`1.0.0` — effective `2026-07-21`.

## Traceability

Origin: SG-001 mandatory template. Historical precedent: repeated purpose/input/output/dependency/boundary structures in the original architecture documents. Change: one authority-aware structure replaces heterogeneous historical formats.

## Canonical Section Order

Every scaffold must contain, in this exact order:

1. Purpose
2. Scope
3. Responsibilities
4. Authority
5. Boundaries
6. Dependencies
7. Source of Truth
8. Related Documents
9. Related ADRs
10. Constitutional References
11. Status
12. Version
13. Traceability

The Traceability section must state:

- constitutional principle of origin;
- historical element preserved from the original Unified Build Tree;
- difference from historical architecture;
- justification for the difference;
- evidence supporting existence.

Unresolved required fields must use `UNKNOWN / BLOCKED`; they must never be guessed.
