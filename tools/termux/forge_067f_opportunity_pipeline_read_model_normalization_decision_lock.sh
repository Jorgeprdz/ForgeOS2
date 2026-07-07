#!/usr/bin/env bash
set -euo pipefail

PHASE="067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"

mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}NO PASS:${RESET} %s\n\n" "$1"; echo "DECISION=NO_PASS_${PHASE}"; echo "Reporte: $REPORT"; autocopy_report; exit 1; }
hold(){ printf "${YELLOW}HOLD:${RESET} %s\n\n" "$1"; echo "DECISION=HOLD_${PHASE}"; echo "Reporte: $REPORT"; autocopy_report; exit 1; }
run_cmd(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }
autocopy_report(){
  sync || true
  sleep 0.2 || true
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" && pass "autocopy_report -> clipboard" || warn "autocopy_report failed"
  else
    warn "termux-clipboard-set not available; report not auto-copied"
  fi
}
require_file(){ [ -f "$1" ] || hold "required file missing: $1"; pass "$1"; }
norm(){
  python3 - "$1" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
text=p.read_text()
p.write_text("\n".join(line.rstrip() for line in text.splitlines()).rstrip()+"\n")
PY
}
backup_file(){ mkdir -p "$BACKUP_DIR/$(dirname "$1")"; cp "$1" "$BACKUP_DIR/$1"; pass "backup $1"; }

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=docs/decision lock only"
echo "BOUNDARY=no UI mutation; no backend real; no CRM write; no pipeline write; no task/calendar/message; no auth/provider/secrets/browser persistence/real engine"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE.Applicable_Constitution=Article 0; Decision Clarity First; Advisor-first; no invented truth"
echo "ROBOCOP_GATE.Applicable_ADRs=067C; 067D; 067E"
echo "ROBOCOP_GATE.Build_Tree_Area=Opportunity Pipeline / Read Model Normalization / Decision Lock"
echo "ROBOCOP_GATE.Discovery_Status=067E closed; 067F requested"
echo "ROBOCOP_GATE.Implementation_Readiness=decision-lock only; no new implementation"
echo "ROBOCOP_GATE.Miranda_Approval=required through validation evidence"
echo "ROBOCOP_GATE.Board_Approval_Status=not assumed"
echo "ROBOCOP_GATE.Scope_Boundary=067F only"
echo "ROBOCOP_GATE.Prohibited_Surfaces=UI; backend; writes; provider; auth; secrets; browser persistence; real engine"
echo "ROBOCOP_GATE.Validation_Expectation=json; markers; safety scan; staged boundary; commit push"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "cannot cd into repo"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status
git branch --show-current | grep -qx "main" || hold "not on main"
if [ "$(git rev-parse --short HEAD)" = "912deac" ] || git log --format=%s -10 | grep -Fxq "docs: lock opportunity pipeline read model normalization qa"; then
  pass "expected 067E commit observed"
else
  hold "expected 067E commit not found in recent history"
fi
pass "branch and 067E commit confirmed"

say_stage "STAGE 2 REQUIRED FILE CHECK"
required=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE_067C.md"
  "docs/evidence/forge-opportunity-pipeline-read-model-normalization-scope-audit-067c.json"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION_067D.md"
  "docs/evidence/forge-opportunity-pipeline-read-model-normalization-implementation-audit-067d.json"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK_067E.md"
  "docs/evidence/forge-opportunity-pipeline-read-model-normalization-qa-audit-067e.json"
  "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d.js"
  "tests/opportunity-pipeline-read-model-normalization-067d-test.js"
)
[ -f "AGENTS.md" ] && pass "AGENTS.md present" || warn "AGENTS.md not present"
for f in "${required[@]}"; do require_file "$f"; done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/067f-opportunity-pipeline-read-model-normalization-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do backup_file "$f"; done
cat > "$BACKUP_DIR/rollback-067f.sh" <<RB
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO"
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md
rm -f docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md
rm -f docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_CERTIFICATE_067F.md
rm -f docs/evidence/forge-opportunity-pipeline-read-model-normalization-decision-audit-067f.json
rm -f tools/termux/forge_067f_opportunity_pipeline_read_model_normalization_decision_lock.sh
echo "Rollback 067F complete"
RB
chmod +x "$BACKUP_DIR/rollback-067f.sh"
pass "rollback script created: $BACKUP_DIR/rollback-067f.sh"

say_stage "STAGE 4 VERIFY 067E INPUTS"
python3 - <<'PY'
import json
from pathlib import Path

audit = json.loads(Path("docs/evidence/forge-opportunity-pipeline-read-model-normalization-qa-audit-067e.json").read_text())
errors = []
if audit.get("phase") != "067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK":
    errors.append(f"bad phase: {audit.get('phase')!r}")
if not str(audit.get("status", "")).startswith("PASS"):
    errors.append(f"bad status: {audit.get('status')!r}")

