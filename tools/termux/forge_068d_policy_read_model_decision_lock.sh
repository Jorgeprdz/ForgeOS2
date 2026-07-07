#!/usr/bin/env bash
set -euo pipefail

PHASE="068D_POLICY_READ_MODEL_DECISION_LOCK"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"

mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
copy_report(){ sync || true; command -v termux-clipboard-set >/dev/null 2>&1 && termux-clipboard-set < "$REPORT" || true; }
hold(){ printf "${YELLOW}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${PHASE}"; echo "Reporte: $REPORT"; copy_report; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }
need(){ [ -f "$1" ] || hold "missing required file: $1"; pass "$1"; }
norm(){ python3 - "$1" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()
p.write_text("\n".join(x.rstrip() for x in s.splitlines()).rstrip()+"\n")
PY
}

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=docs/decision lock only"
echo "BOUNDARY=no UI mutation; no backend real; no CRM/policy/quote writes; no provider/auth/secrets/browser/real engine"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 068C QA locked; decision lock only"

stage "STAGE 1 CHECKPOINT"
cd "$REPO" || hold "cannot cd repo"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status
git branch --show-current | grep -qx main || hold "not on main"

if git log --format='%h %s' -20 | grep -Eq '^e541e74[[:space:]]+docs: lock policy read model qa$' || git log --format='%s' -20 | grep -Fxq 'docs: lock policy read model qa'; then
  pass "expected 068C commit observed"
elif python3 - <<'PY068C'
import json
from pathlib import Path
p = Path("docs/evidence/forge-policy-read-model-qa-audit-068c.json")
if not p.exists():
    raise SystemExit(1)
audit = json.loads(p.read_text())
if audit.get("phase") != "068C_POLICY_READ_MODEL_QA_LOCK":
    raise SystemExit(1)
if not str(audit.get("status", "")).startswith("PASS"):
    raise SystemExit(1)
if audit.get("lockedDecision") != "POLICY_READ_MODEL_QA_LOCKED":
    raise SystemExit(1)
print("068C audit fallback confirmed")
PY068C
then
  pass "068C audit confirmed"
else
  hold "expected 068C commit or audit not found"
fi
pass "main and 068C confirmed"

stage "STAGE 2 REQUIRED FILE CHECK"
need "FORGE_MASTER_BUILD_TREE.md"
need "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
need "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
need "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_SCOPE_068A.md"
need "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md"
need "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_QA_LOCK_068C.md"
need "docs/evidence/forge-policy-read-model-scope-audit-068a.json"
need "docs/evidence/forge-policy-read-model-implementation-audit-068b.json"
need "docs/evidence/forge-policy-read-model-qa-audit-068c.json"
need "platform/adapters/policy-read-model/policy-read-model-adapter-068b.js"
need "tests/policy-read-model-adapter-068b-test.js"

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/068d-policy-read-model-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  mkdir -p "$BACKUP/$(dirname "$f")"
  cp "$f" "$BACKUP/$f"
  pass "backup $f"
done
cat > "$BACKUP/rollback-068d.sh" <<RB
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO"
cp "$BACKUP/FORGE_MASTER_BUILD_TREE.md" FORGE_MASTER_BUILD_TREE.md
cp "$BACKUP/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
cp "$BACKUP/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" docs/roadmap/FORGE_ROADMAP_LOCK_001.md
rm -f docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md
rm -f docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md
rm -f docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_CERTIFICATE_068D.md
rm -f docs/evidence/forge-policy-read-model-decision-audit-068d.json
rm -f tools/termux/forge_068d_policy_read_model_decision_lock.sh
echo "Rollback 068D complete"
RB
chmod +x "$BACKUP/rollback-068d.sh"
pass "rollback created"

stage "STAGE 4 VERIFY 068C INPUTS"
python3 - <<'PY'
import json
from pathlib import Path

audit = json.loads(Path("docs/evidence/forge-policy-read-model-qa-audit-068c.json").read_text())
errors = []

