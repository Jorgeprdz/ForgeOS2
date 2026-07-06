#!/usr/bin/env bash
set -euo pipefail

PHASE="062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR"
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
  local rollback="$BACKUP_DIR/rollback-062f1.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").062f1.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CLOSURE_062F1.md"
restore_or_archive "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1.md"
restore_or_archive "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CERTIFICATE_062F1.md"
restore_or_archive "docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json"
restore_or_archive "tools/termux/forge_062f1_quick_actions_panel_active_state_repair.sh"

echo "rollback 062F1 complete"
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
printf "MODE=scoped static preview quick actions panel active-state repair\n"
printf "BOUNDARY=visual state repair only; no contract behavior changes; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to repair 062F1 over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_CLOSURE_062E.md"
  "docs/evidence/FORGE_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E.md"
  "docs/evidence/forge-action-contract-read-model-preview-binding-audit-062e.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062f1-quick-actions-panel-active-state-repair-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY CHANGES"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_062f1_quick_actions_panel_active_state_repair.sh"
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
css_block = """/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START */
@media (min-width: 901px) {
  .dw-command-zone-056y[data-forge-quick-actions-panel-active-062f1="true"] .dw-command-results-056y,
  .dw-command-zone-056y[data-forge-quick-actions-panel-active-062f1="true"] .forge-contract-results-062c {
    display: grid !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  .dw-command-zone-056y[data-forge-quick-actions-panel-active-062f1="true"] .dw-command-results-056y[hidden],
  .dw-command-zone-056y[data-forge-quick-actions-panel-active-062f1="true"] .forge-contract-results-062c[hidden] {
    display: grid !important;
  }
}
/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END */"""
css = replace_block(
    css,
    "/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START */",
    "/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END */",
    css_block,
)
css_path.write_text(css)

js = js_path.read_text()
js_block = r'''/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START */
(function () {
  "use strict";

  function findInput() {
    return document.querySelector(".dw-command-input-056y, .command-pill-input");
  }

  function findRoot(input) {
    return input && (input.closest(".dw-command-zone-056y") || input.closest(".dw-command-shell-056y") || input.parentElement);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isQuickActions(value) {
    var query = normalize(value);
    return query === "/quick actions" || query === "quick actions";
  }

  function revealResults(root) {
    var panels = root.querySelectorAll(".dw-command-results-056y, .forge-contract-results-062c");
    panels.forEach(function (panel) {
      panel.hidden = false;
      panel.removeAttribute("hidden");
      panel.style.removeProperty("display");
      panel.style.removeProperty("visibility");
      panel.style.removeProperty("opacity");
    });
  }

  function updateQuickActionsPanelState() {
    var input = findInput();
    var root = findRoot(input);
    if (!input || !root) {
      return;
    }
    root.setAttribute("data-forge-quick-actions-panel-repair-ready-062f1", "true");
    if (isQuickActions(input.value || input.textContent)) {
      root.classList.add("is-command-active-060m");
      root.classList.add("is-command-active");
      root.setAttribute("data-forge-quick-actions-panel-active-062f1", "true");
      root.setAttribute("data-forge-contract-panel-active-062c", "true");
      revealResults(root);
    } else {
      root.removeAttribute("data-forge-quick-actions-panel-active-062f1");
    }
  }

  function bind() {
    var input = findInput();
    if (!input) {
      return;
    }
    if (input.getAttribute("data-forge-quick-actions-panel-repair-bound-062f1") !== "true") {
      input.setAttribute("data-forge-quick-actions-panel-repair-bound-062f1", "true");
      input.addEventListener("input", updateQuickActionsPanelState);
      input.addEventListener("keyup", updateQuickActionsPanelState);
      input.addEventListener("focus", updateQuickActionsPanelState);
      input.addEventListener("blur", function () {
        setTimeout(updateQuickActionsPanelState, 80);
      });
    }
    updateQuickActionsPanelState();
    document.documentElement.setAttribute("data-forge-quick-actions-panel-active-state-repair-062f1", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
  window.addEventListener("load", bind);
  window.__forgeRunQuickActionsPanelActiveStateRepair062F1 = bind;
})();
/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END */'''
js = replace_block(
    js,
    "/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START */",
    "/* FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END */",
    js_block,
)
js_path.write_text(js)

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=062e", "forge-public-preview-interaction-visual-repair-060m.css?v=062f1")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=062e", "forge-public-preview-interaction-visual-repair-060m.js?v=062f1")
index_path.write_text(index)
PY
pass "patched quick actions active state and 062f1 cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CLOSURE_062F1.md <<'MD'
# Forge Quick Actions Panel Active State Repair Closure 062F1

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062F1 repairs the public Pages blocker found in 062F: `/quick actions` populated the input and kept result rows in the DOM, but the command result panel stayed visually hidden because the command zone lacked the active state required by existing desktop CSS.

Repair:

- when the command input value is `/quick actions`, the command zone receives the active command state;
- the existing result panel is made visible;
- `/quick actions` result rows remain backed by the existing command catalog;
- action contracts, preview payloads, policy, and no-effect boundaries are unchanged.

Public URL:

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062f1`

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK
MD

cat > docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1.md <<'MD'
# Forge Quick Actions Panel Active State Repair 062F1

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062F1 repairs the `/quick actions` visual panel failure reported during 062F QA.

Expected checks after deploy:

- `/quick actions` opens a visible panel on Pages.
- `/cotizar GMM Lariza`, `Follow Juan`, `Revisar Lariza`, `Abrir Octavio`, and `Preview` continue to show preview-safe contract results.
- preview payload binding from 062E remains available.
- no real effects are enabled.

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK
MD

cat > docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CERTIFICATE_062F1.md <<'MD'
# Forge Quick Actions Panel Active State Repair Certificate 062F1

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062F1 certifies a static-preview visual active-state repair only. It does not change action contracts, payload semantics, module connections, authentication, external effects, provider execution, browser persistence, browser request behavior, or real engine execution.
MD

cat > docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json <<'JSON'
{
  "phase": "062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR",
  "status": "PASS",
  "cacheVersion": "062f1",
  "failedBasePhase": "062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK",
  "repairedBlocker": "/quick actions results were present in DOM but visually hidden by inactive command-zone state",
  "repair": {
    "quickActionsInputActivatesCommandZone": true,
    "resultPanelForcedVisibleOnlyForQuickActions": true,
    "contractBehaviorChanged": false,
    "payloadBindingChanged": false
  },
  "realEffectsEnabled": false,
  "next": "062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK"
}
JSON
pass "wrote 062F1 docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062F1 Quick Actions Panel Active State Repair

Status: PASS / IMPLEMENTED.

062F1 repairs the 062F public QA blocker where \`/quick actions\` kept results in the DOM but visually hidden because the command zone did not carry the active state expected by existing CSS.

Repair:

- \`/quick actions\` activates the command zone;
- the existing result panel becomes visible;
- command catalog, action contracts, preview payloads, and no-effect policy remain unchanged.

Public cache:
\`062f1\`

Boundary:

Visual active-state repair only. No CRM, calendar, message, auth, module, provider, browser persistence, browser request, or real engine behavior is changed.

DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR

NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START -->" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START -->" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:START -->" "<!-- FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CLOSURE_062F1.md"
  "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1.md"
  "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CERTIFICATE_062F1.md"
  "docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json"
  "tools/termux/forge_062f1_quick_actions_panel_active_state_repair.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_062f1_quick_actions_panel_active_state_repair.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd python3 -m json.tool docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json
run_cmd rg -n "062f1|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1|data-forge-quick-actions-panel-active-062f1|__forgeRunQuickActionsPanelActiveStateRepair062F1|/quick actions" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR|NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK" docs/architecture/source-truth/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CLOSURE_062F1.md docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1.md docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CERTIFICATE_062F1.md docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped quick actions visual state repair"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CLOSURE_062F1.md"
  "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1.md"
  "docs/evidence/FORGE_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_CERTIFICATE_062F1.md"
  "docs/evidence/forge-quick-actions-panel-active-state-repair-audit-062f1.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062f1.txt"

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
  "mayCreateCalendarEvent: true"
do
  if rg -n --fixed-strings "$token" "${safety_files[@]}" >> "$safety_scan_file" 2>/dev/null; then
    cat "$safety_scan_file"
    fail "safety scan found forbidden token: $token"
  fi
done
pass "safety scan clean"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "Screenshot and interaction evidence should be captured in 062F2 QA lock"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${changed_files[@]}"

expected="$(mktemp)"
actual="$(mktemp)"
printf "%s\n" "${changed_files[@]}" | sort > "$expected"
git diff --cached --name-only | sort > "$actual"
run_cmd git diff --cached --name-only
if ! diff -u "$expected" "$actual"; then
  fail "staged files differ from authorized 062F1 file set"
fi
pass "only authorized files staged"
run_cmd git diff --cached --check

say_stage "STAGE 12 COMMIT PUSH"
run_cmd git commit -m "fix: repair quick actions panel active state"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062F1_QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062F2_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062f1.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
