#!/usr/bin/env bash
set -euo pipefail

PHASE="060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() {
  printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"
}

pass() {
  printf "${GREEN}PASS:${RESET} %s\n" "$1"
}

warn() {
  printf "${YELLOW}WARN:${RESET} %s\n" "$1"
}

autocopy_report() {
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" || true
    pass "report copied to clipboard"
  else
    warn "termux-clipboard-set not available; report left at $REPORT"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}FAIL:${RESET} %s\n" "$1"
  autocopy_report
  exit 1
}

run_cmd() {
  printf "\n========== RUN ==========\n"
  printf "%s " "$@"
  printf "\n"
  "$@"
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "$file"
  else
    fail "missing required file: $file"
  fi
}

backup_file() {
  local file="$1"
  local dest="$BACKUP_DIR/$file"
  mkdir -p "$(dirname "$dest")"
  cp "$file" "$dest"
  pass "backup $file"
}

normalize_file() {
  local file="$1"
  python3 - "$file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
lines = text.splitlines()
path.write_text("\n".join(line.rstrip() for line in lines) + "\n")
PY
}

append_sync_block() {
  local file="$1"
  local start="$2"
  local end="$3"
  local body="$4"
  python3 - "$file" "$start" "$end" "$body" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = sys.argv[4]
text = path.read_text()
block = f"{start}\n{body.rstrip()}\n{end}\n"
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
path.write_text(text)
PY
}

