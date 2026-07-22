# ADR Constitutional Closure Matrix

Status: GOVERNANCE TRACEABILITY ADDENDUM

This document does not modify, replace or reinterpret any ADR. It records the real repository state and the objective evidence supporting closure. The original status text remains immutable historical evidence.

## Global evidence

- `evidence/ADR_CONSTITUTIONAL_PHASE_LOCK_REPORT.txt` has status `LOCKED / FINAL QA` and declares ADR-001 through ADR-018 locked as the governing boundary layer.
- `01-constitution/docs/migration/constitutional-history/FORGE_CONSTITUTION_V3.md` incorporates the evidence, metric, authority, non-invention, product, policy, forecast, economic, advisor-first, rule-pack and human-decision boundaries expressed by the ADR set.
- `01-constitution/governance/constitution/FORGE_CONSTITUTION_MAP.md` maps ADR-001 through ADR-018 into constitutional layers.
- `03-governance/FORGE_GOVERNANCE_REGISTRY.md` names `adr/` as the canonical ADR authority set.
- `03-governance/axioms/AX-003-Architecture-by-Decision.md` and `AX-005-Implementation-Must-Obey.md` make the project dependent on documented decisions.
- `04-build-tree/governance/architecture/FORGE_MASTER_BUILD_TREE.md` uses these boundaries across its current/historical area map.

## Closure decisions

