# Rewrite Prerequisites

The constitutional prerequisites 1–3 were closed by Constitutional Unification 001. Remaining items are proposals only and do not authorize implementation.

## P0 — Required before any implementation

1. `GOV-ARTICLE-0-AUTHORITY-CLARIFICATION` — **RESOLVED**
   - Unified Constitution Article 0 plus AX-001A.

2. `ADR-STATUS-RECONCILIATION-0019` — **RESOLVED**
   - `governance/ADR-0019_STATUS_RECONCILIATION.md`.

3. `ADR-REWRITE-ARCHITECTURE-BASELINE` — **RESOLVED**
   - ADR-020 Unified Constitutional Architecture Baseline.

4. `CANONICAL-SEMANTIC-MODEL`
   - Ratify Source, Observation, Evidence, Claim, Fact, Unknown, Inference, Interpretation, Confidence, Risk, Recommendation, Human Decision, Approval, Authorized Action, Execution Result and Audit Trace.

5. `CANONICAL-DOMAIN-MODEL`
   - Define durable identities, aggregates, lifecycle events, ownership and cross-domain references without importing legacy classes.

6. `TRUTH-CONTRACT-SUITE`
   - Ratify source ownership, evidence states, truth envelope, uncertainty/conflict handling and validation result. It must replace the incomplete dependency chain around derived contract 001C.

7. `PUBLIC-INTERFACE-CONTRACT`
   - Define versioning, compatibility, errors, idempotency, authorization and evidence metadata for public interfaces.

8. `CANONICAL-SCHEMA-POLICY`
   - Define schema authority, validation, evolution, migration and unknown-value semantics.

9. `RUNTIME-EXECUTION-CONTRACT`
   - Define boot, event, command, orchestration, approval, execution, rollback, audit and offline behavior.

10. `AI-INTERPRETATION-CONTRACT`
    - Turn the ROBOCOP AI boundary into structured request/result/context/provider contracts while preserving `AI output is never source truth`.

11. `CANONICAL-PROMPT-CONTRACT`
    - Define reusable prompt identity, version, allowed inputs, prohibited claims, output classification, evidence references and validation requirements.

12. `DATA-SECURITY-TENANCY-POLICY`
    - Define privacy, retention, deletion, encryption, tenant isolation, secrets, audit and regulatory handling.

## Exit gate

The rewrite may leave Constitutional Freeze only after these documents are ratified, linked to applicable ADRs, indexed in governance, and supplied with testable invariants. Drafts, code, historical implementations and Build Tree intent do not satisfy this gate.