if audit.get("phase") != "068C_POLICY_READ_MODEL_QA_LOCK":
    errors.append(f"bad phase: {audit.get('phase')!r}")
if not str(audit.get("status", "")).startswith("PASS"):
    errors.append(f"bad status: {audit.get('status')!r}")
if audit.get("lockedDecision") != "POLICY_READ_MODEL_QA_LOCKED":
    errors.append(f"bad lockedDecision: {audit.get('lockedDecision')!r}")
if audit.get("safeErrorCode") != "POLICY_READ_MODEL_NOT_MODELED":
    errors.append(f"bad safeErrorCode: {audit.get('safeErrorCode')!r}")
if audit.get("canonicalPolicyTruthClaimed") is not False:
    errors.append("canonicalPolicyTruthClaimed must be false")

for key in [
    "policyWrite","crmWrite","pipelineWrite","quoteWrite","taskCreate","calendarCreate",
    "messageSend","authReal","providerRuntime","secretAccess","browserPersistence",
    "realEngineExecution","realEffectsAllowed","realEffectsEnabled","backendConnection"
]:
    if audit.get(key) is True:
        errors.append(f"{key} must not be true")

print("068C audit observed:")
print(json.dumps({
    "phase": audit.get("phase"),
    "status": audit.get("status"),
    "decision": audit.get("decision"),
    "lockedDecision": audit.get("lockedDecision"),
    "next": audit.get("next")
}, indent=2, sort_keys=True))

if errors:
    for error in errors:
        print("-", error)
    raise SystemExit(1)
PY
pass "068C QA lock verified"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence tools/termux
cp "${BASH_SOURCE[0]}" tools/termux/forge_068d_policy_read_model_decision_lock.sh

cat > docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md <<'MD'
# Forge Policy Read Model Decision Lock 068D

Phase: `068D_POLICY_READ_MODEL_DECISION_LOCK`

Decision: `PASS_068D_POLICY_READ_MODEL_DECISION_LOCK`

Locked decision: `POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER`

068D formally locks the 068B Policy Read Model adapter after 068C QA.

## Locked Meaning

The Policy Read Model adapter is approved only as a local/static/read-only preview adapter.

It is not:

- canonical Policy Truth;
- a policy issuance system;
- a policy mutation layer;
- a provider runtime;
- a backend connection;
- a CRM, pipeline, policy, quote, task, calendar, or message execution surface.

## Authorized Use

- Preview-safe policy read model display.
- Local/static fixture reads.
- Evidence/freshness-backed policy preview records.
- Safe empty/error behavior with `POLICY_READ_MODEL_NOT_MODELED`.
- Future integration planning after source ownership is scoped.

## Not Authorized

- Policy create/update/delete/cancel/renew.
- Premium, coverage, payment, carrier, renewal, or recommendation facts without source evidence.
- Provider execution.
- Backend real connection.
- CRM/pipeline/policy/quote writes.
- Task/calendar/message creation.
- Auth, secret access, browser persistence, or real engine execution.

## Final

DECISION=PASS_068D_POLICY_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER

NEXT=069A_QUOTE_READ_MODEL_SCOPE
MD

cat > docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md <<'MD'
# Evidence 068D

Phase: `068D_POLICY_READ_MODEL_DECISION_LOCK`

Result: `PASS`

068D locks the 068B Policy Read Model adapter as a temporary local/static/read-only adapter after 068C QA.

Evidence confirms:

- 068A scope exists;
- 068B implementation exists;
- 068C QA lock exists;
- adapter remains preview-safe;
- canonical policy truth is not claimed;
- safe error remains `POLICY_READ_MODEL_NOT_MODELED`;
- all real-effect flags remain false.

DECISION=PASS_068D_POLICY_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER

NEXT=069A_QUOTE_READ_MODEL_SCOPE
MD

