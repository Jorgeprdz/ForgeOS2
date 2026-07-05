#!/usr/bin/env bash
set -euo pipefail

PHASE="062B_READ_MODEL_UNIFICATION_SCOPE"
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
  local rollback="$BACKUP_DIR/rollback-062b.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").062b.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
restore_or_archive "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
restore_or_archive "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md"
restore_or_archive "docs/evidence/forge-read-model-unification-scope-audit-062b.json"
restore_or_archive "tools/termux/forge_062b_read_model_unification_scope.sh"

echo "rollback 062B complete"
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
printf "MODE=scope unified read model for premium static command preview\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no CRM; no calendar; no send; no auth; no runtime/network/storage; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to scope 062B over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_062A.md"
  "docs/evidence/FORGE_ACTION_CONTRACTS_SCOPE_CERTIFICATE_062A.md"
  "docs/evidence/forge-action-contracts-scope-audit-062a.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/062b-read-model-unification-scope-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_062b_read_model_unification_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md <<'MD'
# Forge Read Model Unification Scope 062B

Status: SCOPED

Date: 2026-07-05

Phase:
`062B_READ_MODEL_UNIFICATION_SCOPE`

Base:
`062A_ACTION_CONTRACTS_SCOPE`

## Purpose

062B defines the unified read model needed to feed Forge Alive's dashboard, command bar, opportunity table, risk surfaces, and preview-safe action contracts from a single coherent source.

This phase is documentation and scope only. It does not connect live modules, change the static preview, execute actions, or create provider behavior.

## Read Model Name

`forge.alive.workspace.read_model.v1`

## Design Goals

- One source shape feeds metrics, opportunities, risk, command results, and action availability.
- Action contracts from 062A are exposed through stable identifiers.
- UI labels and command-bar suggestions derive from the same available action list.
- Blocked states explain missing permissions, missing source data, or preview-only boundaries.
- The model can be produced by local dry-run data before any live module connection.
- The model can later be backed by real modules without changing UI contracts.

## Top-Level Shape

Required top-level sections:

- `workspace`
- `previewPolicy`
- `metrics`
- `riskSummary`
- `opportunities`
- `actionRegistry`
- `commandCatalog`
- `capabilities`
- `blockedReasons`
- `sourceEvidence`

## `workspace`

Purpose:

Identifies the current command workspace context.

Required fields:

- `workspaceId`
- `workspaceName`
- `surface`
- `mode`
- `ownerDisplayName`
- `lastPreparedAt`

Allowed mode values:

- `static_preview`
- `dry_run`
- `connected_preview`

062B only scopes `static_preview` and `dry_run`.

## `previewPolicy`

Purpose:

Declares global preview boundaries for every action.

Required fields:

- `requiresHumanApproval`
- `externalEffectsAllowed`
- `recordMutationAllowed`
- `scheduleMutationAllowed`
- `messageDeliveryAllowed`
- `providerExecutionAllowed`

062B expected values:

- approval required;
- external effects disabled;
- record mutation disabled;
- schedule mutation disabled;
- message delivery disabled;
- provider execution disabled.

## `metrics`

Purpose:

Feeds KPI cards and dashboard summaries.

Required fields:

- `monthlyGoalProbability`
- `expectedProduction`
- `gapToGoal`
- `followupRiskCount`
- `currency`
- `asOf`

Rules:

- Numeric values must be display-ready and machine-readable.
- Currency formatting must not be hardcoded in command contracts.
- `asOf` must indicate the source snapshot date or dry-run fixture date.

## `riskSummary`

Purpose:

Feeds the primary decision card and Alfred recommendation surfaces.

Required fields:

- `riskId`
- `severity`
- `headline`
- `summary`
- `recommendedActionId`
- `affectedOpportunityIds`
- `approvalRequired`

Allowed severity values:

- `low`
- `medium`
- `high`
- `blocked`

## `opportunities`

Purpose:

Feeds the table and row-level action contracts.

Required row fields:

- `opportunityId`
- `clientId`
- `clientName`
- `lineOfBusiness`
- `stage`
- `probability`
- `lastContactLabel`
- `lastContactDate`
- `nextActionLabel`
- `nextActionDate`
- `riskTags`
- `availableActionIds`

