export const ACTION_CONTRACT_SCHEMA_VERSION = 'forge.action_contract.v1';
export const APPROVAL_GATE_SCHEMA_VERSION = 'forge.approval_gate.v1';

export const ACTION_STATES = Object.freeze([
  'read',
  'preview',
  'recommend',
  'draft',
  'prepare',
  'approval_required',
  'approved',
  'execute',
  'executed',
  'blocked',
  'rejected',
  'failed',
  'audited'
]);

export const APPROVAL_STATUSES = Object.freeze([
  'not_required',
  'required',
  'pending',
  'approved',
  'rejected',
  'expired',
  'revoked',
  'blocked_by_policy',
  'payload_changed'
]);

export const INITIAL_ACTION_FAMILIES = Object.freeze([
  'quote.prepare_preview',
  'quote.prepare',
  'quote.generate_document_preview',
  'quote.generate_document',
  'quote.send',
  'client.follow_preview',
  'client.follow',
  'opportunity.review_preview',
  'opportunity.stage_change',
  'task.create_preview',
  'task.create',
  'calendar.create_preview',
  'calendar.create',
  'message.draft_preview',
  'message.draft',
  'message.send',
  'policy.review_preview',
  'policy.update'
]);

export const SAFE_ERRORS = Object.freeze([
  'ACTION_EXECUTION_REQUIRES_APPROVAL',
  'ACTION_CONTRACT_NOT_MODELED',
  'ACTION_EXECUTION_BLOCKED_BY_POLICY',
  'ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL',
  'ACTION_APPROVAL_EXPIRED',
  'ACTION_APPROVAL_REVOKED',
  'ACTION_CAPABILITY_NOT_GRANTED',
  'ACTION_SOURCE_EVIDENCE_REQUIRED',
  'ACTION_FRESHNESS_REQUIRED',
  'ACTION_ROLLBACK_PLAN_REQUIRED'
]);

export const DEFAULT_SAFETY_FLAGS = Object.freeze({
  crmWrite: false,
  pipelineWrite: false,
  policyWrite: false,
  quoteWrite: false,
  taskCreate: false,
  calendarCreate: false,
  messageSend: false,
  authReal: false,
  providerRuntime: false,
  secretAccess: false,
  browserPersistence: false,
  realEngineExecution: false,
  realEffectsAllowed: false,
  realEffectsEnabled: false,
  backendConnection: false,
  approvalBypass: false,
  autoSend: false,
  autoWrite: false
});

export const REQUIRED_ACTION_CONTRACT_FIELDS = Object.freeze([
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
]);

export const REQUIRED_APPROVAL_GATE_FIELDS = Object.freeze([
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
]);

const EXECUTION_STATES = Object.freeze(['execute', 'executed']);
const APPROVED_STATUS = 'approved';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeError(code, field, message) {
  return {
    code,
    field,
    message,
    effectExecuted: false
  };
}

function makeValidationResult(errors) {
  return {
    valid: errors.length === 0,
    errors,
    effectExecuted: false,
    schemaImplementation: '070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION'
  };
}

function missingRequiredFields(source, requiredFields) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return [...requiredFields];
  }

  return requiredFields.filter((field) => !Object.prototype.hasOwnProperty.call(source, field));
}

function hasEvidence(actionContract) {
  return Array.isArray(actionContract.source_evidence_ids) && actionContract.source_evidence_ids.length > 0;
}

function hasFreshness(actionContract) {
  return Boolean(
    actionContract.freshness_metadata &&
    typeof actionContract.freshness_metadata === 'object' &&
    !Array.isArray(actionContract.freshness_metadata)
  );
}

function hasRollbackPlan(actionContract) {
  return Boolean(
    actionContract.rollback_plan &&
    typeof actionContract.rollback_plan === 'object' &&
    !Array.isArray(actionContract.rollback_plan) &&
    Object.keys(actionContract.rollback_plan).length > 0
  );
}

function isExecutableOrEffectful(actionContract) {
  if (!actionContract || typeof actionContract !== 'object') return false;
  if (actionContract.allowed_without_approval === false) return true;
  if (actionContract.required_approval === true) return true;
  if (EXECUTION_STATES.includes(actionContract.action_state)) return true;
  return INITIAL_ACTION_FAMILIES.includes(actionContract.action_family) &&
    !String(actionContract.action_family).endsWith('_preview') &&
    !['read', 'preview', 'recommend', 'draft'].includes(actionContract.action_type);
}

function approverLooksNonHuman(approvalGate) {
  const approver = approvalGate?.approver_ref || {};
  const values = [
    approver.type,
    approver.actor_type,
    approver.source,
    approver.role,
    approver.system
  ].map((value) => String(value || '').toLowerCase());

  return values.some((value) => (
    value.includes('ai') ||
    value.includes('llm') ||
    value.includes('safety_validation') ||
    value.includes('automation')
  ));
}

export function getActionContractSchema() {
  return {
    schemaName: ACTION_CONTRACT_SCHEMA_VERSION,
    requiredFields: clone(REQUIRED_ACTION_CONTRACT_FIELDS),
    actionStates: clone(ACTION_STATES),
    approvalStatuses: clone(APPROVAL_STATUSES),
    initialActionFamilies: clone(INITIAL_ACTION_FAMILIES),
    safeErrors: clone(SAFE_ERRORS),
    defaultSafetyFlags: clone(DEFAULT_SAFETY_FLAGS),
    noEffectSchemaOnly: true
  };
}