text = json.dumps(audit, sort_keys=True)
if "OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCKED" not in text and "PASS_067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK" not in text:
    errors.append("067E lock marker not found in audit")

for key in ["crmWrite","pipelineWrite","taskCreate","calendarCreate","messageSend","authReal","providerRuntime","secretAccess","browserPersistence","realEngineExecution","realEffectsAllowed","realEffectsEnabled","backendConnection"]:
    if audit.get(key) is True:
        errors.append(f"{key} must not be true")

print("067E audit observed:")
print(json.dumps({
  "phase": audit.get("phase"),
  "status": audit.get("status"),
  "decision": audit.get("decision"),
  "next": audit.get("next")
}, indent=2, sort_keys=True))

if errors:
    for e in errors:
        print("-", e)
    raise SystemExit(1)
PY
pass "067E QA lock verified"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
mkdir -p docs/architecture/source-truth docs/evidence tools/termux

SCRIPT_DEST="tools/termux/forge_067f_opportunity_pipeline_read_model_normalization_decision_lock.sh"
if [ "${BASH_SOURCE[0]}" != "$SCRIPT_DEST" ]; then
  cp "${BASH_SOURCE[0]}" "$SCRIPT_DEST"
fi
pass "script copied into repo -> $SCRIPT_DEST"

cat > docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md <<'MD'
# Forge Opportunity Pipeline Read Model Normalization Decision Lock 067F

Phase: `067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK`

Decision: `OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER`

067F formally locks the 067D Opportunity Pipeline read model normalizer after 067E QA.

## Locked Meaning

- The 067D normalizer is accepted only as a local/static/read-only candidate normalizer.
- It does not claim canonical opportunity truth.
- It does not create, mutate, merge, or delete opportunities.
- Relationship opportunity signals remain candidate inputs, not facts.
- Every non-empty candidate field requires source evidence and freshness metadata.
- `066B` remains the temporary local/static/read-only shim until canonical mapping and ownership are implemented.
- Safe error remains `OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`.
- The implementation is preview-safe and no-effect.

## Authorized Use

- Normalize modeled relationship opportunity signals into candidate-only Opportunity Pipeline read model envelopes.
- Support preview/static QA and future adapter boundary planning.
- Preserve audit, freshness, evidence, blocked effects, and disabled safety flags.

## Not Authorized

- Backend connection.
- CRM write.
- Pipeline write.
- Stage mutation.
- Task/calendar/message creation.
- Provider/runtime execution.
- Secret access.
- Browser persistence.
- Real engine execution.
- Money, premium, or forecast as fact.
- Canonical opportunity truth.

## Final Tokens

DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER

NEXT=068A_POLICY_READ_MODEL_SCOPE
MD

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md <<'MD'
# Evidence 067F

Phase: `067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK`

Result: `PASS`

Locked decision:

`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER`

Evidence confirms:

- 067C scope exists.
- 067D implementation exists.
- 067E QA lock exists.
- 067D remains candidate-only.
- No canonical opportunity truth is claimed.
- 066B remains temporary shim.
- Safety flags remain false.
- No real effects are authorized.

DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK

NEXT=068A_POLICY_READ_MODEL_SCOPE
MD

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_CERTIFICATE_067F.md <<'MD'
# Certificate 067F

DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER

NEXT=068A_POLICY_READ_MODEL_SCOPE

No UI mutation. No backend real. No writes. No provider. No auth. No secrets. No browser persistence. No real engine execution.
MD

cat > docs/evidence/forge-opportunity-pipeline-read-model-normalization-decision-audit-067f.json <<'JSON'
{
  "phase": "067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK",
  "status": "PASS",
  "decision": "PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK",
  "lockedDecision": "OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER",
  "basePhases": [
    "067C_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_SCOPE",
    "067D_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_IMPLEMENTATION",
    "067E_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_QA_LOCK"
  ],
  "normalizer": "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d.js",
  "canonicalTruthClaimed": false,
  "candidateOnly": true,
  "temporaryShimPreserved": true,
  "safeErrorCode": "OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED",
  "authorizedUse": [
    "local_static_candidate_normalization",
    "preview_safe_read_model_candidate_envelope",
    "evidence_and_freshness_required_for_non_empty_candidate_fields"
  ],
  "notAuthorizedUse": [
    "canonical_opportunity_truth",
    "backend_connection",
    "crm_write",
    "pipeline_write",
    "stage_mutation",
    "task_calendar_message_creation",
    "provider_runtime_execution",
    "secret_access",
    "browser_persistence",
    "real_engine_execution",
    "real_effects"
  ],
  "uiMutation": false,
  "backendConnection": false,
  "crmWrite": false,
  "pipelineWrite": false,
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
  "next": "068A_POLICY_READ_MODEL_SCOPE"
}
JSON
pass "wrote 067F docs and audit"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path

