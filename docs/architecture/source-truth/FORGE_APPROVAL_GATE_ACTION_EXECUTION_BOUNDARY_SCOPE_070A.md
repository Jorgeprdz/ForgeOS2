# Forge Approval Gate Action Execution Boundary Scope 070A

Status: SCOPED

Phase:
`070A_APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPE`

Decision:
`PASS_070A_APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPE`

Locked decision:
`APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPED`

Next:
`070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE`

## Robocop Gate

- Applicable Constitution: Forge OS Article 0, Decision Clarity First, Evidence First, no invented truth, no hidden action execution.
- Applicable ADRs and locks: 029A Human Approval Gate scope, 029B Human Approval Gate implementation, 062A Action Contracts scope, 062G Action Contract Read Model Preview decision lock, 064E Backend Approval and Audit Contracts scope, 069E Quote Read Model Adapter decision lock.
- Build Tree area: Action Contracts / Approval Gate / Execution Boundary.
- Discovery status: Existing human approval, action contract preview, backend approval/audit, and quote read-model locks reviewed.
- Implementation readiness: Scope only; implementation deferred to 070B+.
- Miranda approval: PASS for defining the constitutional boundary before any real action execution.
- Board approval status: Not required for documentation-only scope; future effectful implementation will require approval, capability, audit, and adapter locks.
- Scope boundary: Define action states, approval boundary, required fields, safe errors, and non-authorization rules.
- Prohibited surfaces: implementation, UI mutation, backend real, CRM write, policy write, quote write, pipeline write, task creation, calendar creation, message send, provider execution real, auth, secret access, browser persistence, real engine execution with effects, approval bypass, invented truth.
- Validation expectation: JSON audit, required markers, diff checks, scoped safety scans, staged boundary.

## Purpose

070A defines the constitutional boundary between preview/recommendation/draft/prepare behavior and real action execution.

Forge may read, explain, recommend, draft, prepare preview payloads, and show blocked effects. Forge must not execute a real effect until the action contract, approval gate, capability, audit, idempotency, adapter, and error model all allow it.

## What Approval Gate Is

Approval Gate is the boundary between:

- preview;
- recommendation;
- draft;
- prepare;
- validation;
- review;

and real execution.

No write or external effect can occur without explicit human approval.

AI may explain, prepare, suggest, or assemble preview payloads. Forge remains responsible for blocking execution until approval and capability gates are satisfied. AI output is never approval and never source truth.

## Action States

Minimum action states:

- `read`: source or read model is accessed without mutation.
- `preview`: a non-effect payload or view is produced.
- `recommend`: Forge suggests an action as a recommendation, not a fact.
- `draft`: a draft artifact exists but is not sent, persisted as truth, or executed.
- `prepare`: Forge prepares a candidate payload for review.
- `approval_required`: the next effectful step is blocked until explicit approval.
- `approved`: a human approved the exact payload within scope and expiration.
- `execute`: an execution attempt is requested after approval and capability checks.
- `executed`: the effect succeeded and was audited.
- `blocked`: execution is blocked by policy, missing approval, missing capability, stale evidence, or unsupported adapter.
- `rejected`: the human reviewer rejected the payload.
- `failed`: the attempted operation failed safely.
- `audited`: the transition was recorded in the required audit shape.

## Initial Action Coverage

070A covers the following initial action types:

- `quote.prepare_preview`
- `quote.prepare`
- `quote.generate_document_preview`
- `quote.send`
- `client.follow_preview`
- `client.follow`
- `opportunity.review_preview`
- `opportunity.stage_change`
- `task.create_preview`
- `task.create`
- `calendar.create_preview`
- `calendar.create`
- `message.draft_preview`
- `message.draft`
- `message.send`
- `policy.review_preview`
- `policy.update`

## Allowed Without Approval

The following may occur without approval when they remain preview-safe and no-effect:

- read models;
- preview payloads;
- recommendations labeled as recommendations;
- drafts that are not sent;
- prepared quote candidates that are not persisted;
- validation reports;
- blocked effects lists;
- audit preview events.

Allowed-without-approval behavior must still carry source evidence, freshness, safety flags, blocked effects, and an audit event where applicable.

## Requires Approval

The following require approval before any real effect:

- quote creation or persistence;
- PDF or proposal generation if treated as a real client artifact;
- quote send;
- CRM write;
- pipeline stage mutation;
- policy update, cancel, or renew;
- task creation;
- calendar creation;
- message send;
- provider call;
- backend write;
- anything that changes state outside preview.

Approval cannot be inferred from viewing, clicking, hovering, typing, opening a preview, selecting a command, or reading a recommendation.

## Prohibited Even With 070A

070A does not authorize:

- approval bypass;
- auto-send;
- automatic CRM, policy, quote, or pipeline writes;
- provider execution without a locked adapter;
- secret access outside an authorized boundary;
- browser persistence as hidden state;
- invented truth;
- executing recommendations as facts;
- silent record mutation;
- treating safety validation as approval;
- treating AI output as approval;
- treating a draft as sent communication.

## Required Action Contract Fields

Future action contracts must include:

```text
action_id
action_type
domain
actor
target_ref
input_payload
preview_payload
required_capabilities
required_approval
approval_status
allowed_without_approval
blocked_effects
safety_flags
source_evidence_ids
freshness_metadata
audit_event
rollback_plan
idempotency_key
execution_result
error_model
```

## Approval Gate Contract

Future approval gate schema must define:

- who can approve;
- approval timestamp;
- approval scope;
- approval expiration;
- exact payload approved;
- diff between preview payload and execution payload;
- policy checks;
- audit event before approval;
- audit event after approval;
- failure behavior;
- rollback or remediation behavior.

Approval must bind to the exact payload approved. Any material payload change requires reapproval.

## Safe Errors

Required safe errors:

- `ACTION_EXECUTION_REQUIRES_APPROVAL`
- `ACTION_CONTRACT_NOT_MODELED`
- `ACTION_EXECUTION_BLOCKED_BY_POLICY`
- `ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`

## Relationship To Existing Locks

029A/029B already establish that human approval is explicit, attributable, exact-artifact-bound, time-aware, and not send execution.

062A/062G already establish that command-bar action contracts are preview-safe and that real effects remain disabled.

064E already establishes approval, audit, idempotency, capability, and domain matrix requirements before any write-capable or external-effect adapter.

069E already locks Quote Read Model as read-only and explicitly leaves Quote Action Contract as future work.

070A connects those lines and scopes the boundary for action execution without implementing it.

## Decision

`APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPED`

## Final

DECISION=PASS_070A_APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPE

LOCKED_DECISION=APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPED

NEXT=070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE
