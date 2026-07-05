#!/usr/bin/env bash
set -euo pipefail

PHASE="060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() { printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass() { printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }

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
path.write_text("\n".join(line.rstrip() for line in text.splitlines()) + "\n")
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
  local rollback="$BACKUP_DIR/rollback-060x.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").060x.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "docs/static-preview/forge-alive/index.html"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
restore_or_archive "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CERTIFICATE_060X.md"
restore_or_archive "tools/termux/forge_060x_command_bar_quick_actions_placeholder.sh"

echo "rollback 060X complete"
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
printf "MODE=scoped static preview command bar quick actions placeholder implementation\n"
printf "BOUNDARY=static preview placeholder text only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to mix 060X with unrelated edits"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060x-command-bar-quick-actions-placeholder-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_060x_command_bar_quick_actions_placeholder.sh"
pass "copied runner into tools/termux"

python3 - <<'PY'
from pathlib import Path

css_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css")
js_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js")
index_path = Path("docs/static-preview/forge-alive/index.html")

def replace_block(text, start, end, block):
    if start in text and end in text:
        before, rest = text.split(start, 1)
        _, after = rest.split(end, 1)
        return before.rstrip() + "\n\n" + block.rstrip() + "\n" + after.lstrip("\n")
    return text.rstrip() + "\n\n" + block.rstrip() + "\n"

css = css_path.read_text()
start = "/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START */"
end = "/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END */"
css_block = """/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START */
@media (min-width: 901px) {
  .dw-command-input-056y::placeholder,
  .command-pill-input::placeholder,
  input[aria-controls="forge-command-results-060m"]::placeholder {
    color: rgba(245, 247, 255, 0.78) !important;
    opacity: 1 !important;
  }
}
/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END */"""
css_path.write_text(replace_block(css, start, end, css_block))

js = js_path.read_text()
js = js.replace(
    'var PLACEHOLDER = "Buscar o pedir a Alfred: /cotizar, /follow Juan, /llamar Lariza...";',
    'var PLACEHOLDER = "/quick actions";'
)
start_js = "/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START */"
end_js = "/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END */"
js_block = """/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START */
(function () {
  "use strict";

  var PLACEHOLDER = "/quick actions";

  function commandInput() {
    return document.querySelector(".dw-command-input-056y, .command-pill-input, input[aria-controls='forge-command-results-060m'], [role='textbox'][aria-controls='forge-command-results-060m']");
  }

  function applyPlaceholder() {
    var input = commandInput();
    if (!input) {
      return;
    }
    input.setAttribute("placeholder", PLACEHOLDER);
    document.documentElement.setAttribute("data-forge-command-quick-actions-placeholder-060x", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyPlaceholder, { once: true });
  } else {
    applyPlaceholder();
  }
  window.addEventListener("load", applyPlaceholder);
  window.__forgeApplyCommandBarQuickActionsPlaceholder060X = applyPlaceholder;
})();
/* FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END */"""
js_path.write_text(replace_block(js, start_js, end_js, js_block))

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=060w", "forge-public-preview-interaction-visual-repair-060m.css?v=060x")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=060w", "forge-public-preview-interaction-visual-repair-060m.js?v=060x")
index_path.write_text(index)
PY
pass "patched command bar placeholder to /quick actions and 060x cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md <<'MD'
# Forge Command Bar Quick Actions Placeholder Closure 060X

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK

060X simplifies the idle command bar placeholder to `/quick actions`.

Safety remains static-preview only.

## Public URL

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=060x`

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md <<'MD'
# Forge Command Bar Quick Actions Placeholder 060X

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK

060X changes the idle command bar placeholder from the long Spanish example string to `/quick actions`.

Expected behavior:
- command bar visible;
- input editable;
- idle placeholder says `/quick actions`;
- no prefilled command value;
- overlay search remains unchanged.

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CERTIFICATE_060X.md <<'MD'
# Forge Command Bar Quick Actions Placeholder Certificate 060X

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK

060X is a scoped placeholder-text repair and does not enable actions, runtime, network, browser persistence, CRM, calendar, or send behavior.
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060X simplifies the command bar idle placeholder to \`/quick actions\`.

Public cache:
\`060x\`

DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION

NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START -->" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START -->" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:START -->" "<!-- FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md"
  "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md"
  "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CERTIFICATE_060X.md"
  "tools/termux/forge_060x_command_bar_quick_actions_placeholder.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060x_command_bar_quick_actions_placeholder.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "060x|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X|/quick actions|__forgeApplyCommandBarQuickActionsPlaceholder060X" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION|NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK" docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CERTIFICATE_060X.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped placeholder text repair"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md"
  "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-060x.txt"

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
warn "Screenshot evidence should be captured after 060X deploys"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CLOSURE_060X.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_060X.md"
  "docs/evidence/FORGE_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_CERTIFICATE_060X.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_060x_command_bar_quick_actions_placeholder.sh"
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
run_cmd git commit -m "fix: simplify command bar placeholder"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060X_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060Y_COMMAND_BAR_QUICK_ACTIONS_PLACEHOLDER_VISUAL_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060x.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
