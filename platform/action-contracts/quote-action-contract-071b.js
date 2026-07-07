'use strict';

const crypto = require('crypto');

const QUOTE_ACTION_CONTRACT_ID = 'forge.quote.action_contract.v1';
const ACTION_CONTRACT_SCHEMA_VERSION = 'forge.action_contract.v1';
const APPROVAL_GATE_SCHEMA_VERSION = 'forge.approval_gate.v1';
const DOMAIN_ID = 'quote';

const NO_EFFECT_PREVIEW_FAMILIES = Object.freeze([
  'quote.prepare_preview',
  'quote.generate_document_preview',
  'quote.validate_preview',
  'quote.compare_preview',
  'quote.blocked_effects_preview',
]);

const APPROVAL_REQUIRED_FAMILIES = Object.freeze([
  'quote.prepare',
  'quote.generate_document',
  'quote.save',
  'quote.send',
  'quote.convert_to_policy',
  'quote.attach_to_opportunity',
  'quote.write_to_crm',
  'quote.provider_submit',
]);

const SAFE_ERRORS = Object.freeze({
  NOT_MODELED: 'QUOTE_ACTION_CONTRACT_NOT_MODELED',
  REQUIRES_APPROVAL: 'QUOTE_ACTION_REQUIRES_APPROVAL',
  PAYLOAD_CHANGED_AFTER_APPROVAL: 'QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL',
  SOURCE_EVIDENCE_REQUIRED: 'QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED',
  FRESHNESS_REQUIRED: 'QUOTE_ACTION_FRESHNESS_REQUIRED',
  ROLLBACK_PLAN_REQUIRED: 'QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED',
  CAPABILITY_NOT_GRANTED: 'QUOTE_ACTION_CAPABILITY_NOT_GRANTED',
  BLOCKED_BY_POLICY: 'QUOTE_ACTION_BLOCKED_BY_POLICY',
  PROVIDER_NOT_AUTHORIZED: 'QUOTE_ACTION_PROVIDER_NOT_AUTHORIZED',
  REAL_EFFECT_NOT_ALLOWED: 'QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED',
});

const DEFAULT_SAFETY_FLAGS = Object.freeze({
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
  autoWrite: false,
});

