'use strict';

const assert = require('assert');
const quoteAction = require('../platform/action-contracts/quote-action-contract-071b.js');
const gate = require('../platform/action-contracts/quote-approval-gate-integration-072b.js');

function assertAllFalse(flags) {
  for (const [key, value] of Object.entries(flags)) {
    assert.strictEqual(value, false, `${key} must be false`);
  }
}

const preview = gate.validateQuoteApprovalGateIntegration({
  action_family: 'quote.prepare_preview',
  input_payload: { quote_id: 'quote_preview_072b' },
  preview_payload: { status: 'preview_ready' },
  source_evidence_ids: ['evidence_072b'],
  freshness_metadata: { status: 'preview_static' },
});

assert.strictEqual(preview.ok, true);
assert.strictEqual(preview.envelope.integration_id, gate.INTEGRATION_ID);
assert.strictEqual(preview.envelope.approval_decision.allowed_without_approval, true);
assert.strictEqual(preview.envelope.approval_decision.human_approval_required, false);
assert.strictEqual(preview.envelope.quote_execution_authorized, false);
assert.strictEqual(preview.envelope.quote_approval_authorized, false);
assert.strictEqual(preview.envelope.provider_runtime_authorized, false);
assert.strictEqual(preview.envelope.backend_connection_authorized, false);
assert.strictEqual(preview.envelope.new_quote_engine_created, false);
assertAllFalse(preview.envelope.safety_flags);

const send = gate.validateQuoteApprovalGateIntegration({
  action_family: 'quote.send',
  input_payload: { quote_id: 'quote_send_072b' },
  preview_payload: { status: 'send_preview' },
  execution_payload: { status: 'send_real' },
  source_evidence_ids: ['evidence_072b'],
  freshness_metadata: { status: 'preview_static' },
  rollback_plan: { strategy: 'block_before_send' },
  idempotency_key: 'quote-send-072b',
});

assert.strictEqual(send.ok, false);
assert.strictEqual(send.error.code, gate.SAFE_ERRORS.ACTION_REQUIRES_APPROVAL);

const approvedAction = quoteAction.createQuoteActionContract({
  action_family: 'quote.send',
  input_payload: { quote_id: 'quote_send_approved_072b' },
  preview_payload: { status: 'send_preview' },
  execution_payload: { status: 'send_real' },
  source_evidence_ids: ['evidence_072b'],
  freshness_metadata: { status: 'preview_static' },
  rollback_plan: { strategy: 'block_before_send' },
  idempotency_key: 'quote-send-approved-072b',
}).contract;

approvedAction.approval_status = 'approved';
approvedAction.approval_gate.approval_status = 'approved';
approvedAction.approval_gate.approved_payload_hash = approvedAction.execution_payload_hash;
approvedAction.approval_gate.payload_diff_status = 'matched';

const approved = gate.validateQuoteApprovalGateIntegration(approvedAction);
assert.strictEqual(approved.ok, true);
assert.strictEqual(approved.envelope.approval_decision.human_approval_required, true);
assert.strictEqual(approved.envelope.approval_decision.ai_can_approve, false);
assert.strictEqual(approved.envelope.approval_decision.safety_validation_can_approve, false);
assert.strictEqual(approved.envelope.approval_decision.approval_can_be_inferred_from_preview, false);
assertAllFalse(approved.envelope.safety_flags);

const changed = JSON.parse(JSON.stringify(approvedAction));
changed.execution_payload.status = 'changed_after_approval';
changed.execution_payload_hash = quoteAction.hashPayload(changed.execution_payload);
const changedCheck = gate.validateQuoteApprovalGateIntegration(changed);
assert.strictEqual(changedCheck.ok, false);
assert.strictEqual(changedCheck.error.code, gate.SAFE_ERRORS.ACTION_PAYLOAD_CHANGED);

const missingEvidence = JSON.parse(JSON.stringify(approvedAction));
missingEvidence.source_evidence_ids = [];
const missingEvidenceCheck = gate.validateQuoteApprovalGateIntegration(missingEvidence);
assert.strictEqual(missingEvidenceCheck.ok, false);
assert.strictEqual(missingEvidenceCheck.error.code, gate.SAFE_ERRORS.ACTION_SOURCE_EVIDENCE_REQUIRED);

const trueFlag = gate.createQuoteApprovalGateEnvelope({
  action_family: 'quote.prepare_preview',
  input_payload: { quote_id: 'quote_true_flag_072b' },
  preview_payload: { status: 'preview_ready' },
  safety_flags: { quoteWrite: true },
});
assert.strictEqual(trueFlag.ok, false);
assert.strictEqual(trueFlag.error.code, gate.SAFE_ERRORS.REAL_EFFECT_NOT_ALLOWED);

assertAllFalse(gate.DEFAULT_SAFETY_FLAGS);

console.log('PASS quote approval gate integration 072B');