| ADR | Previous literal state | Real state before this review | New recorded state | Replaced / obsolete | Implementation posture | Reason and evidence | Dependencies | Constitutional impact |
|---|---|---|---|---|---|---|---|---|
| ADR-001 | Proposed / Draft | Adopted and phase-locked | LOCKED | No | Constitutional boundary adopted; runtime conformance must be rebuilt | Explicit phase lock; Constitution requires evidence and no invented truth; every later ADR depends on it | Constitution, Article 0 | Establishes the root evidence/source-validity invariant for the rewrite |
| ADR-002 | Proposed / Draft | Adopted and phase-locked | LOCKED | No | Constitutional boundary adopted; metric implementations were cleaned | Explicit phase lock; Constitution and AGENTS require one conceptual owner; later ADRs depend on it | ADR-001 | Prohibits duplicate metric truth in all future domains |
| ADR-003 | Proposed / Draft | Adopted and phase-locked | LOCKED | No | Authority boundary adopted; execution contracts remain missing | Explicit phase lock; Constitution, Article 0 and ROBOCOP preserve human authority | ADR-001, ADR-002 | Human decision authority becomes non-negotiable |
| ADR-004 | Proposed / Draft | Adopted and phase-locked | LOCKED | No | Recommendation boundary adopted; validators must be rebuilt | Explicit phase lock; Constitution and AGENTS prohibit invented recommendations | ADR-001, ADR-003 | Requires evidence-bounded recommendations and fail-closed behavior |
| ADR-005 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; product implementations are outside the pack | Explicit phase lock; Constitution incorporates Product Truth | ADR-001 through ADR-004 | Product documentation remains the only product truth authority |
| ADR-006 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; policy implementations are outside the pack | Explicit phase lock; Constitution incorporates Policy Truth | ADR-001 through ADR-005 | Policy truth cannot be inferred from weak evidence or OCR alone |
| ADR-007 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; forecast runtime must be rebuilt | Explicit phase lock; Constitution and AGENTS state forecasts are not facts | ADR-001 through ADR-004 | Separates scenarios from facts and paid/confirmed outcomes |
| ADR-008 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; economic validators remain a prerequisite | Explicit phase lock; Constitution requires source, period, currency and assumptions | ADR-001, ADR-007 | Unknown economic values remain unknown |
| ADR-009 | Final | Final and phase-locked | LOCKED | No | Canonical decision philosophy; NBA implementation removed/absent | Explicit phase lock; Constitution requires action without removing human authority | ADR-003, ADR-004, ADR-007, ADR-008 | Governs future next-best-action contracts |
| ADR-010 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; NASH implementation is not rewrite authority | Explicit phase lock; Constitution Map places it in Interaction Intelligence | ADR-003, ADR-004, ADR-005 through ADR-009 | Conversation intelligence may explain/draft but not invent or decide |
| ADR-011 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; relationship runtime must be rebuilt | Explicit phase lock; Constitution Map records non-manipulation | ADR-003, ADR-010 | Relationship signals cannot become pressure, consent or final messaging |
| ADR-012 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; planning implementation is outside the pack | Explicit phase lock; Constitution Map places it in Decision Intelligence | ADR-003, ADR-007, ADR-009 | Plans remain evidence-bound and distinct from authorized action |
| ADR-013 | Final | Final and phase-locked | LOCKED | No | Canonical boundary; Mick implementation is outside the pack | Explicit phase lock; AGENTS defines Mick as behavior, not motivation or surveillance | ADR-003, ADR-011, ADR-012 | Observable behavior cannot become human worth or enforcement |
| ADR-014 | Final | Final and phase-locked | LOCKED | No | Canonical metric boundary; implementation must be reconstructed | Explicit phase lock; Metric Ownership is constitutional | ADR-002, ADR-013 | Productivity has one owner and cannot become human ranking |
| ADR-015 | Final | Final and phase-locked | LOCKED | No | Canonical manager boundary; manager runtime is not carried forward | Explicit phase lock; AGENTS and Constitution preserve manager-aware, advisor-first authority | ADR-003, ADR-013, ADR-014 | Manager intelligence remains coaching/review support, never automated labor judgment |
| ADR-016 | Final | Final and phase-locked | LOCKED | No | Canonical advisor-experience boundary; domain remains planned/no implementation | Explicit phase lock; Constitution and AGENTS incorporate Benvenù and anti-dependence | ADR-003, ADR-015 | Rewrite UX must increase capability rather than dependency |
| ADR-016A | FINAL / LOCKED CANDIDATE | Candidate with constitutional-map evidence but no final lock | DISCOVERY / LOCKED CANDIDATE | No | Not implemented; no current architectural dependency demonstrated | Not included in the phase-lock report; historical map inclusion and commit prove intent, not final ratification | ADR-016 | Purpose/dignity constraints must not be treated as locked until explicit Board closure |
| ADR-017 | Final | Final and phase-locked | LOCKED | No | Canonical compensation boundary; implementations/rule packs excluded | Explicit phase lock; Constitution and AGENTS incorporate evidence-first compensation and RuleSnapshot rules | ADR-001, ADR-002, ADR-007, ADR-008 | Forecast is not payout truth; compensation must remain rule/evidence/period-bound |
| ADR-018 | Final | Final and phase-locked | LOCKED | No | Canonical economic-motivation boundary; implementation must be rebuilt | Explicit phase lock; Constitution preserves Client First over economic pressure | ADR-008, ADR-017 | Economic motivation cannot override suitability, evidence or human authority |

## ADR-016A missing evidence

ADR-016A remains open for closure because all of the following are missing from the current canonical tree:

1. An explicit Board/Miranda ratification declaring it `LOCKED` rather than `LOCKED CANDIDATE`.
2. Inclusion in a current phase-lock or governance registry decision.
3. A ratified public contract for Purpose Snapshot ownership, isolation, deletion and forgettability.
4. Objective architecture conformance evidence proving no leakage into Mick, Manager Intelligence, NASH, Business Planning, Economic Motivation or global memory.

Required work: governance-only review and explicit closure decision. No implementation is authorized to manufacture closure evidence.

## Archived and audit ADR artifacts

- Files under `adr/_archive/` remain historical/superseded source forms. They are not separate active ADRs and receive no new status.
- Targeted repair and re-audit reports remain evidence of document repair, not decision authorities.
- `ADR_CONSTITUTIONAL_PHASE_LOCK_REPORT.txt` is retained as closure evidence because it contains the explicit global lock verdict.

## Rewrite Pack impact

- ADR-001 through ADR-018 are normative locked inputs to every future architecture and specification.
- ADR-016A is included for traceability but is not an implementation authority until formally closed.
- The Pack must not infer implementation readiness from ADR closure. Constitutional decisions can be locked while runtime, schema, interface and validation contracts remain missing.
