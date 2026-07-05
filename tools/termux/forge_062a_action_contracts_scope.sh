#!/usr/bin/env bash
set -euo pipefail

PHASE="062A_ACTION_CONTRACTS_SCOPE"
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
  local rollback="$BACKUP_DIR/rollback-062a.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").062a.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
restore_or_archive "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
restore_or_archive "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md"
restore_or_archive "docs/evidence/forge-action-contracts-scope-audit-062a.json"
restore_or_archive "tools/termux/forge_062a_action_contracts_scope.sh"

echo "rollback 062A complete"
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
printf "MODE=scope action contracts for premium static command preview\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to scope 062A over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_PREMIUM_FINAL_DECISION_LOCK_061I.md"
  "docs/evidence/FORGE_PREMIUM_FINAL_DECISION_LOCK_061I.md"
  "docs/evidence/FORGE_PREMIUM_FINAL_DECISION_LOCK_CERTIFICATE_061I.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062a-action-contracts-scope-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_062a_action_contracts_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md <<'MD'
# Forge Action Contracts Scope 062A

Status: SCOPED

Date: 2026-07-05

Phase:
`062A_ACTION_CONTRACTS_SCOPE`

Base locked state:
`PREMIUM_STATIC_COMMAND_PREVIEW_LOCKED`

Base decision:
`061I_PREMIUM_FINAL_DECISION_LOCK`

## Purpose

062A defines the action-contract layer required after the 9.0/10 premium static command preview lock.

This phase does not connect modules, execute actions, change the visual preview, or alter product behavior. It defines the contract names, preview-safe outcomes, required approval gates, blocked effects, and status vocabulary needed before implementation.

## Contract Principles

- Every visible action must map to a named contract.
- Every contract must produce a preview-safe result before any real effect is possible.
- Real effects remain blocked until a later approved implementation explicitly authorizes them.
- Human approval remains required for any future effect that would touch external systems or business records.
- Command-bar results must reference the same contracts as buttons and table actions.
- Read models must become the source for available actions, not ad hoc DOM text.

## Shared Status Vocabulary

- `idle`: no action is prepared.
- `preview_only`: the UI can show what would happen without performing it.
- `prepared`: a preview payload has been built.
- `needs_approval`: a future real effect would require explicit human approval.
- `blocked`: the action cannot proceed because a boundary, permission, or missing source prevents it.
- `failed`: the preview preparation failed safely.

## Scoped Contracts

### `command.quick_actions`

Visible triggers:

- `/quick actions`
- Command bar idle entry point

Preview-safe outcome:

- Shows available preview-safe actions from the current read model.
- Does not infer unavailable actions from free text.

Required future sources:

- Action registry read model.
- Current workspace context.
- User capability flags.

Blocked effects:

- No external write.
- No message delivery.
- No schedule creation.
- No provider execution.

Acceptance target:

- The command bar can list actions without executing them.
- Selecting an action prepares a safe preview or a blocked state.

### `report.prepare_preview`

Visible triggers:

- `Preparar preview`
- Command result for preparing the current workspace preview

Preview-safe outcome:

- Builds a human-readable preview summary.
- Identifies source rows, assumptions, and required approval.

Required future sources:

- Current dashboard read model.
- Opportunity/risk read model.
- Action registry read model.

Blocked effects:

- No system-of-record mutation.
- No external delivery.
- No calendar write.

Acceptance target:

- A prepared preview clearly states what would happen and what remains blocked.

### `opportunity.review`

Visible triggers:

- `Revisar`
- Row-level review action

Preview-safe outcome:

- Opens or prepares a local review panel for the selected opportunity.
- Shows risk, last contact, next action, and available safe follow-ups.

Required future sources:

- Opportunity row id.
- Client summary read model.
- Risk summary read model.

Blocked effects:

- No customer record update.
- No follow-up creation.
- No outbound communication.

Acceptance target:

- Review action is tied to a stable row identity and can fail safely if the row is missing.

### `client.follow_preview`

Visible triggers:

- `Follow`
- `/follow <client>`

Preview-safe outcome:

- Prepares a follow-up recommendation without creating it.
- Shows target client, reason, suggested timing, and approval requirement.

Required future sources:

- Client read model.
- Opportunity read model.
- Follow-up policy read model.

Blocked effects:

- No task creation.
- No calendar event.
- No message delivery.
- No CRM write.

Acceptance target:

- Follow preview returns `needs_approval` before any future real workflow could proceed.

### `quote.prepare_preview`

Visible triggers:

- `Cotizar`
- `/cotizar`
- Row-level quote action

Preview-safe outcome:

- Prepares a quote workspace preview for the selected client/opportunity.
- Shows missing inputs and approval gate.

Required future sources:

- Client read model.
- Product/quote assumptions read model.
- Opportunity row id.

Blocked effects:

- No quote issuance.
- No document generation outside preview evidence.
- No customer record update.

Acceptance target:

- Quote preview can be prepared or blocked with explicit missing-source reasons.

### `record.open_preview`

Visible triggers:

- `Abrir`
- Row-level open action

Preview-safe outcome:

- Opens or prepares a local static detail view for the selected record.

Required future sources:

- Stable record id.
- Record summary read model.
- Permission/capability flags.

Blocked effects:

- No external navigation to live provider systems.
- No mutation.

Acceptance target:

- Open action remains a preview-detail transition until real routing is scoped.

## Cross-Contract Requirements