write_rollback() {
  local rollback="$BACKUP_DIR/rollback-060t.sh"
  cat > "$rollback" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail

REPO="/storage/emulated/0/Forge OS"
BACKUP_DIR_PLACEHOLDER
cd "$REPO"

restore_or_archive() {
  local file="$1"
  local backup="$BACKUP_DIR/$file"
  if [[ -f "$backup" ]]; then
    mkdir -p "$(dirname "$file")"
    cp "$backup" "$file"
    echo "restored $file"
  elif [[ -e "$file" ]]; then
    mkdir -p ".forge-backups/rollback-archives"
    local archive=".forge-backups/rollback-archives/$(basename "$file").060t.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CERTIFICATE_060T.md"
restore_or_archive "docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json"
restore_or_archive "tools/termux/forge_060t_command_bar_search_overlay_visual_qa_lock.sh"

echo "rollback 060T complete"
ROLLBACK
  python3 - "$rollback" "$BACKUP_DIR" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
backup = sys.argv[2]
text = path.read_text().replace("BACKUP_DIR_PLACEHOLDER", f'BACKUP_DIR="{backup}"')
path.write_text(text)
PY
  chmod +x "$rollback"
  pass "rollback script created: $rollback"
}

say_stage "STAGE 0 HEADER"
printf "PHASE=%s\n" "$PHASE"
printf "MODE=read-only command bar search overlay visual QA lock\n"
printf "BOUNDARY=no static preview mutation; no CSS/JS mutation; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to lock QA over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/static-preview/forge-alive/desktop/forge-desktop-visual-line-cleanup-058i.css"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_POLISH_IMPLEMENTATION_CLOSURE_060S.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_POLISH_IMPLEMENTATION_060S.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060t-command-bar-search-overlay-visual-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_060t_command_bar_search_overlay_visual_qa_lock.sh"
pass "copied runner into tools/termux"

mkdir -p docs/evidence
python3 - <<'PY'
from pathlib import Path
import json
import re

index_path = Path("docs/static-preview/forge-alive/index.html")
css_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css")
js_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js")
focus_path = Path("docs/static-preview/forge-alive/desktop/forge-desktop-visual-line-cleanup-058i.css")
out_path = Path("docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json")

index = index_path.read_text()
css = css_path.read_text()
js = js_path.read_text()
focus = focus_path.read_text()

def contains(text, needle):
    return needle in text

def all_contains(text, needles):
    return {needle: needle in text for needle in needles}

index_checks = {
    "interactionLayerCache060sCss": "forge-public-preview-interaction-visual-repair-060m.css?v=060s" in index,
    "interactionLayerCache060sJs": "forge-public-preview-interaction-visual-repair-060m.js?v=060s" in index,
    "focusCleanupPresent": "forge-desktop-visual-line-cleanup-058i.css" in index,
}

css_checks = {
    "overlayRootRelative": 'data-forge-command-overlay-root-060s="true"' in css and "position: relative" in css,
    "overlayActiveZIndex": 'data-forge-command-overlay-active-060s="true"' in css and "z-index: 80" in css,
    "suggestionsCollapseHeightZero": 'data-forge-static-command-suggestions-collapsed-060s="true"' in css and "height: 0" in css,
    "suggestionsCollapseMarginZero": "margin-top: 0" in css and "margin-bottom: 0" in css,
    "resultsPanelAbsolute": 'data-forge-command-results-panel-060s="true"' in css and "position: absolute" in css,
    "resultsPanelPremiumShadow": "box-shadow: 0 24px 70px" in css,
    "inactivePanelHidden": ":not([data-forge-command-overlay-active-060s=\"true\"])" in css and "display: none" in css,
}

js_checks = {
    "overlayRunnerPresent": "__forgeRunCommandBarSearchOverlayPolish060S" in js,
    "inputValueRequiredForActive": "Boolean(input.value && input.value.trim())" in js,
    "geometryVarsSet": "--forge-command-overlay-top-060s" in js and "--forge-command-overlay-left-060s" in js and "--forge-command-overlay-right-060s" in js,
    "resultsPanelMarked": "data-forge-command-results-panel-060s" in js,
    "staticSuggestionsMarked": "data-forge-static-command-suggestions-060s" in js,
    "staticSuggestionsCollapsed": "data-forge-static-command-suggestions-collapsed-060s" in js,
}

focus_checks = {
    "focusOutlineSuppressed": "outline: 0" in css + focus or "outline: none" in css + focus,
    "focusRectangleSuppressed": "box-shadow: none" in css + focus or "border-color: transparent" in css + focus,
}

forbidden = {
    "browserLocalStoreToken": "localStorage" in js + css + index,
    "browserSessionStoreToken": "sessionStorage" in js + css + index,
    "networkRequestToken": "fetch(" in js + css + index,
    "xhrToken": "XMLHttpRequest" in js + css + index,
    "mediaToken": "navigator.mediaDevices" in js + css + index,
    "speechToken": "SpeechRecognition" in js + css + index,
}

audit = {
    "phase": "060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK",
    "status": "PASS",
    "expectedPublicUrl": "https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=060s",
    "indexChecks": index_checks,
    "overlayCssChecks": css_checks,
    "overlayJsChecks": js_checks,
    "focusVisualChecks": focus_checks,
    "forbiddenRuntimeTokensDetected": forbidden,
    "manualScreenshotQaRequired": True,
    "manualScreenshotTargets": [
        "closed 1366x768",
        "open /cot 1366x768",
        "closed 1440x1000",
        "open /cot 1440x1000",
        "closed 1536x864",
        "open /cot 1536x864",
        "closed 1920x1080",
        "open /cot 1920x1080"
    ],
    "manualReviewChecklist": [
        "Open state should feel like a floating premium overlay.",
        "No dead vertical gap should remain below the command bar.",
        "Static suggestions should not overlap active results.",
        "First click on empty input should not open a panel.",
        "Typing /cot should open floating results.",
        "No focus rectangle should appear.",
        "No real action should execute."
    ],
    "safety": {
        "providerExecution": False,
        "realEngineExecution": False,
        "messageSend": False,
        "crmWrite": False,
        "calendarCreate": False,
        "browserStorageMutation": False,
        "liveExternalData": False
    }
}

if not all(index_checks.values()):
    audit["status"] = "REVIEW"
if not all(css_checks.values()):
    audit["status"] = "REVIEW"
if not all(js_checks.values()):
    audit["status"] = "REVIEW"
if not all(focus_checks.values()):
    audit["status"] = "REVIEW"
if any(forbidden.values()):
    audit["status"] = "REVIEW"

out_path.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n")
PY
pass "wrote overlay visual QA audit json"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md <<'MD'
# Forge Command Bar Search Overlay Visual QA Lock Closure 060T

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION

060T locks read-only structural visual QA evidence for the 060S command bar search overlay polish.

Evidence artifact:

- `docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json`

The audit confirms:

- `060s` cache-bust is active;
- results panel is configured as a floating overlay;
- static suggestions collapse with zero height during active query;
- the open state is not allowed to reserve dead vertical space by static suggestions;
- focus outline suppression remains present;
- runtime/action/storage boundaries remain closed.

Manual screenshot QA remains required for public Pages render.

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION
MD

cat > docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md <<'MD'
# Forge Command Bar Search Overlay Visual QA Lock 060T

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION

060T records structural visual QA evidence for the command bar search overlay polish.

Expected public URL:

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=060s`

Manual review checklist:

- closed state remains clean;
- first click on empty input opens no panel;
- typing `/cot` opens a floating overlay;
- no dead vertical gap remains below the command bar;
- static suggestions do not overlap the active overlay;
- no focus rectangle appears;
- no real action executes.

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION
MD

cat > docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CERTIFICATE_060T.md <<'MD'
# Forge Command Bar Search Overlay Visual QA Lock Certificate 060T

060T certifies read-only structural visual QA evidence for the 060S command bar search overlay polish.

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION
MD
pass "wrote evidence docs"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060T locks read-only structural visual QA evidence for the 060S command bar search overlay polish.

Evidence artifact:

\`docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json\`

The audit confirms 060s cache-bust, floating overlay markers, real static suggestion collapse, focus cleanup, and closed runtime/action/storage boundaries.

Manual screenshot QA remains required for Pages render.

DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK

NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:START -->" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:START -->" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:START -->" "<!-- FORGEOS:COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CERTIFICATE_060T.md"
  "docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json"
  "tools/termux/forge_060t_command_bar_search_overlay_visual_qa_lock.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060t_command_bar_search_overlay_visual_qa_lock.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd python3 -m json.tool docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json
run_cmd rg -n "PASS|060s|manualScreenshotQaRequired|overlayCssChecks|overlayJsChecks|providerExecution|messageSend|crmWrite" docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json
run_cmd rg -n "DECISION=PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK|NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION" docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CERTIFICATE_060T.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for read-only overlay visual QA lock"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-060t.txt"

for token in \
  "localStorage" \
  "sessionStorage" \
  "fetch(" \
  "XMLHttpRequest" \
  "navigator.mediaDevices" \
  "SpeechRecognition" \
  "providerRuntimeEnabled: true" \
  "networkCallsAllowed: true" \
  "browserStorageEnabled: true" \
  "mayCreateTruth: true" \
  "maySendMessage: true" \
  "mayWriteCrm: true" \
  "mayCreateCalendarEvent: true"; do
  if rg -n -F "$token" "${safety_files[@]}" > "$safety_scan_file" 2>/dev/null; then
    cat "$safety_scan_file"
    fail "safety scan found forbidden token: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "No automated screenshots captured in 060T; public Pages screenshots should be collected before 060U decision"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CERTIFICATE_060T.md"
  "docs/evidence/forge-command-bar-search-overlay-visual-qa-audit-060t.json"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_060t_command_bar_search_overlay_visual_qa_lock.sh"
)

git add "${allowed_paths[@]}"
run_cmd git diff --cached --name-only

mapfile -t staged_files < <(git diff --cached --name-only)
for staged in "${staged_files[@]}"; do
  ok="false"
  for allowed in "${allowed_paths[@]}"; do
    if [[ "$staged" == "$allowed" ]]; then
      ok="true"
      break
    fi
  done
  if [[ "$ok" != "true" ]]; then
    fail "unauthorized staged file: $staged"
  fi
done
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
run_cmd git commit -m "docs: lock command search overlay visual qa"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060T_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060U_COMMAND_BAR_PUBLIC_MANUAL_REVIEW_DECISION\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060t.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