cat > docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_CERTIFICATE_068D.md <<'MD'
# Certificate 068D

DECISION=PASS_068D_POLICY_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER

NEXT=069A_QUOTE_READ_MODEL_SCOPE

No UI mutation. No backend real. No CRM write. No policy write. No quote write. No provider. No auth. No secrets. No browser persistence. No real engine execution.
MD

cat > docs/evidence/forge-policy-read-model-decision-audit-068d.json <<'JSON'
{
  "phase": "068D_POLICY_READ_MODEL_DECISION_LOCK",
  "status": "PASS",
  "decision": "PASS_068D_POLICY_READ_MODEL_DECISION_LOCK",
  "lockedDecision": "POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER",
  "basePhases": [
    "068A_POLICY_READ_MODEL_SCOPE",
    "068B_POLICY_READ_MODEL_IMPLEMENTATION",
    "068C_POLICY_READ_MODEL_QA_LOCK"
  ],
  "adapter": "platform/adapters/policy-read-model/policy-read-model-adapter-068b.js",
  "test": "tests/policy-read-model-adapter-068b-test.js",
  "authorizedUse": [
    "local_static_policy_read_model_preview",
    "read_only_fixture_records",
    "evidence_and_freshness_backed_preview_fields",
    "safe_empty_and_error_behavior"
  ],
  "notAuthorizedUse": [
    "canonical_policy_truth",
    "policy_issuance",
    "policy_mutation",
    "provider_runtime",
    "backend_connection",
    "crm_pipeline_policy_quote_writes",
    "task_calendar_message_creation",
    "auth_secret_access",
    "browser_persistence",
    "real_engine_execution"
  ],
  "safeErrorCode": "POLICY_READ_MODEL_NOT_MODELED",
  "canonicalPolicyTruthClaimed": false,
  "temporaryLocalStaticAdapter": true,
  "policyWrite": false,
  "crmWrite": false,
  "pipelineWrite": false,
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
  "next": "069A_QUOTE_READ_MODEL_SCOPE"
}
JSON
pass "docs/evidence written"

stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """<!-- FORGE:068D_POLICY_READ_MODEL_DECISION_LOCK:START -->
## 068D Policy Read Model Decision Lock

Status: PASS

Locked decision:

`POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER`

068D locks the 068B Policy Read Model adapter after 068C QA.

Meaning:
- local/static/read-only preview adapter only;
- no canonical policy truth;
- no policy issuance or mutation;
- no provider runtime;
- no backend connection;
- no CRM/pipeline/policy/quote writes;
- no task/calendar/message actions;
- safe error `POLICY_READ_MODEL_NOT_MODELED`;
- all safety flags false.

DECISION=PASS_068D_POLICY_READ_MODEL_DECISION_LOCK

LOCKED_DECISION=POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER

NEXT=069A_QUOTE_READ_MODEL_SCOPE
<!-- FORGE:068D_POLICY_READ_MODEL_DECISION_LOCK:END -->
"""

for file in ["FORGE_MASTER_BUILD_TREE.md","docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md","docs/roadmap/FORGE_ROADMAP_LOCK_001.md"]:
    p=Path(file)
    text=p.read_text()
    start="<!-- FORGE:068D_POLICY_READ_MODEL_DECISION_LOCK:START -->"
    end="<!-- FORGE:068D_POLICY_READ_MODEL_DECISION_LOCK:END -->"
    if start in text and end in text:
        before, rest=text.split(start,1)
        _, after=rest.split(end,1)
        text=before.rstrip()+"\n\n"+block+after.lstrip("\n")
    else:
        text=text.rstrip()+"\n\n"+block
    p.write_text(text)
PY
pass "build tree / roadmap updated"