- Each contract must expose action id, label, source module, source row id when applicable, preview payload, status, and approval requirement.
- Each blocked state must include a human-readable reason.
- Each prepared state must include enough evidence for review.
- Each contract must be usable from both a visible UI action and a command-bar result.
- Each contract must be testable without external systems.

## Explicit Non-Scope

062A does not authorize:

- Static preview UI mutation.
- CSS, JavaScript, or HTML mutation.
- CRM mutation.
- Calendar mutation.
- Message delivery.
- Authentication behavior.
- Provider/runtime activation.
- Browser persistence.
- Browser requests.
- Real engine execution.

## 062B Recommended Next Scope

062B should define the unified read model that supplies:

- dashboard metrics;
- opportunity rows;
- risk state;
- available action contracts;
- capability flags;
- blocked-state reasons;
- preview-safe command results.

## Final Decision

062A approves the action-contract scope needed before connecting Forge Alive to modules or implementing command-bar contract behavior.

DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE

NEXT=062B_READ_MODEL_UNIFICATION_SCOPE
MD

cat > docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md <<'MD'
# Forge Action Contracts Scope 062A

Status: PASS

Date: 2026-07-05

Mode:
Scope/decision only

## Result

062A defines the preview-safe action contract layer for Forge Alive after the premium static command preview lock.

## Scoped Action Contracts

- `command.quick_actions`
- `report.prepare_preview`
- `opportunity.review`
- `client.follow_preview`
- `quote.prepare_preview`
- `record.open_preview`

## Shared Status Vocabulary

- `idle`
- `preview_only`
- `prepared`
- `needs_approval`
- `blocked`
- `failed`

## Safety Boundary

062A defines contracts only. It does not modify the static preview UI, execute workflows, connect modules, or enable external effects.

## Decision

DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE

NEXT=062B_READ_MODEL_UNIFICATION_SCOPE
MD

cat > docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md <<'MD'
# Forge Action Contracts Scope Certificate 062A

Status: CERTIFIED

Date: 2026-07-05

Phase:
`062A_ACTION_CONTRACTS_SCOPE`

## Certification

062A certifies that Forge Alive is ready to move from premium static command preview into action-contract and read-model design.

This certificate covers scope only. It does not certify module integration, real action execution, authentication behavior, external delivery, or provider behavior.

## Certified Contract Families

- Command entry actions.
- Preview preparation actions.
- Opportunity review actions.
- Follow-up preview actions.
- Quote preview actions.
- Record detail preview actions.

## Boundary Certification

No UI source, style, script, runtime adapter, provider behavior, customer record behavior, schedule behavior, message behavior, authentication behavior, browser persistence behavior, browser request behavior, or real engine behavior is modified by this phase.

## Decision Token

DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE

NEXT=062B_READ_MODEL_UNIFICATION_SCOPE
MD

cat > docs/evidence/forge-action-contracts-scope-audit-062a.json <<'JSON'
{
  "phase": "062A_ACTION_CONTRACTS_SCOPE",
  "status": "PASS",
  "baseDecision": "PREMIUM_STATIC_COMMAND_PREVIEW_LOCKED",
  "baseRating": "9.0 / 10",
  "contractsScoped": [
    "command.quick_actions",
    "report.prepare_preview",
    "opportunity.review",
    "client.follow_preview",
    "quote.prepare_preview",
    "record.open_preview"
  ],
  "statusesScoped": [
    "idle",
    "preview_only",
    "prepared",
    "needs_approval",
    "blocked",
    "failed"
  ],
  "scopeOnly": true,
  "uiMutation": false,
  "moduleConnection": false,
  "realActionExecution": false,
  "next": "062B_READ_MODEL_UNIFICATION_SCOPE"
}
JSON
pass "wrote 062A scope docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062A Action Contracts Scope

Status: PASS / SCOPED.

062A defines the preview-safe action contract layer after \`PREMIUM_STATIC_COMMAND_PREVIEW_LOCKED\`.

Scoped contracts:

- \`command.quick_actions\`
- \`report.prepare_preview\`
- \`opportunity.review\`
- \`client.follow_preview\`
- \`quote.prepare_preview\`
- \`record.open_preview\`

Shared statuses:

- \`idle\`
- \`preview_only\`
- \`prepared\`
- \`needs_approval\`
- \`blocked\`
- \`failed\`

Boundary:

Scope/decision only. No UI, module, external-system, auth, provider, browser persistence, browser request, or real engine behavior is modified.

DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE

NEXT=062B_READ_MODEL_UNIFICATION_SCOPE"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:START -->" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:START -->" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:START -->" "<!-- FORGEOS:ACTION_CONTRACTS_SCOPE_062A:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md"
  "docs/evidence/forge-action-contracts-scope-audit-062a.json"
  "tools/termux/forge_062a_action_contracts_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_062a_action_contracts_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-action-contracts-scope-audit-062a.json
run_cmd rg -n "DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE|NEXT=062B_READ_MODEL_UNIFICATION_SCOPE|command.quick_actions|quote.prepare_preview" docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md docs/evidence/forge-action-contracts-scope-audit-062a.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only action contracts scope"

say_stage "STAGE 8 SAFETY SCAN"
safety_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md"
  "docs/evidence/forge-action-contracts-scope-audit-062a.json"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062a.txt"

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
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md"
  "docs/evidence/forge-action-contracts-scope-audit-062a.json"
  "tools/termux/forge_062a_action_contracts_scope.sh"
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
run_cmd git commit -m "docs: scope action contracts"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062A_ACTION_CONTRACTS_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062B_READ_MODEL_UNIFICATION_SCOPE\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062a.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
