# Forge NASH Production Conversation Architecture — NFAST-01

## Ratification record

- `STAGE_ID=NFAST-01_RATIFIED_ARCHITECTURE_AND_OWNERSHIP_LOCK`
- `STATUS=RATIFIED`
- `SOURCE_HEAD=c43761bbcf27c3ca081dba81e3ce005cf48a8050`
- `MIRANDA_APPROVAL=APPROVED`
- `BOARD_APPROVAL=APPROVED_FOR_NFAST_01_ONLY`
- `NASH_FAST_TRACK_DISCOVERY_STATUS=RATIFIED`
- `IMPLEMENTATION_READINESS=APPROVED_WITH_SEQUENTIAL_STAGE_GATES`
- `RUNTIME_CHANGE_AUTHORIZED=NO`
- `SCHEMA_RLS_CHANGE_AUTHORIZED=NO`
- `DEPLOYMENT_AUTHORIZED=NO`

This record ratifies architecture and ownership only. It does not authorize runtime wiring, persistence, provider behavior, deployment, or any later NFAST stage.

## Constitutional and ADR traceability

This architecture applies the Forge constitutional principles that Forge decides, generative AI explains, unknown remains unknown, evidence precedes claims, core behavior remains available without an AI provider, and external action requires human authority.

| Authority | Ratified implication |
| --- | --- |
| Forge Constitution v3 | Deterministic Forge authorities own facts and decisions; AI cannot become source truth or silently execute an action. |
| ADR-003 | Recommendations remain distinct from decisions and cannot cause silent execution. |
| ADR-004 | Next Best Action truth remains with its governed authority; NASH may consume and explain it. |
| ADR-009 | NASH cannot create a parallel NBA authority. |
| ADR-010 | NASH owns Conversation Intelligence: it may compose, guide, and explain, but does not decide, approve, send, or manipulate. |
| ADR-011 | Relationship context cannot be used for coercion, manipulation, or invented certainty. |
| N3 prospect-message privacy policy | Only governed, purpose-limited prospect context may enter message composition; arbitrary or sensitive text is excluded by default. |
| N4 conversation-progression governance | CTA selection is contextual; no universal CTA or mandatory two-option close is created here. |
| N5 prospect-message context contract | The future production input is an allowlisted, classified projection rather than raw Pipeline state. |

Where these sources differ in authority, the Constitution and final ADRs prevail. This document narrows implementation; it does not amend them.

## Canonical production architecture

The sole ratified future production flow is:

```text
Pipeline prospect authority / Relationship authority / future Timeline authority
        / Product Intelligence / Quote authority / official NBA authority
                                |
                                v
                 governed Prospect Context Adapter
                                |
                                v
                    modern NASH Context Intake
                                |
                                v
             evidence validation and privacy filtering
                                |
                                v
       NASH deterministic Conversation Intelligence + Conversation Brief
                                |
                                v
             governed Remote Draft Provider boundary
                                |
                                v
                  Gemini language renderer (optional)
                                |
                                v
                Draft Intake + safety validation
                                |
                                v
             exact-draft human review and approval
                                |
                                v
              explicit user-triggered WhatsApp preview/open
```

The modern context-intake boundary is the sole future production input path to NASH. Raw Pipeline records, arbitrary notes, legacy JSON memory, and direct prompting are not approved inputs. The current runtime may remain in place until separately authorized stages replace it safely; this ratification does not rewire it.

Gemini is only a language renderer. It does not own strategy, evidence, memory, NBA, facts, approval, or delivery. Provider absence must not remove deterministic Forge capability.

## Authority and ownership matrix