block = """<!-- FORGE:067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK:START -->
## 067F Opportunity Pipeline Read Model Normalization Decision Lock

Status: PASS

Locked decision:

`OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER`

067F locks the 067D normalizer as a local/static/read-only candidate normalizer after 067E QA.

Boundaries preserved:
- no canonical opportunity truth;
- no backend real;
- no CRM write;
- no pipeline write;
- no stage mutation;
- no task/calendar/message action;
- no auth/provider/secrets/browser persistence;
- no real engine execution;
- `066B` remains temporary local/static/read-only shim;
- safe error remains `OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED`.

DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK

LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER

NEXT=068A_POLICY_READ_MODEL_SCOPE
<!-- FORGE:067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK:END -->
"""

for file in [
    "FORGE_MASTER_BUILD_TREE.md",
    "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md",
    "docs/roadmap/FORGE_ROADMAP_LOCK_001.md",
]:
    p = Path(file)
    text = p.read_text()
    start = "<!-- FORGE:067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK:START -->"
    end = "<!-- FORGE:067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK:END -->"
    if start in text and end in text:
        before, rest = text.split(start, 1)
        _, after = rest.split(end, 1)
        text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
    else:
        text = text.rstrip() + "\n\n" + block
    p.write_text(text)
PY
pass "updated build tree / roadmap"

say_stage "STAGE 7 NORMALIZE FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_067F.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_CERTIFICATE_067F.md"
  "docs/evidence/forge-opportunity-pipeline-read-model-normalization-decision-audit-067f.json"
  "tools/termux/forge_067f_opportunity_pipeline_read_model_normalization_decision_lock.sh"
)
for f in "${allowed_paths[@]}"; do norm "$f"; done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n "$SCRIPT_DEST"
run_cmd node --check platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d.js
run_cmd node --check tests/opportunity-pipeline-read-model-normalization-067d-test.js
run_cmd node tests/opportunity-pipeline-read-model-normalization-067d-test.js
run_cmd python3 -m json.tool docs/evidence/forge-opportunity-pipeline-read-model-normalization-decision-audit-067f.json
run_cmd rg -n "067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK|PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK|OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER|OPPORTUNITY_PIPELINE_NORMALIZATION_NOT_MODELED|068A_POLICY_READ_MODEL_SCOPE" "${allowed_paths[@]:0:7}"
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
scan_files=("${allowed_paths[@]:0:7}" "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-model-normalizer-067d.js" "tests/opportunity-pipeline-read-model-normalization-067d-test.js")
if rg -n "localStorage|sessionStorage|fetch\\(|XMLHttpRequest|navigator\\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\\s*true|networkCallsAllowed:\\s*true|browserStorageEnabled:\\s*true|mayCreateTruth:\\s*true|maySendMessage:\\s*true|mayWriteCrm:\\s*true|mayCreateCalendarEvent:\\s*true" "${scan_files[@]}"; then
  hold "browser/runtime/action token found"
fi
if rg -n "crmWrite: true|pipelineWrite: true|taskCreate: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|secretAccess: true|browserPersistence: true|realEngineExecution: true|realEffectsAllowed: true|realEffectsEnabled: true|backendConnection: true|\\\"crmWrite\\\": true|\\\"pipelineWrite\\\": true|\\\"taskCreate\\\": true|\\\"calendarCreate\\\": true|\\\"messageSend\\\": true|\\\"authReal\\\": true|\\\"providerRuntime\\\": true|\\\"secretAccess\\\": true|\\\"browserPersistence\\\": true|\\\"realEngineExecution\\\": true|\\\"realEffectsAllowed\\\": true|\\\"realEffectsEnabled\\\": true|\\\"backendConnection\\\": true" "${scan_files[@]}"; then
  hold "enabled real-effect marker found"
fi
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 067F is docs/decision only"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${allowed_paths[@]}"
run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
printf "%s\n" "${allowed_paths[@]}" | sort > "$expected"
git diff --cached --name-only | sort > "$actual"
diff -u "$expected" "$actual" || hold "staged set differs from authorized files"
rm -f "$expected" "$actual"
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
git diff --cached --quiet && hold "nothing staged for commit"
run_cmd git commit -m "docs: lock opportunity pipeline read model normalization decision"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK_COMMIT_PUSH_COMPLETE"
echo "DECISION=PASS_067F_OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_DECISION_LOCK"
echo "LOCKED_DECISION=OPPORTUNITY_PIPELINE_READ_MODEL_NORMALIZATION_LOCKED_AS_CANDIDATE_ONLY_PREVIEW_NORMALIZER"
echo "NEXT=068A_POLICY_READ_MODEL_SCOPE"
echo "BACKUP=$BACKUP_DIR"
echo "ROLLBACK=$BACKUP_DIR/rollback-067f.sh"
echo "Reporte: $REPORT"
autocopy_report
