# Forge Relationship Opportunity Signal Adapter Scope 067B

Status: SCOPED

Phase:
`067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE`

Decision:
`RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED`

Base:

- `067A_OPPORTUNITY_PIPELINE_CANONICAL_SOURCE_MAPPING_SCOPE`
- `066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK`
- `066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION`

## Purpose

067B scopes a no-effect signal adapter lane from `relationship-opportunity-engine.js` into the future Opportunity Pipeline read model normalization path.

This phase does not implement the adapter and does not replace the 066B local/static shim.

## Source Candidate

Primary source candidate:
`relationship-opportunity-engine.js`

067B treats this module as a relationship-derived opportunity signal candidate, not as canonical opportunity truth.

## Adapter Boundary

The future adapter may read relationship opportunity signals and produce normalized signal envelopes. It must not create, update, delete, merge, mutate stage, write CRM, create tasks, create calendar events, send messages, call providers, access secrets, persist browser state, or execute real engines.

## Allowed Signal Inputs

- relationship strength signal;
- referral proximity signal;
- advisor/client interaction signal;
- detected need or intent signal;
- stale follow-up signal;
- relationship risk signal;
- source evidence reference;
- source freshness metadata.

## Required Signal Envelope

| Field | Requirement |
| --- | --- |
| `signal_id` | Stable deterministic id for preview/dry-run mapping |
| `source_module` | Must be `relationship-opportunity-engine.js` |
| `source_signal_type` | Explicit signal type, never invented |
| `client_ref` | Optional until canonical client ownership is mapped |
| `opportunity_candidate_ref` | Candidate-only reference, not opportunity truth |
| `confidence_preview` | Preview estimate only; never fact |
| `priority_hint` | Derived hint only; cannot mutate pipeline priority |
| `next_action_hint` | Draft recommendation only; no task/calendar/message action |
| `risk_flags` | Evidence-backed flags only |
| `source_evidence_ids` | Required for every signal |
| `freshness_metadata` | Required freshness status and timestamp/source label |
| `audit_event` | Must map to `read_model_used` or future signal-read audit |
| `blocked_effects` | Required blocked-effect list |
| `safety_flags` | All real-effect flags must remain false |

## Explicitly Not Authorized

- canonical opportunity creation;
- source-of-truth ownership claim;
- pipeline stage mutation;
- CRM write;
- task/calendar/message creation;
- quote or policy update;
- provider/runtime execution;
- relationship score as fact without evidence;
- forecast as fact;
- money or premium as real value;
- UI projection as source truth.

## Required Before Implementation

Before implementation, Forge must define:

- relationship signal input schema;
- signal envelope output schema;
- relationship source evidence rules;
- source freshness rules;
- empty state rules;
- safe error model;
- permission/capability model;
- no-effect adapter policy;
- audit event mapping;
- mapping bridge into Opportunity Pipeline read model normalization.

## Next Phase

Recommended next phase:

`067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE`

Reason:
After signal adapter scope, Forge should define how relationship-derived signals normalize into the locked Opportunity Pipeline read model without claiming canonical opportunity truth.

## Final

DECISION=PASS_067B_RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPE

LOCKED_DECISION=RELATIONSHIP_OPPORTUNITY_SIGNAL_ADAPTER_SCOPED

NEXT=067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE
