#!/usr/bin/env bash
set -euo pipefail

CHAIN="092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/092c-safe-static-ui-patch-plan-qa-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_092c_quote_preview_safe_static_ui_patch_plan_qa_lock.sh"

PHASE="092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK"
DECISION="PASS_092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCKED"
NEXT_AFTER="092D_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_DECISION_LOCK"

PATCH_PLAN_JSON="docs/evidence/forge-quote-preview-safe-static-ui-patch-plan-092b.json"
PATCH_PLAN_AUDIT="docs/evidence/forge-quote-preview-safe-static-ui-patch-plan-audit-092b.json"
PATCH_PLAN_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_092B.md"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK_092C.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK_092C.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK_CERTIFICATE_092C.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-safe-static-ui-patch-plan-qa-audit-092c.json"

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${CHAIN}" | tee -a "$REPORT"; echo "REPORT=$REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

replace_or_append_block(){
  local path="$1"; local phase="$2"; local block_file="$3"
  python3 - <<PY "$path" "$phase" "$block_file"
from pathlib import Path
import sys
path = Path(sys.argv[1]); phase = sys.argv[2]; block = Path(sys.argv[3]).read_text()
text = path.read_text()
start = f"<!-- FORGE:{phase}:START -->"; end = f"<!-- FORGE:{phase}:END -->"
if start in text and end in text:
    before = text.split(start)[0]; after = text.split(end, 1)[1]
    text = before.rstrip() + "\n\n" + block.strip() + "\n" + after
else:
    text = text.rstrip() + "\n\n" + block.strip() + "\n"
path.write_text(text.rstrip() + "\n")
PY
}

trim_tree_files(){
  python3 - <<'PY'
from pathlib import Path
for p in [Path("FORGE_MASTER_BUILD_TREE.md"), Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"), Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md")]:
    p.write_text(p.read_text().rstrip() + "\n")
    print(f"trimmed EOF blanks: {p}")
PY
}

safety_scan(){
  local files=("$@")
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|renderAllowed\s*:\s*true|screenRenderAllowed\s*:\s*true|componentRenderAllowed\s*:\s*true|uiMutationAllowed\s*:\s*true|cssInjectionAllowed\s*:\s*true|domWriteAllowed\s*:\s*true|writeAllowed\s*:\s*true|quoteTruthAllowed\s*:\s*true|backendConnectionAllowed\s*:\s*true|officialQuoteAllowed\s*:\s*true|sendAllowed\s*:\s*true|crmWriteAllowed\s*:\s*true|calendarCreateAllowed\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/write/ui/render/css marker"
  fi
  if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|ocrExecution|parserExecution|calculatorExecution|banxicoCall|testExecution)"?\s*[:=]\s*true\b' "${files[@]}"; then
    fail "real-effect flag true found"
  fi
  pass "safety scan clean"
}

commit_allowed_subset(){
  local msg="$1"; shift; local allowed=("$@")
  git add "${allowed[@]}"
  run git diff --cached --name-only
  run git diff --cached --check

  local allowed_file staged_file unexpected
  allowed_file="$(mktemp)"
  staged_file="$(mktemp)"
  printf "%s\n" "${allowed[@]}" | sort > "$allowed_file"
  git diff --cached --name-only | sort > "$staged_file"
  unexpected="$(comm -23 "$staged_file" "$allowed_file" || true)"

  if [ -n "$unexpected" ]; then
    echo "$unexpected"
    fail "staged files include files outside authorized boundary"
  fi
  [ -s "$staged_file" ] || fail "no staged changes for commit"

  pass "staged files are within authorized boundary"
  run git commit -m "$msg"
  run git push origin HEAD
}

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "CHAIN=$CHAIN"
echo "REPORT=$REPORT"
echo "BOUNDARY=QA lock only; no UI source edits; no component implementation; no rendering; no CSS injection; no DOM writes; no backend; no quote truth; no sends/writes"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -18
run git diff --name-status
run git diff --cached --name-status
run git reset

stage "STAGE 2 CONFIRM 092B BASE"
if git log --oneline -560 | grep -Eq "092B|plan quote preview safe static ui patch|QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_LOCKED"; then
  pass "092B base found in git log"
elif [ -f "$PATCH_PLAN_AUDIT" ]; then
  pass "092B audit fallback found"
else
  fail "092B base not found"
fi

for f in "$PATCH_PLAN_JSON" "$PATCH_PLAN_AUDIT" "$PATCH_PLAN_DOC" FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

run python3 -m json.tool "$PATCH_PLAN_JSON"
run python3 -m json.tool "$PATCH_PLAN_AUDIT"

if ! rg -n '"next"\s*:\s*"092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK"|QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_LOCKED' "$PATCH_PLAN_AUDIT" >/dev/null; then
  fail "092B audit does not confirm NEXT 092C / plan lock"
fi
pass "092B audit confirms NEXT 092C"

