# Canonical Dependency and Relationship Scaffold

## Purpose

Document a directed dependency or relationship between established components or domains without transferring ownership.

## Scope

- Relationship ID: `[REQUIRED]`
- Upstream source/owner: `[REQUIRED]`
- Downstream consumer: `[REQUIRED]`
- Information or contract transferred: `[REQUIRED]`

## Responsibilities

- Declare direction and purpose.
- Preserve owner, evidence state, period, uncertainty and limits.
- Identify failure isolation and prohibited reverse authority.
- Record whether the relationship is required, optional or blocked.

## Authority

- Constitutional authority: `[REQUIRED]`
- Applicable ADR authority: `[REQUIRED]`
- Source and consumer authority records: `[REQUIRED]`

## Boundaries

- Allowed transfer: `[REQUIRED]`
- Forbidden transfer: `[REQUIRED]`
- No ownership transfer: `true`
- No consumer recalculation: `true when official truth or metrics are consumed`
- Failure behavior: `[REQUIRED; fail closed for authority/evidence gaps]`

## Dependencies

- Upstream prerequisites: `[REQUIRED]`
- Contract/schema reference: `[REQUIRED or NOT APPLICABLE]`
- RuleSnapshot/period: `[REQUIRED when context-sensitive]`
- Human checkpoint: `[REQUIRED when action-sensitive]`

## Source of Truth

- Transferred concept owner: `[REQUIRED; UNKNOWN / BLOCKED if absent]`
- Relationship definition owner: `[REQUIRED]`
- Canonical source references: `[REQUIRED]`

## Related Documents

- `[REQUIRED: both endpoint documents and governing contract]`

## Related ADRs

- ADR-001, ADR-002, ADR-003 and ADR-020.
- `[REQUIRED: endpoint-specific ADRs]`

## Constitutional References

- Article 0 / Ley Zero.
- Articles II–VII.

## Status

`TEMPLATE / DIRECTED RELATIONSHIP ONLY`

## Version

`1.0.0` — SG-001.

## Traceability

- Constitutional origin: Articles III, V and VII require ownership preservation, orchestrator non-duplication and bounded consumption.
- Historical element preserved: the original Unified Build Tree encoded construction sequence and inter-branch dependencies.
- Historical difference: adjacency and sequence no longer imply authority, readiness or runtime coupling.
- Justification: dependencies must remain auditable and must not create parallel truth.
- Evidence: Unified Constitution, ADR-001–003, ADR-020, current Build Tree and original Unified Build Tree dependency ordering.
