# Forecast Scenario Ownership
## Purpose
Register Forecast Intelligence's ownership of labeled scenarios, never facts.
## Scope
Forecast scenarios with assumptions, inputs, period, confidence and uncertainty.
## Responsibilities
Preserve provenance and labels; prevent scenario-to-fact promotion and duplicate scenario truth.
## Authority
Unified Constitution Article III; ADR-007; ADR-020; SG-002 Gate. Owner evidence: ADR-007.
## Boundaries
Registration only; no source fact, production, payment or guarantee is created. Insufficient inputs yield `UNKNOWN / BLOCKED`.
## Dependencies
Official upstream facts/metrics, explicit assumptions, horizon and snapshot.
## Source of Truth
Conceptual owner: Forecast Intelligence for scenarios only. Canonical definition: ADR-007. Upstream source ownership is retained by each fact/metric owner.
## Related Documents
[Domain](../domains/FORECAST_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md); [Boundary](../boundaries/FORECAST_TRUTH_BOUNDARY.md); [SOT Index](../../../source-truth/SCAFFOLD_SOURCE_OF_TRUTH_INDEX.md).
## Related ADRs
ADR-001–004, ADR-007 and ADR-020.
## Constitutional References
Article 0 / Ley Zero; Articles II, III, V, VII and IX.
## Status
`ACTIVE / EXISTING OWNER REGISTRATION / SCENARIOS NOT FACTS`
## Version
`1.0.0` — `2026-07-21`.
## Traceability
Origin: Article III and ADR-007. Historical preservation: forecast domain and scenario planning. Difference: projected states cannot be current truth. Justification/evidence: explicit constitutional/ADR boundary. Implementation boundary: no models or data.
