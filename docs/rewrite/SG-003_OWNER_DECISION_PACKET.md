# SG-003 Owner Decision Packet

Disposition: `SUPERSEDED`

Superseded by: `SG-021 - Product Semantics And Domain Authority Decisions`, `scaffolds/manifest/rewrite-stages.json` owner decision entries, and `scaffolds/manifest/rewrite-artifact-graph.json`.

This document is retained only as historical evidence for why the original SG-003 blocking questions existed. It is not an active normative source, does not define the canonical rewrite order, and must not be used to block unrelated domains. The only still-active decision content is the compact SG-021 decision model in the rewrite manifests.

Stage: `SG-003`

Requested scope: Advisor Domain Redesign Definition

Current manifest scope: Relationship Intelligence Contract

Current status: `BLOCKED_REQUIRES_PRODUCT_DEFINITION`

Prepared for: Project Owner

Prepared from repository evidence only. This packet does not ratify decisions, mark SG-003 ready, apply a rewrite stage, generate product code, or create operational evidence.

## 1. Current SG-003 State

SG-003 is blocked because the repository does not yet contain a ratified product definition for the next advisor-domain boundary to be implemented.

The active stage manifest currently defines SG-003 as `Relationship Intelligence Contract`, with purpose "Define the Relationship Intelligence contract independently from conversation, policy and quote domains." It has no files to generate, allows only `plan` and `record blocked evidence`, and prohibits product code and legacy runtime copying.

The owner's current execution directive frames SG-003 as `Advisor Domain Redesign Definition`. That creates a necessary decision boundary: SG-003 cannot safely proceed until the owner clarifies whether this stage is strictly the Relationship Intelligence contract, the broader Advisor Domain definition, or a narrow Advisor Domain contract that Relationship Intelligence consumes.

## 2. Stage Scope

Allowed in this preparation step:

- identify owner decisions required to define the Advisor Domain;
- separate resolved constitutional/architectural facts from unresolved product semantics;
- document options and consequences;
- propose acceptance criteria for a future SG-003 decision.

Not allowed in this preparation step:

- marking SG-003 as `READY`, `PASS` or completed;
- executing `--apply`;
- generating product modules, UI, Supabase implementation, production migrations or business logic;
- writing `.forge/rewrite/state.json`, `.forge/rewrite/current-stage` or stage evidence;
- copying or adapting legacy code;
- treating historical or missing documents as active authority.

## 3. Authority Consulted

- `AGENTS.md`, Canonical Constitutional Authority: active Constitution is `governance/constitution/CONSTITUTION_UNIFIED.md`; historical constitutions are provenance only.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article 0: Forge strengthens human judgment and must not replace human responsibility.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article III: evidence precedes judgment, unknown remains unknown, one metric has one conceptual owner.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article IV: Forge recommends and accountable humans decide; no automated human consequences.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article VI: Nash, Mick, Manager and Relationship Intelligence are bounded and may not own external truth or final authority.
- `docs/product/FORGE_PRODUCT_SPEC.md`, Product Identity and Users And Roles: Forge serves advisors, managers, candidates/precontract participants, owners and Termux operators.
- `docs/product/FORGE_PRODUCT_SPEC.md`, Critical Flow "Advisor Next Action": domain signals are evidence-validated, converted into one next action, then accepted, rejected or deferred by the human advisor.
- `scaffolds/manifest/rewrite-stages.json`, SG-003: current stage is blocked for product definition and may not generate product files.
- `scaffolds/manifest/forge-product-capabilities.json`, `CAP-RELATIONSHIP-INTELLIGENCE`: Relationship Intelligence is a `REDESIGN` capability that outputs a relationship next action.
- `scaffolds/manifest/requirements-traceability.json`, `CAP-RELATIONSHIP-INTELLIGENCE`: SG-003 acceptance is one evidenced next action with no manipulation.
- `docs/architecture/FORGE_MODULE_REGISTRY.md`: the processable registry is canonical and distinguishes definition, implementation and disposition.
- `docs/product/FORGE_PRODUCT_SURFACE_MAP.md`: Advisor Workspace and Relationship Intelligence are visible surfaces with distinct responsible modules.
- `docs/architecture/FORGE_DEPENDENCY_GRAPH.md`: stage IDs do not determine execution order; SG-003 module readiness is blocked.
- `adr/ADR-010 — NASH Conversation Intelligence Boundary.txt`: NASH drafts and guides language but does not invent truth, consent, recommendations or execution.
- `adr/ADR-011 — Relationship Intelligence Non-Manipulation Boundary.txt`: Relationship Intelligence owns bounded relationship signals and may not infer permission, consent or final action.
- `adr/ADR-014 — Productivity Metric Ownership Boundary.txt`: Productivity owns productivity metrics and cannot create human-worth, potential, enforcement or final manager conclusions.
- `adr/ADR-016 — Advisor Experience + Benvenù Anti-Dependence Boundary.txt`: Advisor Experience owns advisor-facing explanation and learning state but not upstream truth, final recommendation validity or implementation logic.
- `docs/architecture/scaffolds/instances/source-truth/RELATIONSHIP_SIGNAL_OWNERSHIP.md`: relationship signals do not own people, intent, consent or contact permission.
- `docs/architecture/scaffolds/instances/source-truth/PRODUCTIVITY_METRIC_OWNERSHIP.md`: missing formula/context is `UNKNOWN / BLOCKED`; consumers cannot recalculate official productivity truth.
- `docs/architecture/scaffolds/instances/source-truth/ADVISOR_EXPERIENCE_OWNERSHIP.md`: unsupported learning state is `UNKNOWN / BLOCKED` and Advisor Experience cannot redefine source truth.
- `scaffolds/reports/SG-001-evidence.json`: SG-001 validation evidence reports `PASS`.
- `scaffolds/reports/SG-002-evidence.json`: SG-002 generated only contract stubs and validation evidence reports `PASS`.

