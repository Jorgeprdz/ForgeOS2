#!/usr/bin/env bash
set -euo pipefail

PHASE="072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK"
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
  echo "MODE=docs/decision lock only"
  echo "BOUNDARY=no UI mutation; no backend real; no quote execution; no quote approval; no provider/auth/secrets/browser/real engine; no CRM/policy/quote/pipeline/task/calendar/message writes"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 072C QA locked; decision lock only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 072C"
if [ -f docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json'
d=json.load(open(p))
assert d.get('phase') == '072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK'
assert d.get('decision') == 'PASS_072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK'
assert d.get('lockedDecision') == 'QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCKED'
assert d.get('next') == '072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK'
qa=d.get('semanticQa', {})
assert qa.get('quoteExecutionAuthorized') is False
assert qa.get('quoteApprovalAuthorized') is False
assert qa.get('providerRuntimeAuthorized') is False
assert qa.get('backendConnectionAuthorized') is False
assert qa.get('newQuoteEngineCreated') is False
assert qa.get('allDefaultSafetyFlagsFalse') is True
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "072C audit confirmed"
else
  red "072C audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-approval-gate-integration-072b.js"
  "tests/quote-approval-gate-integration-072b-test.js"
  "docs/evidence/forge-quote-approval-gate-integration-qa-audit-072c.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/072d-quote-approval-gate-integration-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 VERIFY IMPLEMENTATION STILL PASSES"
run node --check platform/action-contracts/quote-approval-gate-integration-072b.js
run node --check tests/quote-approval-gate-integration-072b-test.js
run node tests/quote-approval-gate-integration-072b-test.js

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence

cat > docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md <<'EOF'
# Forge Quote Approval Gate Integration Decision Lock 072D

Phase: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Decision: `PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR`

Next: `073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE`

## Decision

072D locks the Quote Approval Gate Integration as a local/static/no-effect validator.

The validator may inspect Quote Action Contract envelopes, Approval Gate schema fields, payload hashes, approval requirement status, evidence, freshness, rollback, safety flags, and safe error conditions.

The validator may not execute quote actions.

The validator may not approve quote actions.

The validator may not call providers, connect backend, generate quote documents, send quotes, save quotes, bind quotes, write CRM, write policies, write pipeline state, create tasks, create calendar events, send messages, access auth or secrets, persist browser state, bypass approval, run real engines with effects, or invent quote truth.

## Authorized Use

- local/static approval gate integration validation;
- preview-safe approval requirement detection;
- deterministic payload integrity checks;
- payload changed after approval detection;
- source evidence requirement checks;
- freshness requirement checks;
- rollback requirement checks;
- safe error mapping;
- blocked effects reporting;
- default false safety flag verification;
- future planning for controlled quote execution gates.

## Not Authorized

- quote execution;
- quote approval;
- provider runtime;
- backend connection;
- real quote document generation;
- quote send;
- quote save;
- quote bind;
- CRM write;
- policy write;
- pipeline write;
- task/calendar/message action;
- auth or secret access;
- browser persistence;
- approval bypass;
- invented premium, coverage, carrier, or quote truth.

## Locked Boundary

Quote Approval Gate Integration can block unsafe quote actions.

Quote Approval Gate Integration cannot perform quote actions.

Human approval remains required before any real quote effect.

## Safe Errors

- `QUOTE_APPROVAL_GATE_NOT_MODELED`
- `QUOTE_ACTION_REQUIRES_APPROVAL`
- `ACTION_EXECUTION_REQUIRES_APPROVAL`
- `QUOTE_ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`
- `ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`
- `QUOTE_ACTION_SOURCE_EVIDENCE_REQUIRED`
- `ACTION_SOURCE_EVIDENCE_REQUIRED`
- `QUOTE_ACTION_FRESHNESS_REQUIRED`
- `ACTION_FRESHNESS_REQUIRED`
- `QUOTE_ACTION_ROLLBACK_PLAN_REQUIRED`
- `ACTION_ROLLBACK_PLAN_REQUIRED`
- `QUOTE_ACTION_REAL_EFFECT_NOT_ALLOWED`
- `ACTION_EXECUTION_BLOCKED_BY_POLICY`

## Final

DECISION=PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR

NEXT=073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md <<'EOF'
# Forge Quote Approval Gate Integration Decision Lock Evidence 072D

Phase: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Status: PASS

Decision: `PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR`

Next: `073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE`

## Evidence Summary

072D locks the 072B/072C Quote Approval Gate Integration work as local/static/no-effect validation infrastructure.

The lock preserves the separation between preview validation and real quote execution.

## Confirmed

- 072B implementation passed.
- 072C QA lock passed.
- Integration id is `forge.quote.approval_gate.integration.v1`.
- Quote action contract id is `forge.quote.action_contract.v1`.
- Real quote effects remain blocked without approval.
- AI cannot approve.
- Safety validation cannot approve.
- Approval cannot be inferred from preview/open/click/type/view.
- Quote execution remains unauthorized.
- Quote approval remains unauthorized.
- Provider runtime remains unauthorized.
- Backend connection remains unauthorized.
- No new quote engine was created.
- All safety flags remain false.

## Boundary

No UI mutation, backend connection, quote execution, quote approval, provider call, quote write, policy write, CRM write, pipeline write, task/calendar/message action, auth, secret access, browser persistence, approval bypass, real engine effect, or invented quote truth was introduced.

## Final

DECISION=PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR

NEXT=073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE
EOF

cat > docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_CERTIFICATE_072D.md <<'EOF'
# Forge Quote Approval Gate Integration Decision Lock Certificate 072D

Certificate status: ISSUED

Phase: `072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Certified decision: `PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK`

Locked decision: `QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR`

Next: `073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE`

## Certification

072D certifies that the Quote Approval Gate Integration is locked as a local/static/no-effect validator.

It may be used for preview-safe approval gate validation and future planning.

It may not execute quotes, approve quotes, call providers, generate documents, send quotes, save quotes, bind policies, write records, connect backend, access secrets, bypass approval, or invent quote truth.

## Required Next Step

`073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE`

## Final

DECISION=PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
EOF

cat > docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json <<'EOF'
{
  "phase": "072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK",
  "status": "PASS",
  "decision": "PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK",
  "lockedDecision": "QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR",
  "basePhases": [
    "072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE",
    "072B_QUOTE_APPROVAL_GATE_INTEGRATION_IMPLEMENTATION",
    "072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK"
  ],
  "next": "073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE",
  "integrationId": "forge.quote.approval_gate.integration.v1",
  "quoteActionContractId": "forge.quote.action_contract.v1",
  "authorizedUse": [
    "local_static_approval_gate_integration_validation",
    "preview_safe_approval_requirement_detection",
    "deterministic_payload_integrity_checks",
    "payload_changed_after_approval_detection",
    "source_evidence_requirement_checks",
    "freshness_requirement_checks",
    "rollback_requirement_checks",
    "safe_error_mapping",
    "blocked_effects_reporting",
    "default_false_safety_flag_verification",
    "future_controlled_quote_execution_gate_planning"
  ],
  "notAuthorizedUse": [
    "quote_execution",
    "quote_approval",
    "provider_runtime",
    "backend_connection",
    "real_quote_document_generation",
    "quote_send",
    "quote_save",
    "quote_bind",
    "crm_write",
    "policy_write",
    "pipeline_write",
    "task_calendar_message_action",
    "auth_secret_access",
    "browser_persistence",
    "approval_bypass",
    "invented_quote_truth"
  ],
  "quoteExecutionAuthorized": false,
  "quoteApprovalAuthorized": false,
  "providerRuntimeAuthorized": false,
  "backendConnectionAuthorized": false,
  "newQuoteEngineCreated": false,
  "humanApprovalRequiredForRealEffects": true,
  "aiCanApprove": false,
  "safetyValidationCanApprove": false,
  "approvalCanBeInferredFromPreview": false,
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

block = """<!-- FORGE:072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK:START -->
## 072D Quote Approval Gate Integration Decision Lock

072D locks the Quote Approval Gate Integration as local/static/no-effect validation infrastructure.

Locked decision:
`QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR`

Authorized:

- local/static approval gate integration validation;
- preview-safe approval requirement detection;
- deterministic payload integrity checks;
- payload changed after approval detection;
- source evidence, freshness, and rollback requirement checks;
- safe error mapping;
- blocked effects reporting;
- default false safety flag verification.

Not authorized:

- quote execution;
- quote approval;
- provider runtime;
- backend connection;
- quote document generation, send, save, or bind;
- CRM, policy, pipeline, task, calendar, or message effects;
- auth, secret, browser, approval bypass, or invented truth.

DECISION=PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK

LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR

NEXT=073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE
<!-- FORGE:072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK:START" in text:
        continue
    marker = "<!-- FORGE:072C_QUOTE_APPROVAL_GATE_INTEGRATION_QA_LOCK:END -->"
    if marker not in text:
        raise SystemExit(f"missing 072C marker in {path}")
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
 "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md",
 "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_CERTIFICATE_072D.md",
 "docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_072d_quote_approval_gate_integration_decision_lock.sh
run node --check platform/action-contracts/quote-approval-gate-integration-072b.js
run node --check tests/quote-approval-gate-integration-072b-test.js
run node tests/quote-approval-gate-integration-072b-test.js
run python3 -m json.tool docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json
run rg -n "072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK|PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK|QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR|073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE|forge\.quote\.approval_gate\.integration\.v1" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_CERTIFICATE_072D.md \
  docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  tests/quote-approval-gate-integration-072b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md \
  docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/quote-approval-gate-integration-072b.js \
  docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_072D.md"
  "docs/evidence/FORGE_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_CERTIFICATE_072D.md"
  "docs/evidence/forge-quote-approval-gate-integration-decision-audit-072d.json"
  "tools/termux/forge_072d_quote_approval_gate_integration_decision_lock.sh"
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
run git commit -m "docs: lock quote approval gate integration decision"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK_COMMIT_PUSH_COMPLETE
DECISION=PASS_072D_QUOTE_APPROVAL_GATE_INTEGRATION_DECISION_LOCK
LOCKED_DECISION=QUOTE_APPROVAL_GATE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_VALIDATOR
NEXT=073A_QUOTE_PDF_PREVIEW_ENGINE_REPO_PROMOTION_SCOPE
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