Rules:

- Every row action button must reference `availableActionIds`.
- Every command result targeting a row must reference `opportunityId` or `clientId`.
- Missing row identity must produce `blocked`.

## `actionRegistry`

Purpose:

Defines the canonical action contracts available to UI buttons and command results.

Required fields per action:

- `actionId`
- `label`
- `aliases`
- `contractStatus`
- `sourceModule`
- `requiresRow`
- `requiresHumanApproval`
- `previewOnly`
- `blockedReasonIds`

Action ids scoped from 062A:

- `command.quick_actions`
- `report.prepare_preview`
- `opportunity.review`
- `client.follow_preview`
- `quote.prepare_preview`
- `record.open_preview`

Allowed `contractStatus` values:

- `idle`
- `preview_only`
- `prepared`
- `needs_approval`
- `blocked`
- `failed`

## `commandCatalog`

Purpose:

Feeds command-bar search results without reading static UI text as data.

Required fields per result:

- `commandId`
- `actionId`
- `title`
- `subtitle`
- `tokens`
- `targetType`
- `targetId`
- `previewPayloadShape`

Rules:

- `/quick actions` lists available preview-safe commands.
- Free text must resolve to known `tokens` before showing a contract result.
- A command result cannot bypass action registry constraints.

## `capabilities`

Purpose:

Explains what the current user/session can preview.

Required fields:

- `canPreviewReport`
- `canReviewOpportunity`
- `canPrepareFollow`
- `canPrepareQuote`
- `canOpenRecord`
- `canRequestRealAction`

062B expected value for `canRequestRealAction`:

`false`

## `blockedReasons`

Purpose:

Provides reusable explanations for blocked action states.

Required fields per reason:

- `reasonId`
- `label`
- `message`
- `recoverable`
- `requiredScope`

Expected baseline reason ids:

- `preview_only_boundary`
- `missing_row_identity`
- `missing_read_model_source`
- `approval_required`
- `capability_disabled`
- `module_not_connected`

## `sourceEvidence`

Purpose:

Tracks what produced the read model.

Required fields:

- `sourceType`
- `sourcePath`
- `sourceCommit`
- `fixtureVersion`
- `generatedAt`

Allowed source types for this stage:

- `repo_fixture`
- `dry_run_audit`
- `static_preview_fixture`

## Acceptance Criteria For 062C

062C can proceed only if the implementation uses or simulates this unified read model shape to:

- render command-bar results from `commandCatalog`;
- resolve action ids through `actionRegistry`;
- preserve preview-only policy from `previewPolicy`;
- map row buttons to `availableActionIds`;
- return `blocked` with a known reason when data is missing;
- keep all real effects disabled.

## Explicit Non-Scope

062B does not authorize:

- Static preview UI mutation.
- CSS, JavaScript, or HTML mutation.
- Live module connection.
- Record mutation.
- Schedule mutation.
- Message delivery.
- Authentication behavior.
- Provider/runtime activation.
- Browser persistence.
- Browser requests.
- Real engine execution.

## Final Decision

062B approves the unified read model scope needed before command-bar action contract implementation.

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION
MD

cat > docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md <<'MD'
# Forge Read Model Unification Scope 062B

Status: PASS

Date: 2026-07-05

Mode:
Scope/decision only

## Result

062B defines `forge.alive.workspace.read_model.v1` as the unified read model shape for Forge Alive after action contracts were scoped in 062A.

## Required Sections

- `workspace`
- `previewPolicy`
- `metrics`
- `riskSummary`
- `opportunities`
- `actionRegistry`
- `commandCatalog`
- `capabilities`
- `blockedReasons`
- `sourceEvidence`

## Action Registry Coverage

- `command.quick_actions`
- `report.prepare_preview`
- `opportunity.review`
- `client.follow_preview`
- `quote.prepare_preview`
- `record.open_preview`

## Baseline Blocked Reasons

- `preview_only_boundary`
- `missing_row_identity`
- `missing_read_model_source`
- `approval_required`
- `capability_disabled`
- `module_not_connected`

## Boundary

062B defines the source shape only. It does not change the UI, connect modules, or enable real effects.

## Decision

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION
MD

