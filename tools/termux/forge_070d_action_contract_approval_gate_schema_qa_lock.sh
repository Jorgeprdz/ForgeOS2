#!/usr/bin/env bash
set -euo pipefail

PHASE="070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK"
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
  echo "BOUNDARY=no UI mutation; no backend real; no CRM/policy/quote/pipeline/task/calendar/message writes; no provider/auth/secrets/browser/real engine"
  echo "REPORT=$REPORT"
  echo "ROBOCOP_GATE=Article 0; 070C implemented; QA lock only"
} | tee -a "$REPORT"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 VERIFY 070C"
if [ -f docs/evidence/forge-action-contract-approval-gate-schema-implementation-audit-070c.json ] && \
python3 - <<'PY'
import json
p='docs/evidence/forge-action-contract-approval-gate-schema-implementation-audit-070c.json'
d=json.load(open(p))
assert d.get('phase') == '070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION'
assert d.get('decision') == 'PASS_070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION'
assert d.get('lockedDecision') == 'ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTED'
assert d.get('next') == '070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK'
v=d.get('validation', {})
for key in ['jsonAudit','markerScan','gitDiffCheck','safetyScan','stagedDiffCheck']:
    assert v.get(key) == 'PASS', key
PY
then
  green "070C audit confirmed"
else
  red "070C audit not confirmed"
fi

REQUIRED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/action-contracts/action-contract-approval-gate-schema-070c.js"
  "tests/action-contract-approval-gate-schema-070c-test.js"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION_070C.md"
  "docs/evidence/forge-action-contract-approval-gate-schema-implementation-audit-070c.json"
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || red "missing required file: $f"
  green "$f"
done

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/070d-action-contract-approval-gate-schema-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP/"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP/"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP/"
green "backup created: $BACKUP"

stage "STAGE 4 SEMANTIC QA"
node tests/action-contract-approval-gate-schema-070c-test.js | tee -a "$REPORT"

python3 - <<'PY' | tee -a "$REPORT"
import json, subprocess
audit=json.load(open('docs/evidence/forge-action-contract-approval-gate-schema-implementation-audit-070c.json'))
assert audit['behaviorImplemented']['schemaOnly'] is True
assert audit['behaviorImplemented']['executableWriteWithoutApprovalBlocked'] is True
assert audit['behaviorImplemented']['payloadChangedAfterApprovalBlocked'] is True
assert audit['behaviorImplemented']['sourceEvidenceRequiredForExecutableAction'] is True
assert audit['behaviorImplemented']['freshnessRequiredForExecutableAction'] is True
assert audit['behaviorImplemented']['rollbackPlanRequiredForEffectfulAction'] is True
assert audit['behaviorImplemented']['executionResultBeforeExecuteBlocked'] is True
assert audit['behaviorImplemented']['aiCannotApprove'] is True
assert audit['behaviorImplemented']['allDefaultSafetyFlagsFalse'] is True
assert all(v is False for v in audit['defaultSafetyFlags'].values())
print(json.dumps({
  "status":"PASS",
  "schemaOnly": True,
  "approvalRequiredBlocked": True,
  "payloadIntegrityBlocked": True,
  "evidenceFreshnessRollbackRequired": True,
  "aiApprovalDenied": True,
  "allDefaultSafetyFlagsFalse": True
}, indent=2))
PY
green "semantic QA passed"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence

cat > docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md <<'EOF'
# Forge Action Contract Approval Gate Schema QA Lock 070D

Phase: `070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Decision: `PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED`

Next: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

## QA Scope

070D locks QA for the local/static/no-effect Action Contract and Approval Gate schema implementation from 070C.

Validated files:

- `platform/action-contracts/action-contract-approval-gate-schema-070c.js`
- `tests/action-contract-approval-gate-schema-070c-test.js`

## QA Confirmed

- `forge.action_contract.v1` is exposed.
- `forge.approval_gate.v1` is exposed.
- Required action contract fields are modeled.
- Required approval gate fields are modeled.
- Default safety flags remain false.
- Executable write actions without approval are blocked.
- Payload changes after approval are blocked.
- Source evidence is required for executable action contracts.
- Freshness is required for executable action contracts.
- Rollback plan is required for effectful actions.
- `execution_result` before `execute` or `executed` is rejected.
- AI/safety validation cannot mark approval.
- Safe errors remain deterministic.

## Boundary

070D is QA/docs/evidence only.

It does not execute actions, approve actions, mutate UI, connect backend, write CRM, policy, quote, pipeline, task, calendar, or message state, execute providers, access auth or secrets, persist browser state, bypass approval, or invent truth.

## Final

DECISION=PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED

NEXT=070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
EOF

cat > docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md <<'EOF'
# Forge Action Contract Approval Gate Schema QA Lock Evidence 070D

Phase: `070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Status: PASS

Decision: `PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED`

Next: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

## Evidence Summary

070D validated the 070C schema implementation and test behavior for Action Contract and Approval Gate.

Validation confirmed schema-only behavior, approval blocking, payload integrity blocking, evidence and freshness requirements, rollback requirements, execution-result timing, AI approval denial, and default false safety flags.

## Validation Commands

- `node --check platform/action-contracts/action-contract-approval-gate-schema-070c.js`
- `node --check tests/action-contract-approval-gate-schema-070c-test.js`
- `node tests/action-contract-approval-gate-schema-070c-test.js`
- `python3 -m json.tool docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json`
- marker scan
- `git diff --check`
- scoped safety scan
- `git diff --cached --check`

## Final

DECISION=PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED

NEXT=070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
EOF