const REQUIRED_QUOTE_ACTION_CONTRACT_FIELDS = Object.freeze([
  'action_id',
  'schema_version',
  'contract_id',
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
  'execution_payload_hash',
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
]);

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function hashPayload(value) {
  return crypto.createHash('sha256').update(stableStringify(value || {})).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPreviewFamily(actionFamily) {
  return NO_EFFECT_PREVIEW_FAMILIES.includes(actionFamily);
}

function isApprovalRequiredFamily(actionFamily) {
  return APPROVAL_REQUIRED_FAMILIES.includes(actionFamily);
}

function buildSafeError(code, message, details) {
  return {
    ok: false,
    error: {
      code,
      message,
      details: details || {},
    },
  };
}

function buildQuoteActionContractNotModeledError(details) {
  return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Quote action contract is not modeled.', details);
}

function buildQuoteActionRequiresApprovalError(details) {
  return buildSafeError(SAFE_ERRORS.REQUIRES_APPROVAL, 'Quote action requires explicit approval before execution.', details);
}

function buildDefaultApprovalGate(requiredApproval, approvalStatus, hashes) {
  return {
    schema_version: APPROVAL_GATE_SCHEMA_VERSION,
    approval_required: requiredApproval,
    approval_status: approvalStatus,
    approver_ref: null,
    approval_timestamp: null,
    approval_scope: requiredApproval ? 'quote_action_real_effect' : 'no_effect_preview',
    approval_expiration: null,
    approved_payload_hash: approvalStatus === 'approved' ? hashes.execution_payload_hash : null,
    preview_payload_hash: hashes.preview_hash,
    execution_payload_hash: hashes.execution_payload_hash,
    payload_diff_status: 'not_approved',
    policy_checks: [],
    capability_checks: [],
    source_evidence_checks: [],
    freshness_checks: [],
    blocked_effects: [],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    pre_approval_audit_event: 'quote_action_contract_previewed',
    post_approval_audit_event: null,
    rejection_reason: null,
    failure_behavior: 'block_safe_error',
    rollback_behavior: requiredApproval ? 'required_before_execution' : 'not_required_for_no_effect_preview',
  };
}

function createQuoteActionContract(input) {
  const data = input || {};
  const actionFamily = data.action_family;
  const preview = isPreviewFamily(actionFamily);
  const approvalRequired = isApprovalRequiredFamily(actionFamily);

  if (!preview && !approvalRequired) {
    return buildQuoteActionContractNotModeledError({ action_family: actionFamily || null });
  }

  const inputPayload = clone(data.input_payload || {});
  const previewPayload = clone(data.preview_payload || inputPayload);
  const executionPayload = clone(data.execution_payload || previewPayload);
  const previewHash = hashPayload(previewPayload);
  const executionPayloadHash = hashPayload(executionPayload);

  const requiredApproval = approvalRequired;
  const approvalStatus = data.approval_status || (requiredApproval ? 'required' : 'not_required');

  const contract = {
    action_id: data.action_id || `quote_action_${hashPayload({ actionFamily, inputPayload }).slice(0, 16)}`,
    schema_version: ACTION_CONTRACT_SCHEMA_VERSION,
    contract_id: QUOTE_ACTION_CONTRACT_ID,
    action_type: data.action_type || (preview ? 'preview' : 'execute'),
    action_family: actionFamily,
    domain: DOMAIN_ID,
    actor: data.actor || { actor_type: 'advisor', actor_ref: 'local_preview_user' },
    target_ref: data.target_ref || null,
    input_payload: inputPayload,
    preview_payload: previewPayload,
    execution_payload: executionPayload,
    payload_hash: hashPayload({ input_payload: inputPayload, preview_payload: previewPayload, execution_payload: executionPayload }),
    preview_hash: previewHash,
    execution_payload_hash: executionPayloadHash,
    required_capabilities: clone(data.required_capabilities || []),
    required_approval: requiredApproval,
    approval_status: approvalStatus,
    approval_gate: data.approval_gate || buildDefaultApprovalGate(requiredApproval, approvalStatus, { preview_hash: previewHash, execution_payload_hash: executionPayloadHash }),
    allowed_without_approval: preview,
    blocked_effects: clone(data.blocked_effects || []),
    safety_flags: Object.assign({}, DEFAULT_SAFETY_FLAGS, data.safety_flags || {}),
    source_evidence_ids: clone(data.source_evidence_ids || []),
    freshness_metadata: clone(data.freshness_metadata || {}),
    audit_events: clone(data.audit_events || ['quote_action_contract_created']),
    rollback_plan: data.rollback_plan || null,
    idempotency_key: data.idempotency_key || null,
    execution_result: data.execution_result || null,
    error_model: {
      safe_errors: Object.values(SAFE_ERRORS),
      default_error: SAFE_ERRORS.NOT_MODELED,
    },
    source_engine_ref: data.source_engine_ref || 'gmm-quote-summary-engine.js',
    quote_read_model_ref: data.quote_read_model_ref || 'platform/adapters/quote-read-model/quote-read-model-adapter-069c.js',
    new_quote_engine_created: false,
    quote_execution_authorized: false,
  };

  return { ok: true, contract };
}

function validateQuoteActionContractShape(contract) {
  if (!contract || typeof contract !== 'object') {
    return buildQuoteActionContractNotModeledError({ reason: 'contract_missing' });
  }

  const missing = REQUIRED_QUOTE_ACTION_CONTRACT_FIELDS.filter((field) => !(field in contract));
  if (missing.length) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Quote action contract is missing required fields.', { missing });
  }

  if (contract.schema_version !== ACTION_CONTRACT_SCHEMA_VERSION) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Unsupported action contract schema version.', { schema_version: contract.schema_version });
  }

  if (contract.contract_id !== QUOTE_ACTION_CONTRACT_ID) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Unsupported quote action contract id.', { contract_id: contract.contract_id });
  }

  if (contract.domain !== DOMAIN_ID) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Unsupported quote action domain.', { domain: contract.domain });
  }

  const flags = contract.safety_flags || {};
  const trueFlags = Object.keys(flags).filter((key) => flags[key] === true);
  if (trueFlags.length) {
    return buildSafeError(SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED, 'Quote action contract has real-effect flags enabled.', { trueFlags });
  }

  return { ok: true, contract };
}

