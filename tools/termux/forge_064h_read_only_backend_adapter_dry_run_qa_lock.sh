#!/usr/bin/env bash
set -euo pipefail

PHASE="064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK"
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
  local rollback="$BACKUP_DIR/rollback-064h.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").064h.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md"
restore_or_archive "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md"
restore_or_archive "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md"
restore_or_archive "docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json"
restore_or_archive "tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh"

echo "rollback 064H complete"
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
printf "MODE=read-only backend adapter dry run QA lock\n"
printf "BOUNDARY=QA/docs lock only; no UI mutation; no backend connection; no CRM; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 064H over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_CLOSURE_064G.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_064G.md"
  "docs/evidence/forge-read-only-backend-adapter-dry-run-audit-064g.json"
  "docs/evidence/forge-read-only-backend-adapter-dry-run-output-064g.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/064h-read-only-backend-adapter-dry-run-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 SEMANTIC QA"
python3 - <<'PY'
import json
from pathlib import Path

audit = json.loads(Path("docs/evidence/forge-read-only-backend-adapter-dry-run-audit-064g.json").read_text())
output = json.loads(Path("docs/evidence/forge-read-only-backend-adapter-dry-run-output-064g.json").read_text())

checks = {
    "audit_status_pass": audit.get("status") == "PASS",
    "route_class_read_only": output.get("route", {}).get("routeClass") == "read_only",
    "adapter_mode_read_only": output.get("adapter", {}).get("mode") == "read_only",
    "adapter_static_fixture": output.get("adapter", {}).get("adapterType") == "local_static_fixture",
    "request_dry_run": output.get("requestEnvelope", {}).get("dryRun") is True,
    "request_preview_only": output.get("requestEnvelope", {}).get("previewOnly") is True,
    "response_real_effects_false": output.get("responseEnvelope", {}).get("realEffectsAllowed") is False,
    "read_model_preview_static": output.get("readModelEnvelope", {}).get("freshness", {}).get("status") == "preview_static",
    "audit_event_read_model_used": output.get("auditEvent", {}).get("eventType") == "read_model_used",
    "safety_crm_write_false": output.get("safety", {}).get("crmWrite") is False,
    "safety_calendar_create_false": output.get("safety", {}).get("calendarCreate") is False,
    "safety_message_send_false": output.get("safety", {}).get("messageSend") is False,
    "safety_auth_real_false": output.get("safety", {}).get("authReal") is False,
    "safety_provider_runtime_false": output.get("safety", {}).get("providerRuntime") is False,
    "safety_browser_persistence_false": output.get("safety", {}).get("browserPersistence") is False,
    "safety_real_engine_execution_false": output.get("safety", {}).get("realEngineExecution") is False,
}

failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("064H semantic QA failed: " + ", ".join(failed))

print(json.dumps({"status": "PASS", "checks": checks}, indent=2))
PY
pass "064G output semantics verified"

say_stage "STAGE 5 APPLY QA DOCS"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md <<'MD'
# Forge Read-Only Backend Adapter Dry Run QA Lock Closure 064H

DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK

NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

## Purpose

064H locks QA for the 064G local/static read-only backend adapter dry run.

The QA confirms that the 064G output is a no-effect read-only dry run and not a real backend connection.

## Verified

- route class is `read_only`;
- adapter mode is `read_only`;
- adapter type is `local_static_fixture`;
- request envelope has `dryRun=true`;
- request envelope has `previewOnly=true`;
- response has `realEffectsAllowed=false`;
- read model freshness is `preview_static`;
- audit-shaped event type is `read_model_used`;
- safety flags block CRM write, calendar create, message send, auth, provider runtime, browser persistence, and real engine execution.

## Boundary

064H does not mutate UI, connect backend, write CRM, create calendar events, deliver messages, authenticate users, execute providers, persist browser state, or run a real engine.

## Decision

DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK

NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md <<'MD'
# Forge Read-Only Backend Adapter Dry Run QA Lock Evidence 064H

