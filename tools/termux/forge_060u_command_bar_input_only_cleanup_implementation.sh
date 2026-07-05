#!/usr/bin/env bash
set -euo pipefail

PHASE="060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION"
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
  local rollback="$BACKUP_DIR/rollback-060u.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").060u.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CERTIFICATE_060U.md"
restore_or_archive "tools/termux/forge_060u_command_bar_input_only_cleanup_implementation.sh"

echo "rollback 060U complete"
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
printf "MODE=scoped static preview command bar input-only cleanup implementation\n"
printf "BOUNDARY=static preview visual cleanup only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to mix 060U with unrelated edits"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_CLOSURE_060T.md"
  "docs/evidence/FORGE_COMMAND_BAR_SEARCH_OVERLAY_VISUAL_QA_LOCK_060T.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060u-command-bar-input-only-cleanup-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_060u_command_bar_input_only_cleanup_implementation.sh"
pass "copied runner into tools/termux"

python3 - <<'PY'
from pathlib import Path

css_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css")
js_path = Path("docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js")
index_path = Path("docs/static-preview/forge-alive/index.html")

css = css_path.read_text()
start = "/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:START */"
end = "/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:END */"
css_block = """/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:START */
@media (min-width: 901px) {
  .dw-command-suggestions-058e,
  .dw-command-suggestions-056y,
  .command-suggestions,
  [data-forge-command-static-suggestion-060u="true"] {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    opacity: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }

  .dw-command-zone-056y,
  .dw-command-shell-056y,
  .dw-command-card-056y {
    overflow: visible !important;
  }

  [data-forge-command-overlay-root-060s="true"] [data-forge-command-results-panel-060s="true"] {
    margin-top: 0 !important;
  }
}
/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:END */"""
if start in css and end in css:
    before, rest = css.split(start, 1)
    _, after = rest.split(end, 1)
    css = before.rstrip() + "\n\n" + css_block + "\n" + after.lstrip("\n")
else:
    css = css.rstrip() + "\n\n" + css_block + "\n"
css_path.write_text(css)

js = js_path.read_text()
start_js = "/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:START */"
end_js = "/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:END */"
js_block = """/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:START */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 901px)";

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function textOf(node) {
    if (!node) {
      return "";
    }
    return String(node.value || node.textContent || node.getAttribute("aria-label") || "").trim();
  }

  function hideStaticSuggestions() {
    if (!isDesktop()) {
      return;
    }
    var selectors = [
      ".dw-command-suggestions-058e",
      ".dw-command-suggestions-056y",
      ".command-suggestions"
    ];
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors.join(",")));
    var commandRoot = document.querySelector(".dw-command-zone-056y, .dw-command-shell-056y, .dw-command-card-056y");
    if (commandRoot) {
      Array.prototype.slice.call(commandRoot.querySelectorAll("div, section, article, li, button")).forEach(function (node) {
        var content = textOf(node).toLowerCase();
        if (content.indexOf("/cotizar") !== -1 || content.indexOf("/follow") !== -1 || content.indexOf("/llamar") !== -1 || content.indexOf("/buscar") !== -1 || content.indexOf("/mandar") !== -1 || content.indexOf("/subir") !== -1) {
          if (!node.hasAttribute("data-forge-command-results-panel-060s") && !node.closest("[data-forge-command-results-panel-060s='true']")) {
            nodes.push(node);
          }
        }
      });
    }
    nodes.forEach(function (node) {
      node.setAttribute("data-forge-command-static-suggestion-060u", "true");
      node.setAttribute("aria-hidden", "true");
    });
    document.documentElement.setAttribute("data-forge-command-input-only-cleanup-060u", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideStaticSuggestions, { once: true });
  } else {
    hideStaticSuggestions();
  }
  window.addEventListener("load", hideStaticSuggestions);
  window.__forgeRunCommandBarInputOnlyCleanup060U = hideStaticSuggestions;
})();
/* FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U:END */"""
if start_js in js and end_js in js:
    before, rest = js.split(start_js, 1)
    _, after = rest.split(end_js, 1)
    js = before.rstrip() + "\n\n" + js_block + "\n" + after.lstrip("\n")
else:
    js = js.rstrip() + "\n\n" + js_block + "\n"
js_path.write_text(js)

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=060s", "forge-public-preview-interaction-visual-repair-060m.css?v=060u")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=060s", "forge-public-preview-interaction-visual-repair-060m.js?v=060u")
index_path.write_text(index)
PY
pass "patched 060m CSS/JS to make command bar input-only and 060u cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md <<'MD'
# Forge Command Bar Input Only Cleanup Implementation Closure 060U

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK

060U removes the static command suggestion grid from the command bar closed state.

The command bar should now be only the text entry surface. Results appear only after input interaction through the floating results panel.

Implemented in-place:

- `docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css`
- `docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js`
- `docs/static-preview/forge-alive/index.html`

Cache-bust:

- `060u`

This remains static preview visual cleanup only. It does not connect provider runtime, execute a real engine, write CRM, create calendar events, send messages, mutate browser storage, or request live external data.

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md <<'MD'
# Forge Command Bar Input Only Cleanup Implementation 060U

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK

060U addresses the public visual issue where static suggestions such as `Cotizar /cotizar` appeared under the command bar and looked like stuck results.

Repair behavior:

- command bar remains clickable and editable;
- static command suggestions under the bar are hidden and removed from layout space;
- floating results remain controlled by text input;
- no static result-looking cards remain in the closed command bar area;
- safe preview and no-action boundaries are unchanged.

Validation:

- runner shell syntax checked;
- command interaction JavaScript syntax checked;
- cache-bust checked;
- input-only cleanup markers checked;
- whitespace check passed;
- safety scan passed.

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CERTIFICATE_060U.md <<'MD'
# Forge Command Bar Input Only Cleanup Implementation Certificate 060U

060U certifies the command bar closed state is input-only: static command suggestion cards are removed from the command bar area.

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060U removes static command suggestions from the command bar closed state.

The command bar is now scoped as the text entry surface only; result cards appear only through the floating results panel after input interaction.

Cache-bust:

\`060u\`

Boundary remains static preview visual cleanup only: no provider runtime, no CRM write, no calendar create, no send, no browser storage, no network calls, and no real engine execution.

DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION

NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:START -->" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:START -->" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:START -->" "<!-- FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md"
  "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md"
  "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CERTIFICATE_060U.md"
  "tools/termux/forge_060u_command_bar_input_only_cleanup_implementation.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060u_command_bar_input_only_cleanup_implementation.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "060u|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:COMMAND_BAR_INPUT_ONLY_CLEANUP_060U|data-forge-command-static-suggestion-060u|data-forge-command-input-only-cleanup-060u|__forgeRunCommandBarInputOnlyCleanup060U|dw-command-suggestions" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION|NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK" docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CERTIFICATE_060U.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped command bar input-only cleanup"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md"
  "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-060u.txt"

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
warn "Screenshot evidence should be captured in 060V visual QA lock"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CLOSURE_060U.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_060U.md"
  "docs/evidence/FORGE_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_CERTIFICATE_060U.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_060u_command_bar_input_only_cleanup_implementation.sh"
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
run_cmd git commit -m "fix: make forge command bar input only"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060U_COMMAND_BAR_INPUT_ONLY_CLEANUP_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060V_COMMAND_BAR_INPUT_ONLY_VISUAL_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060u.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