export function getApprovalGateSchema() {
  return {
    schemaName: APPROVAL_GATE_SCHEMA_VERSION,
    requiredFields: clone(REQUIRED_APPROVAL_GATE_FIELDS),
    approvalStatuses: clone(APPROVAL_STATUSES),
    safeErrors: clone(SAFE_ERRORS),
    defaultSafetyFlags: clone(DEFAULT_SAFETY_FLAGS),
    noEffectSchemaOnly: true
  };
}

export function validateActionContractShape(actionContract) {
  const errors = missingRequiredFields(actionContract, REQUIRED_ACTION_CONTRACT_FIELDS)
    .map((field) => makeError('ACTION_CONTRACT_NOT_MODELED', field, `Missing action contract field: ${field}`));

  if (actionContract && typeof actionContract === 'object') {
    if (actionContract.schema_version && actionContract.schema_version !== ACTION_CONTRACT_SCHEMA_VERSION) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'schema_version', 'Unsupported action contract schema version.'));
    }
    if (actionContract.action_state && !ACTION_STATES.includes(actionContract.action_state)) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'action_state', 'Unsupported action state.'));
    }
    if (!APPROVAL_STATUSES.includes(actionContract.approval_status)) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'approval_status', 'Unsupported approval status.'));
    }
    Object.entries(actionContract.safety_flags || {}).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SAFETY_FLAGS, key) && value !== false) {
        errors.push(makeError('ACTION_EXECUTION_BLOCKED_BY_POLICY', `safety_flags.${key}`, 'Safety flags must remain false in schema-only mode.'));
      }
    });
  }

  return makeValidationResult(errors);
}

export function validateApprovalGateShape(approvalGate) {
  const errors = missingRequiredFields(approvalGate, REQUIRED_APPROVAL_GATE_FIELDS)
    .map((field) => makeError('ACTION_CONTRACT_NOT_MODELED', field, `Missing approval gate field: ${field}`));

  if (approvalGate && typeof approvalGate === 'object') {
    if (approvalGate.schema_version && approvalGate.schema_version !== APPROVAL_GATE_SCHEMA_VERSION) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'schema_version', 'Unsupported approval gate schema version.'));
    }
    if (!APPROVAL_STATUSES.includes(approvalGate.approval_status)) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'approval_status', 'Unsupported approval status.'));
    }
    Object.entries(approvalGate.safety_flags || {}).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SAFETY_FLAGS, key) && value !== false) {
        errors.push(makeError('ACTION_EXECUTION_BLOCKED_BY_POLICY', `safety_flags.${key}`, 'Safety flags must remain false in schema-only mode.'));
      }
    });
  }

  return makeValidationResult(errors);
}

export function validatePayloadIntegrity(actionContract) {
  const errors = [];

  if (!actionContract || typeof actionContract !== 'object' || Array.isArray(actionContract)) {
    return makeValidationResult([
      makeError('ACTION_CONTRACT_NOT_MODELED', 'actionContract', 'Action contract must be an object.')
    ]);
  }

  if (actionContract.execution_result != null && !EXECUTION_STATES.includes(actionContract.action_state)) {
    errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'execution_result', 'Execution result cannot exist before execute or executed state.'));
  }

  if (actionContract.required_approval === true && actionContract.approval_status !== APPROVED_STATUS) {
    errors.push(buildApprovalRequiredError());
  }

  const gate = actionContract.approval_gate || {};
  if (
    actionContract.approval_status === APPROVED_STATUS &&
    gate.approval_status === APPROVED_STATUS &&
    approverLooksNonHuman(gate)
  ) {
    errors.push(makeError('ACTION_EXECUTION_BLOCKED_BY_POLICY', 'approval_gate.approver_ref', 'AI or safety validation cannot mark an action approved.'));
  }

  const approvedPayloadHash = gate.approved_payload_hash || actionContract.approved_payload_hash;
  const executionPayloadHash = gate.execution_payload_hash || actionContract.execution_payload_hash;
  if (approvedPayloadHash && executionPayloadHash && approvedPayloadHash !== executionPayloadHash) {
    errors.push(makeError('ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL', 'execution_payload_hash', 'Execution payload hash does not match approved payload hash.'));
  }

  if (isExecutableOrEffectful(actionContract)) {
    if (!hasEvidence(actionContract)) {
      errors.push(makeError('ACTION_SOURCE_EVIDENCE_REQUIRED', 'source_evidence_ids', 'Executable actions require source evidence.'));
    }
    if (!hasFreshness(actionContract)) {
      errors.push(makeError('ACTION_FRESHNESS_REQUIRED', 'freshness_metadata', 'Executable actions require freshness metadata.'));
    }
    if (!hasRollbackPlan(actionContract)) {
      errors.push(makeError('ACTION_ROLLBACK_PLAN_REQUIRED', 'rollback_plan', 'Effectful actions require a rollback plan.'));
    }
    if (!actionContract.idempotency_key) {
      errors.push(makeError('ACTION_CONTRACT_NOT_MODELED', 'idempotency_key', 'Executable actions require an idempotency key.'));
    }
  }

  return makeValidationResult(errors);
}

export function buildActionContractNotModeledError() {
  return makeError('ACTION_CONTRACT_NOT_MODELED', 'action_contract', 'Action contract is not modeled for this request.');
}

export function buildApprovalRequiredError() {
  return makeError('ACTION_EXECUTION_REQUIRES_APPROVAL', 'approval_status', 'Action execution requires explicit approval.');
}