Phase:
`064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK`

Status:
PASS

Base:
`064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN`

## Evidence Summary

064H validates that the 064G output is local/static, read-only, preview-safe, and no-effect.

QA checks passed:

- route class: `read_only`;
- adapter mode: `read_only`;
- adapter type: `local_static_fixture`;
- request dry run: true;
- request preview only: true;
- response real effects allowed: false;
- read model freshness: `preview_static`;
- audit event: `read_model_used`;
- all safety flags remain false.

## Result

DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK

NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md <<'MD'
# Forge Read-Only Backend Adapter Dry Run QA Lock Certificate 064H

DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK

NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK

Certified boundary:

- QA/docs lock only;
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

cat > docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json <<'JSON'
{
  "phase": "064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK",
  "status": "PASS",
  "basePhase": "064G_READ_ONLY_BACKEND_ADAPTER_DRY_RUN",
  "verifiedOutputFile": "docs/evidence/forge-read-only-backend-adapter-dry-run-output-064g.json",
  "checks": {
    "routeClassReadOnly": true,
    "adapterModeReadOnly": true,
    "adapterStaticFixture": true,
    "requestDryRun": true,
    "requestPreviewOnly": true,
    "responseRealEffectsFalse": true,
    "readModelPreviewStatic": true,
    "auditEventReadModelUsed": true,
    "allSafetyFlagsFalse": true
  },
  "uiMutation": false,
  "backendConnection": false,
  "realEffectsEnabled": false,
  "next": "064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK"
}
JSON

pass "wrote 064H QA docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 064H Read-Only Backend Adapter Dry Run QA Lock

064H locks QA for the 064G local/static read-only backend adapter dry run.

Verified:

- route class `read_only`;
- adapter mode `read_only`;
- local static fixture only;
- dry run and preview-only request;
- `realEffectsAllowed=false`;
- freshness `preview_static`;
- audit event `read_model_used`;
- all safety flags false.

DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK

NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK
MD
)

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:START -->" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:START -->" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:START -->" "<!-- FORGE:064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md"
  "docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md"
  "docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh
run_cmd python3 -m json.tool docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json
run_cmd rg -n "DECISION=PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK|NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK|routeClassReadOnly|adapterModeReadOnly|realEffectsAllowed=false" \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md \
  docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
warn "No package test suite required for read-only backend adapter dry run QA lock"

say_stage "STAGE 9 SAFETY SCAN"
if rg -n "crmWrite: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|browserPersistence: true|realEngineExecution: true|realEffectsEnabled\": true|backendConnection\": true|\"realEffectsAllowed\": true|\"secretAccess\": true" \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md \
  docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md; then
  fail "safety scan found forbidden enabled-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 10 STAGE AUTHORIZED FILES"
git add \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md \
  docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md \
  docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh

run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
cat > "$expected" <<'EOF'
FORGE_MASTER_BUILD_TREE.md
docs/architecture/source-truth/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CLOSURE_064H.md
docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_064H.md
docs/evidence/FORGE_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_CERTIFICATE_064H.md
docs/evidence/forge-read-only-backend-adapter-dry-run-qa-audit-064h.json
docs/roadmap/FORGE_ROADMAP_LOCK_001.md
tools/termux/forge_064h_read_only_backend_adapter_dry_run_qa_lock.sh
EOF
git diff --cached --name-only > "$actual"
if diff -u "$expected" "$actual"; then
  pass "only authorized files staged"
else
  fail "unexpected staged files"
fi
run_cmd git diff --cached --check

say_stage "STAGE 11 COMMIT PUSH"
run_cmd git commit -m "docs: lock read-only backend adapter dry run qa"
run_cmd git push origin HEAD:main

say_stage "STAGE 12 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_064H_READ_ONLY_BACKEND_ADAPTER_DRY_RUN_QA_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=064I_READ_ONLY_BACKEND_ADAPTER_DECISION_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-064h.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