| Domain or artifact | Canonical owner | NASH permission | Explicit boundary |
| --- | --- | --- | --- |
| Prospect identity and Pipeline stage | Advisor OS Sales / Pipeline | Consume governed projection | NASH cannot mutate or persist Pipeline truth. |
| Relationship facts | Relationship Intelligence | Consume verified, purpose-limited facts | NASH cannot infer relationship truth or consent. |
| Commercial Timeline | Deferred future Timeline authority | No production consumption until authorized | Schema, RLS, persistence, service ownership, and projection are deferred. |
| Product facts | Product Intelligence | Consume allowed official facts | NASH cannot invent products, coverage, benefits, or recommendations. |
| Quote and accepted numeric truth | Quote authority | Consume authorized facts only | NASH cannot calculate, alter, or promote quote truth. |
| Next Best Action | Official governed NBA authority | Explain an official recommendation | NASH cannot create parallel NBA truth or auto-execute it. |
| Evidence and provenance | Producing source authority | Preserve lineage in the brief | NASH cannot promote unsupported input to fact. |
| Conversation composition | NASH | Own | Composition remains bounded by evidence, privacy, safety, and human authority. |
| Deterministic Conversation Brief | NASH | Own | The brief is derived context, not source truth or approval. |
| Draft language rendering | Remote provider; Gemini is optional renderer | Request language rendering | Provider output is an unapproved candidate only. |
| Draft intake and safety disposition | Governed draft/safety boundaries | Submit and consume disposition | NASH cannot bypass validation. |
| Human approval | Advisor | No ownership | Approval applies only to the exact reviewed artifact. |
| WhatsApp navigation and sending | Advisor plus external application | No delivery authority | Opening and sending require explicit human actions; no automatic send. |
| Presentation assembly | Sales Presenter | Supply governed conversation context only | NASH does not own presentation lifecycle or approval. |
| Persistence | Owning domain repositories | None by this document | No prompt, brief, draft, Timeline, or memory persistence is authorized. |

`NASH_OWNS=CONVERSATION_COMPOSITION,DETERMINISTIC_CONVERSATION_BRIEF`

`NASH_DOES_NOT_OWN=SOURCE_FACTS,NBA_TRUTH,PRODUCT_TRUTH,QUOTE_TRUTH,PERSISTENCE,DELIVERY,HUMAN_APPROVAL`

## Modern input and execution locks

1. Every future production input must enter through modern governed Context Intake.
2. Context must retain owner, source, evidence, verification, freshness, purpose, privacy classification, uncertainty, and human-approval metadata where applicable.
3. Unknown classification, missing evidence, or unknown consent defaults to exclusion from direct message copy.
4. Conversation strategy and the deterministic brief must be produced before any optional provider request.
5. Providers receive only the governed brief, never raw Pipeline state.
6. Draft generation cannot imply approval; approval cannot imply delivery.
7. No lifecycle callback, observer, retry, hydration, or background event may open or send an external communication.
8. No stage after NFAST-01 is authorized by this document.

## Legacy no-execute matrix

All root legacy NASH modules are classified as non-production by default. They remain available as historical evidence or reference, but must not be reconnected, imported into the canonical runtime, moved, archived, or deleted unless an individual later authorization explicitly changes that classification.

| Legacy surface | Classification | Reason and allowed use |
| --- | --- | --- |
| Root `nash-core-engine.js` chain | `DO_NOT_EXECUTE` | Mixed legacy orchestration is not the ratified modern intake path; reference only. |
| Root `nash-master-intelligence-engine.js` chain | `DO_NOT_EXECUTE` | Aggregates legacy authorities and cannot become production orchestration. |
| Root memory and learning engines using `nash-memory/*.json` | `DO_NOT_EXECUTE` | Filesystem/legacy JSON persistence is not an authorized production truth or memory store. |
| Root message recommendation/composition modules | `DO_NOT_EXECUTE` | Hardcoded or parallel composition cannot bypass governed context, evidence, and draft boundaries. |
| Root personality, intent, and motivation inference modules | `DO_NOT_EXECUTE` | Inferred traits or intent cannot be asserted as source facts. |
| Root team ranking/intelligence modules | `DO_NOT_EXECUTE` | Ranking and scoring authority is outside the ratified conversation boundary. |
| Legacy Council, Combat, NBA, coaching, and alert chain | `DO_NOT_EXECUTE` | May be inspected as reference; no parallel decision or execution authority is approved. |
| Legacy fixtures and tests | `TEST_ONLY` or `REFERENCE_ONLY` | They document historical behavior but do not prove production authority. |

`LEGACY_ROOT_NASH_DEFAULT=DO_NOT_EXECUTE`

`LEGACY_PHYSICAL_DELETION_AUTHORIZATION=NO`

No legacy file may be deleted, moved, renamed, archived, or physically altered under NFAST-01.

## Sequential NFAST stage registry

Each stage is independently gated. Completion or documentation of an earlier stage does not authorize a later one.