stage "STAGE 3 BACKUP"
mkdir -p "$BACKUP_DIR"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  cp "$f" "$BACKUP_DIR/$(echo "$f" | tr '/ ' '__')"
done
pass "$BACKUP_DIR"

stage "STAGE 4 SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
python3 - <<'PY' "$PATCH_PLAN_JSON" "$PATCH_PLAN_AUDIT" > "$SEMANTIC_QA_JSON"
from pathlib import Path
import json, sys

plan = json.loads(Path(sys.argv[1]).read_text())
audit = json.loads(Path(sys.argv[2]).read_text())
errors = []

if plan.get("phase") != "092B_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN":
    errors.append("invalid_plan_phase")
if audit.get("phase") != "092B_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN":
    errors.append("invalid_audit_phase")
if plan.get("status") not in {"PASS", "PASS_WITH_MANUAL_CANONICAL_SELECTION_REQUIRED"}:
    errors.append("invalid_plan_status")
if plan.get("planType") != "safe_static_ui_patch_plan_only":
    errors.append("invalid_plan_type")
if plan.get("next") != "092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK":
    errors.append("invalid_plan_next")
if audit.get("lockedDecision") != "QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_LOCKED":
    errors.append("invalid_audit_locked_decision")

if plan.get("sourceEditsAuthorizedIn092B") is not False:
    errors.append("source_edits_authorized_in_092b")
if plan.get("staticPatchExecutionAuthorizedIn092B") is not False:
    errors.append("static_patch_execution_authorized_in_092b")
if plan.get("requires092CPlanQaBeforeDecision") is not True:
    errors.append("missing_092c_qa_gate")
if plan.get("requires092DDecisionBeforeSourcePatchScope") is not True:
    errors.append("missing_092d_decision_gate")

required_copy = ["Preview", "Solo lectura", "Revisión humana", "No cotización oficial", "Sin envío", "Sin CRM", "Sin calendario"]
for copy in required_copy:
    if copy not in plan.get("requiredVisibleSafetyCopy", []):
        errors.append(f"missing_required_visible_copy:{copy}")

required_forbidden = [
    "backend connection",
    "provider call",
    "parser execution",
    "calculator execution",
    "Banxico call",
    "quote truth creation",
    "official quote claim",
    "send action",
    "CRM write",
    "calendar creation",
    "runtime browser storage or network primitives",
]
for item in required_forbidden:
    if item not in plan.get("forbiddenPatchEffects", []):
        errors.append(f"missing_forbidden_patch_effect:{item}")

required_constraints = [
    "Use static copy only.",
    "Do not introduce new data dependencies.",
    "Do not change business calculations.",
    "Do not change quote truth boundaries.",
    "Do not add action handlers that imply real effects.",
    "Preserve desktop/mobile layer boundaries from 089R.",
    "Preserve safe copy and badge labels from 090D.",
]
constraints = plan.get("plannedPatchConstraints", [])
for item in required_constraints:
    if item not in constraints:
        errors.append(f"missing_patch_constraint:{item}")

for op in plan.get("patchOperationsPlanned", []):
    if op.get("sourceEditAuthorizedBy092B") is not False:
        errors.append(f"op_source_edit_authorized:{op.get('targetPath')}")
    if op.get("operationType") not in {"planned_static_source_patch_only", "manual_review_required"}:
        errors.append(f"invalid_operation_type:{op.get('targetPath')}")
    required = op.get("requiredVisibleCopy", [])
    for copy in ["Preview", "Solo lectura", "No cotización oficial"]:
        if copy not in required:
            errors.append(f"op_missing_required_copy:{op.get('targetPath')}:{copy}")

not_auth = plan.get("notAuthorized", {})
for key, value in not_auth.items():
    if value is not False:
        errors.append(f"not_authorized_not_false:{key}")

for key, value in plan.get("safetyFlags", {}).items():
    if value is not False:
        errors.append(f"safety_flag_not_false:{key}")

audit_confirmed = audit.get("confirmed", {})
for key in [
    "planOnly",
    "requiredVisibleSafetyCopyValidated",
    "forbiddenPatchEffectsValidated",
    "operationBoundariesValidated",
    "allEffectsBlocked",
    "allSafetyFlagsFalse",
]:
    if audit_confirmed.get(key) is not True:
        errors.append(f"audit_confirmed_missing:{key}")

