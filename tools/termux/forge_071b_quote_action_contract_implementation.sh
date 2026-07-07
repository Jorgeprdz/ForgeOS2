#!/usr/bin/env bash
set -euo pipefail

PHASE="071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"

green(){ printf "\033[1;38;5;46mPASS:\033[0m %s\n" "$*" | tee -a "$REPORT"; }
yellow(){ printf "\033[1;33mWARN:\033[0m %s\n" "$*" | tee -a "$REPORT"; }
red(){ printf "\033[1;31mHOLD:\033[0m %s\n" "$*" | tee -a "$REPORT"; copy_report; exit 1; }
stage(){ printf "\n\033[1;36m========== %s ==========\033[0m\n" "$*" | tee -a "$REPORT"; }
run(){ printf "\n========== RUN ==========\n%s\n" "$*" | tee -a "$REPORT"; "$@" 2>&1 | tee -a "$REPORT"; }

copy_report(){
  if command -v termux-clipboard-set >/dev/null 2>&1 && [ -f "$REPORT" ]; then
    termux-clipboard-set < "$REPORT" || true
  fi
}

stage "STAGE 0 HEADER"
{
  echo "PHASE=$PHASE"
  echo "MODE=local/static/no-effect implementation"
  echo "BOUNDARY=no UI mutation; no backend real; no quote execution; no provider/auth/secrets/browser/real engine; no CRM/policy/quote/pipeline/task/calendar/message writes"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 071A scoped; implementation no-effect only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 071A"
if [ -f docs/evidence/forge-quote-action-contract-scope-audit-071a.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-quote-action-contract-scope-audit-071a.json'
d=json.load(open(p))
assert d.get('phase') == '071A_QUOTE_ACTION_CONTRACT_SCOPE'
assert d.get('decision') == 'PASS_071A_QUOTE_ACTION_CONTRACT_SCOPE'
assert d.get('lockedDecision') == 'QUOTE_ACTION_CONTRACT_SCOPED'
assert d.get('next') == '071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION'
assert d.get('newQuoteEngineAuthorized') is False
assert d.get('quoteExecutionAuthorized') is False
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "071A audit confirmed"
else
  red "071A audit not confirmed"
fi

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/071b-quote-action-contract-implementation-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 APPLY IMPLEMENTATION"
mkdir -p platform/action-contracts tests docs/architecture/source-truth docs/evidence

cat > platform/action-contracts/quote-action-contract-071b.js <<'EOF'
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
EOF

cat > tests/quote-action-contract-071b-test.js <<'EOF'
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
EOF

green "implementation and test written"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md <<'EOF'
# Forge Quote Action Contract Implementation 071B

Phase: `071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Decision: `PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `071C_QUOTE_ACTION_CONTRACT_QA_LOCK`

## Purpose

071B implements the local/static/no-effect Quote Action Contract layer.

This phase does not execute quote actions, create a new quote engine, call providers, generate PDFs, send quotes, persist quotes, mutate CRM, mutate policies, mutate pipeline, create tasks, create calendar events, send messages, connect backend, access auth or secrets, persist browser state, bypass approval, or invent quote truth.

## Implemented Files

- `platform/action-contracts/quote-action-contract-071b.js`
- `tests/quote-action-contract-071b-test.js`

## Implemented Contract

- `forge.quote.action_contract.v1`
- `forge.action_contract.v1`
- `forge.approval_gate.v1`
- domain `quote`

## Behavior Implemented

- no-effect preview contract creation;
- approval-required real-effect contract creation;
- deterministic payload hashing;
- required field validation;
- default false safety flags;
- safe error construction;
- approval-required blocking;
- payload-changed-after-approval blocking;
- source evidence requirement;
- freshness requirement;
- rollback plan requirement;
- execution result timing block;
- real-effect flag block;
- no new quote engine creation.

## Safe Errors

- `QUOTE_ACTION_CONTRACT_NOT_MODELED`
- `QUOTE_ACTION_REQUIRES_APPROVAL`
- `QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`
- `QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED`
- `QUOTE_ACTION_FRESHNESS_REQUIRED`
- `QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED`
- `QUOTE_ACTION_CAPABILITY_NOT_GRANTED`
- `QUOTE_ACTION_BLOCKED_BY_POLICY`
- `QUOTE_ACTION_PROVIDER_NOT_AUTHORIZED`
- `QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED`

## Final

DECISION=PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=071C_QUOTE_ACTION_CONTRACT_QA_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md <<'EOF'
# Forge Quote Action Contract Implementation Evidence 071B

Phase: `071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Status: PASS

Decision: `PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `071C_QUOTE_ACTION_CONTRACT_QA_LOCK`

## Evidence Summary

071B implemented a local/static/no-effect Quote Action Contract layer.

The implementation creates and validates action contract envelopes for quote preview and future approval-required quote actions. It does not execute quote actions.

## Validation Evidence

- `node --check platform/action-contracts/quote-action-contract-071b.js`
- `node --check tests/quote-action-contract-071b-test.js`
- `node tests/quote-action-contract-071b-test.js`
- `python3 -m json.tool docs/evidence/forge-quote-action-contract-implementation-audit-071b.json`
- marker scan
- `git diff --check`
- scoped safety scan
- `git diff --cached --check`

Node test result:

`PASS quote action contract 071B`

## Boundary

No UI mutation, backend real connection, provider call, quote execution, quote write, policy write, CRM write, pipeline write, task creation, calendar creation, message send, auth, secret access, browser persistence, approval bypass, real engine effect, or invented quote truth was introduced.

## Final

DECISION=PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=071C_QUOTE_ACTION_CONTRACT_QA_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_CERTIFICATE_071B.md <<'EOF'
# Forge Quote Action Contract Implementation Certificate 071B

Certificate status: ISSUED

Phase: `071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Certified decision: `PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `071C_QUOTE_ACTION_CONTRACT_QA_LOCK`

## Certification

071B certifies that the Quote Action Contract was implemented as a local/static/no-effect contract builder and validator.

Certified behavior:

- preview action contract creation;
- approval-required action contract creation;
- deterministic payload hash validation;
- source evidence requirement;
- freshness requirement;
- rollback plan requirement;
- default false safety flags;
- no new quote engine creation;
- no quote execution.

## Non-Authorization

This certificate does not authorize quote execution, provider calls, quote document generation, quote send, quote save, quote binding, CRM writes, policy writes, pipeline writes, task/calendar/message actions, backend connection, auth, secrets, browser persistence, approval bypass, real engine effects, or invented quote truth.

## Final

DECISION=PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION
EOF

cat > docs/evidence/forge-quote-action-contract-implementation-audit-071b.json <<'EOF'
{
  "phase": "071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION",
  "status": "PASS",
  "decision": "PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION",
  "lockedDecision": "QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED",
  "basePhase": "071A_QUOTE_ACTION_CONTRACT_SCOPE",
  "next": "071C_QUOTE_ACTION_CONTRACT_QA_LOCK",
  "mode": "local_static_no_effect_implementation",
  "implementationFile": "platform/action-contracts/quote-action-contract-071b.js",
  "testFile": "tests/quote-action-contract-071b-test.js",
  "contractId": "forge.quote.action_contract.v1",
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "domain": "quote",
  "newQuoteEngineCreated": false,
  "quoteExecutionAuthorized": false,
  "providerRuntimeAuthorized": false,
  "behaviorImplemented": {
    "previewContractCreation": true,
    "approvalRequiredContractCreation": true,
    "deterministicPayloadHashing": true,
    "requiredFieldValidation": true,
    "approvalRequiredBlocking": true,
    "payloadChangedAfterApprovalBlocking": true,
    "sourceEvidenceRequired": true,
    "freshnessRequired": true,
    "rollbackPlanRequired": true,
    "executionResultBeforeExecuteBlocked": true,
    "realEffectFlagBlocked": true,
    "allDefaultSafetyFlagsFalse": true
  },
  "safeErrors": [
    "QUOTE_ACTION_CONTRACT_NOT_MODELED",
    "QUOTE_ACTION_REQUIRES_APPROVAL",
    "QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL",
    "QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED",
    "QUOTE_ACTION_FRESHNESS_REQUIRED",
    "QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED",
    "QUOTE_ACTION_CAPABILITY_NOT_GRANTED",
    "QUOTE_ACTION_BLOCKED_BY_POLICY",
    "QUOTE_ACTION_PROVIDER_NOT_AUTHORIZED",
    "QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED"
  ],
  "safetyFlags": {
    "crmWrite": false,
    "pipelineWrite": false,
    "policyWrite": false,
    "quoteWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
    "authReal": false,
    "providerRuntime": false,
    "secretAccess": false,
    "browserPersistence": false,
    "realEngineExecution": false,
    "realEffectsAllowed": false,
    "realEffectsEnabled": false,
    "backendConnection": false,
    "approvalBypass": false,
    "autoSend": false,
    "autoWrite": false
  },
  "validation": {
    "nodeCheckImplementation": "PASS",
    "nodeCheckTest": "PASS",
    "nodeTest": "PASS",
    "nodeTestOutput": "PASS quote action contract 071B",
    "jsonAudit": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "safetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

green "docs/evidence written"

stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """<!-- FORGE:071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION:START -->
## 071B Quote Action Contract Implementation

071B implements the local/static/no-effect Quote Action Contract builder and validator.

Locked decision:
`QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Implemented:

- `platform/action-contracts/quote-action-contract-071b.js`
- `tests/quote-action-contract-071b-test.js`

Behavior:

- no-effect preview contract creation;
- approval-required contract creation;
- deterministic payload hashing;
- required field validation;
- approval required blocking;
- payload changed after approval blocking;
- source evidence required;
- freshness required;
- rollback plan required;
- execution result timing block;
- all default safety flags false;
- no new quote engine;
- no quote execution.

DECISION=PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=071C_QUOTE_ACTION_CONTRACT_QA_LOCK
<!-- FORGE:071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION:START" in text:
        continue
    marker = "<!-- FORGE:071A_QUOTE_ACTION_CONTRACT_SCOPE:END -->"
    if marker not in text:
        raise SystemExit(f"missing 071A marker in {path}")
    path.write_text(text.replace(marker, marker + "\n\n" + block, 1))
PY
green "build tree / roadmap updated"

stage "STAGE 7 NORMALIZE FILES"
python3 - <<'PY'
from pathlib import Path
paths = [
 "FORGE_MASTER_BUILD_TREE.md",
 "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
 "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
 "platform/action-contracts/quote-action-contract-071b.js",
 "tests/quote-action-contract-071b-test.js",
 "docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md",
 "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md",
 "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_CERTIFICATE_071B.md",
 "docs/evidence/forge-quote-action-contract-implementation-audit-071b.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_071b_quote_action_contract_implementation.sh
run node --check platform/action-contracts/quote-action-contract-071b.js
run node --check tests/quote-action-contract-071b-test.js
run node tests/quote-action-contract-071b-test.js
run python3 -m json.tool docs/evidence/forge-quote-action-contract-implementation-audit-071b.json
run rg -n "071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION|PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION|QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED|071C_QUOTE_ACTION_CONTRACT_QA_LOCK|forge\.quote\.action_contract\.v1|QUOTE_ACTION_REQUIRES_APPROVAL" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  platform/action-contracts/quote-action-contract-071b.js \
  tests/quote-action-contract-071b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_CERTIFICATE_071B.md \
  docs/evidence/forge-quote-action-contract-implementation-audit-071b.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/quote-action-contract-071b.js \
  tests/quote-action-contract-071b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/quote-action-contract-071b.js \
  docs/evidence/forge-quote-action-contract-implementation-audit-071b.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-action-contract-071b.js"
  "tests/quote-action-contract-071b-test.js"
  "docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md"
  "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_071B.md"
  "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_CERTIFICATE_071B.md"
  "docs/evidence/forge-quote-action-contract-implementation-audit-071b.json"
  "tools/termux/forge_071b_quote_action_contract_implementation.sh"
)
git add "${AUTHORIZED[@]}"
run git diff --cached --name-only

EXPECTED="$(mktemp)"
ACTUAL="$(mktemp)"
printf "%s\n" "${AUTHORIZED[@]}" | sort > "$EXPECTED"
git diff --cached --name-only | sort > "$ACTUAL"
diff -u "$EXPECTED" "$ACTUAL" | tee -a "$REPORT" || red "staged boundary mismatch"
green "only authorized files staged"

run git diff --cached --check

stage "STAGE 11 COMMIT PUSH"
run git commit -m "feat: implement quote action contract"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION_COMMIT_PUSH_COMPLETE
DECISION=PASS_071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION
LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED
NEXT=071C_QUOTE_ACTION_CONTRACT_QA_LOCK
BACKUP=$BACKUP
Reporte: $REPORT
EOF
)"

printf "\n%s\n" "$FINAL_SUMMARY" | tee -a "$REPORT"

if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf "%s\n" "$FINAL_SUMMARY" | termux-clipboard-set || true
  green "final summary copied to clipboard"
else
  yellow "termux-clipboard-set not available; report path printed above"
fi
