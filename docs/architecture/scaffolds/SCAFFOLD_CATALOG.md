# SG-001 Scaffold Catalog

## Purpose

Catalog the canonical scaffolds created by SG-001 and the problem each one is allowed to solve.

## Scope

Includes four reusable documentary scaffolds. Supporting maps, matrices and governance records are indexed separately and create no additional scaffold family.

## Responsibilities

| Scaffold | Families | Required use | Creation evidence |
|---|---|---|---|
| `CANONICAL_ARCHITECTURE_BOUNDARY_SCAFFOLD.md` | Architecture Boundary, ADR Reference, Constitutional Reference, Status, Version, Provenance | Any new boundary description. | Constitution Articles II, IV, V; ADR-003; ADR-020. |
| `CANONICAL_DOMAIN_RESPONSIBILITY_SCAFFOLD.md` | Domain Responsibility, Constitutional Reference, ADR Reference, Status, Version, Provenance | Any established-domain responsibility document. | Constitution Articles III, V, VII; ADR-001/002 and domain ADRs. |
| `CANONICAL_DEPENDENCY_RELATIONSHIP_SCAFFOLD.md` | Dependency, Relationship, Provenance | Any cross-domain or component dependency. | Constitution Articles III, V, VII; orchestrator/consumer rules. |
| `CANONICAL_SOURCE_OF_TRUTH_SCAFFOLD.md` | Source of Truth, ADR Reference, Traceability | Any registration of an already-authorized owner/source. | Constitution Article III; ADR-001/002/005–018. |

## Authority

Unified Constitution v4.0, ADR-001–018 as applicable, ADR-020 and SG-001.

## Boundaries

- Catalog inclusion is not domain ratification.
- Templates do not authorize implementation.
- A domain scaffold is blocked without an owner-establishing authority.
- No historical file is restored by this catalog.

## Dependencies

Document Standard, Architecture Map, Inventory and Source of Truth Index.

## Source of Truth

This catalog is the canonical list of SG-001 scaffold templates. The inventory is the canonical list of all SG-001 artifacts.

## Related Documents

- `governance/scaffolds/SCAFFOLD_INVENTORY.md`
- `docs/architecture/scaffolds/SCAFFOLD_DECISION_MATRIX.md`

## Related ADRs

ADR-001–018 as applicable and ADR-020. ADR-016A is excluded as a candidate.

## Constitutional References

Articles 0, II, III, V, VII and IX.

## Status

`ACTIVE / FOUR CANONICAL SCAFFOLDS`

## Version

`1.0.0` — `2026-07-21`.

## Traceability

- Constitutional origin: traceable, owner-bounded architecture.
- Historical element preserved: catalogs and component-responsibility separation.
- Historical difference: generic reusable scaffolds replace product-specific catalog proliferation.
- Justification: SG-001 requires only constitutionally evidenced artifacts and prohibits copied historical structures.
- Evidence: Constitution, ADR decisions, Build Tree comparison and historical component catalog/responsibility documents.