## 4. Facts Already Established

- Forge OS is a Sales Operating System, Decision Intelligence System and Career Intelligence System for advisors, managers and commercial organizations.
- Forge is advisor-first and manager-aware, but it is not a generic CRM, chatbot, dashboard collection or note-taking system.
- The advisor-facing product goal is action-oriented: "Do this now. With this client. For this reason."
- Relationship management is allowed only when it serves Forge decision/action workflows.
- Advisor Workspace, Advisor Lifecycle, Relationship Intelligence, Conversation Intelligence, Mick Observable Behavior, Productivity, Policy, Product, Economic Evidence and Advisor Experience are distinct conceptual areas.
- Relationship Intelligence owns relationship signals, not people, client intent, consent, contact permission, final recommendations or contact execution.
- NASH may draft, explain and guide conversation. NASH cannot invent client intent, consent, product truth, policy truth, economic evidence, forecast truth or send messages.
- Productivity owns activity, throughput, conversion and output metrics. It does not own behavior truth, human worth, advisor potential, manager conclusions or consequences.
- Mick owns observable behavior signals only. It cannot infer moral discipline, human worth or consequences.
- Advisor Experience owns advisor-facing explanation, contextual help, learning support and first-value experience. It does not own upstream domain truth or final recommendation validity.
- Advisor Lifecycle is canonically defined but not implemented. Its current registry purpose is to represent advisor lifecycle status without creating payout truth.
- Recruitment/Precontract is deferred. Its evidence can inform identity/lifecycle questions but cannot authorize advisor-domain behavior.
- Historical Forge OS original behavior is evidence only. It cannot be copied, restored or treated as architecture.
- Unknown values remain unknown. Source ambiguity blocks strong claims.

## 5. Decisions Still Blocking SG-003

SG-003 has three blocking owner decisions. These are product semantics decisions, not code decisions.

### SG003-OD-001 — Advisor Identity And Domain Boundary

#### Decision Question

What is the canonical meaning of `Advisor` in Forge OS V2 for domain modeling purposes?

Choose one:

- `A`: Advisor is a durable person identity with advisor role/state history.
- `B`: Advisor is a separate domain aggregate linked to, but distinct from, Person/User/Candidate/Recruit/Agent/Manager identities.
- `C`: Advisor is only an operating role/profile attached to an existing Person/User identity and never owns durable identity.
- `UNKNOWN`: defer until the owner supplies an explicit identity policy.

#### Why This Requires The Owner

The Constitution establishes that Forge serves advisors and accompanies the commercial career from Candidate to Director, but it does not define whether Advisor is the same durable person as Candidate/Recruit/User/Agent/Manager or a separate aggregate. The repository contains related concepts (`MOD-ADVISOR-LIFECYCLE`, `MOD-ADVISOR-WORKSPACE`, `MOD-RECRUITMENT-PRECONTRACT`, `RecruitIdentity`, `AdvisorConversion`, `AdvisorActivation`), but it does not contain a ratified owner decision that maps these identities into one canonical Advisor model.

Codex can recommend a safe modeling boundary, but deciding how Forge names and tracks the commercial person across Candidate, Precontract, Advisor, Manager, Partner and Director is product authority.

#### Evidence Available

- `AGENTS.md`, Project Identity, lines 13-36: Forge serves financial advisors and follows the career path `Candidate -> Precontract -> Advisor -> Manager / Partner -> Director`.
- `AGENTS.md`, Recruitment Lifecycle Domain, lines 716-734: `RecruitIdentity` is durable, `candidateId` is not permanent identity, and assignments/events are not overwrites.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Articles III-IV, lines 59-75: evidence, ownership, privacy, human review and consequential limits apply to personal and cross-domain interpretation.
- `docs/architecture/FORGE_MODULE_REGISTRY.md`, lines 11-26: source absence does not remove a module from the rewrite; `MOD-ADVISOR-LIFECYCLE` is canonically defined but not implemented in the processable registry.
- `docs/product/FORGE_PRODUCT_SURFACE_MAP.md`, lines 13 and 17: Advisor Workspace and Relationship Intelligence are separate surfaces with separate responsible modules.
- `docs/architecture/FORGE_DEPENDENCY_GRAPH.md`, lines 42-45: `MOD-ADVISOR-LIFECYCLE`, `MOD-ADVISOR-CONVERSION` and `MOD-ADVISOR-ACTIVATION` are present as defined modules, but that does not settle product semantics.

#### Options

- Option A: Model a canonical durable `Person` identity with Advisor as a role/state history attached to that identity.
- Option B: Model `Advisor` as its own aggregate with explicit links to Person/User/Candidate/Recruit/Agent/Manager identities.
- Option C: Model `Advisor` as a runtime operating profile only, with identity owned elsewhere.
- UNKNOWN / defer: keep Advisor semantics unresolved and keep SG-003 blocked.

#### Architectural Recommendation

Recommend Option A as the safest default to prevent duplicate people across Candidate, Recruit, Advisor, Agent, Manager, Leader and User contexts. The Advisor Domain should own advisor-role state and lifecycle references, while a separate identity/person boundary owns durable person identity. This is a recommendation only; it is not ratified by this document.

#### Impact

Affected modules:

- `MOD-ADVISOR-LIFECYCLE`
- `MOD-ADVISOR-WORKSPACE`
- `MOD-RELATIONSHIP-INTELLIGENCE`
- `MOD-CLIENT-CRM-READMODEL`
- `MOD-RECRUITMENT-PRECONTRACT`
- `MOD-NBA-REASON-WHY`

Affected contracts and future contract fields:

- advisor identifier contract;
- person/advisor/user linking contract;
- lifecycle event envelope;
- read-only client/person evidence contract;
- relationship signal context contract;
- privacy and consent metadata.

Affected events:

- advisor identity linked;
- advisor role assigned;
- advisor role changed;
- advisor lifecycle state proposed;
- advisor lifecycle state confirmed;
- advisor lifecycle state corrected.

Affected validations:

- no duplicate person identity;
- no advisor truth without source;
- no identity merge without human approval;
- no lifecycle state change without authority and evidence.

#### Response From Owner

DECISION: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:

### SG003-OD-002 — Advisor Lifecycle States And Transition Authority

#### Decision Question

Which Advisor lifecycle states are canonical for Forge OS V2, and who is authorized to change each state?

At minimum, decide whether the following terms are canonical states, derived labels, evidence fields, or rejected terms:

- active;
- productive;
- contracted;
- coded;
- authorized;
- in development;
- terminated;
- converted;
- activated.

Choose one transition model:

- `A`: State transitions are event-sourced and require official evidence plus explicit human authority.
- `B`: State transitions are read-only reflections of external/official systems; Forge never writes lifecycle truth.
- `C`: Some states are Forge-owned and some are read-only external facts, with an owner-approved state table.
- `UNKNOWN`: defer until the owner supplies a lifecycle vocabulary and transition authority table.

#### Why This Requires The Owner

The Constitution can prohibit unsafe behavior, and architecture can require source, owner and evidence. Neither can decide business vocabulary such as what "active", "coded" or "authorized" means inside this commercial organization. Those terms affect access, reporting, relationship handling, coaching, compliance, user expectation and downstream workflow readiness.

Codex cannot infer whether a term is a legal, operational, HR, sales, licensing, policy, carrier, office or product-specific state. Unsupported terms must remain `UNKNOWN`.

#### Evidence Available

- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article III, lines 61-67: unknown remains unknown, every material interpretation needs source, owner, context and limits.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article IV, lines 71-75: Forge recommends and humans decide; personal and cross-domain interpretation requires consent, correction, privacy and review.
- `AGENTS.md`, Recruitment Lifecycle Domain, lines 727-734: identity and lifecycle history should preserve assignments/events and historical cycles.
- `AGENTS.md`, Advisor Experience Domain, lines 591-638: Advisor Experience includes setup, baseline snapshot and progression, but learning is measured by behavior and feature states, not necessarily Advisor lifecycle status.
- `docs/product/FORGE_PRODUCT_SPEC.md`, Users And Roles, lines 53-59: Advisor, Manager, Candidate/Precontract Participant, Project Owner and Termux Operator have different authority limits.
- `docs/architecture/FORGE_DEPENDENCY_GRAPH.md`, lines 43-45: Advisor Lifecycle, Advisor Conversion and Advisor Activation are defined modules in the execution graph.

#### Options

- Option A: Approve an event-sourced Advisor lifecycle model. Every transition has source evidence, authorized actor, timestamp, reason, previous state and immutable receipt.
- Option B: Approve a read-only Advisor lifecycle model. Forge only reflects official external states and may recommend review/correction, but never writes lifecycle truth.
- Option C: Approve a split state model. Forge owns internal experience/progression states, while official employment/licensing/coding/authorization states remain read-only external facts.
- UNKNOWN / defer: keep all unresolved terms as unknown and keep SG-003 blocked.

#### Architectural Recommendation

Recommend Option C. Let Forge own only internal, non-consequential advisor operating states when explicitly approved, and treat official status terms such as contracted, coded, authorized and terminated as externally sourced or human-approved facts. Productivity should not define these states, NASH should not define them, Relationship Intelligence should not define them, and Manager Intelligence should not create consequences from them.

This recommendation is conservative because it preserves one owner per truth class, supports correction/audit, and avoids converting product terminology into unauthorized human-consequence automation.

#### Impact

Affected modules:

- `MOD-ADVISOR-LIFECYCLE`
- `MOD-ADVISOR-CONVERSION`
- `MOD-ADVISOR-ACTIVATION`
- `MOD-ADVISOR-WORKSPACE`
- `MOD-MANAGER-WORKSPACE`
- `MOD-RECRUITMENT-PRECONTRACT`
- `MOD-MICK-BEHAVIOR`
- `MOD-POLICY-OPERATIONS`

Affected contracts and future contract fields:

- lifecycle state enum;
- transition event contract;
- authority actor contract;
- official evidence source contract;
- correction/append-only receipt contract;
- state visibility policy.

Affected permissions:

- advisor self-observation;
- manager review;
- owner/admin ratification;
- external system read-only state import;
- prohibited automatic transition.

Affected validations:

- no transition without source owner;
- no state synonym without mapping;
- no state change from NASH, Relationship Intelligence, Productivity or Mick;
- no lifecycle state presented as productive worth or future potential;
- unknown terms block strong output.

#### Response From Owner

DECISION: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:

### SG003-OD-003 — Advisor Data, Metrics, NASH Access And Action Boundary

#### Decision Question

What information may the Advisor Domain own, what may it read, and what may NASH propose when advisor context is involved?

Choose one ownership/access model:

- `A`: Advisor Domain owns only advisor profile, lifecycle references and preferences; it consumes all metrics, relationship, policy, product, economic, case and productivity outputs read-only from their official owners.
- `B`: Advisor Domain owns a broader advisor operating snapshot, but every embedded metric or claim must retain its source owner and cannot be recalculated.
- `C`: Advisor Domain is only an orchestration/read model and owns no source truth beyond view composition.
- `UNKNOWN`: defer until the owner supplies a data ownership and privacy policy.

#### Why This Requires The Owner

The Constitution and ADRs define prohibitions: no invented truth, one metric one owner, no hidden uncertainty, no autonomous execution, no manipulation and no human-worth scoring. They do not decide the owner-approved privacy scope for Advisor PII, which commercial data belongs in the Advisor Domain, which data remains read-only, or whether Advisor Domain may materialize an operating snapshot.

Those choices affect privacy, product behavior, NASH context, manager visibility, retention, access controls and future integrations.

#### Evidence Available

- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article III, lines 61-65: evidence precedes judgment and one metric has one conceptual owner.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article V, lines 79-87: engines are specialized, orchestrators consume logic, Core is universal and capture-once applies.
- `governance/constitution/CONSTITUTION_UNIFIED.md`, Article VI, lines 91-93: AI is never source truth, metric owner, ratifier, final decision authority or execution authority.
- `adr/ADR-010 — NASH Conversation Intelligence Boundary.txt`, lines 56-83 and 139-173: NASH can generate guidance/drafts but cannot invent truth, intent, consent, recommendations or execute communication.
- `adr/ADR-011 — Relationship Intelligence Non-Manipulation Boundary.txt`, lines 46-54 and 118-154: Relationship Intelligence owns relationship signals but not people, intent, consent, final recommendations or contact execution.
- `adr/ADR-014 — Productivity Metric Ownership Boundary.txt`, lines 55-100 and 160-192: Productivity owns productivity metrics and cannot own behavior truth, human worth, advisor potential, manager conclusions or consequences.
- `adr/ADR-016 — Advisor Experience + Benvenù Anti-Dependence Boundary.txt`, lines 52-70 and 126-169: Advisor Experience owns explanation/learning state but not upstream truth or final recommendation validity.
- `docs/architecture/scaffolds/instances/source-truth/RELATIONSHIP_SIGNAL_OWNERSHIP.md`, lines 4-15: relationship signals preserve source/uncertainty and do not own people, intent, consent or contact permission.
- `docs/architecture/scaffolds/instances/source-truth/PRODUCTIVITY_METRIC_OWNERSHIP.md`, lines 4-15: Productivity owns official productivity metrics; source-fact owners remain unchanged.
- `docs/architecture/scaffolds/instances/source-truth/ADVISOR_EXPERIENCE_OWNERSHIP.md`, lines 4-15: Advisor Experience owns explanation and feature-learning state, not upstream truth.

#### Options

- Option A: Minimal Advisor Domain ownership. Own advisor profile/lifecycle references only; consume all domain metrics and signals read-only.
- Option B: Advisor operating snapshot. Materialize a governed snapshot for ergonomics, with embedded source owner, freshness, uncertainty and no recalculation.
- Option C: Pure read-model/orchestration domain. Compose views from official owners and own no durable advisor source truth.
- UNKNOWN / defer: keep data ownership, PII scope and NASH access unresolved and keep SG-003 blocked.

#### Architectural Recommendation

Recommend Option B only if the owner also approves a strict source-owner envelope for every embedded claim. Otherwise, use Option A as the conservative minimum. NASH should receive only evidence-bounded, purpose-limited context and may propose language, questions or action candidates for human review; it must not execute actions, write production data, infer client intent, infer consent, redefine productivity, determine advisor worth or create lifecycle transitions.

#### Impact

Affected modules:

- `MOD-ADVISOR-WORKSPACE`
- `MOD-ADVISOR-LIFECYCLE`
- `MOD-RELATIONSHIP-INTELLIGENCE`
- `MOD-CONVERSATION-INTELLIGENCE`
- `MOD-NBA-REASON-WHY`
- `MOD-MICK-BEHAVIOR`
- `MOD-CLIENT-CRM-READMODEL`
- `MOD-POLICY-OPERATIONS`
- `MOD-PRODUCT-CATALOG`
- `MOD-COMPENSATION-ECONOMIC`

Affected contracts and future contract fields:

- AdvisorContextEnvelope;
- PII classification;
- data retention and correction policy;
- metric owner references;
- read-only integration declaration;
- NASH context whitelist;
- forbidden inference list;
- action candidate approval requirement.

Affected events:

- advisor context read;
- advisor profile evidence updated;
- advisor context ambiguity blocked;
- advisor action candidate proposed;
- advisor action candidate accepted/rejected/deferred by human.

Affected validations:

- no metric without owner;
- no duplicate metric truth;
- no NASH claim without source owner;
- no source ambiguity in strong output;
- no production writes from SG-003;
- no external side effects;
- no legacy data copied into canonical domain.

#### Response From Owner

DECISIÓN: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:

## 6. Risks Of Wrong Decisions

- If Advisor identity is modeled incorrectly, Forge may duplicate people across Candidate, Recruit, Agent, Manager, Leader and User domains.
- If lifecycle state semantics are guessed, Forge may confuse official status, operational readiness, access, productivity, authorization and human development.
- If "productive" is treated as Advisor truth, Forge violates Productivity ownership and risks human-worth interpretation.
- If "active", "coded", "authorized" or "terminated" are treated as Forge-owned without owner ratification, Forge may create unauthorized human-consequence records.
- If Relationship Intelligence controls Advisor truth, relationship opportunity could become permission or mandate.
- If NASH receives uncontrolled Advisor context, it may invent intent, consent, recommendations or manipulative language.
- If Advisor Domain owns metrics from other domains, the one metric one owner rule is violated.
- If legacy records are imported as authority, removed runtime debt and historical assumptions can re-enter the rewrite.
- If Advisor Experience is confused with Advisor Domain, explanation and learning state may silently redefine product, policy, productivity or lifecycle truth.
- If PII scope is too broad, future implementation may violate purpose limitation, correction, privacy and manager-facing visibility boundaries.

