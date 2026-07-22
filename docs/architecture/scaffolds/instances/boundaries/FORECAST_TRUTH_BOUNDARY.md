# Forecast Truth Boundary
## Purpose
Prevent forecasts from being represented as facts or confirmed outcomes.
## Scope
Scenario inputs, assumptions, horizons, confidence, labels and consumers.
## Responsibilities
Require explicit assumptions/period; label estimates; HOLD unsupported projections.
## Authority
Unified Constitution Article III; ADR-007; ADR-020; SG-002 Gate. Owner evidence: ADR-007.
## Boundaries
Permitted: labeled scenarios. Prohibited: fact, payment, production or guarantee claims. Humans retain decisions; failure is `UNKNOWN / BLOCKED`.
## Dependencies
Official upstream facts/metrics; planning/economic consumers without reverse authority.
## Source of Truth
Forecast Intelligence for scenarios only; [Forecast Scenario Ownership](../source-truth/FORECAST_SCENARIO_OWNERSHIP.md).
## Related Documents
[Domain](../domains/FORECAST_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md); [SG-002 Gate](../../../../../governance/constitutional/SCAFFOLD_INSTANTIATION_GATE_002.md).
## Related ADRs
ADR-001–004, ADR-007 and ADR-020.
## Constitutional References
Article 0 / Ley Zero; Articles III–VII.
## Status
`ACTIVE / SG-002 DOCUMENTARY BOUNDARY / FORECAST IS NOT FACT`
## Version
`1.0.0` — `2026-07-21`.
## Traceability
Origin: Article III/ADR-007. Historical preservation: forecast scenario branch. Difference: no readiness/status may promote scenarios to truth. Justification/evidence: Constitution/ADR-007. Implementation boundary: no model/runtime.
