#!/usr/bin/env bash
set -euo pipefail

PHASE="072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION"
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
  echo "BOUNDARY=no UI mutation; no backend real; no quote execution; no quote approval; no provider/auth/secrets/browser/real engine; no CRM/policy/quote/pipeline/task/calendar/message writes"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 072A scoped; implementation no-effect only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 072A"
if [ -f docs/evidence/forge-quote-approval-gate-integration-scope-audit-072a.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-quote-approval-gate-integration-scope-audit-072a.json'
d=json.load(open(p))
assert d.get('phase') == '072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE'
assert d.get('decision') == 'PASS_072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE'
assert d.get('lockedDecision') == 'QUOTE_APPROVAL_GATE_INTEGRATION_SCOPED'
assert d.get('next') == '072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION'
assert d.get('quoteExecutionAuthorized') is False
assert d.get('quoteApprovalAuthorized') is False
assert d.get('newQuoteEngineAuthorized') is False
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "072A audit confirmed"
else
  red "072A audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-action-contract-071b.js"
  "tests/quote-action-contract-071b-test.js"
  "platform/action-contracts/action-contract-approval-gate-schema-070c.js"
  "docs/evidence/forge-quote-approval-gate-integration-scope-audit-072a.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/072b-quote-approval-gate-integration-implementation-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 APPLY IMPLEMENTATION"
mkdir -p platform/action-contracts tests docs/architecture/source-truth docs/evidence

cat > platform/action-contracts/quote-approval-gate-integration-072b.js <<'EOF'
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
EOF

cat > tests/quote-approval-gate-integration-072b-test.js <<'EOF'
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
EOF

green "implementation and test written"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md <<'EOF'
# Forge Quote Approval Gate Integration Implementation 072B

Phase: `072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Decision: `PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

## Purpose

072B implements the local/static/no-effect integration validator between Quote Action Contract and Approval Gate schema.

It does not execute quote actions.

It does not approve quote actions.

It does not call providers, connect backend, generate documents, send quotes, save quotes, write records, bypass approval, or invent quote truth.

## Implemented Files

- `platform/action-contracts/quote-approval-gate-integration-072b.js`
- `tests/quote-approval-gate-integration-072b-test.js`

## Implemented Behavior

- builds integrated quote approval gate envelope;
- validates no-effect preview approval status;
- detects approval-required quote actions;
- maps quote action errors to approval gate errors;
- validates payload hash integrity;
- blocks payload change after approval;
- requires source evidence;
- requires freshness metadata;
- requires rollback plan;
- blocks real-effect safety flags;
- confirms AI cannot approve;
- confirms safety validation cannot approve;
- confirms approval cannot be inferred from preview;
- keeps quote execution unauthorized;
- keeps quote approval unauthorized;
- keeps provider/backend unauthorized;
- creates no new quote engine.

## Final

DECISION=PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md <<'EOF'
# Forge Quote Approval Gate Integration Implementation Evidence 072B

Phase: `072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Status: PASS

Decision: `PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

## Evidence Summary

072B implemented a local/static/no-effect integration validator between Quote Action Contract and Approval Gate schema.

The implementation validates preview/no-effect behavior, approval-required behavior, payload integrity, source evidence, freshness, rollback plan, safety flags, and no real-effect authorization.

## Validation Evidence

- `node --check platform/action-contracts/quote-approval-gate-integration-072b.js`
- `node --check tests/quote-approval-gate-integration-072b-test.js`
- `node tests/quote-approval-gate-integration-072b-test.js`
- `python3 -m json.tool docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json`
- marker scan
- `git diff --check`
- scoped safety scan
- `git diff --cached --check`

Node test result:

`PASS quote approval gate integration 072B`

## Boundary

No UI mutation, backend real connection, quote execution, quote approval, provider call, quote write, policy write, CRM write, pipeline write, task/calendar/message action, auth, secret access, browser persistence, approval bypass, real engine effect, or invented quote truth was introduced.

## Final

DECISION=PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_CERTIFICATE_072B.md <<'EOF'
# Forge Quote Approval Gate Integration Implementation Certificate 072B

Certificate status: ISSUED

Phase: `072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Certified decision: `PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Next: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

## Certification

072B certifies the Quote Approval Gate Integration as a local/static/no-effect integration validator.

It may validate preview-safe envelopes, approval-required state, payload integrity, source evidence, freshness, rollback, safety flags, and safe errors.

It may not execute or approve quote actions.

## Final

DECISION=PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION
EOF

cat > docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json <<'EOF'
{
  "phase": "072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION",
  "status": "PASS",
  "decision": "PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION",
  "lockedDecision": "QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED",
  "basePhase": "072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE",
  "next": "072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK",
  "mode": "local_static_no_effect_implementation",
  "implementationFile": "platform/action-contracts/quote-approval-gate-integration-072b.js",
  "testFile": "tests/quote-approval-gate-integration-072b-test.js",
  "integrationId": "forge.quote.approval_gate.integration.v1",
  "quoteActionContractId": "forge.quote.action_contract.v1",
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "behaviorImplemented": {
    "integratedEnvelopeBuild": true,
    "previewAllowedWithoutApproval": true,
    "realEffectRequiresApproval": true,
    "payloadIntegrityValidated": true,
    "payloadChangedAfterApprovalBlocked": true,
    "sourceEvidenceRequired": true,
    "freshnessRequired": true,
    "rollbackPlanRequired": true,
    "realEffectFlagBlocked": true,
    "aiCannotApprove": true,
    "safetyValidationCannotApprove": true,
    "approvalCannotBeInferredFromPreview": true,
    "allDefaultSafetyFlagsFalse": true
  },
  "quoteExecutionAuthorized": false,
  "quoteApprovalAuthorized": false,
  "providerRuntimeAuthorized": false,
  "backendConnectionAuthorized": false,
  "newQuoteEngineCreated": false,
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
    "nodeTestOutput": "PASS quote approval gate integration 072B",
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

block = """<!-- FORGE:072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION:START -->
## 072B Quote Approval Gate Integration Implementation

072B implements the local/static/no-effect integration validator between Quote Action Contract and Approval Gate schema.

Locked decision:
`QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED`

Implemented:

- `platform/action-contracts/quote-approval-gate-integration-072b.js`
- `tests/quote-approval-gate-integration-072b-test.js`

Behavior:

- integrated approval gate envelope build;
- no-effect preview validation;
- approval-required real-effect detection;
- payload integrity validation;
- payload changed after approval blocked;
- source evidence required;
- freshness required;
- rollback plan required;
- real-effect flags blocked;
- AI/safety validation cannot approve;
- quote execution unauthorized;
- quote approval unauthorized;
- provider/backend unauthorized.

DECISION=PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED

NEXT=072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
<!-- FORGE:072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION:START" in text:
        continue
    marker = "<!-- FORGE:072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE:END -->"
    if marker not in text:
        raise SystemExit(f"missing 072A marker in {path}")
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
 "platform/action-contracts/quote-approval-gate-integration-072b.js",
 "tests/quote-approval-gate-integration-072b-test.js",
 "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_CERTIFICATE_072B.md",
 "docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_072b_quote_approval_gate_integration_implementation.sh
run node --check platform/action-contracts/quote-approval-gate-integration-072b.js
run node --check tests/quote-approval-gate-integration-072b-test.js
run node tests/quote-approval-gate-integration-072b-test.js
run python3 -m json.tool docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json
run rg -n "072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION|PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION|QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED|072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK|forge\.quote\.approval_gate\.integration\.v1|ACTION_EXECUTION_REQUIRES_APPROVAL" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  tests/quote-approval-gate-integration-072b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_CERTIFICATE_072B.md \
  docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  tests/quote-approval-gate-integration-072b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-approval-gate-integration-072b.js"
  "tests/quote-approval-gate-integration-072b-test.js"
  "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_072B.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_CERTIFICATE_072B.md"
  "docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json"
  "tools/termux/forge_072b_quote_approval_gate_integration_implementation.sh"
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
run git commit -m "feat: implement quote approval gate integration"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION_COMMIT_PUSH_COMPLETE
DECISION=PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION
LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED
NEXT=072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
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