cat > docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md <<'MD'
# Forge Read Model Unification Scope Certificate 062B

Status: CERTIFIED

Date: 2026-07-05

Phase:
`062B_READ_MODEL_UNIFICATION_SCOPE`

## Certification

062B certifies that Forge Alive has a scoped unified read model shape ready for command-bar action contract implementation.

This certificate covers scope only. It does not certify a live module integration or real action execution.

## Certified Model Name

`forge.alive.workspace.read_model.v1`

## Certified Source Coverage

- Workspace context.
- Preview policy.
- Dashboard metrics.
- Risk summary.
- Opportunity rows.
- Action registry.
- Command catalog.
- Capability flags.
- Blocked-state reasons.
- Source evidence.

## Boundary Certification

No UI source, style, script, runtime adapter, provider behavior, customer record behavior, schedule behavior, message behavior, authentication behavior, browser persistence behavior, browser request behavior, or real engine behavior is modified by this phase.

## Decision Token

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION
MD

cat > docs/evidence/forge-read-model-unification-scope-audit-062b.json <<'JSON'
{
  "phase": "062B_READ_MODEL_UNIFICATION_SCOPE",
  "status": "PASS",
  "modelName": "forge.alive.workspace.read_model.v1",
  "basePhase": "062A_ACTION_CONTRACTS_SCOPE",
  "sectionsScoped": [
    "workspace",
    "previewPolicy",
    "metrics",
    "riskSummary",
    "opportunities",
    "actionRegistry",
    "commandCatalog",
    "capabilities",
    "blockedReasons",
    "sourceEvidence"
  ],
  "actionsCovered": [
    "command.quick_actions",
    "report.prepare_preview",
    "opportunity.review",
    "client.follow_preview",
    "quote.prepare_preview",
    "record.open_preview"
  ],
  "scopeOnly": true,
  "uiMutation": false,
  "moduleConnection": false,
  "realActionExecution": false,
  "next": "062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION"
}
JSON
pass "wrote 062B scope docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
sync_body="## 062B Read Model Unification Scope

Status: PASS / SCOPED.

062B defines \`forge.alive.workspace.read_model.v1\` as the single source shape for Forge Alive command workspace data after 062A action contracts.

Scoped sections:

- \`workspace\`
- \`previewPolicy\`
- \`metrics\`
- \`riskSummary\`
- \`opportunities\`
- \`actionRegistry\`
- \`commandCatalog\`
- \`capabilities\`
- \`blockedReasons\`
- \`sourceEvidence\`

Boundary:

Scope/decision only. No UI, module, external-system, auth, provider, browser persistence, browser request, or real engine behavior is modified.

DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE

NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION"

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:START -->" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:END -->" "$sync_body"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:START -->" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:END -->" "$sync_body"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:START -->" "<!-- FORGEOS:READ_MODEL_UNIFICATION_SCOPE_062B:END -->" "$sync_body"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md"
  "docs/evidence/forge-read-model-unification-scope-audit-062b.json"
  "tools/termux/forge_062b_read_model_unification_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_062b_read_model_unification_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-read-model-unification-scope-audit-062b.json
run_cmd rg -n "DECISION=PASS_062B_READ_MODEL_UNIFICATION_SCOPE|NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION|forge.alive.workspace.read_model.v1|actionRegistry|commandCatalog" docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md docs/evidence/forge-read-model-unification-scope-audit-062b.json FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only read model scope"

say_stage "STAGE 8 SAFETY SCAN"
safety_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md"
  "docs/evidence/forge-read-model-unification-scope-audit-062b.json"
)
safety_scan_file="$BACKUP_DIR/safety-scan-062b.txt"

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
  "docs/architecture/source-truth/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_062B.md"
  "docs/evidence/FORGE_READ_MODEL_UNIFICATION_SCOPE_CERTIFICATE_062B.md"
  "docs/evidence/forge-read-model-unification-scope-audit-062b.json"
  "tools/termux/forge_062b_read_model_unification_scope.sh"
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
run_cmd git commit -m "docs: scope read model unification"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_062B_READ_MODEL_UNIFICATION_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=062C_COMMAND_BAR_ACTION_CONTRACT_IMPLEMENTATION\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-062b.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
