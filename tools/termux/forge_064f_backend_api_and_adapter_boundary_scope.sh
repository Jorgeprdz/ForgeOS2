#!/usr/bin/env bash
set -euo pipefail

PHASE="064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE"
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
  local rollback="$BACKUP_DIR/rollback-064f.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").064f.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md"
restore_or_archive "docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md"
restore_or_archive "docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json"
restore_or_archive "tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh"

echo "rollback 064F complete"
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
printf "MODE=backend API and adapter boundary scope documentation\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no backend connection; no CRM; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 064F over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/evidence/forge-backend-approval-and-audit-contracts-scope-audit-064e.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/064f-backend-api-and-adapter-boundary-scope-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 APPLY DOCS"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md <<'MD'
# Forge Backend API And Adapter Boundary Scope 064F

Status: SCOPED

Date: 2026-07-06

Phase:
`064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE`

Base:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

## Purpose

064F scopes the backend API and adapter boundary required before Forge can connect real modules.

064B mapped module ownership. 064C scoped domain contracts. 064D scoped read model contracts. 064E scoped approval and audit contracts. 064F defines the route, adapter, provider, secret, auth, retry, and dry-run boundaries that must exist before any backend connection.

This phase is documentation and scope only. It does not implement backend routes, connect adapters, execute providers, read secrets, authenticate users, mutate UI, write CRM records, create calendar items, deliver messages, or run a real engine.

## Global API Boundary Rule

No UI surface may call a real backend route until the target module has:

- domain contract;
- read model contract;
- approval and audit contract;
- capability rule;
- route contract;
- adapter boundary;
- error envelope;
- freshness policy;
- idempotency rule;
- blocked-effect policy;
- QA evidence.

## Backend API Envelope

Every future backend route must use a canonical envelope:

```text
requestId
schemaVersion
routeId
routeClass
domainId
actionId
actor
tenant
capabilities
readModelSnapshotId
approvalRequestId
idempotencyKey
dryRun
previewOnly
payload
sourceEvidence
clientContext
```

Every response must use:

```text
requestId
schemaVersion
routeId
status
result
readModelDelta
auditEventId
approvalRequestId
blockedReasons
errors
freshness
sourceEvidence
realEffectsAllowed
```

## Route Classes

Future routes must be grouped into explicit classes:

- `read_only`: may read modeled backend truth and return read envelopes.
- `preview_prepare`: may prepare preview payloads with no real effect.
- `approval_request`: may create an approval request artifact only after 064E rules are implemented.
- `approved_execute`: reserved for future approved execution after all gates pass.
- `audit_read`: may read immutable audit/event history.
- `health_check`: may report service readiness without sensitive data.

## Adapter Modes

Every adapter must declare one mode:

- `disabled`: no calls allowed.
- `read_only`: non-mutating reads only.
- `preview_only`: prepares payloads, no write or provider effect.
- `approval_required`: can propose an effect but cannot execute it.
- `execute_approved`: reserved for future explicit approved execution.

Default mode is always `disabled`.

## Adapter Boundary Contract

Every future adapter must define:

```text
adapterId
adapterType
domainId
owner
mode
capabilityRequired
sourceOfTruth
authBoundary
secretBoundary
rateLimitPolicy
retryPolicy
idempotencyPolicy
freshnessPolicy
errorMap
auditEvents
blockedEffects
qaEvidence
```

## Provider Boundary

Provider calls remain blocked until a provider registry exists. A provider adapter must never be called directly by UI code.

Provider boundary requirements:

- provider id;
- tenant/account binding;
- allowed route classes;
- allowed adapter modes;
- secret reference only, never raw secret in logs or docs;
- rate limit;
- retry class;
- idempotency behavior;
- audit event mapping;
- failure taxonomy;
- rollback or remediation note.

## Secret Boundary

064F does not create secrets and does not read secrets.

Future secret handling must require:

- named secret reference;
- no secret value in repo;
- no secret value in audit body;
- no secret value in screenshots;
- least-privilege provider capability;
- rotation policy;
- missing-secret error envelope.

## Auth Boundary

064F does not implement auth.

Future backend auth must separate:

- actor identity;
- tenant identity;
- role;
- capability;
- approval authority;
- provider account access;
- session freshness;
- impersonation prohibition.

## Retry And Idempotency

All non-read requests must carry an idempotency key before any future execution path can exist.

Retry policy classes:

- `no_retry`;
- `safe_read_retry`;
- `preview_retry`;
- `approval_artifact_retry`;
- `manual_recovery_required`.

Execution retries remain blocked until approved execution is separately designed.

## No-Effect Dry Run Rule

The first backend adapter dry run after this scope must be read-only or preview-only.

It must prove:

- no CRM write;
- no calendar creation;
- no message delivery;
- no auth mutation;
- no provider effect;
- no browser storage dependency;
- no real engine execution;
- audit and read model envelopes are produced.

## Domain Route Matrix

| Domain | First Allowed Route Class | First Adapter Mode | Blocked Effects |
|---|---|---|---|
| `client_crm` | `read_only` | `read_only` | client create/update/delete |
| `opportunity_pipeline` | `read_only` | `read_only` | stage mutation, opportunity create/update |
| `quote` | `preview_prepare` | `preview_only` | official quote issue, carrier call |
| `policy` | `read_only` | `read_only` | policy update, endorsement, renewal action |
| `document_evidence` | `read_only` | `read_only` | upload/storage truth, OCR persistence |
| `followup_task` | `preview_prepare` | `preview_only` | task create/update |
| `calendar_intent` | `preview_prepare` | `preview_only` | calendar event create/update |
| `communication` | `preview_prepare` | `preview_only` | delivery/send |
| `profile_auth` | `read_only` | `disabled` | auth/session/profile mutation |
| `settings_preferences` | `read_only` | `disabled` | preference persistence |
| `command_action_router` | `preview_prepare` | `preview_only` | command execution |
| `approval_audit` | `audit_read` | `read_only` | audit mutation outside contract |
| `capability_permission` | `read_only` | `read_only` | policy override |
| `backend_api_boundary` | `health_check` | `disabled` | route execution |
| `error_empty_state` | `read_only` | `read_only` | none |
| `sync_freshness` | `read_only` | `read_only` | sync write queue |

## First Safe Dry Run Candidate

The recommended next dry run is:

`064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN`

Allowed candidate:

- route class: `read_only`;
- adapter mode: `read_only`;
- domain: one of `client_crm`, `policy`, `capability_permission`, or `sync_freshness`;
- source: local/static/non-sensitive adapter only unless a real backend source is separately approved and scoped;
- output: backend read envelope plus audit-shaped event;
- effects: all real effects disabled.

## Explicit Non-Scope

064F does not:

- implement a backend server;
- define final REST/GraphQL endpoints;
- connect CRM;
- create calendar events;
- deliver communications;
- authenticate users;
- read provider secrets;
- call external providers;
- mutate browser storage;
- execute actions;
- replace approval/audit scope;
- replace read model scope.

## Decision

DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE

NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN
MD

cat > docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md <<'MD'
# Forge Backend API And Adapter Boundary Scope Evidence 064F

Phase:
`064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE`

Status:
PASS

Base:
`064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE`

## Evidence Summary

064F scopes the backend API and adapter boundary for future real module connection.

Scoped contracts:

- backend API envelope;
- route classes;
- adapter modes;
- adapter boundary;
- provider boundary;
- secret boundary;
- auth boundary;
- retry and idempotency;
- no-effect dry run rule;
- domain route matrix.

No UI, backend, CRM, calendar, delivery, auth, provider, storage, or real engine behavior was connected.

## Result

DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE

NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN
MD

cat > docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md <<'MD'
# Forge Backend API And Adapter Boundary Scope Certificate 064F

DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE

NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN

Certified boundary:

- docs/scope only;
- no UI mutation;
- no backend connection;
- no CRM mutation;
- no calendar creation;
- no communication delivery;
- no auth implementation;
- no provider execution;
- no real engine execution.
MD

cat > docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json <<'JSON'
{
  "phase": "064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE",
  "status": "PASS",
  "basePhase": "064E_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE",
  "contractsScoped": [
    "backend_api_envelope",
    "route_boundary",
    "adapter_boundary",
    "provider_boundary",
    "secret_boundary",
    "auth_boundary",
    "retry_idempotency",
    "no_effect_dry_run",
    "domain_route_matrix"
  ],
  "routeClasses": [
    "read_only",
    "preview_prepare",
    "approval_request",
    "approved_execute",
    "audit_read",
    "health_check"
  ],
  "adapterModes": [
    "disabled",
    "read_only",
    "preview_only",
    "approval_required",
    "execute_approved"
  ],
  "defaultAdapterMode": "disabled",
  "firstDryRun": {
    "phase": "064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN",
    "allowedRouteClass": "read_only",
    "allowedAdapterMode": "read_only",
    "realEffectsAllowed": false
  },
  "scopeOnly": true,
  "uiMutation": false,
  "backendConnection": false,
  "realEffectsEnabled": false,
  "next": "064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN"
}
JSON

pass "wrote 064F docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 064F Backend API And Adapter Boundary Scope

064F scopes the backend API and adapter boundary required before Forge can connect real modules.

Contracts scoped:

- backend API envelope;
- route boundary;
- adapter boundary;
- provider boundary;
- secret boundary;
- auth boundary;
- retry and idempotency;
- no-effect dry run;
- domain route matrix.

Default adapter mode is `disabled`.

First future dry run must be read-only or preview-only with all real effects disabled.

DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE

NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN
MD
)

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:START -->" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:END -->" "$SYNC_BODY"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:START -->" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:END -->" "$SYNC_BODY"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:START -->" "<!-- FORGE:064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md"
  "docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md"
  "docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md"
  "docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json
run_cmd rg -n "DECISION=PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE|NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN|backend_api_envelope|adapterModes|read_only" \
  docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md \
  docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only backend API/adapter boundary scope"

say_stage "STAGE 8 SAFETY SCAN"
if rg -n "crmWrite: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|browserPersistence: true|realEngineExecution: true|realEffectsEnabled\": true|backendConnection\": true" \
  docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md \
  docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md; then
  fail "safety scan found forbidden enabled-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 9 STAGE AUTHORIZED FILES"
git add \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md \
  docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md \
  docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh

run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
cat > "$expected" <<'EOF'
FORGE_MASTER_BUILD_TREE.md
docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md
docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md
docs/evidence/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_CERTIFICATE_064F.md
docs/evidence/forge-backend-api-and-adapter-boundary-scope-audit-064f.json
docs/roadmap/FORGE_ROADMAP_LOCK_001.md
tools/termux/forge_064f_backend_api_and_adapter_boundary_scope.sh
EOF
git diff --cached --name-only > "$actual"
if diff -u "$expected" "$actual"; then
  pass "only authorized files staged"
else
  fail "unexpected staged files"
fi
run_cmd git diff --cached --check

say_stage "STAGE 10 COMMIT PUSH"
run_cmd git commit -m "docs: scope backend API and adapter boundary"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_064F_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-064f.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