## 7. Decisions Already Resolved By Constitution Or Architecture

- Forge may recommend; humans decide.
- Action planning is not action execution.
- NASH may draft/explain but cannot own truth, invent consent or send.
- Relationship opportunity is not permission.
- Productivity is not human worth.
- Forecast is not fact.
- Unknown remains unknown.
- One metric has one conceptual owner.
- Source ambiguity blocks strong claims.
- Legacy code may not be copied or restored.
- Read-only adapters may read and validate evidence; they must not mutate production state.
- Advisor Experience may explain and teach; it cannot redefine upstream truth.

## 8. Technical Decisions Architecture Can Resolve Later

These do not require the owner before answering the three product decisions above:

- file layout for future Advisor Domain contracts;
- exact JSON Schema filenames;
- generated stub naming;
- validator wiring;
- dependency graph updates;
- Termux command sequencing;
- rollback checkpoint representation;
- bash invocation format for stage runners.

## 9. Legacy Evidence Handling

Legacy evidence may only answer "what behavior existed" or "what users expected." It may not authorize:

- copying code;
- restoring directories;
- restoring dependencies;
- reviving deleted engines;
- preserving old architecture;
- treating previous names as canonical without owner ratification.

If legacy evidence is unavailable or ambiguous, the value remains `UNKNOWN` and the related claim must block strong output.

## 10. Proposed SG-003 Acceptance Criteria

SG-003 can be considered ready for a future contract-definition step only after the owner supplies explicit answers for `SG003-OD-001`, `SG003-OD-002` and `SG003-OD-003`.

Suggested acceptance criteria after owner response:

- Advisor identity boundary is explicit and prevents duplicate person records.
- Advisor lifecycle vocabulary is explicit, source-owned and correction-capable.
- Every lifecycle transition has permitted actor, required evidence and prohibited automation.
- Advisor Domain ownership is separated from Relationship, Conversation, Productivity, Mick, Policy, Product, Economic Evidence, Recruiting and Human Capital ownership.
- NASH access is read-only, evidence-bounded and purpose-limited.
- Relationship opportunity cannot become permission, consent, contact execution or mandate.
- No production data writes are introduced.
- No legacy code or legacy architecture is copied.
- Unknown or source-ambiguous values remain blocked.
- SG-003 stage manifest and traceability can be updated only after owner ratification, with no retroactive completion.

## 11. Explicit Out Of Scope

- Functional implementation of Advisor Domain.
- UI or navigation changes.
- Supabase migrations or production data writes.
- Execution of `forge-rewrite-stage.sh SG-003 --apply`.
- Marking SG-003 complete.
- Modifying `.forge/rewrite/state.json` or `.forge/rewrite/current-stage`.
- Creating real Advisor repositories, services, engines or adapters.
- Defining compensation, policy, product, eligibility, calculation or quote behavior.
- Deciding official licensing, employment, HR, compliance or carrier status semantics.
- Reintroducing Forge OS original code or folder structures.
- Treating Candidate/Recruitment deferred modules as active implementation authority.

## 12. Owner Response Template

Copy the following block into the owner response and replace only the pending fields.

```text
SG003-OD-001 — Advisor Identity And Domain Boundary
DECISIÓN: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:

SG003-OD-002 — Advisor Lifecycle States And Transition Authority
DECISIÓN: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:

SG003-OD-003 — Advisor Data, Metrics, NASH Access And Action Boundary
DECISIÓN: PENDIENTE
JUSTIFICACIÓN:
RESTRICCIONES ADICIONALES:
```

## 13. Resulting Blocker Summary

Real blocker: SG-003 lacks owner-ratified product semantics for Advisor identity, lifecycle state authority and Advisor Domain data/NASH boundaries.

Current repository evidence is sufficient to prohibit unsafe designs. It is not sufficient to choose the owner-specific Advisor model.

Until the owner answers the three decisions above, SG-003 must remain blocked and no Advisor Domain implementation should be generated.
