# Forge Action Contract Approval Gate Schema Scope 070B

Status: PASS

Phase:
`070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE`

Decision:
`PASS_070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE`

Locked decision:
`ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPED`

Next:
`070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION`

## Evidence Summary

070B scopes the formal schema contracts needed before any future action can pass through Approval Gate.

Schema names:

- `forge.action_contract.v1`
- `forge.approval_gate.v1`

This is schema scope only. It does not implement runtime validation, execute actions, mutate UI, connect backend, write records, send messages, call providers, access auth/secrets, persist browser state, bypass approval, or invent truth.

## Scoped Foundations

- Action Contract Schema v1 required fields.
- Approval Gate Schema v1 required fields.
- Allowed action states.
- Approval statuses.
- Initial action families.
- Approval rules.
- Payload integrity rules.
- Default safety flags.
- Safe errors.

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

## Final

DECISION=PASS_070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPED

NEXT=070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION
