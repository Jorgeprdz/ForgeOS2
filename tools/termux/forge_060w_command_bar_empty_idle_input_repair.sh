#!/usr/bin/env bash
set -euo pipefail

PHASE="060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION"
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
  local rollback="$BACKUP_DIR/rollback-060w.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").060w.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CERTIFICATE_060W.md"
restore_or_archive "tools/termux/forge_060w_command_bar_empty_idle_input_repair.sh"

echo "rollback 060W complete"
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
printf "MODE=scoped static preview command bar empty idle input repair implementation\n"
printf "BOUNDARY=static preview input-state repair only; no CRM; no calendar; no send; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to mix 060W with unrelated edits"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_RESTORE_INPUT_REPAIR_CLOSURE_060V.md"
  "docs/evidence/FORGE_COMMAND_BAR_RESTORE_INPUT_REPAIR_060V.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/060w-command-bar-empty-idle-input-repair-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_060w_command_bar_empty_idle_input_repair.sh"
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
start = "/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START */"
end = "/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END */"
css_block = """/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START */
@media (min-width: 901px) {
  .dw-command-input-056y::placeholder,
  .command-pill-input::placeholder,
  input[aria-controls="forge-command-results-060m"]::placeholder {
    color: rgba(245, 247, 255, 0.72) !important;
    opacity: 1 !important;
  }
}
/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END */"""
css_path.write_text(replace_block(css, start, end, css_block))

js = js_path.read_text()
start_js = "/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START */"
end_js = "/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END */"
js_block = """/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 901px)";
  var PLACEHOLDER = "Buscar o pedir a Alfred: /cotizar, /follow Juan, /llamar Lariza...";
  var userTouched = false;

  function isDesktop() {
    return !window.matchMedia || window.matchMedia(DESKTOP_QUERY).matches;
  }

  function commandInput() {
    return document.querySelector(".dw-command-input-056y, .command-pill-input, input[aria-controls='forge-command-results-060m'], [role='textbox'][aria-controls='forge-command-results-060m']");
  }

  function valueOf(input) {
    if (!input) {
      return "";
    }
    if ("value" in input) {
      return String(input.value || "");
    }
    return String(input.textContent || "");
  }

  function setValue(input, value) {
    if (!input) {
      return;
    }
    if ("value" in input) {
      input.value = value;
    } else {
      input.textContent = value;
    }
  }

  function looksLikeStaticPrefill(value) {
    var text = String(value || "").trim().toLowerCase();
    if (!text || text.charAt(0) !== "/") {
      return false;
    }
    return text.indexOf("lariza") !== -1 ||
      text.indexOf("gmm") !== -1 ||
      text.indexOf("/cotizar") !== -1 ||
      text.indexOf("/follow") !== -1 ||
      text.indexOf("/llamar") !== -1 ||
      text.indexOf("/buscar") !== -1 ||
      text.indexOf("/mandar") !== -1 ||
      text.indexOf("/subir") !== -1;
  }

  function hideResultPanel(input) {
    if (!input) {
      return;
    }
    var panel = document.getElementById(input.getAttribute("aria-controls") || "forge-command-results-060m");
    if (panel) {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
    }
    input.removeAttribute("aria-activedescendant");
    var root = input.closest(".dw-command-zone-056y, .dw-command-shell-056y, .dw-command-card-056y, .command-shell");
    if (root) {
      root.removeAttribute("data-forge-command-overlay-active-060s");
    }
  }

  function clearStaticPrefill() {
    if (!isDesktop() || userTouched) {
      return;
    }
    var input = commandInput();
    if (!input) {
      return;
    }
    input.setAttribute("placeholder", PLACEHOLDER);
    input.setAttribute("inputmode", "text");
    input.removeAttribute("aria-readonly");
    if ("readOnly" in input) {
      input.readOnly = false;
    }
    if (!looksLikeStaticPrefill(valueOf(input))) {
      return;
    }
    setValue(input, "");
    hideResultPanel(input);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    document.documentElement.setAttribute("data-forge-command-idle-input-empty-060w", "true");
  }

  function markTouched() {
    userTouched = true;
  }

  function bindInteractionGuard() {
    var input = commandInput();
    if (!input || input.getAttribute("data-forge-command-empty-idle-bound-060w") === "true") {
      return;
    }
    input.setAttribute("data-forge-command-empty-idle-bound-060w", "true");
    input.addEventListener("keydown", markTouched, { once: true });
    input.addEventListener("input", markTouched, { once: true });
    input.addEventListener("paste", markTouched, { once: true });
  }

  function scheduleClear() {
    bindInteractionGuard();
    clearStaticPrefill();
    window.setTimeout(clearStaticPrefill, 0);
    window.setTimeout(clearStaticPrefill, 80);
    window.setTimeout(clearStaticPrefill, 220);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleClear, { once: true });
  } else {
    scheduleClear();
  }
  window.addEventListener("load", scheduleClear);
  window.__forgeRunCommandBarEmptyIdleInputRepair060W = clearStaticPrefill;
})();
/* FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END */"""
js_path.write_text(replace_block(js, start_js, end_js, js_block))

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=060v", "forge-public-preview-interaction-visual-repair-060m.css?v=060w")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=060v", "forge-public-preview-interaction-visual-repair-060m.js?v=060w")
index_path.write_text(index)
PY
pass "patched 060m CSS/JS to empty idle command input and 060w cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md <<'MD'
# Forge Command Bar Empty Idle Input Repair Closure 060W

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK

060W clears static slash-command prefill from the command bar idle state. The command bar remains visible and editable, with a placeholder only until the user types.

Safety remains static-preview only.

## Public URL

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=060w`

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md <<'MD'
# Forge Command Bar Empty Idle Input Repair 060W

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK

060W addresses the public QA finding that the restored command bar still opened with a prefilled static command such as `/llamar Lariza ahora`.

Expected behavior:
- command bar visible;
- command bar editable;
- idle state shows placeholder only;
- no fixed slash command appears until the user types;
- search overlay behavior remains unchanged.

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CERTIFICATE_060W.md <<'MD'
# Forge Command Bar Empty Idle Input Repair Certificate 060W

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK

060W is a scoped static preview input-state repair. It does not enable CRM, calendar, send, provider, real engine, runtime, network, or browser persistence behavior.
MD
pass "wrote docs / evidence"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="060W clears static slash-command prefill from the command bar idle state while keeping the restored input visible and editable.

Public cache:
\`060w\`

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START -->" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START -->" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:START -->" "<!-- FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CERTIFICATE_060W.md"
  "tools/termux/forge_060w_command_bar_empty_idle_input_repair.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_060w_command_bar_empty_idle_input_repair.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "060w|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W|data-forge-command-idle-input-empty-060w|__forgeRunCommandBarEmptyIdleInputRepair060W|PLACEHOLDER" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION|NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK" docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CERTIFICATE_060W.md FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped command bar empty idle input repair"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-060w.txt"

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
warn "Screenshot evidence should be captured after 060W deploys"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CLOSURE_060W.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_060W.md"
  "docs/evidence/FORGE_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_CERTIFICATE_060W.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_060w_command_bar_empty_idle_input_repair.sh"
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
run_cmd git commit -m "fix: clear idle command bar prefill"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-060w.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
