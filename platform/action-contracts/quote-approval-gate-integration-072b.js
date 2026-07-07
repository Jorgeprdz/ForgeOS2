'use strict';

const quoteAction = require('./quote-action-contract-071b.js');

const INTEGRATION_ID = 'forge.quote.approval_gate.integration.v1';
const ACTION_CONTRACT_SCHEMA_VERSION = 'forge.action_contract.v1';
const APPROVAL_GATE_SCHEMA_VERSION = 'forge.approval_gate.v1';
const QUOTE_ACTION_CONTRACT_ID = 'forge.quote.action_contract.v1';

const SAFE_ERRORS = Object.freeze({
  NOT_MODELED: 'QUOTE_APPROVAL_GATE_NOT_MODELED',
  QUOTE_REQUIRES_APPROVAL: 'QUOTE_ACTION_REQUIRES_APPROVAL',
  ACTION_REQUIRES_APPROVAL: 'ACTION_EXECUTION_REQUIRES_APPROVAL',
  QUOTE_PAYLOAD_CHANGED: 'QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL',
  ACTION_PAYLOAD_CHANGED: 'ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL',
  QUOTE_SOURCE_EVIDENCE_REQUIRED: 'QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED',
  ACTION_SOURCE_EVIDENCE_REQUIRED: 'ACTION_SOURCE_EVIDENCE_REQUIRED',
  QUOTE_FRESHNESS_REQUIRED: 'QUOTE_ACTION_FRESHNESS_REQUIRED',
  ACTION_FRESHNESS_REQUIRED: 'ACTION_FRESHNESS_REQUIRED',
  QUOTE_ROLLBACK_REQUIRED: 'QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED',
  ACTION_ROLLBACK_REQUIRED: 'ACTION_ROLLBACK_PLAN_REQUIRED',
  REAL_EFFECT_NOT_ALLOWED: 'QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED',
  BLOCKED_BY_POLICY: 'ACTION_EXECUTION_BLOCKED_BY_POLICY',
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function mapQuoteActionError(code) {
  if (code === quoteAction.SAFE_ERRORS.REQUIRES_APPROVAL) return SAFE_ERRORS.ACTION_REQUIRES_APPROVAL;
  if (code === quoteAction.SAFE_ERRORS.PAYLOAD_CHANGED_AFTER_APPROVAL) return SAFE_ERRORS.ACTION_PAYLOAD_CHANGED;
  if (code === quoteAction.SAFE_ERRORS.SOURCE_EVIDENCE_REQUIRED) return SAFE_ERRORS.ACTION_SOURCE_EVIDENCE_REQUIRED;
  if (code === quoteAction.SAFE_ERRORS.FRESHNESS_REQUIRED) return SAFE_ERRORS.ACTION_FRESHNESS_REQUIRED;
  if (code === quoteAction.SAFE_ERRORS.ROLLBACK_PLAN_REQUIRED) return SAFE_ERRORS.ACTION_ROLLBACK_REQUIRED;
  if (code === quoteAction.SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED) return SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED;
  if (code === quoteAction.SAFE_ERRORS.BLOCKED_BY_POLICY) return SAFE_ERRORS.BLOCKED_BY_POLICY;
  return SAFE_ERRORS.NOT_MODELED;
}

function normalizeQuoteActionContract(input) {
  if (!input || typeof input !== 'object') {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Quote approval gate integration input is missing.', {});
  }

  if (input.contract_id === QUOTE_ACTION_CONTRACT_ID) {
    return { ok: true, contract: input };
  }

  const created = quoteAction.createQuoteActionContract(input);
  if (!created.ok) {
    return buildSafeError(mapQuoteActionError(created.error.code), created.error.message, created.error.details);
  }

  return { ok: true, contract: created.contract };
}

function buildApprovalDecision(contract) {
  const preview = quoteAction.isPreviewFamily(contract.action_family);
  const realEffect = quoteAction.isApprovalRequiredFamily(contract.action_family);

  return {
    approval_required: realEffect,
    approval_status: contract.approval_status,
    approval_gate_status: contract.approval_gate ? contract.approval_gate.approval_status : null,
    allowed_without_approval: preview && !realEffect,
    real_effect_family: realEffect,
    human_approval_required: realEffect,
    ai_can_approve: false,
    safety_validation_can_approve: false,
    approval_can_be_inferred_from_preview: false,
  };
}

function createQuoteApprovalGateEnvelope(input) {
  const normalized = normalizeQuoteActionContract(input);
  if (!normalized.ok) return normalized;

  const contract = normalized.contract;
  const shape = quoteAction.validateQuoteActionContractShape(contract);
  if (!shape.ok) {
    return buildSafeError(mapQuoteActionError(shape.error.code), shape.error.message, shape.error.details);
  }

  const decision = buildApprovalDecision(contract);
  const flags = Object.assign({}, DEFAULT_SAFETY_FLAGS, contract.safety_flags || {});
  const trueFlags = Object.keys(flags).filter((key) => flags[key] === true);

  if (trueFlags.length) {
    return buildSafeError(SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED, 'Quote approval gate integration has real-effect flags enabled.', { trueFlags });
  }

  const envelope = {
    integration_id: INTEGRATION_ID,
    integration_mode: 'local_static_no_effect',
    action_contract_schema_version: ACTION_CONTRACT_SCHEMA_VERSION,
    approval_gate_schema_version: APPROVAL_GATE_SCHEMA_VERSION,
    quote_action_contract_id: QUOTE_ACTION_CONTRACT_ID,
    quote_action_contract: clone(contract),
    approval_gate: clone(contract.approval_gate),
    approval_decision: decision,
    payload_integrity: {
      preview_payload_hash: contract.preview_hash,
      execution_payload_hash: contract.execution_payload_hash,
      approved_payload_hash: contract.approval_gate ? contract.approval_gate.approved_payload_hash : null,
      payload_diff_status: contract.approval_gate ? contract.approval_gate.payload_diff_status : 'not_approved',
    },
    required_evidence: {
      source_evidence_ids: clone(contract.source_evidence_ids || []),
      freshness_metadata: clone(contract.freshness_metadata || {}),
      rollback_plan: clone(contract.rollback_plan || null),
      idempotency_key: contract.idempotency_key || null,
    },
    blocked_effects: clone(contract.blocked_effects || []),
    safety_flags: flags,
    audit_event: 'quote_approval_gate_integration_previewed',
    safe_errors: Object.values(SAFE_ERRORS),
    quote_execution_authorized: false,
    quote_approval_authorized: false,
    provider_runtime_authorized: false,
    backend_connection_authorized: false,
    new_quote_engine_created: false,
  };

  return { ok: true, envelope };
}

function validateQuoteApprovalGateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Quote approval gate envelope is missing.', {});
  }

  const required = [
    'integration_id',
    'integration_mode',
    'action_contract_schema_version',
    'approval_gate_schema_version',
    'quote_action_contract_id',
    'quote_action_contract',
    'approval_gate',
    'approval_decision',
    'payload_integrity',
    'required_evidence',
    'safety_flags',
  ];
  const missing = required.filter((field) => !(field in envelope));
  if (missing.length) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Quote approval gate envelope is missing required fields.', { missing });
  }

  if (envelope.integration_id !== INTEGRATION_ID) {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Unsupported quote approval gate integration id.', { integration_id: envelope.integration_id });
  }

  if (envelope.integration_mode !== 'local_static_no_effect') {
    return buildSafeError(SAFE_ERRORS.NOT_MODELED, 'Unsupported quote approval gate integration mode.', { integration_mode: envelope.integration_mode });
  }

  const trueFlags = Object.keys(envelope.safety_flags || {}).filter((key) => envelope.safety_flags[key] === true);
  if (trueFlags.length) {
    return buildSafeError(SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED, 'Quote approval gate envelope has real-effect flags enabled.', { trueFlags });
  }

  if (envelope.quote_execution_authorized === true || envelope.quote_approval_authorized === true || envelope.provider_runtime_authorized === true || envelope.backend_connection_authorized === true) {
    return buildSafeError(SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED, 'Quote approval gate envelope attempted to authorize a real effect.', {});
  }

  const actionResult = quoteAction.validateQuoteActionPayloadIntegrity(envelope.quote_action_contract);
  if (!actionResult.ok) {
    return buildSafeError(mapQuoteActionError(actionResult.error.code), actionResult.error.message, actionResult.error.details);
  }

  return { ok: true, envelope };
}

function validateQuoteApprovalGateIntegration(input) {
  const built = createQuoteApprovalGateEnvelope(input);
  if (!built.ok) return built;
  const checked = validateQuoteApprovalGateEnvelope(built.envelope);
  if (!checked.ok) return checked;
  return { ok: true, envelope: checked.envelope };
}

module.exports = {
  INTEGRATION_ID,
  ACTION_CONTRACT_SCHEMA_VERSION,
  APPROVAL_GATE_SCHEMA_VERSION,
  QUOTE_ACTION_CONTRACT_ID,
  SAFE_ERRORS,
  DEFAULT_SAFETY_FLAGS,
  createQuoteApprovalGateEnvelope,
  validateQuoteApprovalGateEnvelope,
  validateQuoteApprovalGateIntegration,
  buildApprovalDecision,
  mapQuoteActionError,
};