| Stage | Purpose | Status after NFAST-01 | Required gate |
| --- | --- | --- | --- |
| NFAST-01 | Ratified architecture and ownership lock | `AUTHORIZED_AND_RATIFIED` | Miranda approved; Board approved for NFAST-01 only. |
| NFAST-02 | Prospect Context Intake contract | `READY_PENDING_SEPARATE_AUTHORIZATION` | Miranda stage approval; Board only if authority boundary changes. |
| NFAST-03 | Pipeline context adapter | `NOT_AUTHORIZED` | NFAST-02 acceptance plus runtime/implementation approval. |
| NFAST-04 | Evidence validation and deterministic Conversation Brief | `NOT_AUTHORIZED` | NFAST-03 acceptance plus authority/runtime approval. |
| NFAST-05 | Provider contract hardening | `NOT_AUTHORIZED` | NFAST-04 acceptance plus provider/runtime approval. |
| NFAST-06 | Draft Intake and safety reconciliation | `NOT_AUTHORIZED` | NFAST-05 acceptance plus safety/runtime approval. |
| NFAST-07 | Pipeline runtime integration | `NOT_AUTHORIZED` | NFAST-06 acceptance plus UI/runtime approval. |
| NFAST-08 | Prospect Timeline governance and persistence | `DEFERRED` | Separate Board, schema, persistence, migration, and RLS approvals. |
| NFAST-09 | Timeline-to-Brief projection | `BLOCKED_BY_NFAST_08` | Accepted NFAST-08 authority and separate runtime approval. |
| NFAST-10 | Product, Quote, and Presenter bridges | `NOT_AUTHORIZED` | Separate cross-domain authority and runtime approvals. |
| NFAST-11 | Legacy quarantine and runtime locks | `NOT_AUTHORIZED` | Runtime reachability evidence and separate approval; physical deletion remains prohibited. |
| NFAST-12 | Production acceptance and deployment | `NOT_AUTHORIZED` | All applicable prior acceptance gates plus explicit deployment authorization. |

### Mandatory stage gate

Before each later stage, its executor must record: applicable Constitution and ADRs; Build Tree area; accepted dependency evidence; Miranda status; Board status; authority impact; runtime impact; persistence impact; schema/RLS/migration impact; exact scope and prohibited surfaces; validation plan; rollback; and explicit stage authorization. Missing fields result in `BLOCKED_BY_ROBOCOP_LOCK_001`.

## Timeline deferral

`TIMELINE_SCHEMA_RLS_AUTHORIZATION=DEFERRED`

The existing prospect audit-event surface is not ratified as the commercial Conversation Timeline. Timeline ownership, event vocabulary, persistence, service boundary, migration, RLS, retention, privacy, and Pipeline-to-NASH projection require NFAST-08 or another explicitly approved governance stage. NFAST-01 authorizes none of them.

## NFAST-02 readiness record

- `NEXT_STAGE=NFAST-02_PROSPECT_CONTEXT_INTAKE_CONTRACT`
- `NFAST_02_READINESS_STATUS=READY_FOR_SEPARATE_STAGE_AUTHORIZATION`
- `NFAST_02_AUTHORIZED=NO`
- `NFAST_02_MIRANDA_APPROVAL=REQUIRED`
- `NFAST_02_BOARD_APPROVAL=NOT_REQUIRED_IF_AUTHORITY_REMAINS_WITHIN_THIS_RATIFIED_BOUNDARY`
- `NFAST_02_RUNTIME_CHANGE=NO_EXPECTED`
- `NFAST_02_SCHEMA_RLS_CHANGE=NO`

NFAST-02 may define the governed Context Intake contract only after its own approval token. It must not wire Pipeline, generate drafts, persist context, or broaden ownership. Any departure from these bounds requires renewed Board review.

## Ratified acceptance locks

- NASH owns conversation composition and the deterministic Conversation Brief only.
- Source facts, NBA, Product, Quote, persistence, delivery, and human approval retain their independent owners.
- Gemini remains an optional language renderer.
- Modern Context Intake is the sole future production input path.
- Legacy root NASH is non-production unless individually approved later.
- Physical legacy deletion is prohibited.
- Timeline persistence and its schema/RLS are deferred.
- Runtime behavior, schema, RLS, migrations, provider behavior, and deployment are unchanged by NFAST-01.
- Every NFAST-02 through NFAST-12 stage requires a separate recorded gate and authorization.
