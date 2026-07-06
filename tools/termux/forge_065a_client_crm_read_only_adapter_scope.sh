#!/usr/bin/env bash
set -euo pipefail

PHASE="065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE"
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
  local rollback="$BACKUP_DIR/rollback-065a.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").065a.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md"
restore_or_archive "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md"
restore_or_archive "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md"
restore_or_archive "docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json"
restore_or_archive "tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh"

echo "rollback 065A complete"
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
printf "MODE=client CRM read-only adapter scope documentation\n"
printf "BOUNDARY=docs/scope only; no UI mutation; no backend connection; no CRM write; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 065A over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
  "docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json"
  "docs/architecture/source-truth/FORGE_BACKEND_MODULE_OWNERSHIP_MAP_064B.md"
  "docs/architecture/source-truth/FORGE_BACKEND_DOMAIN_CONTRACTS_SCOPE_064C.md"
  "docs/architecture/source-truth/FORGE_BACKEND_READ_MODEL_CONTRACTS_SCOPE_064D.md"
  "docs/architecture/source-truth/FORGE_BACKEND_APPROVAL_AND_AUDIT_CONTRACTS_SCOPE_064E.md"
  "docs/architecture/source-truth/FORGE_BACKEND_API_AND_ADAPTER_BOUNDARY_SCOPE_064F.md"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/065a-client-crm-read-only-adapter-scope-$(date +%Y%m%d_%H%M%S)"
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
cp "$SCRIPT_SOURCE" "tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md <<'MD'
# Forge Client CRM Read-Only Adapter Scope 065A

Status: SCOPED

Date: 2026-07-06

Phase:
`065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE`

Base:
`064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK`

## Purpose

065A scopes the first Client CRM read-only adapter boundary after the read-only backend adapter dry run was locked.

This is a design/scope phase only. It does not connect a backend, read a real CRM, write a CRM record, authenticate a user, access secrets, call providers, mutate UI, persist browser data, or run a real engine.

## Adapter Identity

Adapter id:
`forge.client_crm.read_only.adapter.v1`

Adapter mode:
`read_only`

Route class:
`read_only`

Domain:
`client_crm`

First route candidate:
`forge.api.read.client_crm.list.v1`

Second route candidate:
`forge.api.read.client_crm.detail.v1`

## Allowed Reads

The adapter may eventually read:

- client id;
- display name;
- segment;
- relationship owner;
- contact readiness state;
- last interaction date;
- follow-up risk flag;
- policy summary references;
- opportunity summary references;
- source evidence ids;
- freshness metadata.

## Forbidden Fields

The first read-only adapter must not expose:

- raw secrets;
- full medical detail;
- payment instrument data;
- private document bodies;
- unredacted identity documents;
- provider tokens;
- internal credentials;
- unsupported inferred facts.

## Forbidden Effects

The adapter must not:

- create clients;
- update clients;
- delete clients;
- merge clients;
- create tasks;
- create calendar events;
- send messages;
- create quotes;
- update policies;
- call external providers;
- persist browser state;
- execute actions.

## Canonical Read Envelope

Every read must return the backend read model envelope from 064D:

```text
readModelId
schemaVersion
domainId
sourceOfTruth
sourceEvidence
generatedAt
freshness
capabilities
approvalContext
entities
relationships
metrics
emptyState
errors
blockedEffects
audit
uiProjection
```

## Client Entity Shape

The first client entity shape is:

```text
entityType
entityId
displayName
status
segment
ownerId
ownerName
contactReadiness
lastInteractionAt
followupRisk
policyRefs
opportunityRefs
sourceEvidence
freshness
```

## Empty States

The adapter must distinguish:

- `no_records`;
- `not_connected`;
- `permission_blocked`;
- `source_unavailable`;
- `filter_no_match`;
- `pending_sync`;
- `preview_placeholder`.

## Error Model

The adapter must map errors into safe backend envelopes:

- `CLIENT_CRM_SOURCE_UNAVAILABLE`;
- `CLIENT_CRM_PERMISSION_BLOCKED`;
- `CLIENT_CRM_SCHEMA_MISMATCH`;
- `CLIENT_CRM_STALE_SOURCE`;
- `CLIENT_CRM_NOT_MODELED`;
- `CLIENT_CRM_UNSAFE_FIELD_BLOCKED`.

## Capability Requirements

Required capabilities:

- `client.read.preview`;
- `client.read.summary`;
- `client.read.detail`;

Explicitly not granted:

- `client.write`;
- `client.merge`;
- `client.delete`;
- `provider.call`;
- `message.send`;
- `calendar.create`.

## Audit Events

The adapter must emit audit-shaped events:

- `read_model_used`;
- `stale_source_detected`;
- `capability_denied`;
- `unsafe_field_blocked`;
- `source_unavailable`;

No write audit event may be emitted by this adapter.

## Freshness Policy

Allowed freshness statuses:

- `fresh`;
- `possibly_stale`;
- `stale`;
- `source_unavailable`;
- `not_connected`;
- `preview_static`.

Any non-fresh data must be visible in the envelope and must not silently drive a recommended action.

## First Implementation Constraint

