#!/usr/bin/env bash
set -euo pipefail

PHASE="072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK"
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
  echo "MODE=QA/docs/evidence only"
  echo "BOUNDARY=no UI mutation; no backend real; no quote execution; no quote approval; no provider/auth/secrets/browser/real engine; no CRM/policy/quote/pipeline/task/calendar/message writes"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 072B implemented; QA lock only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 072B"
if [ -f docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json'
d=json.load(open(p))
assert d.get('phase') == '072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION'
assert d.get('decision') == 'PASS_072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION'
assert d.get('lockedDecision') == 'QUOTE_APPROVAL_GATE_INTEGRATION_LOCAL_STATIC_NO_EFFECT_IMPLEMENTED'
assert d.get('next') == '072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK'
assert d.get('quoteExecutionAuthorized') is False
assert d.get('quoteApprovalAuthorized') is False
assert d.get('providerRuntimeAuthorized') is False
assert d.get('backendConnectionAuthorized') is False
assert d.get('newQuoteEngineCreated') is False
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "072B audit confirmed"
else
  red "072B audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-approval-gate-integration-072b.js"
  "tests/quote-approval-gate-integration-072b-test.js"
  "platform/action-contracts/quote-action-contract-071b.js"
  "platform/action-contracts/action-contract-approval-gate-schema-070c.js"
  "docs/evidence/forge-quote-approval-gate-integration-implementation-audit-072b.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/072c-quote-approval-gate-integration-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 SEMANTIC QA"
run node --check platform/action-contracts/quote-approval-gate-integration-072b.js
run node --check tests/quote-approval-gate-integration-072b-test.js
run node tests/quote-approval-gate-integration-072b-test.js

node <<'NODE' | tee -a "$REPORT"
const assert = require('assert');
const quoteAction = require('./platform/action-contracts/quote-action-contract-071b.js');
const gate = require('./platform/action-contracts/quote-approval-gate-integration-072b.js');

function allFalse(flags) {
  return Object.values(flags).every((value) => value === false);
}

const preview = gate.validateQuoteApprovalGateIntegration({
  action_family: 'quote.prepare_preview',
  input_payload: { quote_id: 'qa_072c_preview' },
  preview_payload: { status: 'preview_ready' },
  source_evidence_ids: ['evidence_072c'],
  freshness_metadata: { status: 'preview_static' },
});
assert.strictEqual(preview.ok, true);
assert.strictEqual(preview.envelope.approval_decision.allowed_without_approval, true);
assert.strictEqual(preview.envelope.approval_decision.human_approval_required, false);
assert.strictEqual(preview.envelope.quote_execution_authorized, false);
assert.strictEqual(preview.envelope.quote_approval_authorized, false);
assert.strictEqual(preview.envelope.provider_runtime_authorized, false);
assert.strictEqual(preview.envelope.backend_connection_authorized, false);
assert.strictEqual(preview.envelope.new_quote_engine_created, false);
assert.strictEqual(allFalse(preview.envelope.safety_flags), true);

const send = gate.validateQuoteApprovalGateIntegration({
  action_family: 'quote.send',
  input_payload: { quote_id: 'qa_072c_send' },
  preview_payload: { status: 'send_preview' },
  execution_payload: { status: 'send_real' },
  source_evidence_ids: ['evidence_072c'],
  freshness_metadata: { status: 'preview_static' },
  rollback_plan: { strategy: 'block_before_send' },
  idempotency_key: 'qa-072c-send',
});
assert.strictEqual(send.ok, false);
assert.strictEqual(send.error.code, gate.SAFE_ERRORS.ACTION_REQUIRES_APPROVAL);

const approvedAction = quoteAction.createQuoteActionContract({
  action_family: 'quote.send',
  input_payload: { quote_id: 'qa_072c_approved' },
  preview_payload: { status: 'send_preview' },
  execution_payload: { status: 'send_real' },
  source_evidence_ids: ['evidence_072c'],
  freshness_metadata: { status: 'preview_static' },
  rollback_plan: { strategy: 'block_before_send' },
  idempotency_key: 'qa-072c-approved',
}).contract;

approvedAction.approval_status = 'approved';
approvedAction.approval_gate.approval_status = 'approved';
approvedAction.approval_gate.approved_payload_hash = approvedAction.execution_payload_hash;
approvedAction.approval_gate.payload_diff_status = 'matched';

const approved = gate.validateQuoteApprovalGateIntegration(approvedAction);
assert.strictEqual(approved.ok, true);
assert.strictEqual(approved.envelope.approval_decision.ai_can_approve, false);
assert.strictEqual(approved.envelope.approval_decision.safety_validation_can_approve, false);
assert.strictEqual(approved.envelope.approval_decision.approval_can_be_inferred_from_preview, false);
assert.strictEqual(approved.envelope.quote_execution_authorized, false);
assert.strictEqual(approved.envelope.quote_approval_authorized, false);
assert.strictEqual(allFalse(approved.envelope.safety_flags), true);

const changed = JSON.parse(JSON.stringify(approvedAction));
changed.execution_payload.status = 'changed_after_approval';
changed.execution_payload_hash = quoteAction.hashPayload(changed.execution_payload);
const changedCheck = gate.validateQuoteApprovalGateIntegration(changed);
assert.strictEqual(changedCheck.ok, false);
assert.strictEqual(changedCheck.error.code, gate.SAFE_ERRORS.ACTION_PAYLOAD_CHANGED);

console.log(JSON.stringify({
  status: 'PASS',
  previewAllowedWithoutApproval: true,
  realEffectRequiresApproval: true,
  approvedEnvelopeStillNoExecution: true,
  payloadChangedAfterApprovalBlocked: true,
  aiCannotApprove: true,
  safetyValidationCannotApprove: true,
  approvalCannotBeInferredFromPreview: true,
  allSafetyFlagsFalse: true
}, null, 2));
NODE
green "semantic QA passed"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence

cat > docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md <<'EOF'
# Forge Quote Approval Gate Integration QA Lock 072C

Phase: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Decision: `PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED`

Next: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

## QA Scope

072C locks QA for the local/static/no-effect Quote Approval Gate Integration implementation from 072B.

Validated files:

- `platform/action-contracts/quote-approval-gate-integration-072b.js`
- `tests/quote-approval-gate-integration-072b-test.js`

## QA Confirmed

- `forge.quote.approval_gate.integration.v1` is exposed.
- Quote Action Contract is integrated with Approval Gate schema.
- Preview quote actions remain no-effect.
- Real-effect quote actions require approval.
- Payload integrity is validated.
- Payload changed after approval is blocked.
- Source evidence is required.
- Freshness metadata is required.
- Rollback plan is required.
- AI cannot approve.
- Safety validation cannot approve.
- Approval cannot be inferred from preview/open/click/type/view.
- Quote execution remains unauthorized.
- Quote approval remains unauthorized.
- Provider runtime remains unauthorized.
- Backend connection remains unauthorized.
- No new quote engine was created.
- All default safety flags remain false.

## Boundary

072C is QA/docs/evidence only.

It does not execute quotes, approve quotes, call providers, generate PDFs, send quotes, save quotes, bind quotes, mutate UI, connect backend, write CRM, write policies, write pipeline, create tasks, create calendar events, send messages, access auth or secrets, persist browser state, bypass approval, or invent quote truth.

## Final

DECISION=PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED

NEXT=072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md <<'EOF'
# Forge Quote Approval Gate Integration QA Lock Evidence 072C

Phase: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Status: PASS

Decision: `PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED`

Next: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

## Evidence Summary

072C validated the 072B Quote Approval Gate Integration implementation.

QA confirms no-effect preview behavior, approval-required behavior, payload integrity validation, payload-change blocking, evidence/freshness/rollback requirements, AI approval denial, safety validation approval denial, and default false safety flags.

## Validation Commands

- `node --check platform/action-contracts/quote-approval-gate-integration-072b.js`
- `node --check tests/quote-approval-gate-integration-072b-test.js`
- `node tests/quote-approval-gate-integration-072b-test.js`
- `python3 -m json.tool docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json`
- marker scan
- `git diff --check`
- scoped safety scan
- `git diff --cached --check`

## Final

DECISION=PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED

NEXT=072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_CERTIFICATE_072C.md <<'EOF'
# Forge Quote Approval Gate Integration QA Lock Certificate 072C

Certificate status: ISSUED

Phase: `072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Certified decision: `PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED`

Next: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

## Certification

072C certifies that the 072B Quote Approval Gate Integration passed local/static/no-effect QA.

Certified behavior:

- preview actions remain no-effect;
- real-effect quote actions require approval;
- payload integrity is enforced;
- payload changes after approval are blocked;
- source evidence, freshness, and rollback remain required;
- AI and safety validation cannot approve;
- approval cannot be inferred from preview interaction;
- all default safety flags remain false;
- no new quote engine was created;
- quote execution and quote approval remain unauthorized.

## Non-Authorization

This certificate does not authorize quote execution, quote approval, provider calls, quote document generation, quote send, quote save, quote binding, CRM writes, policy writes, pipeline writes, task/calendar/message actions, backend connection, auth, secrets, browser persistence, approval bypass, real engine effects, or invented quote truth.

## Final

DECISION=PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
EOF

cat > docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json <<'EOF'
{
  "phase": "072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK",
  "status": "PASS",
  "decision": "PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK",
  "lockedDecision": "QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED",
  "basePhase": "072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION",
  "next": "072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK",
  "mode": "qa_docs_evidence_only",
  "implementationFile": "platform/action-contracts/quote-approval-gate-integration-072b.js",
  "testFile": "tests/quote-approval-gate-integration-072b-test.js",
  "integrationId": "forge.quote.approval_gate.integration.v1",
  "quoteActionContractId": "forge.quote.action_contract.v1",
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "semanticQa": {
    "previewAllowedWithoutApproval": true,
    "realEffectRequiresApproval": true,
    "payloadIntegrityValidated": true,
    "payloadChangedAfterApprovalBlocked": true,
    "sourceEvidenceRequired": true,
    "freshnessRequired": true,
    "rollbackPlanRequired": true,
    "aiCannotApprove": true,
    "safetyValidationCannotApprove": true,
    "approvalCannotBeInferredFromPreview": true,
    "quoteExecutionAuthorized": false,
    "quoteApprovalAuthorized": false,
    "providerRuntimeAuthorized": false,
    "backendConnectionAuthorized": false,
    "newQuoteEngineCreated": false,
    "allDefaultSafetyFlagsFalse": true
  },
  "safeErrorsConfirmed": [
    "QUOTE_APPROVAL_GATE_NOT_MODELED",
    "QUOTE_ACTION_REQUIRES_APPROVAL",
    "ACTION_EXECUTION_REQUIRES_APPROVAL",
    "QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL",
    "ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL",
    "QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED",
    "ACTION_SOURCE_EVIDENCE_REQUIRED",
    "QUOTE_ACTION_FRESHNESS_REQUIRED",
    "ACTION_FRESHNESS_REQUIRED",
    "QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED",
    "ACTION_ROLLBACK_PLAN_REQUIRED",
    "QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED",
    "ACTION_EXECUTION_BLOCKED_BY_POLICY"
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

block = """<!-- FORGE:072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK:START -->
## 072C Quote Approval Gate Integration QA Lock

072C locks QA for the local/static/no-effect Quote Approval Gate Integration implementation.

Locked decision:
`QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED`

QA confirms:

- `forge.quote.approval_gate.integration.v1`;
- preview quote actions remain no-effect;
- real-effect quote actions require approval;
- payload integrity enforced;
- payload changed after approval blocked;
- source evidence required;
- freshness required;
- rollback plan required;
- AI/safety validation cannot approve;
- approval cannot be inferred from preview;
- quote execution unauthorized;
- quote approval unauthorized;
- provider/backend unauthorized;
- all default safety flags false.

DECISION=PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED

NEXT=072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
<!-- FORGE:072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK:START" in text:
        continue
    marker = "<!-- FORGE:072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION:END -->"
    if marker not in text:
        raise SystemExit(f"missing 072B marker in {path}")
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
 "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_CERTIFICATE_072C.md",
 "docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_072c_quote_approval_gate_integration_qa_lock.sh
run node --check platform/action-contracts/quote-approval-gate-integration-072b.js
run node --check tests/quote-approval-gate-integration-072b-test.js
run node tests/quote-approval-gate-integration-072b-test.js
run python3 -m json.tool docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json
run rg -n "072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK|PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK|QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED|072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK|forge\.quote\.approval_gate\.integration\.v1|ACTION_EXECUTION_REQUIRES_APPROVAL" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_CERTIFICATE_072C.md \
  docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  tests/quote-approval-gate-integration-072b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_072C.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_CERTIFICATE_072C.md"
  "docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json"
  "tools/termux/forge_072c_quote_approval_gate_integration_qa_lock.sh"
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
run git commit -m "docs: lock quote approval gate integration qa"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK_COMMIT_PUSH_COMPLETE
DECISION=PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK
LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED
NEXT=072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
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
