#!/usr/bin/env bash
set -euo pipefail

PHASE="065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK"
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
  local rollback="$BACKUP_DIR/rollback-065c.sh"
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
    local archive=".forge-backups/rollback-archives/$(basename "$file").065c.$(date +%Y%m%d_%H%M%S)"
    mv "$file" "$archive"
    echo "archived created file $file -> $archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md"
restore_or_archive "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md"
restore_or_archive "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md"
restore_or_archive "docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json"
restore_or_archive "tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh"

echo "rollback 065C complete"
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
printf "MODE=client CRM read-only adapter QA lock\n"
printf "BOUNDARY=QA/docs lock only; no UI mutation; no backend connection; no CRM write; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status

if [[ -n "$(git diff --name-only)" || -n "$(git diff --cached --name-only)" ]]; then
  hold "tracked worktree has unstaged or staged changes; refusing to write 065C over a moving target"
fi

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "platform/adapters/client-crm/client-crm-read-only-adapter-065b.js"
  "tests/client-crm-read-only-adapter-065b-test.js"
  "docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION_CLOSURE_065B.md"
  "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION_065B.md"
  "docs/evidence/forge-client-crm-read-only-adapter-implementation-audit-065b.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

say_stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/065c-client-crm-read-only-adapter-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for file in "${required_files[@]}"; do
  backup_file "$file"
done
write_rollback

say_stage "STAGE 4 ADAPTER SEMANTIC QA"
node <<'NODE'
"use strict";

const assert = require("assert");
const adapter = require("./platform/adapters/client-crm/client-crm-read-only-adapter-065b");

const manifest = adapter.getAdapterManifest();
assert.strictEqual(manifest.adapterId, "forge.client_crm.read_only.adapter.v1");
assert.strictEqual(manifest.adapterType, "local_static_fixture");
assert.strictEqual(manifest.adapterMode, "read_only");
assert.strictEqual(manifest.routeClass, "read_only");
assert.strictEqual(manifest.providerRuntime, false);
assert.strictEqual(manifest.secretAccess, false);
assert.strictEqual(manifest.realEffectsAllowed, false);

const list = adapter.listClients();
const detail = adapter.getClientDetail("client_preview_lariza");
const missing = adapter.getClientDetail("missing_client");

function assertEnvelope(envelope) {
  assert.strictEqual(envelope.schemaVersion, "forge.backend.read_model.v1");
  assert.strictEqual(envelope.domainId, "client_crm");
  assert.strictEqual(envelope.freshness.status, "preview_static");
  assert.strictEqual(envelope.approvalContext.requiresApproval, false);
  assert.strictEqual(envelope.audit.eventType, "read_model_used");
  assert.strictEqual(envelope.auditEvent.eventType, "read_model_used");
  assert.strictEqual(envelope.auditEvent.providerRuntime, false);
  assert.strictEqual(envelope.auditEvent.realEffectsAllowed, false);
  assert.strictEqual(envelope.safety.crmWrite, false);
  assert.strictEqual(envelope.safety.calendarCreate, false);
  assert.strictEqual(envelope.safety.messageSend, false);
  assert.strictEqual(envelope.safety.authReal, false);
  assert.strictEqual(envelope.safety.providerRuntime, false);
  assert.strictEqual(envelope.safety.browserPersistence, false);
  assert.strictEqual(envelope.safety.realEngineExecution, false);
  assert.strictEqual(envelope.safety.realEffectsAllowed, false);
}

assertEnvelope(list);
assertEnvelope(detail);
assertEnvelope(missing);

assert.strictEqual(list.entities.length, 2);
assert.deepStrictEqual(list.entities.map((item) => item.entityId), [
  "client_preview_lariza",
  "client_preview_octavio"
]);
assert.strictEqual(detail.entities[0].displayName, "Lariza");
assert.strictEqual(missing.emptyState.reason, "filter_no_match");
assert.strictEqual(missing.errors[0].code, "CLIENT_CRM_NOT_MODELED");

console.log(JSON.stringify({
  status: "PASS",
  adapterId: manifest.adapterId,
  listCount: list.entities.length,
  detailClient: detail.entities[0].entityId,
  missingError: missing.errors[0].code,
  allSafetyFlagsFalse: true
}, null, 2));
NODE
pass "adapter semantic QA passed"

say_stage "STAGE 5 APPLY QA DOCS"
mkdir -p tools/termux docs/architecture/source-truth docs/evidence
SCRIPT_SOURCE="$0"
if [[ -n "${BASH_SOURCE+x}" && -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
fi
if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  fail "runner source not found: $SCRIPT_SOURCE"
fi
cp "$SCRIPT_SOURCE" "tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md <<'MD'
# Forge Client CRM Read-Only Adapter QA Lock Closure 065C

DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK

NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK

## Purpose

065C locks QA for the 065B Client CRM read-only adapter.

The QA confirms the adapter remains local/static, read-only, envelope-compatible, and no-effect.

## Verified

- adapter id is `forge.client_crm.read_only.adapter.v1`;
- adapter type is `local_static_fixture`;
- adapter mode is `read_only`;
- route class is `read_only`;
- list route returns Lariza and Octavio preview fixtures;
- detail route returns Lariza fixture;
- missing detail returns `filter_no_match` and `CLIENT_CRM_NOT_MODELED`;
- envelopes use `forge.backend.read_model.v1`;
- freshness is `preview_static`;
- audit event is `read_model_used`;
- all safety flags remain false.

## Decision

DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK

NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md <<'MD'
# Forge Client CRM Read-Only Adapter QA Lock Evidence 065C

Phase:
`065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK`

Status:
PASS

Base:
`065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION`

## Evidence Summary

065C validates the local static Client CRM read-only adapter.

QA passed:

- syntax check;
- adapter unit test;
- semantic envelope QA;
- JSON audit validation;
- safety scan;
- staged-file boundary.

## Result

DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK

NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md <<'MD'
# Forge Client CRM Read-Only Adapter QA Lock Certificate 065C

DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK

NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK

Certified boundary:

- QA/docs lock only;
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

cat > docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json <<'JSON'
{
  "phase": "065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK",
  "status": "PASS",
  "basePhase": "065B_CLIENT_CRM_READ_ONLY_ADAPTER_IMPLEMENTATION",
  "adapterFile": "platform/adapters/client-crm/client-crm-read-only-adapter-065b.js",
  "testFile": "tests/client-crm-read-only-adapter-065b-test.js",
  "checks": {
    "syntaxCheck": true,
    "unitTest": true,
    "semanticEnvelopeQa": true,
    "adapterId": "forge.client_crm.read_only.adapter.v1",
    "adapterType": "local_static_fixture",
    "adapterMode": "read_only",
    "routeClass": "read_only",
    "listReturnsTwoFixtures": true,
    "detailReturnsLariza": true,
    "missingReturnsSafeEmptyState": true,
    "readModelEnvelopeVersion": "forge.backend.read_model.v1",
    "freshnessPreviewStatic": true,
    "auditEventReadModelUsed": true,
    "allSafetyFlagsFalse": true
  },
  "uiMutation": false,
  "backendConnection": false,
  "crmWrite": false,
  "realEffectsEnabled": false,
  "next": "065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK"
}
JSON

pass "wrote 065C QA docs and audit json"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 065C Client CRM Read-Only Adapter QA Lock

065C locks QA for the 065B Client CRM read-only adapter.

Verified:

- syntax check;
- adapter unit test;
- semantic envelope QA;
- adapter id `forge.client_crm.read_only.adapter.v1`;
- local static fixture;
- read-only mode;
- Lariza and Octavio list fixtures;
- Lariza detail fixture;
- safe missing-client empty state;
- `CLIENT_CRM_NOT_MODELED`;
- all safety flags false.

DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK

NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK
MD
)

append_sync_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
append_sync_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

say_stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md"
  "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md"
  "docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md"
  "docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh"
)

for file in "${changed_files[@]}"; do
  normalize_file "$file"
done
pass "normalized EOF and trailing whitespace"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh
run_cmd node --check platform/adapters/client-crm/client-crm-read-only-adapter-065b.js
run_cmd node --check tests/client-crm-read-only-adapter-065b-test.js
run_cmd node tests/client-crm-read-only-adapter-065b-test.js
run_cmd python3 -m json.tool docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json
run_cmd rg -n "DECISION=PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK|NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK|CLIENT_CRM_NOT_MODELED|allSafetyFlagsFalse|forge.client_crm.read_only.adapter.v1" \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md \
  docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check

say_stage "STAGE 9 SAFETY SCAN"
if rg -n "crmWrite: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|browserPersistence: true|realEngineExecution: true|realEffectsEnabled\": true|backendConnection\": true|\"crmWrite\": true|\"realEffectsAllowed\": true|\"secretAccess\": true|\"providerRuntime\": true" \
  platform/adapters/client-crm/client-crm-read-only-adapter-065b.js \
  tests/client-crm-read-only-adapter-065b-test.js \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md \
  docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md; then
  fail "safety scan found forbidden enabled-effect marker"
fi
pass "safety scan clean"

say_stage "STAGE 10 STAGE AUTHORIZED FILES"
git add \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md \
  docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md \
  docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh

run_cmd git diff --cached --name-only
expected="$(mktemp)"
actual="$(mktemp)"
cat > "$expected" <<'EOF'
FORGE_MASTER_BUILD_TREE.md
docs/architecture/source-truth/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_065C.md
docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_065C.md
docs/evidence/FORGE_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_065C.md
docs/evidence/forge-client-crm-read-only-adapter-qa-audit-065c.json
docs/roadmap/FORGE_ROADMAP_LOCK_001.md
tools/termux/forge_065c_client_crm_read_only_adapter_qa_lock.sh
EOF
git diff --cached --name-only > "$actual"
if diff -u "$expected" "$actual"; then
  pass "only authorized files staged"
else
  fail "unexpected staged files"
fi
run_cmd git diff --cached --check

say_stage "STAGE 11 COMMIT PUSH"
run_cmd git commit -m "docs: lock client CRM read-only adapter qa"
run_cmd git push origin HEAD:main

say_stage "STAGE 12 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
printf "PASS_065C_CLIENT_CRM_READ_ONLY_ADAPTER_QA_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=065D_CLIENT_CRM_READ_ONLY_ADAPTER_DECISION_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-065c.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy_report
