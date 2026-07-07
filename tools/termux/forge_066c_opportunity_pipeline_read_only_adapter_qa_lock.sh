#!/usr/bin/env bash
set -euo pipefail

PHASE="066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}FAIL:${RESET} %s\n" "$1"; autocopy; exit 1; }

autocopy(){
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" || true
  fi
}

run(){
  printf "\n========== RUN ==========\n"
  printf "%q " "$@"
  printf "\n"
  "$@"
}

require_file(){ [[ -f "$1" ]] && pass "$1" || fail "missing required file: $1"; }

backup_if_present(){
  local file="$1"
  if [[ -e "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp -R "$file" "$BACKUP_DIR/$file"
    pass "backup $file"
  else
    pass "new file slot clear: $file"
  fi
}

norm(){
  python3 - "$1" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
p.write_text("\n".join(line.rstrip() for line in p.read_text().splitlines()) + "\n")
PY
}

append_block(){
  local file="$1" start="$2" end="$3" body="$4"
  python3 - "$file" "$start" "$end" "$body" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = sys.argv[4]
text = p.read_text()
block = f"{start}\n{body.rstrip()}\n{end}\n"
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + block + after.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
p.write_text(text)
PY
}

write_rollback(){
  local rollback="$BACKUP_DIR/rollback-066c.sh"
  cat > "$rollback" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
REPO="/storage/emulated/0/Forge OS"
BACKUP_DIR="$BACKUP_DIR"
cd "\$REPO"

restore_or_archive(){
  local file="\$1"
  local backup="\$BACKUP_DIR/\$file"
  if [[ -e "\$backup" ]]; then
    mkdir -p "\$(dirname "\$file")"
    rm -rf "\$file"
    cp -R "\$backup" "\$file"
    echo "restored \$file"
  elif [[ -e "\$file" ]]; then
    mkdir -p ".forge-backups/rollback-archives"
    local archive=".forge-backups/rollback-archives/\$(basename "\$file").066c.\$(date +%Y%m%d_%H%M%S)"
    mv "\$file" "\$archive"
    echo "archived created file \$file -> \$archive"
  fi
}

restore_or_archive "FORGE_MASTER_BUILD_TREE.md"
restore_or_archive "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
restore_or_archive "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
restore_or_archive "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
restore_or_archive "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
restore_or_archive "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
restore_or_archive "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
restore_or_archive "tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
echo "rollback 066C complete"
ROLLBACK
  chmod +x "$rollback"
  pass "rollback script created: $rollback"
}

stage "STAGE 0 HEADER"
printf "PHASE=%s\n" "$PHASE"
printf "MODE=opportunity pipeline read-only adapter QA lock\n"
printf "BOUNDARY=QA/docs lock only; no UI mutation; no backend connection; no CRM write; no pipeline write; no calendar; no send; no auth; no provider execution; no real engine execution\n"
printf "REPORT=%s\n" "$REPORT"

stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "repo not found: $REPO"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

[[ -z "$(git diff --name-only)" && -z "$(git diff --cached --name-only)" ]] || fail "tracked worktree dirty; refusing to write 066C"

stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js"
  "tests/opportunity-pipeline-read-only-adapter-066b-test.js"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION_CLOSURE_066B.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION_066B.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-implementation-audit-066b.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
for file in "${required_files[@]}"; do require_file "$file"; done

stage "STAGE 3 BACKUP"
BACKUP_DIR=".forge-backups/066c-opportunity-pipeline-read-only-adapter-qa-lock-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
backup_targets=(
  "${required_files[@]}"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
  "tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
)
for file in "${backup_targets[@]}"; do backup_if_present "$file"; done
write_rollback

stage "STAGE 4 ADAPTER SEMANTIC QA"
node <<'JS'
"use strict";

const assert = require("assert");
const {
  getAdapterManifest,
  listOpportunities,
  getOpportunityDetail
} = require("./platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b");

function assertAllSafetyFlagsFalse(envelope) {
  const expectedFalse = [
    "crmWrite",
    "pipelineWrite",
    "taskCreate",
    "calendarCreate",
    "messageSend",
    "authReal",
    "providerRuntime",
    "secretAccess",
    "browserPersistence",
    "realEngineExecution",
    "realEffectsAllowed"
  ];
  for (const key of expectedFalse) {
    assert.strictEqual(envelope.safety[key], false, `${key} must remain false`);
  }
}

const manifest = getAdapterManifest();
assert.strictEqual(manifest.adapterId, "forge.opportunity_pipeline.read_only.adapter.v1");
assert.strictEqual(manifest.adapterType, "local_static_fixture");
assert.strictEqual(manifest.adapterMode, "read_only");
assert.strictEqual(manifest.routeClass, "read_only");
assert.strictEqual(manifest.domainId, "opportunity_pipeline");
assert.strictEqual(manifest.providerRuntime, false);
assert.strictEqual(manifest.secretAccess, false);
assert.strictEqual(manifest.realEffectsAllowed, false);

const list = listOpportunities();
assert.strictEqual(list.schemaVersion, "forge.backend.read_model.v1");
assert.strictEqual(list.freshness.status, "preview_static");
assert.strictEqual(list.entities.length, 2);
assert.strictEqual(list.auditEvent.eventType, "read_model_used");
assertAllSafetyFlagsFalse(list);

const detail = getOpportunityDetail("opp_preview_lariza_review");
assert.strictEqual(detail.entities.length, 1);
assert.strictEqual(detail.entities[0].entityId, "opp_preview_lariza_review");
assert.strictEqual(detail.entities[0].clientRef.entityId, "client_preview_lariza");
assert.strictEqual(detail.entities[0].priority, "high");
assert.strictEqual(detail.auditEvent.eventType, "read_model_used");
assertAllSafetyFlagsFalse(detail);

const missing = getOpportunityDetail("missing_opportunity");
assert.strictEqual(missing.entities.length, 0);
assert.strictEqual(missing.emptyState.reason, "filter_no_match");
assert.strictEqual(missing.errors[0].code, "OPPORTUNITY_PIPELINE_NOT_MODELED");
assertAllSafetyFlagsFalse(missing);

console.log(JSON.stringify({
  status: "PASS",
  adapterId: manifest.adapterId,
  listCount: list.entities.length,
  detailOpportunity: detail.entities[0].entityId,
  missingError: missing.errors[0].code,
  allSafetyFlagsFalse: true
}, null, 2));
JS
pass "adapter semantic QA passed"

stage "STAGE 5 APPLY QA DOCS"
mkdir -p docs/architecture/source-truth docs/evidence tools/termux
cp "$0" "tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
pass "copied runner into tools/termux"

cat > docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md <<'MD'
# Forge Opportunity Pipeline Read-Only Adapter QA Lock Closure 066C

DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK

NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

## Purpose

066C locks QA for the local static Opportunity Pipeline read-only adapter implemented in 066B.

## Verified

- adapter id is `forge.opportunity_pipeline.read_only.adapter.v1`;
- adapter type is `local_static_fixture`;
- adapter mode is `read_only`;
- route class is `read_only`;
- list route returns two opportunity fixtures;
- detail route returns `opp_preview_lariza_review`;
- missing detail returns `filter_no_match` and `OPPORTUNITY_PIPELINE_NOT_MODELED`;
- read model envelope version is `forge.backend.read_model.v1`;
- freshness is `preview_static`;
- audit event is `read_model_used`;
- all safety flags remain false.

## Decision

DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK

NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md <<'MD'
# Forge Opportunity Pipeline Read-Only Adapter QA Lock Evidence 066C

Phase:
`066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK`

Status:
PASS

Base:
`066B_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION`

## QA Summary

066C verifies the Opportunity Pipeline adapter implementation from 066B through syntax checks, unit tests, semantic envelope checks, safety flag checks, and documentation lock evidence.

Verified:

- adapter manifest is stable;
- read-only mode is preserved;
- local static fixture behavior is preserved;
- safe empty state is returned for missing opportunity fixture ids;
- all real-effect surfaces stay blocked.

## Result

DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK

NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK
MD

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md <<'MD'
# Forge Opportunity Pipeline Read-Only Adapter QA Lock Certificate 066C

DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK

NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

Certified:

- QA lock only;
- no UI mutation;
- no backend connection;
- no CRM write;
- no pipeline write;
- no task creation;
- no calendar creation;
- no message send;
- no auth implementation;
- no provider runtime;
- no secret access;
- no browser persistence;
- no real engine execution.
MD

cat > docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json <<'JSON'
{
  "phase": "066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK",
  "status": "PASS",
  "basePhase": "066B_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION",
  "adapterFile": "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js",
  "testFile": "tests/opportunity-pipeline-read-only-adapter-066b-test.js",
  "checks": {
    "syntaxCheck": true,
    "unitTest": true,
    "semanticEnvelopeQa": true,
    "adapterId": "forge.opportunity_pipeline.read_only.adapter.v1",
    "adapterType": "local_static_fixture",
    "adapterMode": "read_only",
    "routeClass": "read_only",
    "listReturnsTwoFixtures": true,
    "detailReturnsLarizaReview": true,
    "missingReturnsSafeEmptyState": true,
    "missingError": "OPPORTUNITY_PIPELINE_NOT_MODELED",
    "readModelEnvelopeVersion": "forge.backend.read_model.v1",
    "freshnessPreviewStatic": true,
    "auditEventReadModelUsed": true,
    "allSafetyFlagsFalse": true
  },
  "uiMutation": false,
  "backendConnection": false,
  "crmWrite": false,
  "pipelineWrite": false,
  "realEffectsEnabled": false,
  "next": "066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK"
}
JSON
pass "wrote 066C QA docs and audit json"

stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
SYNC_BODY=$(cat <<'MD'
## 066C Opportunity Pipeline Read-Only Adapter QA Lock

066C locks QA for the Opportunity Pipeline read-only adapter implemented in 066B.

Verified:

- adapter id `forge.opportunity_pipeline.read_only.adapter.v1`;
- adapter type `local_static_fixture`;
- adapter mode `read_only`;
- route class `read_only`;
- list returns two fixtures;
- detail returns `opp_preview_lariza_review`;
- missing detail returns `OPPORTUNITY_PIPELINE_NOT_MODELED`;
- audit event `read_model_used`;
- all safety flags false.

DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK

NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK
MD
)
append_block "FORGE_MASTER_BUILD_TREE.md" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
append_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
append_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START -->" "<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:END -->" "$SYNC_BODY"
pass "updated build tree / roadmap sync blocks"

stage "STAGE 7 NORMALIZE FILES"
changed_files=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
  "tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
)
for file in "${changed_files[@]}"; do norm "$file"; done
pass "normalized EOF and trailing whitespace"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh
run node --check platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js
run node --check tests/opportunity-pipeline-read-only-adapter-066b-test.js
run node tests/opportunity-pipeline-read-only-adapter-066b-test.js
run python3 -m json.tool docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json
run rg -n "DECISION=PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK|NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK|OPPORTUNITY_PIPELINE_NOT_MODELED|allSafetyFlagsFalse|forge.opportunity_pipeline.read_only.adapter.v1" \
  docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md \
  docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md \
  docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md \
  docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run git diff --check

stage "STAGE 9 SAFETY SCAN"
scan_files=(
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
if rg -n "crmWrite: true|pipelineWrite: true|taskCreate: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|secretAccess: true|browserPersistence: true|realEngineExecution: true|realEffectsAllowed: true|realEffectsEnabled\\\": true|backendConnection\\\": true|\\\"pipelineWrite\\\": true|\\\"providerRuntime\\\": true|\\\"secretAccess\\\": true|\\\"realEffectsAllowed\\\": true" "${scan_files[@]}"; then
  fail "safety scan found an enabled real-effect marker"
fi
pass "safety scan clean"

stage "STAGE 10 STAGE AUTHORIZED FILES"
git add "${changed_files[@]}"
run git diff --cached --name-only
expected=$(mktemp)
actual=$(mktemp)
printf "%s\n" "${changed_files[@]}" | sort > "$expected"
git diff --cached --name-only | sort > "$actual"
if ! diff -u "$expected" "$actual"; then
  fail "staged file set differs from authorized files"
fi
rm -f "$expected" "$actual"
pass "only authorized files staged"
run git diff --cached --check

stage "STAGE 11 COMMIT PUSH"
git diff --cached --quiet && fail "nothing staged for commit"
run git commit -m "docs: lock opportunity pipeline read-only adapter qa"
run git push origin HEAD:main

stage "STAGE 12 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

stage "FINAL DECISION"
printf "PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_COMMIT_PUSH_COMPLETE\n"
printf "NEXT=066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK\n"
printf "BACKUP=%s\n" "$BACKUP_DIR"
printf "ROLLBACK=%s\n" "$BACKUP_DIR/rollback-066c.sh"
printf "Reporte: %s\n" "$REPORT"
autocopy
