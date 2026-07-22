# SG-001 Scaffold Architecture Map

## Purpose

Define how the first canonical scaffold generation organizes architecture documentation after the Constitutional Rewrite.

## Scope

Maps documentary scaffold families only. It does not map or authorize software runtime.

## Responsibilities

- Show authority-to-consumer flow.
- Preserve the original layered/domain philosophy where compatible.
- Separate boundary, ownership, dependency and Source of Truth concerns.
- Route every future scaffold through one standard and inventory.

## Authority

Unified Constitution v4.0, ADR-001–004, ADR-020 and SG-001.

## Boundaries

```text
Unified Constitution + ratified ADRs
                  |
                  v
       Architecture Boundary Scaffold
                  |
                  v
       Domain Responsibility Scaffold
                  |
                  v
   Dependency and Relationship Scaffold
                  |
                  v
        Source of Truth Scaffold
                  |
                  v
        Governed human consumers
```

The sequence is documentary and logical. It does not imply runtime, implementation readiness or automatic action.

## Dependencies

- `governance/scaffolds/SCAFFOLD_DOCUMENT_STANDARD.md`
- The four canonical scaffold templates.
- Catalog, inventory, traceability, decision and changelog records.

## Source of Truth

This map owns SG-001 scaffold-family navigation only. It does not own domain architecture or Build Tree truth.

## Related Documents

- `docs/architecture/scaffolds/SCAFFOLD_CATALOG.md`
- `docs/architecture/scaffolds/SCAFFOLD_TRACEABILITY_MATRIX.md`
- `governance/scaffolds/INDEX.md`

## Related ADRs

ADR-001, ADR-002, ADR-003, ADR-004 and ADR-020.

## Constitutional References

Articles 0, II–V, VII–IX.

## Status

`ACTIVE / SG-001 DOCUMENTARY MAP`

## Version

`1.0.0` — `2026-07-21`.

## Traceability

- Constitutional origin: governed ownership and specialized, non-duplicating architecture.
- Historical element preserved: foundation-first sequencing, domain grouping and explicit dependency flow from the original Unified Build Tree.
- Historical difference: historical 00–18 branches are not recreated as current scaffolds.
- Justification: branch status mixed product intent, implementation evidence and pre-unification authority.
- Evidence: current Constitution/Build Tree and original Unified Build Tree hash `1804191c6f85cad550e48056e6ab81d02fd93b25259c6edd362142c3e193ef29`.
