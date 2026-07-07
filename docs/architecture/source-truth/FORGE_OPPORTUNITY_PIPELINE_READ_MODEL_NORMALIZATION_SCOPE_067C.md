# Forge Opportunity Pipeline Read Model Normalization Scope 067C

Status: SCOPED

Phase:
`067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE`

Decision:
`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPED`

Base:

- `067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE`
- `067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE`
- `066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK`

## Robocop Gate

- Applicable Constitution: Article 0, Decision Clarity First, Advisor-first, no invented truth, forecasts are not facts, Forge decides and AI explains.
- Applicable ADRs: 066D, 067A, 067B continuity for Opportunity Pipeline read-only boundaries.
- Build Tree area: Opportunity Pipeline / Read Model Normalization / Candidate-only scope.
- Discovery status: 067A selected relationship opportunity as first candidate lane; 067B scoped the signal adapter lane.
- Implementation readiness: Not implementation-ready. 067C is docs/scope only.
- Miranda approval: PASS for bounded scope only.
- Board approval status: Not assumed.
- Scope boundary: Define candidate-only normalization contract from relationship opportunity signal envelopes to Opportunity Pipeline read model candidates.
- Prohibited surfaces: UI mutation, backend real, CRM write, pipeline write, task creation, calendar creation, message send, auth, provider execution, secret access, browser persistence, real engine execution.
- Validation expectation: JSON audit, required markers, diff checks, safety scan, exact staged boundary.

## Purpose

067C scopes how future 067B relationship opportunity signal envelopes can normalize into Opportunity Pipeline read model candidate rows.

This phase does not implement normalization logic.

This phase does not replace the 066B temporary local/static/read-only shim.

This phase does not create canonical opportunity truth.

## Scope Lock

Normalization is candidate-only.

Relationship signals do not create real opportunities.

Every non-empty normalized field must be backed by:

- source evidence;
- freshness metadata;
- no-effect safety flags;
- blocked effects;
- audit event context.

If a field cannot be evidence-backed, it must remain empty, unknown, preview-only, or not modeled.

Safe error:
`OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`

Locked decision:
`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPED`

## Input Envelope From Future 067B

The future relationship signal adapter should provide this signal envelope:

| Field | Requirement |
| --- | --- |
| `signal_id` | Stable deterministic id for candidate mapping |
| `source_module` | Must identify the source module, initially `relationship-opportunity-engine.js` |
| `source_signal_type` | Explicit signal type; never inferred silently |
| `client_ref` | Client reference candidate; not client source truth |
| `opportunity_candidate_ref` | Candidate reference only; not canonical opportunity id |
| `confidence_preview` | Preview confidence only; never fact |
| `priority_hint` | Hint only; cannot mutate pipeline priority |
| `next_action_hint` | Recommendation preview only; no task, calendar, or message creation |
| `risk_flags` | Evidence-backed flags only |
| `source_evidence_ids` | Required for every non-empty normalized field |
| `freshness_metadata` | Required source freshness label and timestamp/context |
| `audit_event` | Read/signal audit event only |
| `blocked_effects` | Required blocked-effect list |
| `safety_flags` | All real-effect flags false |

## Output Candidate Read Model Fields

067C scopes the candidate output shape for the future Opportunity Pipeline read model:

| Field | Normalization Rule |
| --- | --- |
| `opportunity_id` | Candidate id only, derived deterministically from signal id and source context |
| `client_ref` | Copied from signal only when evidence-backed and freshness is present |
| `display_name` | Derived preview label; must not invent product, premium, or opportunity truth |
| `stage` | Candidate/read-only stage only; no mutation and no canonical stage ownership claim |
| `status` | Candidate status such as `candidate_preview`, `not_modeled`, `blocked`, or `source_unavailable` |
| `priority` | Derived from `priority_hint` only when evidence-backed |
| `probability` | Preview estimate only; never fact |
| `expected_value_preview` | Empty or preview placeholder unless source-truth evidence exists |
| `next_action` | Derived from `next_action_hint` as recommendation preview only |
| `followup_due_state` | Preview/read-only due state only with freshness metadata |
| `risk_flags` | Copied or normalized from evidence-backed signal flags |
| `policy_summary_refs` | Reference-only; no policy truth creation |
| `quote_summary_refs` | Reference-only; no quote truth creation |
| `source_evidence_ids` | Required for every non-empty field |
| `freshness_metadata` | Required on every candidate row |
| `audit_event` | Must remain no-effect read/signal audit |
| `blocked_effects` | Required explicit blocked-effect list |
| `safety_flags` | All real-effect flags false |

## Required Empty State

The future normalizer must return a safe empty state when:

- no signal is available;
- signal schema is missing required evidence;
- freshness metadata is absent;
- client reference cannot be mapped safely;
- source signal type is unsupported;
- a field would require invented truth;
- the normalizer is not implemented yet.

Allowed empty state reason:
`not_modeled`

Safe error:
`OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`

## Not Authorized

067C does not authorize:

- canonical opportunity creation;
- opportunity source truth ownership;
- CRM write;
- pipeline write;
- stage mutation;
- task creation;
- calendar creation;
- message send;
- auth runtime;
- provider execution;
- secret access;
- browser persistence;
- real engine execution;
- monetary truth without evidence;
- premium truth without source ownership;
- forecast as fact;
- UI projection as source truth.

## Safety Flags

All future normalized candidates must keep these false:

- `crmWrite`
- `pipelineWrite`
- `taskCreate`
- `calendarCreate`
- `messageSend`
- `authReal`
- `providerRuntime`
- `secretAccess`
- `browserPersistence`
- `realEngineExecution`
- `realEffectsAllowed`
- `realEffectsEnabled`
- `backendConnection`

## Relationship To 066B

066B remains:
`OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_LOCKED_AS_TEMPORARY_LOCAL_STATIC_SHIM`

067C does not replace 066B and does not create a production adapter.

067C only scopes how a future implementation may normalize relationship-derived signals into candidate rows compatible with the Opportunity Pipeline read model boundary.

## Implementation Gate For 067D

067D may implement only if it preserves:

- candidate-only normalization;
- no canonical opportunity truth;
- no real effects;
- evidence and freshness required for non-empty fields;
- safe empty state;
- `OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`;
- all safety flags false;
- 066B as temporary local/static/read-only shim until a later decision replaces it.

## Next Phase

Recommended next phase:

`067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION`

## Final

DECISION=PASS_067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPED

NEXT=067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION
