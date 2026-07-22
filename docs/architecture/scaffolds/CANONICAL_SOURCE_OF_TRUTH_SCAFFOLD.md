# Canonical Source of Truth Scaffold

## Purpose

Register an already-authorized Source of Truth and its conceptual owner without creating either one.

## Scope

- Concept: `[REQUIRED]`
- Conceptual owner: `[REQUIRED from active authority]`
- Context and period: `[REQUIRED]`
- Consumers: `[REQUIRED]`

## Responsibilities

- Identify the canonical source and provenance.
- Separate evidence source, truth owner, metric owner and consumer.
- Record version, effective period, uncertainty and conflict behavior.
- Prevent duplicate or local truth.

## Authority

- Owner-establishing Constitution/ADR: `[REQUIRED]`
- Ratification/status evidence: `[REQUIRED]`
- SG-001 registration authority: `governance/constitutional/SCAFFOLD_GENERATION_GATE_001.md`.

## Boundaries

- This scaffold registers; it does not invent ownership.
- Consumers may not redefine or recalculate official truth.
- Forecasts, assumptions, AI output and UI state may not become facts.
- Missing or conflicting authority results in `UNKNOWN / BLOCKED`.

## Dependencies

- Evidence source: `[REQUIRED]`
- Rule/RuleSnapshot: `[REQUIRED when applicable]`
- Metric definition: `[REQUIRED when applicable]`
- Provenance chain: `[REQUIRED]`

## Source of Truth

- Canonical source: `[REQUIRED]`
- Conceptual owner: `[REQUIRED]`
- Source owner: `[REQUIRED]`
- Effective version/period: `[REQUIRED]`
- Evidence state vocabulary: `[REQUIRED]`
- Conflict resolver/human review: `[REQUIRED]`

## Related Documents

- `docs/architecture/source-truth/SCAFFOLD_SOURCE_OF_TRUTH_INDEX.md`
- `[REQUIRED: owner and consumer records]`

## Related ADRs

- ADR-001, ADR-002, ADR-003, ADR-004 and ADR-020.
- `[REQUIRED: truth-specific ADR]`

## Constitutional References

- Article 0 / Ley Zero.
- Articles II, III, V, VII and IX.

## Status

`TEMPLATE / REGISTRATION WITHOUT AUTHORITY CREATION`

## Version

`1.0.0` — SG-001.

## Traceability

- Constitutional origin: Article III requires identifiable source, conceptual owner, context, period, evidence state, uncertainty and limits.
- Historical element preserved: the original Unified Build Tree's Evidence/Provenance/Rules/Periods/Source Truth branch and historical ownership registries.
- Historical difference: only owners explicitly established by active Constitution or ADR may be registered.
- Justification: historical registries contained pre-unification and candidate authorities, including obsolete ADR references.
- Evidence: Unified Constitution, ADR-001, ADR-002, ADR-005–018, ADR-020 and Governance Registry.
