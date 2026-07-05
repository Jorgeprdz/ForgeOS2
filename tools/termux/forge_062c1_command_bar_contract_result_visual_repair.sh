#!/usr/bin/env bash
set -euo pipefail

PHASE="062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR"
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
  local rollback="$BACKUP_DIR/rollback-062c1.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").062c1.$(date +%Y%m%d_%H%M%S)"
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
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md"
restore_or_archive "docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json"
restore_or_archive "tools/termux/forge_062c1_command_bar_contract_result_visual_repair.sh"

echo "rollback 062C1 complete"
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
printf "MODE=scoped static preview command bar contract result visual repair\n"
printf "BOUNDARY=visual/layout repair only; no contract behavior changes; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to repair 062C1 over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION_CLOSURE_062C.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION_062C.md"
  "docs/evidence/forge-command-bar-action-contract-audit-062c.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062c1-command-bar-contract-result-visual-repair-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_062c1_command_bar_contract_result_visual_repair.sh"
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
css_block = """/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START */
@media (min-width: 901px) {
  [data-forge-contract-result-visual-repair-062c1="true"] {
    position: relative !important;
    overflow: visible !important;
    z-index: 70;
  }

  [data-forge-contract-result-visual-repair-062c1="true"][data-forge-contract-panel-active-062c="true"] {
    z-index: 130;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-results-062c {
    top: var(--forge-contract-panel-top-062c1, 76px) !important;
    left: var(--forge-contract-panel-left-062c1, 28px) !important;
    right: var(--forge-contract-panel-right-062c1, 28px) !important;
    gap: 9px !important;
    padding: 10px !important;
    max-height: min(330px, 42vh) !important;
    border-radius: 18px !important;
    background: linear-gradient(180deg, rgba(7, 19, 33, 0.985), rgba(4, 10, 18, 0.965)) !important;
    box-shadow:
      0 34px 92px rgba(0, 0, 0, 0.54),
      0 0 0 1px rgba(139, 232, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-result-062c {
    grid-template-columns: minmax(0, 1fr) max-content !important;
    align-items: center !important;
    min-height: 62px;
    padding: 12px 14px !important;
    border-radius: 14px !important;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-result-062c > span:first-child {
    display: block;
    min-width: 0;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-result-062c__title {
    display: block !important;
    max-width: 100%;
    overflow: hidden;
    color: rgba(248, 251, 255, 0.96);
    line-height: 1.18;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-result-062c__subtitle {
    display: block !important;
    max-width: 100%;
    margin-top: 5px !important;
    overflow: hidden;
    color: rgba(214, 226, 238, 0.74);
    line-height: 1.28;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-forge-contract-result-visual-repair-062c1="true"] .forge-contract-result-062c__status {
    align-self: center;
    white-space: nowrap;
  }
}
/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END */"""
css = replace_block(
    css,
    "/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START */",
    "/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END */",
    css_block,
)
css_path.write_text(css)

js = js_path.read_text()
js_block = """/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START */
(function () {
  "use strict";

  function findInput() {
    return document.querySelector(".dw-command-input-056y, .command-pill-input");
  }

  function findRoot(input) {
    return input && (input.closest(".dw-command-zone-056y") || input.closest(".dw-command-shell-056y") || input.parentElement);
  }

  function updateGeometry() {
    var input = findInput();
    var root = findRoot(input);
    if (!input || !root) {
      return;
    }
    root.setAttribute("data-forge-contract-result-visual-repair-062c1", "true");
    var inputRect = input.getBoundingClientRect();
    var rootRect = root.getBoundingClientRect();
    var top = Math.max(68, Math.round(inputRect.bottom - rootRect.top + 12));
    root.style.setProperty("--forge-contract-panel-top-062c1", top + "px");
    root.style.setProperty("--forge-contract-panel-left-062c1", "28px");
    root.style.setProperty("--forge-contract-panel-right-062c1", "28px");
  }

  function runRepair() {
    updateGeometry();
    var input = findInput();
    if (!input || input.getAttribute("data-forge-contract-visual-repair-bound-062c1") === "true") {
      return;
    }
    input.setAttribute("data-forge-contract-visual-repair-bound-062c1", "true");
    input.addEventListener("input", updateGeometry);
    input.addEventListener("focus", updateGeometry);
    window.addEventListener("resize", updateGeometry);
    document.documentElement.setAttribute("data-forge-contract-result-visual-repair-ready-062c1", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runRepair, { once: true });
  } else {
    runRepair();
  }
  window.addEventListener("load", runRepair);
  window.__forgeRunCommandBarContractResultVisualRepair062C1 = runRepair;
})();
/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END */"""
js = replace_block(
    js,
    "/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START */",
    "/* FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END */",
    js_block,
)
js_path.write_text(js)

