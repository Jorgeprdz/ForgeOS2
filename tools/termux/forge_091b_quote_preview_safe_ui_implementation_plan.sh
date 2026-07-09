#!/usr/bin/env bash
set -euo pipefail

CHAIN="091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/091b-safe-ui-implementation-plan-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_091b_quote_preview_safe_ui_implementation_plan.sh"

PHASE="091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN"
DECISION="PASS_091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN"
LOCKED_DECISION="QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_LOCKED"
NEXT_AFTER="091C_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_QA_LOCK"

DISCOVERY_JSON="docs/evidence/forge-quote-preview-safe-ui-implementation-surface-discovery-091a.json"
DISCOVERY_MD="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SURFACE_DISCOVERY_091A.md"
SCOPE_AUDIT="docs/evidence/forge-quote-preview-safe-ui-implementation-scope-audit-091a.json"

COPY_BADGE_ADAPTER="platform/adapters/quote-preview/quote-preview-safe-copy-badge-system-registry-adapter-090b.js"
COPY_BADGE_TEST="tests/quote-preview-safe-copy-badge-system-registry-adapter-090b-test.js"

PLAN_JSON="docs/evidence/forge-quote-preview-safe-ui-implementation-plan-091b.json"
ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_091B.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_091B.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_CERTIFICATE_091B.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-safe-ui-implementation-plan-audit-091b.json"

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
  allowed_file="$(mktemp)"; staged_file="$(mktemp)"
  printf "%s\n" "${allowed[@]}" | sort > "$allowed_file"
  git diff --cached --name-only | sort > "$staged_file"
  unexpected="$(comm -23 "$staged_file" "$allowed_file" || true)"
  if [ -n "$unexpected" ]; then echo "$unexpected"; fail "staged files include files outside authorized boundary"; fi
  [ -s "$staged_file" ] || fail "no staged changes for commit"

  pass "staged files are within authorized boundary"
  run git commit -m "$msg"
  run git push origin HEAD:main
}

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "CHAIN=$CHAIN"
echo "REPORT=$REPORT"
echo "BOUNDARY=plan only; no UI source edits; no rendering; no CSS injection; no DOM writes; no backend; no quote truth; no sends/writes"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -18
run git diff --name-status
run git diff --cached --name-status
run git reset

stage "STAGE 2 CONFIRM 091A BASE"
if git log --oneline -380 | grep -Eq "091A|scope quote preview safe ui implementation surfaces|QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPED"; then
  pass "091A base found in git log"
elif [ -f "$SCOPE_AUDIT" ]; then
  pass "091A audit fallback found"
else
  fail "091A base not found"
fi

for f in "$DISCOVERY_JSON" "$DISCOVERY_MD" "$SCOPE_AUDIT" "$COPY_BADGE_ADAPTER" "$COPY_BADGE_TEST" FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

run python3 -m json.tool "$SCOPE_AUDIT"
if ! rg -n '"next"\s*:\s*"091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN"|QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPED' "$SCOPE_AUDIT" >/dev/null; then
  fail "091A audit does not confirm NEXT 091B / lock"
fi

stage "STAGE 3 BACKUP"
mkdir -p "$BACKUP_DIR"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  cp "$f" "$BACKUP_DIR/$(echo "$f" | tr '/ ' '__')"
done
pass "$BACKUP_DIR"

stage "STAGE 4 BASE VALIDATION"
run node --check "$COPY_BADGE_ADAPTER"
run node --check "$COPY_BADGE_TEST"
run node "$COPY_BADGE_TEST"
run python3 -m json.tool "$DISCOVERY_JSON"

stage "STAGE 5 BUILD 091B IMPLEMENTATION PLAN"
mkdir -p "$(dirname "$PLAN_JSON")"

python3 - <<'PY' "$DISCOVERY_JSON" "$PLAN_JSON"
from pathlib import Path
import json, re, sys

discovery_path = Path(sys.argv[1])
plan_path = Path(sys.argv[2])
discovery = json.loads(discovery_path.read_text())

