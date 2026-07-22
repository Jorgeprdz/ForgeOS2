# SG-001 Scaffold Decision Matrix

## Purpose

Record why each scaffold exists and why historical artifacts were not automatically restored.

## Scope

Covers SG-001 scaffold candidates and the historical architecture artifact classes that materially informed the decision.

## Responsibilities

### Scaffold decisions

| Candidate | Decision | Classification | Justification |
|---|---|---|---|
| Architecture Boundary scaffold | Create | New / Derived | Constitution and ADR-020 require explicit architecture authority and boundaries. |
| Domain Responsibility scaffold | Create | New / Derived | Article VII and owner-specific ADRs require bounded responsibilities. |
| Dependency/Relationship scaffold | Create | New / Fused / Derived | Preserves dependency and relationship intent without duplicate documents. |
| Source of Truth scaffold | Create | New / Replaces pattern / Derived | Registers only already-authorized owners and replaces unsafe free-form registry patterns. |
| Separate Status scaffold | Do not create | Fused | Status is mandatory in every scaffold; a separate template would duplicate truth. |
| Separate Version scaffold | Do not create | Fused | Version is mandatory in every scaffold. |
| Separate Provenance scaffold | Do not create | Fused | Provenance is mandatory in Traceability. |
| Separate ADR Reference scaffold | Do not create | Fused | ADR references are mandatory in every scaffold. |
| Separate Constitutional Reference scaffold | Do not create | Fused | Constitutional references are mandatory in every scaffold. |
| Domain-specific populated scaffolds | Do not create in SG-001 | Not required | SG-001 establishes the generation system; populated domain records require exact owner/evidence review. |

### Historical decisions

| Historical artifact or class | Decision | Reason |
|---|---|---|
| `FORGE_UNIFIED_BUILD_TREE_001.md` | Eliminated from current / not restored | Planning/source-truth aid contained pre-unification hierarchy and time-varying implementation status; philosophy preserved in the map. |
| `FORGE_ARCHITECTURAL_CONSTITUTION_v3.md` | Not required | ADR-020 explicitly treats it as historical context and supplies the prospective baseline. |
| `FORGE_ARCHITECTURE_TREE_V1.md` | Not required | Physical/runtime claims are historical evidence, not current authority. |
| `ARCH-001_TARGET_PHYSICAL_ARCHITECTURE.md` | Not required | Design-only physical paths are not ratified by current Constitution. |
| `FORGE_TRUTH_DEPENDENCY_MAP.md` | Fused / derived | Dependency philosophy retained; candidate claims and unlocked statuses excluded. |
| `FORGE_TRUTH_CLASSIFICATION_MATRIX.md` | Fused / derived | Classification requirement retained through authority/status fields. |
| `SOURCE_OWNERSHIP_REGISTRY_001.md` | Replaced as pattern, not content | Pre-unification registry cites non-active candidates; current index uses only active ADR owners. |
| `FORGE_INTELLIGENCE_MAP.md` | Not required | It labels domains constitutional without ratification and conflicts with current authority rules. |
| Product-specific component catalogs | Derived, not restored | Purpose/responsibility/dependency pattern retained generically; product claims stay historical. |
| Product-specific responsibility documents | Derived, not restored | Responsibility format retained; no product implementation or truth imported. |
| Discovery/PAQ/roadmap documents | Not required | Discovery, candidate and historical status cannot authorize current architecture. |
| Archived domain architectures | Not required | Archive status and pre-unification authority prevent canonical restoration. |
| Removed software/runtime clusters | Prohibited | SG-001 is Markdown-only and expressly denies software restoration. |

## Authority

Unified Constitution Articles II, IX and X; ADR-020; Governance Lifecycle; SG-001.

## Boundaries

“Replaces pattern” does not supersede or edit historical evidence. “Eliminated” describes current-repository disposition, not destruction of the historical repository.

## Dependencies

Complete current/original repository comparison, both Build Tree representations, Catalog and Traceability Matrix.

## Source of Truth

This matrix owns SG-001 scaffold disposition only. Git history owns exact deletion history.

## Related Documents

- `docs/architecture/scaffolds/SCAFFOLD_CATALOG.md`
- `docs/architecture/scaffolds/SCAFFOLD_CHANGELOG.md`

## Related ADRs

ADR-001–004 and ADR-020; domain ADRs inform only the Source of Truth template/index.

## Constitutional References

Articles 0, II, III, IX and X.

## Status

`ACTIVE / DECISIONS CLOSED FOR SG-001`

## Version

`1.0.0` — `2026-07-21`.

## Traceability

- Constitutional origin: active authority must prevail over historical repetition or implementation.
- Historical element preserved: architecture layering, domain grouping, dependency direction and reusable responsibility conventions.
- Historical difference: obsolete hierarchy, candidate status and implementation claims are excluded.
- Justification: the Golden Rule preserves intent, not contradiction, duplication or debt.
- Evidence: cleanup history, current Constitution/Build Tree and original repository at commit `863a11024131401defc2ea29cfdef3964eb128ef`.
