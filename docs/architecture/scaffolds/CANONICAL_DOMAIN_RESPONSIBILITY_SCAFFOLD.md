# Canonical Domain Responsibility Scaffold

## Purpose

Document one constitutionally or ADR-established domain's responsibility without inventing ownership.

## Scope

- Domain name: `[REQUIRED]`
- Owned concept: `[REQUIRED]`
- Consumed concepts: `[REQUIRED]`
- Build Tree placement: `[REQUIRED]`

## Responsibilities

- Define the domain's owned interpretation or truth.
- Separate owner responsibilities from consumer uses.
- Declare inputs, actionable outputs and human review.
- Identify prohibited recalculation, duplication and cross-domain leakage.

## Authority

- Constitutional authority: `[REQUIRED]`
- Owner-establishing ADR: `[REQUIRED; otherwise UNKNOWN / BLOCKED]`
- Governance status: `[REQUIRED]`

## Boundaries

- Owns: `[REQUIRED from active authority]`
- Consumes: `[REQUIRED]`
- Does not own: `[REQUIRED]`
- May not execute: `[REQUIRED]`
- Human authority boundary: `[REQUIRED]`

## Dependencies

- Facts/evidence consumed: `[REQUIRED]`
- Rule/period context: `[REQUIRED when applicable]`
- Official metrics consumed: `[REQUIRED when applicable]`
- Downstream consumers: `[REQUIRED]`

## Source of Truth

- Domain owner: `[REQUIRED from ratified authority]`
- Canonical definition source: `[REQUIRED]`
- Source/evidence owner distinction: `[REQUIRED]`
- Unknown handling: `Unknown remains unknown.`

## Related Documents

- `[REQUIRED: active contracts, specifications and Build Tree references]`

## Related ADRs

- ADR-001, ADR-002, ADR-003, ADR-004 and ADR-020.
- `[REQUIRED: domain-specific ADR]`

## Constitutional References

- Article 0 / Ley Zero.
- Articles I, III–VII.

## Status

`TEMPLATE / OWNER MUST BE DEMONSTRATED`

## Version

`1.0.0` — SG-001.

## Traceability

- Constitutional origin: Articles III, V and VII require one conceptual owner, specialized engines and bounded domain ownership.
- Historical element preserved: the original Unified Build Tree grouped capabilities by named domain and separated current implementation, open work and locks.
- Historical difference: directory presence, filenames and historical status cannot establish a domain or owner.
- Justification: Article II and ADR-020 reject implementation and Build Tree status as architecture authority.
- Evidence: Unified Constitution, ADR-001–004, owner-specific ADRs, current Build Tree and original Unified Build Tree branches 02–17.
