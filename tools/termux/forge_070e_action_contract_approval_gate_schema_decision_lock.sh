#!/usr/bin/env bash
set -euo pipefail

PHASE="070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK"
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
  echo "BOUNDARY=no UI mutation; no backend real; no action execution; no CRM/policy/quote/pipeline/task/calendar/message writes; no provider/auth/secrets/browser/real engine"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 070D QA locked; decision lock only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 070D"
if [ -f docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json'
d=json.load(open(p))
assert d.get('phase') == '070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK'
assert d.get('decision') == 'PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK'
assert d.get('lockedDecision') == 'ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED'
assert d.get('next') == '070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK'
assert d.get('semanticQa', {}).get('allDefaultSafetyFlagsFalse') is True
assert all(v is False for v in d.get('safetyFlags', {}).values())
PY
then
  green "070D audit confirmed"
else
  red "070D audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md"
  "docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json"
  "platform/action-contracts/action-contract-approval-gate-schema-070c.js"
  "tests/action-contract-approval-gate-schema-070c-test.js"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/070e-action-contract-approval-gate-schema-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 VERIFY 070C/070D BEHAVIOR"
run node --check platform/action-contracts/action-contract-approval-gate-schema-070c.js
run node --check tests/action-contract-approval-gate-schema-070c-test.js
run node tests/action-contract-approval-gate-schema-070c-test.js

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence

cat > docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md <<'EOF'
# Forge Action Contract Approval Gate Schema Decision Lock 070E

Phase: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Decision: `PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA`

Next: `071A_QUOTE_ACTION_CONTRACT_SCOPE`

## Decision

070E locks the Action Contract and Approval Gate schema implementation as a local/static/no-effect schema layer.

This decision authorizes the schema module only for:

- local schema constants;
- required field inspection;
- deterministic shape validation;
- deterministic payload integrity validation;
- safe error construction;
- default false safety flags;
- future action-contract planning.

## Authorized Use

- `forge.action_contract.v1`
- `forge.approval_gate.v1`
- local/static validation
- no-effect preview checks
- QA evidence
- future action contract scope work

## Not Authorized

070E does not authorize:

- action execution;
- action approval;
- approval bypass;
- UI mutation;
- backend connection;
- CRM write;
- policy write;
- quote write;
- pipeline write;
- task creation;
- calendar creation;
- message send;
- provider execution;
- auth or secret access;
- browser persistence;
- real engine execution with effects;
- invented truth.

## Locked Boundary

The schema can say whether an action contract is modeled, missing fields, blocked by approval, blocked by payload mismatch, missing source evidence, missing freshness, or missing rollback plan.

The schema cannot execute the action.

The schema cannot approve the action.

The schema cannot convert preview into permission.

Human approval remains required for real effects.

## Safe Errors

- `ACTION_EXECUTION_REQUIRES_APPROVAL`
- `ACTION_CONTRACT_NOT_MODELED`
- `ACTION_EXECUTION_BLOCKED_BY_POLICY`
- `ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL`
- `ACTION_APPROVAL_EXPIRED`
- `ACTION_APPROVAL_REVOKED`
- `ACTION_CAPABILITY_NOT_GRANTED`
- `ACTION_SOURCE_EVIDENCE_REQUIRED`
- `ACTION_FRESHNESS_REQUIRED`
- `ACTION_ROLLBACK_PLAN_REQUIRED`

## Final

DECISION=PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA

NEXT=071A_QUOTE_ACTION_CONTRACT_SCOPE
EOF

cat > docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md <<'EOF'
# Forge Action Contract Approval Gate Schema Decision Lock Evidence 070E

Phase: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Status: PASS

Decision: `PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA`

Next: `071A_QUOTE_ACTION_CONTRACT_SCOPE`

## Evidence Summary

070E locks the 070C/070D Action Contract and Approval Gate schema work as a local/static/no-effect schema layer.

The lock preserves Article 0 boundaries: schema validation is allowed; action execution is not allowed.

## Confirmed

- 070C implementation passed.
- 070D QA lock passed.
- Schema versions are `forge.action_contract.v1` and `forge.approval_gate.v1`.
- Safe errors remain deterministic.
- Default safety flags remain false.
- Approval cannot be inferred or auto-created.
- Payload changes after approval remain blocked.
- Source evidence, freshness, and rollback rules remain required for executable/effectful contracts.

## Boundary

No UI mutation, backend real connection, action execution, approval bypass, CRM write, policy write, quote write, pipeline write, task creation, calendar creation, message send, provider execution, auth, secret access, browser persistence, real engine execution, or invented truth was introduced.

## Final

DECISION=PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA

NEXT=071A_QUOTE_ACTION_CONTRACT_SCOPE
EOF

cat > docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_CERTIFICATE_070E.md <<'EOF'
# Forge Action Contract Approval Gate Schema Decision Lock Certificate 070E

Certificate status: ISSUED

Phase: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Certified decision: `PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA`

Next: `071A_QUOTE_ACTION_CONTRACT_SCOPE`

## Certification

070E certifies that the Action Contract and Approval Gate schema layer is locked as local/static/no-effect infrastructure.

It may be used for schema inspection, validation, QA, and future action-contract planning.

It may not execute, approve, send, persist, mutate, call providers, connect backend, access secrets, bypass approval, or create real effects.

## Required Next Step

`071A_QUOTE_ACTION_CONTRACT_SCOPE`

## Final

DECISION=PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
EOF

cat > docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json <<'EOF'
{
  "phase": "070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK",
  "status": "PASS",
  "decision": "PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK",
  "lockedDecision": "ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA",
  "basePhases": [
    "070B_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_SCOPE",
    "070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION",
    "070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK"
  ],
  "next": "071A_QUOTE_ACTION_CONTRACT_SCOPE",
  "authorizedUse": [
    "local_schema_constants",
    "required_field_inspection",
    "deterministic_shape_validation",
    "deterministic_payload_integrity_validation",
    "safe_error_construction",
    "default_false_safety_flags",
    "future_action_contract_planning"
  ],
  "notAuthorizedUse": [
    "action_execution",
    "action_approval",
    "approval_bypass",
    "ui_mutation",
    "backend_connection",
    "crm_write",
    "policy_write",
    "quote_write",
    "pipeline_write",
    "task_creation",
    "calendar_creation",
    "message_send",
    "provider_execution",
    "auth_secret_access",
    "browser_persistence",
    "real_engine_execution_with_effects",
    "invented_truth"
  ],
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "safeErrors": [
    "ACTION_EXECUTION_REQUIRES_APPROVAL",
    "ACTION_CONTRACT_NOT_MODELED",
    "ACTION_EXECUTION_BLOCKED_BY_POLICY",
    "ACTION_PAYLOAD_CHANGED_AFTER_APPROVAL",
    "ACTION_APPROVAL_EXPIRED",
    "ACTION_APPROVAL_REVOKED",
    "ACTION_CAPABILITY_NOT_GRANTED",
    "ACTION_SOURCE_EVIDENCE_REQUIRED",
    "ACTION_FRESHNESS_REQUIRED",
    "ACTION_ROLLBACK_PLAN_REQUIRED"
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
  "humanApprovalRequiredForRealEffects": true,
  "schemaCanExecuteActions": false,
  "schemaCanApproveActions": false,
  "schemaCanBypassApproval": false,
  "validation": {
    "nodeCheckSchema": "PASS",
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

block = """<!-- FORGE:070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK:START -->
## 070E Action Contract Approval Gate Schema Decision Lock

070E locks the Action Contract and Approval Gate schema layer as local/static/no-effect infrastructure.

Locked decision:
`ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA`

Authorized:

- local schema constants;
- required field inspection;
- deterministic shape validation;
- deterministic payload integrity validation;
- safe error construction;
- future action-contract planning.

Not authorized:

- action execution;
- action approval;
- approval bypass;
- UI/backend mutation;
- CRM, policy, quote, pipeline, task, calendar, or message writes;
- provider, auth, secret, browser, or real engine effects;
- invented truth.

DECISION=PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA

NEXT=071A_QUOTE_ACTION_CONTRACT_SCOPE
<!-- FORGE:070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK:END -->
"""

for raw in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    path = Path(raw)
    text = path.read_text()
    if "FORGE:070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK:START" in text:
        continue
    marker = "<!-- FORGE:070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK:END -->"
    if marker not in text:
        raise SystemExit(f"missing 070D marker in {path}")
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
 "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md",
 "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md",
 "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_CERTIFICATE_070E.md",
 "docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text().replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_070e_action_contract_approval_gate_schema_decision_lock.sh
run node --check platform/action-contracts/action-contract-approval-gate-schema-070c.js
run node --check tests/action-contract-approval-gate-schema-070c-test.js
run node tests/action-contract-approval-gate-schema-070c-test.js
run python3 -m json.tool docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json
run rg -n "070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK|PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK|ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA|071A_QUOTE_ACTION_CONTRACT_SCOPE|forge\.action_contract\.v1|forge\.approval_gate\.v1" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_CERTIFICATE_070E.md \
  docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/action-contract-approval-gate-schema-070c.js \
  tests/action-contract-approval-gate-schema-070c-test.js \
  docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/action-contract-approval-gate-schema-070c.js \
  docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_070E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_CERTIFICATE_070E.md"
  "docs/evidence/forge-action-contract-approval-gate-schema-decision-audit-070e.json"
  "tools/termux/forge_070e_action_contract_approval_gate_schema_decision_lock.sh"
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
run git commit -m "docs: lock action contract approval gate schema decision"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK_COMMIT_PUSH_COMPLETE
DECISION=PASS_070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_LOCKED_AS_LOCAL_STATIC_NO_EFFECT_SCHEMA
NEXT=071A_QUOTE_ACTION_CONTRACT_SCOPE
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
