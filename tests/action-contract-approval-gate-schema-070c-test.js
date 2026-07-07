import assert from 'node:assert/strict';
import {
  ACTION_CONTRACT_SCHEMA_VERSION,
  APPROVAL_GATE_SCHEMA_VERSION,
  ACTION_STATES,
  APPROVAL_STATUSES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_ACTION_CONTRACT_FIELDS,
  REQUIRED_APPROVAL_GATE_FIELDS,
  SAFE_ERRORS,
  getActionContractSchema,
  getApprovalGateSchema,
  validateActionContractShape,
  validateApprovalGateShape,
  validatePayloadIntegrity,
  buildActionContractNotModeledError,
  buildApprovalRequiredError
} from '../platform/action-contracts/action-contract-approval-gate-schema-070c.js';

const expectedActionFields = [
  'action_id',
  'action_type',
  'action_family',
  'domain',
  'actor',
  'target_ref',
  'input_payload',
  'preview_payload',
  'execution_payload',
  'payload_hash',
  'preview_hash',
  'required_capabilities',
  'required_approval',
  'approval_status',
  'approval_gate',
  'allowed_without_approval',
  'blocked_effects',
  'safety_flags',
  'source_evidence_ids',
  'freshness_metadata',
  'audit_events',
  'rollback_plan',
  'idempotency_key',
  'execution_result',
  'error_model',
  'created_at_policy',
  'expires_at_policy'
];

const expectedGateFields = [
  'approval_required',
  'approval_status',
  'approver_ref',
  'approval_timestamp',
  'approval_scope',
  'approval_expiration',
  'approved_payload_hash',
  'preview_payload_hash',
  'execution_payload_hash',
  'payload_diff_status',
  'policy_checks',
  'capability_checks',
  'source_evidence_checks',
  'freshness_checks',
  'blocked_effects',
  'safety_flags',
  'pre_approval_audit_event',
  'post_approval_audit_event',
  'rejection_reason',
  'failure_behavior',
  'rollback_behavior'
];

function assertAllSafetyFlagsFalse(flags) {
  Object.entries(DEFAULT_SAFETY_FLAGS).forEach(([key, value]) => {
    assert.equal(value, false, `${key} default must be false`);
    assert.equal(flags[key], false, `${key} instance must be false`);
  });
}

function baseApprovalGate(overrides = {}) {
  return {
    approval_required: false,
    approval_status: 'not_required',
    approver_ref: null,
    approval_timestamp: null,
    approval_scope: 'preview_only',
    approval_expiration: null,
    approved_payload_hash: null,
    preview_payload_hash: 'preview_hash_070c',
    execution_payload_hash: null,
    payload_diff_status: 'not_applicable',
    policy_checks: [],
    capability_checks: [],
    source_evidence_checks: [],
    freshness_checks: [],
    blocked_effects: [],
    safety_flags: { ...DEFAULT_SAFETY_FLAGS },
    pre_approval_audit_event: { event: 'preview_created' },
    post_approval_audit_event: null,
    rejection_reason: null,
    failure_behavior: 'block_without_effect',
    rollback_behavior: 'not_required',
    ...overrides
  };
}

function baseActionContract(overrides = {}) {
  return {
    action_id: 'action_preview_070c',
    action_type: 'preview',
    action_family: 'quote.prepare_preview',
    action_state: 'preview',
    domain: 'quote',
    actor: { actor_type: 'advisor', actor_id: 'advisor_preview' },
    target_ref: { target_type: 'opportunity', target_id: 'opp_preview' },
    input_payload: { source: 'static_preview' },
    preview_payload: { summary: 'Preview only' },
    execution_payload: null,
    payload_hash: 'payload_hash_070c',
    preview_hash: 'preview_hash_070c',
    required_capabilities: [],
    required_approval: false,
    approval_status: 'not_required',
    approval_gate: baseApprovalGate(),
    allowed_without_approval: true,
    blocked_effects: ['quote_create', 'provider_call'],
    safety_flags: { ...DEFAULT_SAFETY_FLAGS },
    source_evidence_ids: ['evidence_preview_070c'],
    freshness_metadata: { status: 'preview_static' },
    audit_events: [{ event: 'preview_created' }],
    rollback_plan: null,
    idempotency_key: null,
    execution_result: null,
    error_model: { safe_errors: [...SAFE_ERRORS] },
    created_at_policy: 'static_no_runtime_clock',
    expires_at_policy: 'not_applicable',
    ...overrides
  };
}

function errorCodes(result) {
  return result.errors.map((error) => error.code);
}

const actionSchema = getActionContractSchema();
const approvalSchema = getApprovalGateSchema();

assert.equal(ACTION_CONTRACT_SCHEMA_VERSION, 'forge.action_contract.v1');
assert.equal(APPROVAL_GATE_SCHEMA_VERSION, 'forge.approval_gate.v1');
assert.equal(actionSchema.schemaName, 'forge.action_contract.v1');
assert.equal(approvalSchema.schemaName, 'forge.approval_gate.v1');
assert.ok(ACTION_STATES.includes('approval_required'));
assert.ok(APPROVAL_STATUSES.includes('payload_changed'));

expectedActionFields.forEach((field) => {
  assert.ok(REQUIRED_ACTION_CONTRACT_FIELDS.includes(field), `missing action field ${field}`);
  assert.ok(actionSchema.requiredFields.includes(field), `missing schema action field ${field}`);
});

expectedGateFields.forEach((field) => {
  assert.ok(REQUIRED_APPROVAL_GATE_FIELDS.includes(field), `missing approval gate field ${field}`);
  assert.ok(approvalSchema.requiredFields.includes(field), `missing schema approval gate field ${field}`);
});

assertAllSafetyFlagsFalse(DEFAULT_SAFETY_FLAGS);

const previewAction = baseActionContract();
assert.equal(validateActionContractShape(previewAction).valid, true);
assert.equal(validateApprovalGateShape(previewAction.approval_gate).valid, true);
assert.equal(validatePayloadIntegrity(previewAction).valid, true);

const unapprovedWrite = baseActionContract({
  action_id: 'action_write_without_approval_070c',
  action_type: 'execute',
  action_family: 'quote.send',
  action_state: 'approval_required',
  required_approval: true,
  approval_status: 'pending',
  allowed_without_approval: false,
  idempotency_key: 'idem_quote_send_070c',
  rollback_plan: { strategy: 'block_before_effect' },
  approval_gate: baseApprovalGate({
    approval_required: true,
    approval_status: 'pending'
  })
});
assert.ok(errorCodes(validatePayloadIntegrity(unapprovedWrite)).includes('ACTION_EXECUTION_REQUIRES_APPROVAL'));

const changedPayload = baseActionContract({
  action_id: 'action_changed_payload_070c',
  action_type: 'execute',
  action_family: 'quote.send',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  execution_payload: { send: 'candidate' },
  execution_payload_hash: 'execution_hash_changed_070c',
  idempotency_key: 'idem_changed_070c',
  rollback_plan: { strategy: 'block_before_effect' },
  approval_gate: baseApprovalGate({
    approval_required: true,
    approval_status: 'approved',
    approver_ref: { actor_type: 'human', actor_id: 'advisor_preview' },
    approved_payload_hash: 'approved_hash_070c',
    execution_payload_hash: 'execution_hash_changed_070c'
  })
});
assert.ok(errorCodes(validatePayloadIntegrity(changedPayload)).includes('ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL'));

const missingEvidence = baseActionContract({
  action_id: 'action_missing_evidence_070c',
  action_type: 'execute',
  action_family: 'task.create',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  source_evidence_ids: [],
  idempotency_key: 'idem_missing_evidence_070c',
  rollback_plan: { strategy: 'block_before_effect' }
});
assert.ok(errorCodes(validatePayloadIntegrity(missingEvidence)).includes('ACTION_SOURCE_EVIDENCE_REQUIRED'));

const missingFreshness = baseActionContract({
  action_id: 'action_missing_freshness_070c',
  action_type: 'execute',
  action_family: 'calendar.create',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  freshness_metadata: null,
  idempotency_key: 'idem_missing_freshness_070c',
  rollback_plan: { strategy: 'block_before_effect' }
});
assert.ok(errorCodes(validatePayloadIntegrity(missingFreshness)).includes('ACTION_FRESHNESS_REQUIRED'));

const missingRollback = baseActionContract({
  action_id: 'action_missing_rollback_070c',
  action_type: 'execute',
  action_family: 'message.send',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  idempotency_key: 'idem_missing_rollback_070c',
  rollback_plan: null
});
assert.ok(errorCodes(validatePayloadIntegrity(missingRollback)).includes('ACTION_ROLLBACK_PLAN_REQUIRED'));

const prematureResult = baseActionContract({
  action_id: 'action_premature_result_070c',
  execution_result: { status: 'executed' }
});
assert.ok(errorCodes(validatePayloadIntegrity(prematureResult)).includes('ACTION_CONTRACT_NOT_MODELED'));

const aiApproved = baseActionContract({
  action_id: 'action_ai_approved_070c',
  action_type: 'execute',
  action_family: 'quote.send',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  idempotency_key: 'idem_ai_approved_070c',
  rollback_plan: { strategy: 'block_before_effect' },
  approval_gate: baseApprovalGate({
    approval_required: true,
    approval_status: 'approved',
    approver_ref: { actor_type: 'ai', actor_id: 'alfred_preview' },
    approved_payload_hash: 'same_hash_070c',
    execution_payload_hash: 'same_hash_070c'
  })
});
assert.ok(errorCodes(validatePayloadIntegrity(aiApproved)).includes('ACTION_EXECUTION_BLOCKED_BY_POLICY'));

const safetyValidationApproved = baseActionContract({
  action_id: 'action_safety_validation_approved_070c',
  action_type: 'execute',
  action_family: 'quote.send',
  action_state: 'execute',
  required_approval: false,
  approval_status: 'approved',
  allowed_without_approval: false,
  idempotency_key: 'idem_safety_validation_070c',
  rollback_plan: { strategy: 'block_before_effect' },
  approval_gate: baseApprovalGate({
    approval_required: true,
    approval_status: 'approved',
    approver_ref: { actor_type: 'safety_validation', actor_id: 'validator_preview' },
    approved_payload_hash: 'same_hash_070c',
    execution_payload_hash: 'same_hash_070c'
  })
});
assert.ok(errorCodes(validatePayloadIntegrity(safetyValidationApproved)).includes('ACTION_EXECUTION_BLOCKED_BY_POLICY'));

assert.equal(buildActionContractNotModeledError().code, 'ACTION_CONTRACT_NOT_MODELED');
assert.equal(buildApprovalRequiredError().code, 'ACTION_EXECUTION_REQUIRES_APPROVAL');

console.log('PASS action contract approval gate schema 070C');