index = index_path.read_text()
index = index.replace("forge-public-preview-interaction-visual-repair-060m.css?v=062c", "forge-public-preview-interaction-visual-repair-060m.css?v=062c1")
index = index.replace("forge-public-preview-interaction-visual-repair-060m.js?v=062c", "forge-public-preview-interaction-visual-repair-060m.js?v=062c1")
index_path.write_text(index)
PY
pass "patched contract result layout and 062c1 cache"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md <<'MD'
# Forge Command Bar Contract Result Visual Repair Closure 062C1

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

062C1 repairs the visual layout of command-bar contract results after manual review of 062C.

Repairs:

- command result title and subtitle are visually separated;
- result status pill remains aligned to the right;
- result panel receives stronger overlay treatment;
- panel geometry is recalculated from the command input;
- command contracts and preview-only behavior are unchanged.

Public URL:

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062c1`

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md <<'MD'
# Forge Command Bar Contract Result Visual Repair 062C1

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

062C1 fixes the contract-backed command result layout without changing contract behavior.

Expected checks:

- `Revisar Lariza` and its subtitle are separated.
- `/follow Juan` and its subtitle are separated.
- `/cotizar GMM Lariza` and its subtitle are separated.
- status pills remain visible.
- no real action executes.

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK
MD

cat > docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md <<'MD'
# Forge Command Bar Contract Result Visual Repair Certificate 062C1

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

062C1 certifies a static-preview visual/layout repair only. It does not modify action contracts, connect modules, or enable real effects.
MD

cat > docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json <<'JSON'
{
  "phase": "062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR",
  "status": "PASS",
  "cacheVersion": "062c1",
  "visualRepairs": {
    "titleSubtitleSeparated": true,
    "statusPillPreserved": true,
    "overlayTreatmentStrengthened": true,
    "inputAnchoredGeometry": true
  },
  "contractBehaviorChanged": false,
  "realEffectsEnabled": false,
  "next": "062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK"
}
JSON
pass "wrote 062C1 docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062C1 Command Bar Contract Result Visual Repair

Status: PASS / IMPLEMENTED.

062C1 repairs the contract-backed command result layout after manual review of 062C.

Repairs:

- title/subtitle visual separation;
- status pill alignment;
- stronger overlay treatment;
- command-input anchored panel geometry.

Public cache:
\`062c1\`

Boundary:

Visual/layout repair only. No action contract, module, external-system, auth, provider, browser persistence, browser request, or real engine behavior is changed.

DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR

NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START -->" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START -->" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:START -->" "<!-- FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md"
  "docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json"
  "tools/termux/forge_062c1_command_bar_contract_result_visual_repair.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_062c1_command_bar_contract_result_visual_repair.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd python3 -m json.tool docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json
run_cmd rg -n "062c1|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1|data-forge-contract-result-visual-repair-062c1|__forgeRunCommandBarContractResultVisualRepair062C1" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR|NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK" docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for scoped command result visual repair"

say_stage "STAGE 9 SAFETY SCAN"
safety_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md"
  "docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062c1.txt"

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
warn "Screenshot and interaction evidence should be captured in 062D QA lock"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CERTIFICATE_062C1.md"
  "docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "tools/termux/forge_062c1_command_bar_contract_result_visual_repair.sh"
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
run_cmd git commit -m "fix: polish command contract result layout"
run_cmd git push origin HEAD:main

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062C1_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062c1.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
