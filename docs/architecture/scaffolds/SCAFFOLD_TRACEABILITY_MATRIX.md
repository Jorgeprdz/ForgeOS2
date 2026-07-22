# SG-001 Scaffold Traceability Matrix

## Purpose

Provide bidirectional traceability from each scaffold to current authority and compatible historical intent.

## Scope

Applies to the four SG-001 canonical templates and their controlling standard.

## Responsibilities

| Scaffold | Constitutional origin | ADR origin | Historical intent preserved | Current change |
|---|---|---|---|---|
| Architecture Boundary | Articles II, IV, V | ADR-003, ADR-020 | Branch locks, allowed/open/prohibited separation | Exact authority and HOLD replace semaforo inference. |
| Domain Responsibility | Articles III, V, VII | ADR-001, ADR-002, domain ADR | Domain grouping and responsibility lists | Owner must be proven by current authority. |
| Dependency/Relationship | Articles III, V, VII | ADR-001–003, ADR-020 | Build order and dependency arrows | Direction no longer transfers authority or readiness. |
| Source of Truth | Articles II, III, IX | ADR-001/002/005–018 | Evidence/provenance/rules/period branch | Candidate/pre-unification owners are excluded. |
| Document Standard | Articles II, VIII, IX | ADR-020 | Repeated purpose/dependency/boundary conventions | One mandatory versioned structure. |

## Authority

Unified Constitution, Governance Traceability Policy, ADR-020 and SG-001.

## Boundaries

Traceability proves documentary derivation only. It does not prove runtime, implementation, domain existence beyond cited authority or historical correctness.

## Dependencies

Catalog, Decision Matrix, Changelog, current Build Tree and original Unified Build Tree.

## Source of Truth

This matrix owns SG-001 derivation links. Normative meaning remains with the cited active source.

## Related Documents

- `docs/architecture/scaffolds/SCAFFOLD_ARCHITECTURE_MAP.md`
- `docs/architecture/scaffolds/SCAFFOLD_DECISION_MATRIX.md`
- `governance/scaffolds/SCAFFOLD_INVENTORY.md`

## Related ADRs

ADR-001–018 as applicable and ADR-020.

## Constitutional References

Articles 0, II–V, VII–IX.

## Status

`ACTIVE / TRACEABILITY PASS`

## Version

`1.0.0` — `2026-07-21`.

## Traceability

- Constitutional origin: Article II ratification and Article III evidence requirements.
- Historical element preserved: explicit sources, dependencies and boundary relationships.
- Historical difference: no historical claim is self-authorizing.
- Justification: Governance Traceability Policy blocks missing authority-to-consumer chains.
- Evidence: current normative set, Build Tree headings/status blocks and complete historical repository scan hash `39cce65e852db536ec83387aab5af16e597f1d72835385f66354995007c6db1e`.