surface = discovery.get("surfaceClassification", {})
framework = discovery.get("frameworkSignals", {})
by_path = surface.get("uiCandidateFilesByPath", [])
by_content = surface.get("uiCandidateFilesByContent", [])
candidate_dirs = surface.get("candidateUiDirs", [])
design_docs = surface.get("designDocs", [])

def score(path: str):
    s = 0
    low = path.lower()
    if any(x in low for x in ["quote", "preview", "quote-preview", "quotepreview"]): s += 40
    if "alfred" in low: s += 25
    if "dashboard" in low: s += 18
    if "command" in low: s += 15
    if "static-preview" in low: s += 15
    if low.endswith((".tsx", ".jsx")): s += 12
    if low.endswith((".ts", ".js")): s += 5
    if any(part in low for part in ["/components/", "/src/", "/app/", "/pages/"]): s += 8
    if "test" in low or "spec" in low: s -= 15
    if "docs/" in low and not "static-preview" in low: s -= 10
    return s

combined = sorted(set(by_path + by_content), key=lambda p: (-score(p), p))
top_candidates = combined[:40]

implementation_zones = {
    "highestPriorityCandidates": top_candidates[:15],
    "secondaryCandidates": top_candidates[15:40],
    "candidateUiDirs": candidate_dirs,
    "frameworkSignals": framework,
    "designDocsAvailable": design_docs[:60]
}

canonical_selection_rules = [
    "Prefer files already containing QuotePreview / quote-preview / Preview copy.",
    "Prefer UI source files over docs or evidence files.",
    "Prefer TSX/JSX component/page files for visual implementation.",
    "Prefer static preview surface only if it is the actual rendered demo workspace.",
    "Do not select tests, evidence screenshots, generated artifacts, or docs as implementation targets.",
    "Do not cross desktop/mobile layer boundaries established by 089R.",
    "Do not introduce backend calls, network calls, storage calls, provider runtime, quote truth, sends, CRM writes, or calendar creation."
]

planned_safe_static_ui_contract = {
    "allowedPatchKind": "minimal_static_ui_patch_after_canonical_files_are_selected",
    "allowedVisualBindings": [
        "show Preview badge",
        "show Solo lectura badge",
        "show No cotización oficial badge",
        "show Sin envío badge where action risk exists",
        "show Sin CRM badge where action risk exists",
        "show Sin calendario badge where action risk exists",
        "use compact Alfred decision strip on desktop",
        "use compact KPI strip on desktop",
        "use priority list cards on mobile",
        "use bottom nav on mobile only where existing shell supports it"
    ],
    "requiredCopySources": [
        "090B safe copy badge system registry",
        "089R visual template reconciliation",
        "088D screen composition",
        "087D component contracts",
        "086D state model"
    ],
    "blockedPatchKind": [
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
        "DOM write outside normal static source code patch",
        "runtime browser storage or network primitives"
    ]
}

plan = {
    "phase": "091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN",
    "status": "PASS",
    "planType": "safe_ui_implementation_plan_only",
    "base": {
        "091A_discovery": str(discovery_path),
        "090D_copy_badge": "docs/evidence/forge-quote-preview-safe-copy-and-badge-system-decision-audit-090d.json",
        "089R_visual_reconciliation": "docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json"
    },
    "implementationZones": implementation_zones,
    "canonicalSelectionRules": canonical_selection_rules,
    "plannedSafeStaticUiContract": planned_safe_static_ui_contract,
    "requiresHumanOrCodexSelectionBeforePatch": True,
    "next": "091C_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_QA_LOCK",
    "notAuthorized": {
        "uiSourceEditsIn091B": False,
        "screenRendering": False,
        "componentRendering": False,
        "uiMutation": False,
        "cssInjection": False,
        "domWrite": False,
        "quoteTruthCreation": False,
        "backendConnection": False,
        "providerCall": False,
        "parserExecution": False,
        "calculatorExecution": False,
        "banxicoCall": False,
        "send": False,
        "crmWrite": False,
        "calendarCreate": False
    },
    "safetyFlags": {
        "crmWrite": False,
        "pipelineWrite": False,
        "policyWrite": False,
        "quoteWrite": False,
        "taskCreate": False,
        "calendarCreate": False,
        "messageSend": False,
        "authReal": False,
        "providerRuntime": False,
        "secretAccess": False,
        "browserPersistence": False,
        "realEngineExecution": False,
        "realEffectsAllowed": False,
        "realEffectsEnabled": False,
        "backendConnection": False,
        "pdfRead": False,
        "ocrExecution": False,
        "parserExecution": False,
        "calculatorExecution": False,
        "banxicoCall": False,
        "testExecution": False
    }
}

