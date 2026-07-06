#!/usr/bin/env bash
set -euo pipefail

PHASE="064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK"
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
  local rollback="$BACKUP_DIR/rollback-064i.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").064i.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
restore_or_archive "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
restore_or_archive "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md"
restore_or_archive "docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json"
restore_or_archive "tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh"

echo "rollback 064I complete"
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
printf "MODE=read-only backend adapter decision lock documentation\n"
printf "BOUNDARY=decision/docs lock only; no UI mutation; no backend connection; no CRM; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 064I over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md"
  "docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json"
  "docs/evidence/forge-read-only-backend-adapter-dry-run-output-064g.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/064i-read-only-backend-adapter-decision-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 VERIFY LOCK INPUTS"
python3 - <<'PY'
import json
from pathlib import Path

qa = json.loads(Path("docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json").read_text())
out = json.loads(Path("docs/evidence/forge-read-only-backend-adapter-dry-run-output-064g.json").read_text())

assert qa["status"] == "PASS"
assert qa["checks"]["routeClassReadOnly"] is True
assert qa["checks"]["adapterModeReadOnly"] is True
assert qa["checks"]["allSafetyFlagsFalse"] is True
assert out["route"]["routeClass"] == "read_only"
assert out["adapter"]["mode"] == "read_only"
assert out["responseEnvelope"]["realEffectsAllowed"] is False
assert out["safety"]["crmWrite"] is False
assert out["safety"]["providerRuntime"] is False

print(json.dumps({
    "status": "PASS",
    "lockedRoute": out["route"]["routeId"],
    "lockedAdapter": out["adapter"]["adapterId"],
    "realEffectsAllowed": out["responseEnvelope"]["realEffectsAllowed"]
}, indent=2))
PY
pass "064H QA inputs verified"

say_stage "STAGE 5 APPLY DECISION DOCS"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md <<'MD'
# Forge Read-Only Backend Adapter Decision Lock 064I

Status: LOCKED

Date: 2026-07-06

Phase:
`064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK`

Base:
`064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK`

Decision:
`READ_ONLY_BACKEND_ADAPTER_DRY_RUN_LOCKED`

## Decision

The first backend adapter dry run is accepted as a local/static read-only proof.

It proves the backend envelope, adapter boundary, read model envelope, audit-shaped event, and safety flags can be represented without enabling any real effect.

## Locked Proof

Route:
`forge.api.read.client_crm.summary.preview_dry_run.v1`

Route class:
`read_only`

Adapter:
`forge.local.static.client_crm.read_only.v1`

Adapter mode:
`read_only`

Domain:
`client_crm`

Freshness:
`preview_static`

Audit event:
`read_model_used`

## Locked Safety Position

The following remain blocked:

- CRM writes;
- calendar creation;
- communication delivery;
- auth/session mutation;
- provider runtime;
- browser persistence;
- real engine execution.

## What This Unlocks

064I unlocks scope work for the first real read-only module adapter boundary.

The next phase may scope a Client CRM read-only adapter, but it must not implement writes or provider execution.

## What Remains Blocked

- Any write-capable adapter;
- calendar event creation;
- message sending;
- auth mutation;
- provider runtime;
- secret access;
- execution after approval;
- CRM source-of-truth mutation.

## Next Phase

`065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE`

## Final

DECISION=PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE
MD

cat > docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md <<'MD'
# Forge Read-Only Backend Adapter Decision Lock Evidence 064I

Phase:
`064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK`

Status:
PASS

Decision:
`READ_ONLY_BACKEND_ADAPTER_DRY_RUN_LOCKED`

## Evidence Summary

064I locks the 064G/064H read-only backend adapter dry run as accepted architecture proof.

Accepted proof:

- route class `read_only`;
- adapter mode `read_only`;
- local static fixture only;
- request envelope and response envelope present;
- read model envelope present;
- audit-shaped event present;
- all real-effect flags remain false.

## Result

DECISION=PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE
MD

cat > docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md <<'MD'
# Forge Read-Only Backend Adapter Decision Lock Certificate 064I

DECISION=PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE

Certified boundary:

- decision/docs lock only;
- no UI mutation;
- no backend connection;
- no CRM mutation;
- no calendar creation;
- no communication delivery;
- no auth implementation;
- no provider execution;
- no browser persistence;
- no real engine execution.
MD

cat > docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json <<'JSON'
{
  "phase": "064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK",
  "status": "PASS",
  "decision": "READ_ONLY_BACKEND_ADAPTER_DRY_RUN_LOCKED",
  "basePhase": "064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK",
  "lockedProof": {
    "routeId": "forge.api.read.client_crm.summary.preview_dry_run.v1",
    "routeClass": "read_only",
    "adapterId": "forge.local.static.client_crm.read_only.v1",
    "adapterMode": "read_only",
    "domainId": "client_crm",
    "freshness": "preview_static",
    "auditEventType": "read_model_used"
  },
  "unlocks": [
    "065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE"
  ],
  "stillBlocked": [
    "crm_write",
    "calendar_create",
    "message_send",
    "auth_mutation",
    "provider_runtime",
    "secret_access",
    "real_engine_execution"
  ],
  "uiMutation": false,
  "backendConnection": false,
  "realEffectsEnabled": false,
  "next": "065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE"
}
JSON

pass "wrote 064I decision docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 064I Read-Only Backend Adapter Decision Lock

064I locks the 064G/064H local/static read-only backend adapter dry run as accepted architecture proof.

Decision:
`READ_ONLY_BACKEND_ADAPTER_DRY_RUN_LOCKED`

Locked proof:

- route `forge.api.read.client_crm.summary.preview_dry_run.v1`;
- route class `read_only`;
- adapter `forge.local.static.client_crm.read_only.v1`;
- adapter mode `read_only`;
- domain `client_crm`;
- freshness `preview_static`;
- audit event `read_model_used`;
- all real-effect flags false.

DECISION=PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE
MD
)

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:START -->" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:START -->" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:START -->" "<!-- FORGE:064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md"
  "docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh
run_cmd python3 -m json.tool docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json
run_cmd rg -n "DECISION=PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK|NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE|READ_ONLY_BACKEND_ADAPTER_DRY_RUN_LOCKED|forge.local.static.client_crm.read_only.v1" \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md \
  docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for read-only backend adapter decision lock"

say_stage "STAGE 9 SAFETY SCAN"
if rg -n "crmWrite: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|browserPersistence: true|realEngineExecution: true|realEffectsEnabled\": true|backendConnection\": true|\"realEffectsAllowed\": true|\"secretAccess\": true" \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md \
  docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md; then
  fail "safety scan found forbidden enabled-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 10 STAGE AUTHORIZED FILES"
git add \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md \
  docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh

run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
cat > "$expected" <<'EOF'
FORGE_MASTER_BUILD_TREE.md
docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md
docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_064I.md
docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_CERTIFICATE_064I.md
docs/evidence/forge-read-only-backend-adapter-decision-audit-064i.json
docs/roadmap/FORGE_ROADMAP_LOCK_001.md
tools/termux/forge_064i_read_only_backend_adapter_decision_lock.sh
EOF
git diff --cached --name-only > "$actual"
if diff -u "$expected" "$actual"; then
  pass "only authorized files staged"
else
  fail "unexpected staged files"
fi
run_cmd git diff --cached --check

say_stage "STAGE 11 COMMIT PUSH"
run_cmd git commit -m "docs: lock read-only backend adapter decision"
run_cmd git push origin HEAD:main

say_stage "STAGE 12 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=065A_CLIENT_CRM_READ_ONLY_ADAPTER_SCOPE\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-064i.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