function validateQuoteActionPayloadIntegrity(contract) {
  const shape = validateQuoteActionContractShape(contract);
  if (!shape.ok) return shape;

  const expectedPreviewHash = hashPayload(contract.preview_payload);
  const expectedExecutionHash = hashPayload(contract.execution_payload);

  if (contract.preview_hash !== expectedPreviewHash || contract.execution_payload_hash !== expectedExecutionHash) {
    return buildSafeError(SAFE_ERRORS.PAYLOAD_CHANGED_AFTER_APPROVAL, 'Quote action payload hash does not match payload content.', {
      preview_hash_valid: contract.preview_hash === expectedPreviewHash,
      execution_payload_hash_valid: contract.execution_payload_hash === expectedExecutionHash,
    });
  }

  if (contract.execution_result && !['execute', 'executed'].includes(contract.action_type)) {
    return buildSafeError(SAFE_ERRORS.BLOCKED_BY_POLICY, 'Quote action execution_result cannot exist before execute or executed state.', {
      action_type: contract.action_type,
    });
  }

  if (contract.required_approval && contract.approval_status !== 'approved') {
    return buildQuoteActionRequiresApprovalError({ approval_status: contract.approval_status });
  }

  if (contract.required_approval && contract.approval_gate && contract.approval_gate.approved_payload_hash) {
    if (contract.approval_gate.approved_payload_hash !== contract.execution_payload_hash) {
      return buildSafeError(SAFE_ERRORS.PAYLOAD_CHANGED_AFTER_APPROVAL, 'Quote action execution payload changed after approval.', {
        approved_payload_hash: contract.approval_gate.approved_payload_hash,
        execution_payload_hash: contract.execution_payload_hash,
      });
    }
  }

  if (isApprovalRequiredFamily(contract.action_family) && (!contract.source_evidence_ids || contract.source_evidence_ids.length === 0)) {
    return buildSafeError(SAFE_ERRORS.SOURCE_EVIDENCE_REQUIRED, 'Quote action requires source evidence before executable use.', {});
  }

  if (isApprovalRequiredFamily(contract.action_family) && (!contract.freshness_metadata || !contract.freshness_metadata.status)) {
    return buildSafeError(SAFE_ERRORS.FRESHNESS_REQUIRED, 'Quote action requires freshness metadata before executable use.', {});
  }

  if (isApprovalRequiredFamily(contract.action_family) && !contract.rollback_plan) {
    return buildSafeError(SAFE_ERRORS.ROLLBACK_PLAN_REQUIRED, 'Quote action requires rollback plan before executable use.', {});
  }

  return { ok: true, contract };
}

module.exports = {
  QUOTE_ACTION_CONTRACT_ID,
  ACTION_CONTRACT_SCHEMA_VERSION,
  APPROVAL_GATE_SCHEMA_VERSION,
  DOMAIN_ID,
  NO_EFFECT_PREVIEW_FAMILIES,
  APPROVAL_REQUIRED_FAMILIES,
  SAFE_ERRORS,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_QUOTE_ACTION_CONTRACT_FIELDS,
  stableStringify,
  hashPayload,
  isPreviewFamily,
  isApprovalRequiredFamily,
  createQuoteActionContract,
  validateQuoteActionContractShape,
  validateQuoteActionPayloadIntegrity,
  buildQuoteActionContractNotModeledError,
  buildQuoteActionRequiresApprovalError,
};
