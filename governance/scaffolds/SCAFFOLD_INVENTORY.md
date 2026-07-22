# SG-001 Scaffold Inventory

## Purpose

Inventory every artifact created by Scaffold Generation 001.

## Scope

SG-001 allowlisted Markdown artifacts and the Build Tree registration update.

## Responsibilities

| Artifact | Category | Status | Owner |
|---|---|---|---|
| `governance/scaffolds/SCAFFOLD_DOCUMENT_STANDARD.md` | Governance standard | Active | SG-001 scaffold governance |
| `governance/scaffolds/INDEX.md` | Navigation | Active | SG-001 scaffold governance |
| `governance/scaffolds/SCAFFOLD_INVENTORY.md` | Inventory | Active | SG-001 scaffold governance |
| `docs/architecture/scaffolds/CANONICAL_ARCHITECTURE_BOUNDARY_SCAFFOLD.md` | Canonical template | Active template | SG-001 scaffold governance |
| `docs/architecture/scaffolds/CANONICAL_DOMAIN_RESPONSIBILITY_SCAFFOLD.md` | Canonical template | Active template | SG-001 scaffold governance |
| `docs/architecture/scaffolds/CANONICAL_DEPENDENCY_RELATIONSHIP_SCAFFOLD.md` | Canonical template | Active template | SG-001 scaffold governance |
| `docs/architecture/scaffolds/CANONICAL_SOURCE_OF_TRUTH_SCAFFOLD.md` | Canonical template | Active template | SG-001 scaffold governance |
| `docs/architecture/scaffolds/SCAFFOLD_ARCHITECTURE_MAP.md` | Architecture map | Active | SG-001 scaffold governance |
| `docs/architecture/scaffolds/SCAFFOLD_CATALOG.md` | Catalog | Active | SG-001 scaffold governance |
| `docs/architecture/scaffolds/SCAFFOLD_TRACEABILITY_MATRIX.md` | Traceability | Active | SG-001 scaffold governance |
| `docs/architecture/scaffolds/SCAFFOLD_DECISION_MATRIX.md` | Decision matrix | Active | SG-001 scaffold governance |
| `docs/architecture/scaffolds/SCAFFOLD_CHANGELOG.md` | Changelog | Active | SG-001 scaffold governance |
| `docs/architecture/source-truth/SCAFFOLD_SOURCE_OF_TRUTH_INDEX.md` | Existing-owner index | Active | SG-001 scaffold governance |
| `FORGE_MASTER_BUILD_TREE.md` SG-001 block | Build Tree registration | Updated on validation PASS | Build Tree authority unchanged |

## Authority

SG-001 Gate and Governance Traceability Policy.

## Boundaries

Inventory inclusion does not confer domain, Source of Truth or implementation authority.

## Dependencies

Catalog, Changelog and Git diff.

## Source of Truth

This document owns the SG-001 artifact inventory. Git owns byte-level change history.

## Related Documents

- `governance/scaffolds/INDEX.md`
- `docs/architecture/scaffolds/SCAFFOLD_CATALOG.md`

## Related ADRs

ADR-020.

## Constitutional References

Articles II, VIII and IX.

## Status

`ACTIVE / INVENTORY COMPLETE`

## Version

`1.1.0` — SG-002 instances, `2026-07-21`.

## Traceability

- Constitutional origin: governance traceability and documentary immutability.
- Historical element preserved: explicit catalogs and inventories.
- Historical difference: only current SG-001 artifacts are counted; historical repository contents remain evidence.
- Justification: avoids duplicate or inherited inventory truth.
- Evidence: filesystem allowlist and final SG-001 diff.

## SG-002 Inventory Extension

| Artifact family | Count | Status | Authority |
|---|---:|---|---|
| `docs/architecture/scaffolds/instances/domains/*.md` | 12 | Active documentary instances | SG-002 exact manifest |
| `docs/architecture/scaffolds/instances/source-truth/*.md` | 12 | Existing-owner registrations | SG-002 exact manifest |
| `docs/architecture/scaffolds/instances/boundaries/*.md` | 12 | Active documentary boundaries | SG-002 exact manifest |
| `docs/architecture/scaffolds/sg-002/*.md` | 5 | SG-002 controls | SG-002 exact manifest |

NASH has no Source of Truth registration. Blocked candidates and standalone Dependency/Relationship instances are absent by design.