The first implementation after this scope must use one of:

- local static fixture;
- committed non-sensitive sample fixture;
- generated fixture with no personal data;
- read-only adapter mock.

It must not connect to a production CRM or provider.

## Decision

DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION
MD

cat > docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md <<'MD'
# Forge Client CRM Read-Only Adapter Scope Evidence 065A

Phase:
`065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE`

Status:
PASS

Base:
`064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK`

## Evidence Summary

065A scopes the first Client CRM read-only adapter boundary.

Scoped:

- adapter identity;
- allowed reads;
- forbidden fields;
- forbidden effects;
- canonical read envelope;
- client entity shape;
- empty states;
- error model;
- capabilities;
- audit events;
- freshness policy;
- first implementation constraint.

No UI, backend, CRM write, calendar, delivery, auth, provider, storage, or real engine behavior was connected.

## Result

DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION
MD

cat > docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md <<'MD'
# Forge Client CRM Read-Only Adapter Scope Certificate 065A

DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION

Certified boundary:

- docs/scope only;
- no UI mutation;
- no backend connection;
- no CRM write;
- no calendar creation;
- no communication delivery;
- no auth implementation;
- no provider execution;
- no browser persistence;
- no real engine execution.
MD

cat > docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json <<'JSON'
{
  "phase": "065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE",
  "status": "PASS",
  "basePhase": "064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK",
  "adapter": {
    "adapterId": "forge.client_crm.read_only.adapter.v1",
    "adapterMode": "read_only",
    "routeClass": "read_only",
    "domainId": "client_crm"
  },
  "routesScoped": [
    "forge.api.read.client_crm.list.v1",
    "forge.api.read.client_crm.detail.v1"
  ],
  "allowedReads": [
    "client_id",
    "display_name",
    "segment",
    "relationship_owner",
    "contact_readiness",
    "last_interaction_date",
    "followup_risk",
    "policy_summary_refs",
    "opportunity_summary_refs",
    "source_evidence_ids",
    "freshness_metadata"
  ],
  "forbiddenEffects": [
    "client_create",
    "client_update",
    "client_delete",
    "client_merge",
    "task_create",
    "calendar_create",
    "message_send",
    "quote_create",
    "policy_update",
    "provider_call",
    "browser_persistence",
    "action_execution"
  ],
  "firstImplementationConstraint": [
    "local_static_fixture",
    "non_sensitive_sample_fixture",
    "generated_fixture",
    "read_only_adapter_mock"
  ],
  "scopeOnly": true,
  "uiMutation": false,
  "backendConnection": false,
  "crmWrite": false,
  "realEffectsEnabled": false,
  "next": "065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION"
}
JSON

pass "wrote 065A docs and audit json"

say_stage "STAGE 5 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 065A Client CRM Read-Only Adapter Scope

065A scopes the first Client CRM read-only adapter boundary after the read-only backend adapter decision lock.

Adapter:
`forge.client_crm.read_only.adapter.v1`

Mode:
`read_only`

Scoped:

- allowed client summary/detail reads;
- forbidden sensitive fields;
- forbidden effects;
- canonical read envelope;
- client entity shape;
- empty states;
- safe error model;
- capabilities;
- audit events;
- freshness policy;
- first implementation constraint.

DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION
MD
)

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:START -->" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:START -->" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:START -->" "<!-- FORGE:065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 6 NORMALIZE FILES"
changed_files=(
  "docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md"
  "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md"
  "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md"
  "docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 7 VALIDATION"
run_cmd bash -n tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh
run_cmd python3 -m json.tool docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json
run_cmd rg -n "DECISION=PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE|NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION|forge.client_crm.read_only.adapter.v1|client.read.summary|CLIENT_CRM_SOURCE_UNAVAILABLE" \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md \
  docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for documentation-only Client CRM read-only adapter scope"

say_stage "STAGE 8 SAFETY SCAN"
if rg -n "crmWrite: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|browserPersistence: true|realEngineExecution: true|realEffectsEnabled\": true|backendConnection\": true|\"crmWrite\": true|\"realEffectsAllowed\": true|\"secretAccess\": true" \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md \
  docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md; then
  fail "safety scan found forbidden enabled-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 9 STAGE AUTHORIZED FILES"
git add \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md \
  docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh

run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
cat > "$expected" <<'EOF'
FORGE_MASTER_BUILD_TREE.md
docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md
docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_065A.md
docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_CERTIFICATE_065A.md
docs/evidence/forge-client-crm-read-only-adapter-scope-audit-065a.json
docs/roadmap/FORGE_ROADMAP_LOCK_001.md
tools/termux/forge_065a_client_crm_read_only_adapter_scope.sh
EOF
git diff --cached --name-only > "$actual"
if diff -u "$expected" "$actual"; then
  pass "only authorized files staged"
else
  fail "unexpected staged files"
fi
run_cmd git diff --cached --check

say_stage "STAGE 10 COMMIT PUSH"
run_cmd git commit -m "docs: scope client CRM read-only adapter"
run_cmd git push origin HEAD:main

say_stage "STAGE 11 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-065a.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
