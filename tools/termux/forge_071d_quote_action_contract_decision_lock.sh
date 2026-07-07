#!/usr/bin/env bash
set -euo pipefail

PHASE="071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK"
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
  echo "BOUNDARY=no UI mutation; no backend real; no quote execution; no provider/auth/secrets/browser/real engine; no CRM/policy/quote/pipeline/task/calendar/message writes"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 071C QA locked; decision lock only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 071C"
if [ -f docs/evidence/forge-quote-action-contract-qa-audit-071c.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-quote-action-contract-qa-audit-071c.json'
d=json.load(open(p))
assert d.get('phase') == '071C_QUOTE_ACTION_CONTRACT_QA_LOCK'
assert d.get('decision') == 'PASS_071C_QUOTE_ACTION_CONTRACT_QA_LOCK'
assert d.get('lockedDecision') == 'QUOTE_ACTION_CONTRACT_QA_LOCKED'
assert d.get('next') == '071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK'
qa=d.get('semanticQa', {})
assert qa.get('newQuoteEngineCreated') is False
assert qa.get('quoteExecutionAuthorized') is False
assert qa.get('allDefaultSafetyFlagsFalse') is True
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "071C audit confirmed"
else
  red "071C audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/quote-action-contract-071b.js"
  "tests/quote-action-contract-071b-test.js"
  "docs/evidence/forge-quote-action-contract-qa-audit-071c.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/071d-quote-action-contract-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 VERIFY IMPLEMENTATION STILL PASSES"
run node --check platform/action-contracts/quote-action-contract-071b.js
run node --check tests/quote-action-contract-071b-test.js
run node tests/quote-action-contract-071b-test.js

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence

cat > docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md <<'EOF'
# Forge Quote Action Contract Decision Lock 071D

Phase: `071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Decision: `PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT`

Next: `072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE`

## Decision

071D locks the Quote Action Contract as a local/static/no-effect contract layer.

The contract may describe, build, and validate quote action envelopes.

The contract may not execute quote actions.

The contract may not approve quote actions.

The contract may not call providers, generate PDFs, send quotes, save quotes, bind quotes, write CRM, write policies, write pipeline state, create tasks, create calendar events, send messages, connect backend, access auth, access secrets, persist browser state, bypass approval, or invent quote truth.

## Authorized Use

- local/static quote action contract construction;
- preview-safe quote action validation;
- deterministic payload hashing;
- required field validation;
- approval requirement detection;
- payload-changed-after-approval detection;
- source evidence requirement detection;
- freshness requirement detection;
- rollback plan requirement detection;
- default false safety flags;
- safe error construction;
- future approval gate integration planning.

## Not Authorized

- new quote engine creation;
- quote execution;
- quote approval;
- provider runtime;
- backend connection;
- real quote document or proposal generation;
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

The Quote Action Contract can answer whether a future quote action is modeled, preview-only, approval-required, missing evidence, missing freshness, missing rollback, payload-changed, or blocked.

It cannot perform the action.

Human approval remains required before any real quote effect.

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

DECISION=PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT

NEXT=072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE
EOF

cat > docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md <<'EOF'
# Forge Quote Action Contract Decision Lock Evidence 071D

Phase: `071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Status: PASS

Decision: `PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT`

Next: `072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE`

## Evidence Summary

071D locks the 071B/071C Quote Action Contract work as local/static/no-effect infrastructure.

The lock preserves the separation between:

- existing quote engine;
- quote read model;
- quote action contract;
- approval gate;
- future real-effect execution.

## Confirmed

- 071B implementation passed.
- 071C QA lock passed.
- Contract id is `forge.quote.action_contract.v1`.
- Schema `forge.action_contract.v1` is used.
- Schema `forge.approval_gate.v1` is used.
- No new quote engine was created.
- Quote execution remains unauthorized.
- Real-effect quote actions require approval.
- Payload integrity is enforced.
- Evidence, freshness, and rollback requirements are enforced.
- All safety flags remain false.

## Boundary

No UI mutation, backend connection, quote execution, provider call, quote write, policy write, CRM write, pipeline write, task/calendar/message action, auth, secret access, browser persistence, approval bypass, real engine effect, or invented quote truth was introduced.

## Final

DECISION=PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT

NEXT=072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE
EOF

cat > docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_CERTIFICATE_071D.md <<'EOF'
# Forge Quote Action Contract Decision Lock Certificate 071D

Certificate status: ISSUED

Phase: `071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Certified decision: `PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK`

Locked decision: `QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT`

Next: `072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE`

## Certification

071D certifies that the Quote Action Contract is locked as a local/static/no-effect contract layer.

It may be used for preview-safe action contract creation, validation, QA, and future approval gate integration planning.

It may not execute quotes, approve quotes, call providers, generate documents, send quotes, save quotes, bind policies, write records, connect backend, access secrets, bypass approval, or invent truth.

## Required Next Step

`072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE`

## Final

DECISION=PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK
EOF

cat > docs/evidence/forge-quote-action-contract-decision-audit-071d.json <<'EOF'
{
  "phase": "071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK",
  "status": "PASS",
  "decision": "PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK",
  "lockedDecision": "QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT",
  "basePhases": [
    "071A_QUOTE_ACTION_CONTRACT_SCOPE",
    "071B_QUOTE_ACTION_CONTRACT_IMPLEMENTATION",
    "071C_QUOTE_ACTION_CONTRACT_QA_LOCK"
  ],
  "next": "072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE",
  "contractId": "forge.quote.action_contract.v1",
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "authorizedUse": [
    "local_static_quote_action_contract_construction",
    "preview_safe_quote_action_validation",
    "deterministic_payload_hashing",
    "required_field_validation",
    "approval_requirement_detection",
    "payload_changed_after_approval_detection",
    "source_evidence_requirement_detection",
    "freshness_requirement_detection",
    "rollback_plan_requirement_detection",
    "default_false_safety_flags",
    "safe_error_construction",
    "future_approval_gate_integration_planning"
  ],
  "notAuthorizedUse": [
    "new_quote_engine_creation",
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
  "newQuoteEngineCreated": false,
  "quoteExecutionAuthorized": false,
  "quoteApprovalAuthorized": false,
  "humanApprovalRequiredForRealEffects": true,
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

block = """<!-- FORGE:071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK:START -->
## 071D Quote Action Contract Decision Lock

071D locks the Quote Action Contract as local/static/no-effect infrastructure.

Locked decision:
`QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT`

Authorized:

- local/static quote action contract construction;
- preview-safe quote action validation;
- deterministic payload hashing;
- approval requirement detection;
- payload integrity detection;
- evidence, freshness, and rollback requirement detection;
- safe error construction;
- future approval gate integration planning.

Not authorized:

- new quote engine;
- quote execution;
- quote approval;
- provider runtime;
- backend connection;
- quote document generation, send, save, or bind;
- CRM, policy, pipeline, task, calendar, or message effects;
- auth, secret, browser, approval bypass, or invented truth.

DECISION=PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK

LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT

NEXT=072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE
<!-- FORGE:071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK:START" in text:
        continue
    marker = "<!-- FORGE:071C_QUOTE_ACTION_CONTRACT_QA_LOCK:END -->"
    if marker not in text:
        raise SystemExit(f"missing 071C marker in {path}")
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
 "docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md",
 "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md",
 "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_CERTIFICATE_071D.md",
 "docs/evidence/forge-quote-action-contract-decision-audit-071d.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_071d_quote_action_contract_decision_lock.sh
run node --check platform/action-contracts/quote-action-contract-071b.js
run node --check tests/quote-action-contract-071b-test.js
run node tests/quote-action-contract-071b-test.js
run python3 -m json.tool docs/evidence/forge-quote-action-contract-decision-audit-071d.json
run rg -n "071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK|PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK|QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT|072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE|forge\.quote\.action_contract\.v1|QUOTE_ACTION_REQUIRES_APPROVAL" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_CERTIFICATE_071D.md \
  docs/evidence/forge-quote-action-contract-decision-audit-071d.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/quote-action-contract-071b.js \
  tests/quote-action-contract-071b-test.js \
  docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md \
  docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/quote-action-contract-071b.js \
  docs/evidence/forge-quote-action-contract-decision-audit-071d.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md"
  "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_071D.md"
  "docs/evidence/FORGE_QUOTE_ACTION_CONTRACT_DECISION_LOCK_CERTIFICATE_071D.md"
  "docs/evidence/forge-quote-action-contract-decision-audit-071d.json"
  "tools/termux/forge_071d_quote_action_contract_decision_lock.sh"
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
run git commit -m "docs: lock quote action contract decision"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK_COMMIT_PUSH_COMPLETE
DECISION=PASS_071D_QUOTE_ACTION_CONTRACT_DECISION_LOCK
LOCKED_DECISION=QUOTE_ACTION_CONTRACT_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_CONTRACT
NEXT=072A_QUOTE_APPROVAL_GATE_INTEGRATION_SCOPE
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
