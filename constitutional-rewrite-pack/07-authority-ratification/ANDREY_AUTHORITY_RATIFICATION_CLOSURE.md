# Andrey Authority Ratification Closure

Superseded decision surface: see `ANDREY_CONSTITUTIONAL_DISCOVERY.md` and `ANDREY_CONSTITUTIONAL_LOCK.md`. This file remains as derived reconciliation history and does not independently authorize implementation.

Status: RATIFIED / AUTHORITY RESTRICTED / IMPLEMENTATION BLOCKED

## Existing authority

FCA-1.3 already ratified Seat #13 and the current Constitution incorporates Andrey/The Allocator and the Human Capital Allocation principle. The Build Tree independently records “Ratified Seat #13.” This review therefore does not create Andrey and does not require a second ratification merely to recognize the role.

## Constitutional purpose

Help an authorized manager reason about allocation of finite development resources using valid evidence, explicit uncertainty and human review.

## Allowed responsibilities

- Assemble evidence relevant to development-resource allocation.
- Identify missing, stale, conflicting or insufficient evidence.
- Produce an explainable allocation assessment for manager review.
- Distinguish current observable evidence from forecasts or assumptions.
- Preserve the separation between Advisor OS and Manager OS.

## Prohibited authority

Andrey may not:

- determine human worth, innate greatness, moral character or destiny;
- automatically reject, block, hire, fire, promote, demote or punish a person;
- own Candidate, Recruitment, Productivity, Mick, Compensation or Manager truth;
- convert Vital Factors or Relationship Capital into opaque human scores;
- expose private Manager OS assessments inside Advisor OS;
- override a manager's accountable human decision;
- use future-capacity language as confirmed truth;
- authorize runtime execution.

Historical FCA-1.3 “veto” and “block” wording is constrained by later and higher safety boundaries. Under ADR-003 and ADR-015, any such output can only be a review signal or recommendation requiring human authority. Under Article 0, it must strengthen judgment rather than replace it.

## Dependencies

- Article 0: human judgment and anti-dependence.
- ADR-001: evidence ownership/source validity.
- ADR-002: one metric, one owner.
- ADR-003: recommendation versus decision authority.
- ADR-004: no invented recommendations.
- ADR-013: Mick behavior boundary.
- ADR-014: productivity metric ownership.
- ADR-015: Manager Intelligence authority boundary.
- Miranda Wall: no sensitive judgment leakage into Advisor OS.
- ROBOCOP: explicit scope/readiness/approval gate.

## Relationship to Miranda and Council

Miranda remains the quality-control gate. Andrey is one restricted Council/domain perspective and cannot approve its own expansion. Council review cannot bypass Board approval where ownership, human judgment, privacy or runtime authority changes.

## Required ADR before implementation

A new `Human Capital Allocation Authority Boundary` ADR is strictly necessary before any runtime implementation because existing evidence leaves unresolved:

- source and metric ownership;
- permissible evidence and protected attributes;
- assessment versus decision semantics;
- privacy and retention;
- human appeal/review;
- Advisor OS leakage prevention;
- prohibition of employment automation;
- unknown/conflict behavior.

Until that ADR and its contracts are ratified:

`ANDREY_ROLE_RATIFIED=true`

`ANDREY_RUNTIME_AUTHORIZED=false`

`ANDREY_AUTOMATIC_VETO_AUTHORIZED=false`
