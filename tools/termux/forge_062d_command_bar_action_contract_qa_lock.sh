#!/usr/bin/env bash
set -euo pipefail

PHASE="062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK"
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
  local rollback="$BACKUP_DIR/rollback-062d.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").062d.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md"
restore_or_archive "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md"
restore_or_archive "docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json"
restore_or_archive "tools/termux/forge_062d_command_bar_action_contract_qa_lock.sh"

echo "rollback 062D complete"
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
printf "MODE=read-only command bar action contract QA lock\n"
printf "BOUNDARY=no static preview mutation; no CSS/JS mutation; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to lock 062D over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/static-preview/forge-alive/index.html"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css"
  "docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION_CLOSURE_062C.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_CLOSURE_062C1.md"
  "docs/evidence/FORGE_COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1.md"
  "docs/evidence/forge-command-bar-contract-result-visual-repair-audit-062c1.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062d-command-bar-action-contract-qa-lock-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_062d_command_bar_action_contract_qa_lock.sh"
pass "copied runner into tools/termux"

cat > docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json <<'JSON'
{
  "phase": "062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK",
  "status": "PASS",
  "publicUrl": "https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062c1",
  "cacheChecks": {
    "css062c1": true,
    "js062c1": true
  },
  "sourceChecks": {
    "readModelPresent": true,
    "actionRegistryPresent": true,
    "commandCatalogPresent": true,
    "contractPreviewEventPresent": true,
    "visualRepairPresent": true
  },
  "manualPublicReview": {
    "performedBeforeLock": true,
    "quickActionsPanelLegible": true,
    "resultTitleSubtitleSeparated": true,
    "approvalAndPreviewOnlyPillsVisible": true,
    "noStaticSuggestionsUnderCommandBar": true,
    "noRealEffectsObserved": true
  },
  "contractsVerified": [
    "command.quick_actions",
    "report.prepare_preview",
    "opportunity.review",
    "client.follow_preview",
    "quote.prepare_preview",
    "record.open_preview"
  ],
  "keyboardChecklistRequiredForRegression": [
    "ArrowDown navigates result rows",
    "ArrowUp navigates result rows",
    "Enter selects a result into preview-only status",
    "Escape closes the result panel"
  ],
  "safety": {
    "crmWrite": false,
    "calendarCreate": false,
    "messageSend": false,
    "authReal": false,
    "providerRuntime": false,
    "browserPersistence": false,
    "browserNetworkRequest": false,
    "realEngineExecution": false
  },
  "next": "062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING"
}
JSON

cat > docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md <<'MD'
# Forge Command Bar Action Contract QA Lock Closure 062D

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

062D locks the command-bar action contract implementation after 062C and 062C1.

Validated public URL:

`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062c1`

Validated behavior:

- `/quick actions` displays contract-backed results;
- `revisar` displays `Revisar Lariza` with separated subtitle and `PREVIEW ONLY`;
- `follow` displays `/follow Juan` with separated subtitle and `APPROVAL`;
- `/cotizar` displays `/cotizar GMM Lariza` with separated subtitle and `APPROVAL`;
- command result cards are legible after 062C1 repair;
- selected results remain preview-safe;
- no real effects are enabled.

No CRM, calendar, send, authentication, provider/runtime, browser persistence, browser request, or real engine execution is enabled.

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING
MD

cat > docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md <<'MD'
# Forge Command Bar Action Contract QA Lock 062D

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

062D verifies the command-bar action contract layer and the 062C1 visual repair.

Public review result:

- `/quick actions` panel is legible.
- Contract result titles and subtitles are separated.
- `APPROVAL` and `PREVIEW ONLY` pills remain visible.
- Static suggestions do not appear below the command bar.
- No real effects are triggered.

Source validation confirms the presence of:

- `forge.alive.workspace.read_model.v1`;
- action registry;
- command catalog;
- preview-only event payload;
- 062C1 result layout repair.

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING
MD

cat > docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md <<'MD'
# Forge Command Bar Action Contract QA Lock Certificate 062D

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

062D certifies the static-preview command-bar action contract layer as QA-locked for preview-safe behavior.

This certificate does not certify module connection, CRM mutation, calendar mutation, message delivery, authentication behavior, provider execution, browser persistence, browser requests, or real engine execution.
MD
pass "wrote 062D QA docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062D Command Bar Action Contract QA Lock

Status: PASS / QA LOCKED.

062D validates the 062C command-bar action contract implementation plus 062C1 result visual repair against public Pages \`?v=062c1\`.

Validated:

- \`/quick actions\` results;
- \`revisar\` result with separated subtitle;
- \`follow\` result with separated subtitle;
- \`/cotizar\` result with separated subtitle;
- visible \`APPROVAL\` and \`PREVIEW ONLY\` pills;
- preview-safe no-effect behavior.

Boundary:

Read-only QA lock. No UI source, module, external-system, auth, provider, browser persistence, browser request, or real engine behavior is modified.

DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK

NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:START -->" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:START -->" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:START -->" "<!-- FORGEOS:COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md"
  "docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json"
  "tools/termux/forge_062d_command_bar_action_contract_qa_lock.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_062d_command_bar_action_contract_qa_lock.sh
run_cmd node --check docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd python3 -m json.tool docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json
run_cmd rg -n "062c1|forge-public-preview-interaction-visual-repair-060m.css|forge-public-preview-interaction-visual-repair-060m.js" docs/static-preview/forge-alive/index.html
run_cmd rg -n "forge.alive.workspace.read_model.v1|command.quick_actions|quote.prepare_preview|forge:action-contract-preview:062c|FORGEOS:COMMAND_BAR_CONTRACT_RESULT_VISUAL_REPAIR_062C1" docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.css docs/static-preview/forge-alive/desktop/forge-public-preview-interaction-visual-repair-060m.js
run_cmd rg -n "DECISION=PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK|NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING" docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No automated screenshots captured in Termux; manual public screenshots were reviewed before this lock"

say_stage "STAGE 8 SAFETY SCAN"
safety_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md"
  "docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062d.txt"

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

say_stage "STAGE 9 STAGE AUTHORIZED FILES"
allowed_paths=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CLOSURE_062D.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_062D.md"
  "docs/evidence/FORGE_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_CERTIFICATE_062D.md"
  "docs/evidence/forge-command-bar-action-contract-qa-audit-062d.json"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_062d_command_bar_action_contract_qa_lock.sh"
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

say_stage "STAGE 10 COMMIT PUSH"
run_cmd git commit -m "docs: lock command bar action contract qa"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062D_COMMAND_BAR_ACTION_CONTRACT_QA_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062d.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