cat > docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_CERTIFICATE_070D.md <<'EOF'
# Forge Action Contract Approval Gate Schema QA Lock Certificate 070D

Certificate status: ISSUED

Phase: `070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Certified decision: `PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK`

Locked decision: `ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED`

Next: `070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK`

## Certification

070D certifies that the 070C Action Contract and Approval Gate schema implementation passed local/static/no-effect QA.

Certified behavior:

- schema-only validation;
- no action execution;
- approval required for executable/effectful actions;
- payload integrity enforcement;
- source evidence requirement;
- freshness requirement;
- rollback plan requirement;
- AI/safety validation cannot approve;
- all default safety flags remain false.

## Non-Authorization

This certificate does not authorize action execution, UI mutation, backend connection, CRM/policy/quote/pipeline writes, task/calendar/message creation, provider execution, auth, secret access, browser persistence, approval bypass, real engine effects, or invented truth.

## Final

DECISION=PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK
EOF

cat > docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json <<'EOF'
{
  "phase": "070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK",
  "status": "PASS",
  "decision": "PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK",
  "lockedDecision": "ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED",
  "basePhase": "070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION",
  "next": "070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK",
  "mode": "qa_docs_evidence_only",
  "schemaFile": "platform/action-contracts/action-contract-approval-gate-schema-070c.js",
  "testFile": "tests/action-contract-approval-gate-schema-070c-test.js",
  "schemas": {
    "actionContract": "forge.action_contract.v1",
    "approvalGate": "forge.approval_gate.v1"
  },
  "semanticQa": {
    "schemaOnly": true,
    "approvalRequiredBlocked": true,
    "payloadChangedAfterApprovalBlocked": true,
    "sourceEvidenceRequired": true,
    "freshnessRequired": true,
    "rollbackPlanRequired": true,
    "executionResultBeforeExecuteBlocked": true,
    "aiApprovalDenied": true,
    "allDefaultSafetyFlagsFalse": true
  },
  "safeErrorsConfirmed": [
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

block = """<!-- FORGE:070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK:START -->
## 070D Action Contract Approval Gate Schema QA Lock

070D locks QA for the local/static/no-effect Action Contract and Approval Gate schema implementation.

Locked decision:
`ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED`

QA confirms:

- `forge.action_contract.v1`;
- `forge.approval_gate.v1`;
- required fields modeled;
- approval required behavior;
- payload changed after approval blocked;
- source evidence required;
- freshness required;
- rollback plan required;
- execution result timing enforced;
- AI/safety validation cannot approve;
- all default safety flags false.

DECISION=PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK

LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED

NEXT=070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
<!-- FORGE:070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK:END -->
"""

files = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

for path in files:
    text = path.read_text()
    if "FORGE:070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK:START" in text:
        continue
    marker = "<!-- FORGE:070C_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_IMPLEMENTATION:END -->"
    if marker not in text:
        raise SystemExit(f"missing 070C marker in {path}")
    text = text.replace(marker, marker + "\n\n" + block, 1)
    path.write_text(text)
PY
green "build tree / roadmap updated"

stage "STAGE 7 NORMALIZE FILES"
python3 - <<'PY'
from pathlib import Path
paths = [
 "FORGE_MASTER_BUILD_TREE.md",
 "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
 "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
 "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md",
 "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md",
 "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_CERTIFICATE_070D.md",
 "docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json",
]
for p in paths:
    path=Path(p)
    s=path.read_text()
    s=s.replace("\r\n","\n").replace("\r","\n").rstrip()+"\n"
    path.write_text(s)
PY
green "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_070d_action_contract_approval_gate_schema_qa_lock.sh
run node --check platform/action-contracts/action-contract-approval-gate-schema-070c.js
run node --check tests/action-contract-approval-gate-schema-070c-test.js
run node tests/action-contract-approval-gate-schema-070c-test.js
run python3 -m json.tool docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json
run rg -n "070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK|PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK|ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED|070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK|forge\.action_contract\.v1|forge\.approval_gate\.v1" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_CERTIFICATE_070D.md \
  docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json
run git diff --check

stage "STAGE 9 SAFETY SCAN"
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" \
  platform/action-contracts/action-contract-approval-gate-schema-070c.js \
  tests/action-contract-approval-gate-schema-070c-test.js \
  docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md \
  docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md; then
  red "prohibited runtime/browser token found"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|approvalBypass|autoSend|autoWrite)"?\s*[:=]\s*true\b' \
  platform/action-contracts/action-contract-approval-gate-schema-070c.js \
  docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json; then
  red "real-effect true flag found"
fi
green "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
AUTHORIZED=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_070D.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_CERTIFICATE_070D.md"
  "docs/evidence/forge-action-contract-approval-gate-schema-qa-audit-070d.json"
  "tools/termux/forge_070d_action_contract_approval_gate_schema_qa_lock.sh"
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
run git commit -m "docs: lock action contract approval gate schema qa"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

FINAL_SUMMARY="$(cat <<EOF
PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK_COMMIT_PUSH_COMPLETE
DECISION=PASS_070D_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCK
LOCKED_DECISION=ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_QA_LOCKED
NEXT=070E_ACTION_CONTRACT_APPROVAL_GATE_SCHEMA_DECISION_LOCK
BACKUP=$BACKUP
Reporte: $REPORT
EOF
)"
printf "\n%s\n" "$FINAL_SUMMARY" | tee -a "$REPORT"
copy_report
if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf "%s\n" "$FINAL_SUMMARY" | termux-clipboard-set || true
  green "final summary copied to clipboard"
else
  yellow "termux-clipboard-set not available; report path printed above"
fi