result = {
    "status": "PASS" if not errors else "HOLD",
    "planQaValidated": not errors,
    "errors": errors,
    "selectedCanonicalUiFileCount": len(plan.get("selectedCanonicalUiFiles", [])),
    "patchOperationPlanCount": len(plan.get("patchOperationsPlanned", [])),
    "requiredVisibleSafetyCopyValidated": not any(e.startswith("missing_required_visible_copy") for e in errors),
    "forbiddenPatchEffectsValidated": not any(e.startswith("missing_forbidden_patch_effect") for e in errors),
    "patchConstraintsValidated": not any(e.startswith("missing_patch_constraint") for e in errors),
    "operationBoundariesValidated": not any(e.startswith("op_") for e in errors),
    "sourceEditsAuthorizedIn092B": plan.get("sourceEditsAuthorizedIn092B"),
    "staticPatchExecutionAuthorizedIn092B": plan.get("staticPatchExecutionAuthorizedIn092B"),
    "allEffectsBlocked": all(v is False for v in not_auth.values()),
    "allSafetyFlagsFalse": all(v is False for v in plan.get("safetyFlags", {}).values()),
    "next": "092D_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_DECISION_LOCK",
}
print(json.dumps(result, indent=2, ensure_ascii=False))
if errors:
    raise SystemExit(1)
PY

cat "$SEMANTIC_QA_JSON"

stage "STAGE 5 WRITE DOCS / AUDIT"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview Safe Static UI Patch Plan QA Lock 092C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Purpose

092C QA locks the 092B safe static UI patch plan.

092C does not edit UI source files. It verifies that 092B remains patch-plan-only and does not authorize source edits, patch execution, rendering, CSS injection, DOM writes, backend connection, quote truth, sends, CRM writes, or calendar creation.

## QA Validated

- 092B patch plan shape validates.
- required visible safety copy is present.
- forbidden patch effects are present.
- patch constraints are present.
- planned operations do not authorize source edits.
- 092C gate is required before decision.
- 092D decision gate is required before source patch scope.
- all safety flags remain false.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview Safe Static UI Patch Plan QA Lock Evidence 092C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Semantic QA

\`\`\`json
$(cat "$SEMANTIC_QA_JSON")
\`\`\`

## Patch Plan Source

- \`$PATCH_PLAN_JSON\`

## Final

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$CERT_DOC" <<EOF
# Forge Quote Preview Safe Static UI Patch Plan QA Lock Certificate 092C

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

092C certifies that the safe static UI patch plan is QA locked.

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "base": {
    "phase": "092B_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_LOCKED"
  },
  "next": "$NEXT_AFTER",
  "semanticQa": $(cat "$SEMANTIC_QA_JSON"),
  "patchPlanSource": "$PATCH_PLAN_JSON",
  "qaValidated": {
    "patchPlanShapeValidated": true,
    "requiredVisibleSafetyCopyPresent": true,
    "forbiddenPatchEffectsPresent": true,
    "patchConstraintsPresent": true,
    "plannedOperationsDoNotAuthorizeSourceEdits": true,
    "requires092CGate": true,
    "requires092DDecisionBeforeSourcePatchScope": true,
    "allEffectsBlocked": true,
    "allSafetyFlagsFalse": true
  },
  "notAuthorized": {
    "uiSourceEditsIn092C": false,
    "componentImplementation": false,
    "screenRendering": false,
    "componentRendering": false,
    "uiMutation": false,
    "cssInjection": false,
    "domWrite": false,
    "quoteTruthCreation": false,
    "backendConnection": false,
    "providerCall": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "send": false,
    "crmWrite": false,
    "calendarCreate": false
  },
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
    "pdfRead": false,
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "testExecution": false
  }
}
EOF

TREE_BLOCK="$(mktemp)"
cat > "$TREE_BLOCK" <<EOF
<!-- FORGE:$PHASE:START -->
## 092C Quote Preview Safe Static UI Patch Plan QA Lock

092C QA locks the 092B safe static UI patch plan.

Locked decision:
\`$LOCKED_DECISION\`

QA validated:

- 092B patch plan shape validates;
- required visible safety copy is present;
- forbidden patch effects are present;
- patch constraints are present;
- planned operations do not authorize source edits;
- 092C gate is required before decision;
- 092D decision gate is required before source patch scope;
- all effects remain blocked;
- all safety flags remain false.

092C does not edit UI source files.

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
<!-- FORGE:$PHASE:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE" "$TREE_BLOCK"
done
trim_tree_files

mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"

stage "STAGE 6 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run python3 -m json.tool "$AUDIT_JSON"
run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT_AFTER|QA locks|required visible safety copy|forbidden patch effects|does not edit UI source files|planned operations do not authorize source edits" \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md

run git diff --check
safety_scan "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md

stage "STAGE 7 COMMIT / PUSH"
commit_allowed_subset \
  "docs: lock quote preview safe static ui patch plan qa" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -14

SUMMARY=$(cat <<EOF
PASS_092C_QUOTE_PREVIEW_SAFE_STATIC_UI_PATCH_PLAN_QA_LOCK_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT_AFTER
BACKUP=$BACKUP_DIR
REPORT=$REPORT
EOF
)

echo
echo "$SUMMARY"

if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf "%s\n" "$SUMMARY" | termux-clipboard-set
  pass "final summary copied to clipboard"
else
  warn "termux-clipboard-set not available; summary not copied"
fi

echo "Reporte: $REPORT"
