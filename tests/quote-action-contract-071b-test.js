'use strict';

const assert = require('assert');
const {
  QUOTE_ACTION_CONTRACT_ID,
  ACTION_CONTRACT_SCHEMA_VERSION,
  APPROVAL_GATE_SCHEMA_VERSION,
  DEFAULT_SAFETY_FLAGS,
  SAFE_ERRORS,
  createQuoteActionContract,
  validateQuoteActionContractShape,
  validateQuoteActionPayloadIntegrity,
  hashPayload,
} = require('../platform/action-contracts/quote-action-contract-071b.js');

function assertAllFalse(flags) {
  for (const [key, value] of Object.entries(flags)) {
    assert.strictEqual(value, false, `${key} must be false`);
  }
}

const previewResult = createQuoteActionContract({
  action_family: 'quote.prepare_preview',
  target_ref: 'quote_preview_gmm_lariza_alfa_medical_069c',
  input_payload: { quote_id: 'quote_preview_gmm_lariza_alfa_medical_069c' },
  preview_payload: { status: 'preview_ready' },
  source_evidence_ids: ['evidence_quote_preview_069c'],
  freshness_metadata: { status: 'preview_static' },
});

assert.strictEqual(previewResult.ok, true);
assert.strictEqual(previewResult.contract.contract_id, QUOTE_ACTION_CONTRACT_ID);
assert.strictEqual(previewResult.contract.schema_version, ACTION_CONTRACT_SCHEMA_VERSION);
assert.strictEqual(previewResult.contract.approval_gate.schema_version, APPROVAL_GATE_SCHEMA_VERSION);
assert.strictEqual(previewResult.contract.required_approval, false);
assert.strictEqual(previewResult.contract.allowed_without_approval, true);
assert.strictEqual(previewResult.contract.new_quote_engine_created, false);
assert.strictEqual(previewResult.contract.quote_execution_authorized, false);
assertAllFalse(previewResult.contract.safety_flags);
assert.strictEqual(validateQuoteActionContractShape(previewResult.contract).ok, true);
assert.strictEqual(validateQuoteActionPayloadIntegrity(previewResult.contract).ok, true);

const unknown = createQuoteActionContract({ action_family: 'quote.magic_send' });
assert.strictEqual(unknown.ok, false);
assert.strictEqual(unknown.error.code, SAFE_ERRORS.NOT_MODELED);

const sendResult = createQuoteActionContract({
  action_family: 'quote.send',
  target_ref: 'quote_preview_gmm_lariza_alfa_medical_069c',
  input_payload: { quote_id: 'quote_preview_gmm_lariza_alfa_medical_069c' },
  preview_payload: { status: 'send_preview' },
  execution_payload: { status: 'send_real' },
  source_evidence_ids: ['evidence_quote_preview_069c'],
  freshness_metadata: { status: 'preview_static' },
  rollback_plan: { strategy: 'do_not_send_if_failure' },
  idempotency_key: 'quote-send-071b-test',
});

assert.strictEqual(sendResult.ok, true);
assert.strictEqual(sendResult.contract.required_approval, true);
assert.strictEqual(sendResult.contract.allowed_without_approval, false);
assertAllFalse(sendResult.contract.safety_flags);

const notApproved = validateQuoteActionPayloadIntegrity(sendResult.contract);
assert.strictEqual(notApproved.ok, false);
assert.strictEqual(notApproved.error.code, SAFE_ERRORS.REQUIRES_APPROVAL);

const approved = JSON.parse(JSON.stringify(sendResult.contract));
approved.approval_status = 'approved';
approved.approval_gate.approval_status = 'approved';
approved.approval_gate.approved_payload_hash = approved.execution_payload_hash;
assert.strictEqual(validateQuoteActionPayloadIntegrity(approved).ok, true);

const changed = JSON.parse(JSON.stringify(approved));
changed.execution_payload.status = 'changed_after_approval';
changed.execution_payload_hash = hashPayload(changed.execution_payload);
const changedCheck = validateQuoteActionPayloadIntegrity(changed);
assert.strictEqual(changedCheck.ok, false);
assert.strictEqual(changedCheck.error.code, SAFE_ERRORS.PAYLOAD_CHANGED_AFTER_APPROVAL);

const noEvidence = JSON.parse(JSON.stringify(approved));
noEvidence.source_evidence_ids = [];
const noEvidenceCheck = validateQuoteActionPayloadIntegrity(noEvidence);
assert.strictEqual(noEvidenceCheck.ok, false);
assert.strictEqual(noEvidenceCheck.error.code, SAFE_ERRORS.SOURCE_EVIDENCE_REQUIRED);

const noFreshness = JSON.parse(JSON.stringify(approved));
noFreshness.freshness_metadata = {};
const noFreshnessCheck = validateQuoteActionPayloadIntegrity(noFreshness);
assert.strictEqual(noFreshnessCheck.ok, false);
assert.strictEqual(noFreshnessCheck.error.code, SAFE_ERRORS.FRESHNESS_REQUIRED);

const noRollback = JSON.parse(JSON.stringify(approved));
noRollback.rollback_plan = null;
const noRollbackCheck = validateQuoteActionPayloadIntegrity(noRollback);
assert.strictEqual(noRollbackCheck.ok, false);
assert.strictEqual(noRollbackCheck.error.code, SAFE_ERRORS.ROLLBACK_PLAN_REQUIRED);

const executionTooSoon = JSON.parse(JSON.stringify(previewResult.contract));
executionTooSoon.execution_result = { status: 'executed' };
const executionTooSoonCheck = validateQuoteActionPayloadIntegrity(executionTooSoon);
assert.strictEqual(executionTooSoonCheck.ok, false);
assert.strictEqual(executionTooSoonCheck.error.code, SAFE_ERRORS.BLOCKED_BY_POLICY);

const trueFlag = JSON.parse(JSON.stringify(previewResult.contract));
trueFlag.safety_flags.quoteWrite = true;
const trueFlagCheck = validateQuoteActionContractShape(trueFlag);
assert.strictEqual(trueFlagCheck.ok, false);
assert.strictEqual(trueFlagCheck.error.code, SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED);

assertAllFalse(DEFAULT_SAFETY_FLAGS);

console.log('PASS quote action contract 071B');