stage "STAGE 7 NORMALIZE FILES"
allowed=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md"
  "docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_068D.md"
  "docs/evidence/FORGE_POLICY_READ_MODEL_DECISION_LOCK_CERTIFICATE_068D.md"
  "docs/evidence/forge-policy-read-model-decision-audit-068d.json"
  "tools/termux/forge_068d_policy_read_model_decision_lock.sh"
)
for f in "${allowed[@]}"; do norm "$f"; done
pass "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_068d_policy_read_model_decision_lock.sh
run node --check platform/adapters/policy-read-model/policy-read-model-adapter-068b.js
run node --check tests/policy-read-model-adapter-068b-test.js
run node tests/policy-read-model-adapter-068b-test.js
run python3 -m json.tool docs/evidence/forge-policy-read-model-decision-audit-068d.json
run rg -n "068D_POLICY_READ_MODEL_DECISION_LOCK|PASS_068D_POLICY_READ_MODEL_DECISION_LOCK|POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER|POLICY_READ_MODEL_NOT_MODELED|069A_QUOTE_READ_MODEL_SCOPE" "${allowed[@]:0:7}"
run git diff --check

stage "STAGE 9 SAFETY SCAN"
scan=("${allowed[@]:0:7}" "platform/adapters/policy-read-model/policy-read-model-adapter-068b.js" "tests/policy-read-model-adapter-068b-test.js")
if rg -n "localStorage|sessionStorage|fetch\\(|XMLHttpRequest|navigator\\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\\s*true|networkCallsAllowed:\\s*true|browserStorageEnabled:\\s*true|mayCreateTruth:\\s*true|maySendMessage:\\s*true|mayWriteCrm:\\s*true|mayCreateCalendarEvent:\\s*true" "${scan[@]}"; then hold "browser/runtime/action token found"; fi
if rg -n "crmWrite: true|pipelineWrite: true|policyWrite: true|quoteWrite: true|taskCreate: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|secretAccess: true|browserPersistence: true|realEngineExecution: true|realEffectsAllowed: true|realEffectsEnabled: true|backendConnection: true|\\\"crmWrite\\\": true|\\\"pipelineWrite\\\": true|\\\"policyWrite\\\": true|\\\"quoteWrite\\\": true|\\\"taskCreate\\\": true|\\\"calendarCreate\\\": true|\\\"messageSend\\\": true|\\\"authReal\\\": true|\\\"providerRuntime\\\": true|\\\"secretAccess\\\": true|\\\"browserPersistence\\\": true|\\\"realEngineExecution\\\": true|\\\"realEffectsAllowed\\\": true|\\\"realEffectsEnabled\\\": true|\\\"backendConnection\\\": true" "${scan[@]}"; then hold "enabled real-effect marker found"; fi
pass "safety scan clean"

stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 068D has no UI mutation"

stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${allowed[@]}"
run git diff --cached --name-only
exp="$(mktemp)"; act="$(mktemp)"
printf "%s\n" "${allowed[@]}" | sort > "$exp"
git diff --cached --name-only | sort > "$act"
diff -u "$exp" "$act" || hold "staged set differs from authorized files"
rm -f "$exp" "$act"
pass "only authorized files staged"
run git diff --cached --check

stage "STAGE 12 COMMIT PUSH"
git diff --cached --quiet && hold "nothing staged for commit"
run git commit -m "docs: lock policy read model decision"
run git push origin HEAD:main

stage "STAGE 13 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

stage "FINAL DECISION"
echo "PASS_068D_POLICY_READ_MODEL_DECISION_LOCK_COMMIT_PUSH_COMPLETE"
echo "DECISION=PASS_068D_POLICY_READ_MODEL_DECISION_LOCK"
echo "LOCKED_DECISION=POLICY_READ_MODEL_LOCKED_AS_TEMPORARY_LOCAL_STATIC_READ_ONLY_ADAPTER"
echo "NEXT=069A_QUOTE_READ_MODEL_SCOPE"
echo "BACKUP=$BACKUP"
echo "ROLLBACK=$BACKUP/rollback-068d.sh"
echo "Reporte: $REPORT"
copy_report