if not top_candidates:
    plan["status"] = "PASS_WITH_NO_UI_CANDIDATES_FOUND"
    plan["requiresHumanOrCodexSelectionBeforePatch"] = True

plan_path.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(plan, indent=2, ensure_ascii=False))
PY

run python3 -m json.tool "$PLAN_JSON"

stage "STAGE 6 WRITE DOCS / AUDIT"
cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview Safe UI Implementation Plan 091B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Purpose

091B creates a safe UI implementation plan for Quote Preview based on 091A surface discovery.

091B does not edit UI source files. It does not implement components.

## Boundary

091B is plan-only.

It does not render components, render screens, mutate UI, inject CSS, write DOM, connect backend, create quote truth, issue quotes, send quotes, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or create calendar events.

## Plan Output

- \`$PLAN_JSON\`

## Canonical Selection Rules

- Prefer files already containing QuotePreview / quote-preview / Preview copy.
- Prefer UI source files over docs or evidence files.
- Prefer TSX/JSX component/page files for visual implementation.
- Prefer static preview surface only if it is the actual rendered demo workspace.
- Do not select tests, evidence screenshots, generated artifacts, or docs as implementation targets.
- Do not cross desktop/mobile layer boundaries established by 089R.
- Do not introduce backend calls, network calls, storage calls, provider runtime, quote truth, sends, CRM writes, or calendar creation.

## 091C Guardrail

091C must QA lock this plan before 091D can decision-lock it.

No UI patch is authorized until after plan QA/decision and explicit safe static UI patch scope.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview Safe UI Implementation Plan Evidence 091B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Implementation Plan

\`\`\`json
$(cat "$PLAN_JSON")
\`\`\`

## Final

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$CERT_DOC" <<EOF
# Forge Quote Preview Safe UI Implementation Plan Certificate 091B

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

091B certifies that safe UI implementation planning has been completed without UI source edits.

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "base": {
    "phase": "091A_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPE",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPED"
  },
  "next": "$NEXT_AFTER",
  "plan": $(cat "$PLAN_JSON"),
  "notAuthorized": {
    "uiSourceEditsIn091B": false,
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
## 091B Quote Preview Safe UI Implementation Plan

091B creates a safe UI implementation plan from the 091A surface discovery.

Locked decision:
\`$LOCKED_DECISION\`

Outputs:

- \`$ARCH_DOC\`
- \`$EVIDENCE_DOC\`
- \`$PLAN_JSON\`
- \`$AUDIT_JSON\`

091B does not edit UI source files.

091C must QA lock this plan before 091D can decision-lock it.

No UI patch is authorized until after explicit safe static UI patch scope.

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

stage "STAGE 7 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run python3 -m json.tool "$AUDIT_JSON"
run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT_AFTER|safe UI implementation plan|does not edit UI source files|No UI patch is authorized|canonicalSelectionRules" \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$PLAN_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md

run git diff --check
safety_scan "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$PLAN_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md

stage "STAGE 8 COMMIT / PUSH"
commit_allowed_subset \
  "docs: plan quote preview safe ui implementation" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$PLAN_JSON" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -14

SUMMARY=$(cat <<EOF
PASS_091B_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_PLAN_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT_AFTER
BACKUP=$BACKUP_DIR
REPORT=$REPORT
PLAN_JSON=$PLAN_JSON
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
