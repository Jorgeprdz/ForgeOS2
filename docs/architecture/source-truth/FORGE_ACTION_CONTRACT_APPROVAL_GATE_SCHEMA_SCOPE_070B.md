# Forge Action Contract Approval Gate Schema Scope 070B

Status: SCOPED

Phase:
`070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE`

Decision:
`PASS_070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE`

Locked decision:
`ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPED`

Next:
`070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION`

## Robocop Gate

- Applicable Constitution: Forge OS Article 0, Decision Clarity First, Evidence First, no invented truth, no hidden action execution.
- Applicable ADRs and locks: 029A Human Approval Gate scope, 029B Human Approval Gate implementation, 062A Action Contracts scope, 062G Action Contract Read Model Preview decision lock, 064E Backend Approval and Audit Contracts scope, 070A Approval Gate Action Execution Boundary scope.
- Build Tree area: Action Contracts / Approval Gate / Schema Scope.
- Discovery status: 070A closed with `APPROVAL_GATE_ACTION_EXECUTION_BOUNDARY_SCOPED`; prior action-contract and approval surfaces reviewed.
- Implementation readiness: Schema scope only; runtime/schema implementation deferred to 070C.
- Miranda approval: PASS for formalizing schema contracts before any implementation.
- Board approval status: Not required for documentation-only schema scope; future executable implementation remains blocked until approval/capability/audit locks exist.
- Scope boundary: Define schema names, required fields, allowed states, approval rules, payload integrity rules, default safety flags, and safe errors.
- Prohibited surfaces: runtime implementation, action execution real, UI mutation, backend real, CRM write, policy write, quote write, pipeline write, task creation, calendar creation, message send, provider execution real, auth, secret access, browser persistence, real engine execution with effects, approval bypass, invented truth.
- Validation expectation: JSON audit, required markers, diff checks, scoped safety scans, staged boundary.

## Purpose

070B defines the formal schema scope that every future Forge action must satisfy before passing through Approval Gate.

It does not implement runtime validation, execute actions, mutate records, create UI, or connect backend adapters.

## Action Contract Schema v1

Schema name:

`forge.action_contract.v1`

Required fields:

```text
action_id
action_type
action_family
domain
actor
target_ref
input_payload
preview_payload
execution_payload
payload_hash
preview_hash
required_capabilities
required_approval
approval_status
approval_gate
allowed_without_approval
blocked_effects
safety_flags
source_evidence_ids
freshness_metadata
audit_events
rollback_plan
idempotency_key
execution_result
error_model
created_at_policy
expires_at_policy
```

## Approval Gate Schema v1

Schema name:

`forge.approval_gate.v1`

Required fields:

```text
approval_required
approval_status
approver_ref
approval_timestamp
approval_scope
approval_expiration
approved_payload_hash
preview_payload_hash
execution_payload_hash
payload_diff_status
policy_checks
capability_checks
source_evidence_checks
freshness_checks
blocked_effects
safety_flags
pre_approval_audit_event
post_approval_audit_event
rejection_reason
failure_behavior
rollback_behavior
```

## Allowed Action States

- `read`
- `preview`
- `recommend`
- `draft`
- `prepare`
- `approval_required`
- `approved`
- `execute`
- `executed`
- `blocked`
- `rejected`
- `failed`
- `audited`

## Allowed Approval Statuses

- `not_required`
- `required`
- `pending`
- `approved`
- `rejected`
- `expired`
- `revoked`
- `blocked_by_policy`
- `payload_changed`

## Initial Action Families

- `quote.prepare_preview`
- `quote.prepare`
- `quote.generate_document_preview`
- `quote.generate_document`
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

The schema may mark these as allowed without approval only when they remain no-effect:

- `read`
- `preview`
- `recommend`
- local draft not sent
- preview prepare not persisted
- validation report
- blocked effects list
- audit preview event

## Requires Approval

The schema must require approval for:

- any write;
- quote persistence;
- real quote document or proposal generation;
- quote send;
- CRM write;
- policy update, cancel, or renew;
- pipeline stage mutation;
- task creation;
- calendar creation;
- message send;
- provider call;
- backend write;
- anything that changes external state.

## Payload Integrity Rules

- `preview_payload_hash` must exist before approval.
- `execution_payload_hash` must match `approved_payload_hash` before execution.
- If payload changes after approval, block with `ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`.
- `idempotency_key` is required for executable actions.
- `rollback_plan` is required for actions with effects.
- `execution_result` cannot exist before `execute` or `executed`.
- AI cannot mark `approved`.
- Safety validation cannot mark `approved`.
- Approval cannot be inferred from viewing, clicking, hovering, typing, or opening a preview.

## Default Safety Flags

All safety flags default to false:

- `crmWrite`
- `pipelineWrite`
- `policyWrite`
- `quoteWrite`
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
- `approvalBypass`
- `autoSend`
- `autoWrite`

## Safe Errors

- `ACTION_EXECUTION_REQUIRES_APPROVAL`
- `ACTION_CONTRACT_NOT_MODELED`
- `ACTION_EXECUTION_BLOCKED_BY_POLICY`
- `ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`
- `ACTION_APPROVAL_EXPIRED`
- `ACTION_APPROVAL_REVOKED`
- `ACTION_CAPABILITY_NOT_GRANTED`
- `ACTION_SOURCE_EVIDENCE_REQUIRED`
- `ACTION_FRESHNESS_REQUIRED`
- `ACTION_ROLLBACK_PLAN_REQUIRED`

## Non-Authorization

070B does not authorize:

- schema implementation;
- runtime validation implementation;
- action execution;
- UI mutation;
- backend connection;
- CRM, policy, quote, pipeline, task, calendar, message, provider, auth, secret, browser persistence, or real engine side effects;
- approval bypass;
- invented truth.

## Decision

`ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPED`

## Final

DECISION=PASS_070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPED

NEXT=070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION
