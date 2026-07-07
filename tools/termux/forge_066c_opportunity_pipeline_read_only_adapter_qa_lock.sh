#!/usr/bin/env bash
set -euo pipefail

PHASE="066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"
MODE="QA_LOCK_OR_REPAIR_DOCS_ONLY"
BOUNDARY="no UI mutation; no backend connection; no CRM write; no pipeline write; no task creation; no calendar creation; no send; no auth; no provider execution; no secret access; no browser persistence; no real engine execution"
NEXT="066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK"
COMMIT_MESSAGE="docs: lock opportunity pipeline read-only adapter qa"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".forge-backups/066c-opportunity-pipeline-read-only-adapter-qa-lock-${STAMP}"
ROLLBACK_SCRIPT="${BACKUP_DIR}/rollback-066c-opportunity-pipeline-read-only-adapter-qa-lock.sh"

mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

say_stage() {
  printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"
}

pass() {
  printf "${GREEN}PASS:${RESET} %s\n" "$1"
}

warn() {
  printf "${YELLOW}WARN:${RESET} %s\n" "$1"
}

autocopy_report() {
  sync || true
  sleep 0.2 || true
  if command -v termux-clipboard-set >/dev/null 2>&1; then
    termux-clipboard-set < "$REPORT" && pass "autocopy_report -> clipboard" || warn "autocopy_report failed"
  else
    warn "termux-clipboard-set not available; report not auto-copied"
  fi
}

hold() {
  printf "${YELLOW}HOLD:${RESET} %s\n\n" "$1"
  say_stage "HOLD"
  echo "$1"
  echo "DECISION=HOLD_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

fail() {
  printf "${RED}NO PASS:${RESET} %s\n\n" "$1"
  say_stage "NO PASS"
  echo "$1"
  echo "DECISION=NO_PASS_${PHASE}"
  echo "Reporte: $REPORT"
  autocopy_report
  exit 1
}

run_cmd() {
  echo
  echo "========== RUN =========="
  printf '%q ' "$@"
  echo
  "$@"
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || hold "Required file missing: $path"
  pass "required file exists -> $path"
}

backup_if_present() {
  local path="$1"
  if [[ -e "$path" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$path")"
    cp -a "$path" "$BACKUP_DIR/$path"
    printf 'mkdir -p %q\n' "$(dirname "$path")" >> "$ROLLBACK_SCRIPT"
    printf 'cp -a %q %q\n' "$BACKUP_DIR/$path" "$path" >> "$ROLLBACK_SCRIPT"
  else
    mkdir -p "$BACKUP_DIR/__created_files"
    printf 'if [[ -e %q ]]; then mkdir -p %q; mv %q %q; fi\n' "$path" "$BACKUP_DIR/__created_files/$(dirname "$path")" "$path" "$BACKUP_DIR/__created_files/$path" >> "$ROLLBACK_SCRIPT"
  fi
}

norm() {
  python3 - "$@" <<'PYNORM'
import sys
from pathlib import Path
for raw in sys.argv[1:]:
    p = Path(raw)
    if not p.exists() or p.is_dir():
        continue
    text = p.read_text(errors='replace')
    normalized = "\n".join(line.rstrip() for line in text.splitlines()).rstrip() + "\n"
    p.write_text(normalized)
PYNORM
}

append_block() {
  local file="$1"
  local marker="$2"
  local body_file="$3"
  local start="<!-- ${marker} -->"
  local end="${start/:START/:END}"
  python3 - "$file" "$start" "$end" "$body_file" <<'PYBLOCK'
import sys
from pathlib import Path

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
body = Path(sys.argv[4]).read_text().strip() + "\n"
text = path.read_text()

if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    text = before.rstrip() + "\n\n" + after.lstrip("\n")
else:
    text = text.rstrip() + "\n"

text = text.rstrip() + "\n\n" + body
path.write_text(text)
PYBLOCK
  pass "synced block -> $file"
}

write_rollback() {
  mkdir -p "$BACKUP_DIR"
  cat > "$ROLLBACK_SCRIPT" <<'RB'
#!/usr/bin/env bash
set -euo pipefail
ROOT="/storage/emulated/0/Forge OS"
cd "$ROOT"
RB
  chmod +x "$ROLLBACK_SCRIPT"
}

copy_self_into_repo_if_needed() {
  local target="tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
  mkdir -p "$(dirname "$target")"
  local self="${BASH_SOURCE[0]}"
  if [[ "$self" != "$target" ]]; then
    local self_abs
    local target_abs
    self_abs="$(cd "$(dirname "$self")" && pwd)/$(basename "$self")"
    target_abs="$(cd "$(dirname "$target")" && pwd)/$(basename "$target")"
    if [[ "$self_abs" != "$target_abs" ]]; then
      cp -a "$self" "$target"
      pass "script copied into repo -> $target"
    else
      pass "script already running from repo target"
    fi
  else
    pass "script already running from repo target"
  fi
  chmod +x "$target"
}

expected_sorted() {
  printf '%s\n' "$@" | LC_ALL=C sort
}

say_stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "Robocop Gate: applicable Constitution=Article 0; Build Tree area=Opportunity Pipeline read-only adapter QA; scope=066C only; prohibited surfaces=$BOUNDARY; validation=syntax, tests, semantic QA, evidence, safety scan, staged boundary."

say_stage "STAGE 1 CHECKPOINT"
cd "$REPO" || fail "Repo not found: $REPO"
run_cmd git status --short --branch
run_cmd git log --oneline -10
run_cmd git diff --name-status
run_cmd git diff --cached --name-status
branch="$(git rev-parse --abbrev-ref HEAD)"
[[ "$branch" == "main" ]] || hold "Expected branch main, got $branch"
pass "branch main confirmed"

say_stage "STAGE 2 REQUIRED FILE CHECK"
required_files=(
  "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js"
  "tests/opportunity-pipeline-read-only-adapter-066b-test.js"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION_CLOSURE_066B.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_IMPLEMENTATION_066B.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-implementation-audit-066b.json"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION_066B1.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION_066B1.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION_CERTIFICATE_066B1.md"
  "docs/evidence/forge-opportunity-pipeline-existing-module-reconciliation-audit-066b1.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
for f in "${required_files[@]}"; do
  require_file "$f"
done

say_stage "STAGE 3 BACKUP"
write_rollback
allowed_paths=(
  "tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
)
for f in "${allowed_paths[@]}"; do
  backup_if_present "$f"
done
pass "backup created -> $BACKUP_DIR"
pass "rollback created -> $ROLLBACK_SCRIPT"

say_stage "STAGE 4 APPLY CHANGES"
copy_self_into_repo_if_needed

say_stage "STAGE 4 VERIFY 066B1 RECONCILIATION"
python3 - <<'PYVERIFY'
import json
import sys
from pathlib import Path

path = Path('docs/evidence/forge-opportunity-pipeline-existing-module-reconciliation-audit-066b1.json')
data = json.loads(path.read_text())

EXPECTED_PHASE = '066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION'
EXPECTED_SHIM_DECISION = 'KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM'

REAL_EFFECT_KEYS = {
    'crmWrite',
    'pipelineWrite',
    'taskCreate',
    'calendarCreate',
    'messageSend',
    'authReal',
    'providerRuntime',
    'secretAccess',
    'browserPersistence',
    'realEngineExecution',
    'realEffectsAllowed',
    'realEffectsEnabled',
    'backendConnection',
}

def walk(obj, prefix=''):
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = str(k)
            next_prefix = f'{prefix}.{key}' if prefix else key
            yield next_prefix, key, v
            yield from walk(v, next_prefix)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            next_prefix = f'{prefix}[{i}]'
            yield from walk(v, next_prefix)

def find_first(keys):
    wanted = set(keys)
    for path_key, key, value in walk(data):
        if key in wanted:
            return value, path_key
    return None, None

def find_all_values(keys):
    wanted = set(keys)
    found = []
    for path_key, key, value in walk(data):
        if key in wanted:
            found.append((path_key, value))
    return found

def falseish(v):
    if v is False:
        return True
    if isinstance(v, str) and v.strip().lower() in {'false', 'no', '0', 'disabled', 'none', 'null'}:
        return True
    if v in (0, None):
        return True
    return False

phase, phase_path = find_first(['phase', 'phaseId', 'id'])
status, status_path = find_first(['status', 'result'])
# 066B1 real audit uses `decision` for PASS token and `reconciliationDecision`
# for the critical shim decision. Prefer the semantic reconciliation field.
shim_decision_candidates = find_all_values([
    'reconciliationDecision',
    'adapterDecision',
    'shimDecision',
    'canonicalDecision',
    'finalShimDecision',
    'decision',
    'finalDecision',
])
shim_decision_path = None
shim_decision = None
for p, v in shim_decision_candidates:
    if v == EXPECTED_SHIM_DECISION:
        shim_decision = v
        shim_decision_path = p
        break
if shim_decision is None and shim_decision_candidates:
    shim_decision_path, shim_decision = shim_decision_candidates[0]

real_effect_values = find_all_values(REAL_EFFECT_KEYS)
true_real_effects = [(p, v) for p, v in real_effect_values if v is True or (isinstance(v, str) and v.strip().lower() == 'true')]
explicit_real_effects_enabled = [(p, v) for p, v in real_effect_values if p.endswith('realEffectsEnabled')]

print('066B1 audit observed:')
print(json.dumps({
    'phase': phase,
    'phasePath': phase_path,
    'status': status,
    'statusPath': status_path,
    'shimDecision': shim_decision,
    'shimDecisionPath': shim_decision_path,
    'topLevelDecision': data.get('decision') if isinstance(data, dict) else None,
    'topLevelReconciliationDecision': data.get('reconciliationDecision') if isinstance(data, dict) else None,
    'explicitRealEffectsEnabled': explicit_real_effects_enabled,
    'trueRealEffectMarkers': true_real_effects,
}, indent=2, sort_keys=True))

errors = []
if phase != EXPECTED_PHASE:
    errors.append(f'phase must equal {EXPECTED_PHASE}, got {phase!r} at {phase_path!r}')
if shim_decision != EXPECTED_SHIM_DECISION:
    errors.append(f'shim decision must equal {EXPECTED_SHIM_DECISION}, got {shim_decision!r} at {shim_decision_path!r}')
if not (isinstance(status, str) and status.startswith('PASS')):
    errors.append(f'status must be PASS or start with PASS, got {status!r} at {status_path!r}')
if true_real_effects:
    errors.append(f'real-effect markers must not be true, got {true_real_effects!r}')
# If realEffectsEnabled exists, it must be false-ish. If it does not exist in the
# historical audit, absence is accepted only because the full recursive scan above
# found no true real-effect marker. This keeps 066C strict on safety without
# pretending 066B1 used today\'s exact key shape.
for p, v in explicit_real_effects_enabled:
    if not falseish(v):
        errors.append(f'realEffectsEnabled must be false-ish at {p}, got {v!r}')

if errors:
    print('066B1 reconciliation audit did not satisfy 066C gate:')
    for error in errors:
        print('-', error)
    if isinstance(data, dict):
        print('Top-level audit keys:', sorted(data.keys()))
    sys.exit(1)

print('066B1 reconciliation gate accepted')
PYVERIFY
pass "066B1 reconciliation accepted: KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM"

say_stage "STAGE 4 ADAPTER SEMANTIC QA"
run_cmd node --check platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js
run_cmd node --check tests/opportunity-pipeline-read-only-adapter-066b-test.js
run_cmd node tests/opportunity-pipeline-read-only-adapter-066b-test.js
node <<'NODEQA'
const assert = require('assert');
const adapter = require('./platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js');

function get(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  for (const value of Object.values(obj)) {
    const found = get(value, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function allFalse(envelope, keys) {
  for (const key of keys) {
    assert.strictEqual(get(envelope, key), false, `${key} must be false`);
  }
}

function callAny(names, ...args) {
  for (const name of names) {
    if (typeof adapter[name] === 'function') {
      return adapter[name](...args);
    }
  }
  throw new Error(`none of these adapter functions exist: ${names.join(', ')}`);
}

const manifest = typeof adapter.getAdapterManifest === 'function'
  ? adapter.getAdapterManifest()
  : (adapter.manifest || (typeof adapter.getManifest === 'function' ? adapter.getManifest() : {}));
assert.strictEqual(manifest.adapterId, 'forge.opportunity_pipeline.read_only.adapter.v1');
assert.strictEqual(manifest.adapterType, 'local_static_fixture');
assert.strictEqual(manifest.adapterMode, 'read_only');
assert.strictEqual(manifest.routeClass, 'read_only');
assert.strictEqual(manifest.domainId, 'opportunity_pipeline');
assert.strictEqual(manifest.providerRuntime, false);
assert.strictEqual(manifest.secretAccess, false);
assert.strictEqual(manifest.realEffectsAllowed, false);

const safetyKeys = [
  'crmWrite', 'pipelineWrite', 'taskCreate', 'calendarCreate', 'messageSend',
  'authReal', 'providerRuntime', 'secretAccess', 'browserPersistence',
  'realEngineExecution', 'realEffectsAllowed'
];

const list = callAny(['listOpportunities', 'readOpportunityList', 'list']);
const items = list.entities || get(list, 'items') || get(list, 'opportunities') || get(list, 'data') || [];
assert.strictEqual(items.length, 2, 'listOpportunities must return 2 fixtures');
assert.strictEqual(list.auditEvent.eventType, 'read_model_used');
assert.strictEqual(list.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(list.freshness.status, 'preview_static');
allFalse(list, safetyKeys);

const detail = callAny(['getOpportunityDetail', 'readOpportunityDetail', 'detail'], 'opp_preview_lariza_review');
assert.strictEqual(detail.entities.length, 1);
assert.strictEqual(detail.entities[0].entityId, 'opp_preview_lariza_review');
assert.strictEqual(detail.entities[0].clientRef.entityId, 'client_preview_lariza');
assert.strictEqual(detail.entities[0].priority, 'high');
assert.strictEqual(detail.auditEvent.eventType, 'read_model_used');
assert.strictEqual(detail.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(detail.freshness.status, 'preview_static');
allFalse(detail, safetyKeys);

const missing = callAny(['getOpportunityDetail', 'readOpportunityDetail', 'detail'], 'missing_opportunity_066c');
assert.strictEqual(missing.emptyState.reason, 'filter_no_match');
assert.strictEqual(missing.errors[0].code, 'OPPORTUNITY_PIPELINE_NOT_MODELED');
allFalse(missing, safetyKeys);

console.log(JSON.stringify({
  status: 'PASS',
  adapterId: manifest.adapterId,
  listCount: items.length,
  detailOpportunity: detail.entities[0].entityId,
  missingError: missing.errors[0].code,
  allSafetyFlagsFalse: true
}, null, 2));
NODEQA
pass "adapter semantic QA passed"

say_stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md <<'MD1'
# FORGE OPPORTUNITY PIPELINE READ ONLY ADAPTER QA LOCK CLOSURE 066C

Status: PASS
Phase: 066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Decision: PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Next: 066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

## Robocop Gate

- Applicable Constitution: Article 0, Decision Clarity First, Advisor-first, no invented truth, AI explains and Forge decides.
- Applicable ADRs: 064F through 066B1 backend/read-only adapter continuity.
- Build Tree area: Opportunity Pipeline / Read-only Adapter / QA Lock.
- Discovery status: 066B implementation complete; 066B1 reconciliation complete.
- Implementation readiness: QA lock only; no backend real.
- Miranda approval: PASS for bounded QA lock scope only.
- Board approval status: bounded to local/static read-only shim QA.
- Scope boundary: validate 066B adapter and evidence using 066B1 decision.
- Prohibited surfaces: UI, backend connection, provider runtime, auth, secrets, writes, browser persistence, real engine execution.
- Validation expectation: syntax, test, semantic envelope, reconciliation audit, safety scan, staged file boundary.

## Closure

066C locks QA for the Opportunity Pipeline read-only adapter introduced in 066B.

066C preserves the 066B1 decision:

`KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM`

No new adapter was created.
No backend was connected.
No writes or real effects were enabled.
MD1

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md <<'MD2'
# FORGE OPPORTUNITY PIPELINE READ ONLY ADAPTER QA LOCK 066C

Status: PASS
Phase: 066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Decision: PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Next: 066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

## Evidence Summary

Validated 066B implementation files and 066B1 reconciliation files.

066B1 audit acceptance is robust but strict where it matters:

- phase must equal `066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION`
- shim decision must equal `KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM` using `reconciliationDecision` when present
- explicit `realEffectsEnabled` must be false when present; historical audits without that exact key are accepted only if no real-effect marker is true
- status may be `PASS` or any string starting with `PASS`

Validated adapter semantics:

- adapterId: `forge.opportunity_pipeline.read_only.adapter.v1`
- adapterType: `local_static_fixture`
- adapterMode: `read_only`
- routeClass: `read_only`
- domainId: `opportunity_pipeline`
- providerRuntime: false
- secretAccess: false
- realEffectsAllowed: false
- list returns two fixtures
- Lariza detail resolves with `client_preview_lariza` and `priority=high`
- missing opportunity returns `OPPORTUNITY_PIPELINE_NOT_MODELED` and `filter_no_match`
- audit event: `read_model_used`
- schemaVersion: `forge.backend.read_model.v1`
- freshness status: `preview_static`
- safety flags remain false

## Boundary Confirmation

No UI mutation.
No backend connection.
No CRM write.
No pipeline write.
No task creation.
No calendar creation.
No send.
No auth.
No provider execution.
No secret access.
No browser persistence.
No real engine execution.
MD2

cat > docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md <<'MD3'
# FORGE OPPORTUNITY PIPELINE READ ONLY ADAPTER QA LOCK CERTIFICATE 066C

Certificate: PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Phase: 066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Next: 066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

This certificate confirms that 066C completed QA lock for the 066B Opportunity Pipeline read-only adapter while preserving the 066B1 reconciliation decision.

066B remains a temporary local/static/read-only shim until canonical source mapping is scoped.

Real effects remain blocked.
MD3

cat > docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json <<'JSON066C'
{
  "phase": "066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK",
  "status": "PASS",
  "decision": "PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK",
  "next": "066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK",
  "reconciliationDependency": {
    "phase": "066B1_OPPORTUNITY_PIPELINE_EXISTING_MODULE_RECONCILIATION",
    "requiredDecision": "KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM",
    "statusAccepted": "PASS_OR_PASS_PREFIX",
    "realEffectsEnabled": false
  },
  "adapter": {
    "path": "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js",
    "adapterId": "forge.opportunity_pipeline.read_only.adapter.v1",
    "adapterType": "local_static_fixture",
    "adapterMode": "read_only",
    "routeClass": "read_only",
    "domainId": "opportunity_pipeline",
    "schemaVersion": "forge.backend.read_model.v1",
    "freshnessStatus": "preview_static",
    "auditEvent": "read_model_used",
    "safeErrorCode": "OPPORTUNITY_PIPELINE_NOT_MODELED",
    "fixtureCount": 2,
    "temporaryShimDecision": "KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM"
  },
  "safety": {
    "crmWrite": false,
    "pipelineWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
    "authReal": false,
    "providerRuntime": false,
    "secretAccess": false,
    "browserPersistence": false,
    "realEngineExecution": false,
    "realEffectsAllowed": false,
    "realEffectsEnabled": false,
    "backendConnection": false
  },
  "boundary": {
    "uiMutation": false,
    "backendConnection": false,
    "crmWrite": false,
    "pipelineWrite": false,
    "taskCreation": false,
    "calendarCreation": false,
    "messageSend": false,
    "auth": false,
    "providerExecution": false,
    "secretAccess": false,
    "browserPersistence": false,
    "realEngineExecution": false
  }
}
JSON066C
pass "docs and evidence written"

say_stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
block_file="$(mktemp)"
cat > "$block_file" <<'MDBLOCK'

<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START -->
## 066C Opportunity Pipeline Read-only Adapter QA Lock

Status: PASS
Decision: PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK
Next: 066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK

066C validates the 066B Opportunity Pipeline read-only adapter using the 066B1 reconciliation decision.
066B remains a temporary local/static/read-only shim until canonical source mapping is scoped.
No backend connection, writes, provider runtime, auth, secrets, browser persistence or real engine execution were enabled.
<!-- FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:END -->
MDBLOCK
append_block "FORGE_MASTER_BUILD_TREE.md" "FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START" "$block_file"
append_block "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" "FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START" "$block_file"
append_block "docs/roadmap/FORGE_ROADMAP_LOCK_001.md" "FORGE:066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK:START" "$block_file"
rm -f "$block_file"
pass "build tree and roadmap updated"

say_stage "STAGE 7 NORMALIZE FILES"
norm "${allowed_paths[@]}"
chmod +x tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh
pass "files normalized"

say_stage "STAGE 8 VALIDATION"
run_cmd bash -n tools/termux/forge_066c_opportunity_pipeline_read_only_adapter_qa_lock.sh
run_cmd node --check platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js
run_cmd node --check tests/opportunity-pipeline-read-only-adapter-066b-test.js
run_cmd node tests/opportunity-pipeline-read-only-adapter-066b-test.js
run_cmd python3 -m json.tool docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json
run_cmd rg -n "066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK|PASS_066C_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK|066D_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_DECISION_LOCK|KEEP_066B_AS_TEMPORARY_LOCAL_STATIC_SHIM" \
  docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md \
  docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md \
  docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md \
  docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
run_cmd git diff --check
pass "validation passed"

say_stage "STAGE 9 SAFETY SCAN"
safety_scan_files=(
  "platform/adapters/opportunity-pipeline/opportunity-pipeline-read-only-adapter-066b.js"
  "tests/opportunity-pipeline-read-only-adapter-066b-test.js"
  "docs/architecture/source-truth/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CLOSURE_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_066C.md"
  "docs/evidence/FORGE_OPPORTUNITY_PIPELINE_READ_ONLY_ADAPTER_QA_LOCK_CERTIFICATE_066C.md"
  "docs/evidence/forge-opportunity-pipeline-read-only-adapter-qa-audit-066c.json"
)
if rg -n "localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true" "${safety_scan_files[@]}"; then
  hold "safety scan found prohibited browser/network/action token"
fi
if rg -n '"?(crmWrite|pipelineWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection)"?\s*[:=]\s*true\b' "${safety_scan_files[@]}"; then
  hold "safety scan found real-effect marker set to true"
fi
pass "safety scan passed"

say_stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
TMPDIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
mkdir -p "$TMPDIR"
warn "screenshots not applicable for 066C adapter QA lock; no UI surface touched"

say_stage "STAGE 11 STAGE AUTHORIZED FILES"
run_cmd git add "${allowed_paths[@]}"
expected="$(expected_sorted "${allowed_paths[@]}")"
actual="$(git diff --cached --name-only | LC_ALL=C sort)"
echo "Expected staged files:"
echo "$expected"
echo "Actual staged files:"
echo "$actual"
unexpected="$(
  comm -13 \
    <(printf '%s\n' "${allowed_paths[@]}" | LC_ALL=C sort) \
    <(git diff --cached --name-only | LC_ALL=C sort)
)"
[[ -z "$unexpected" ]] || hold "staged files include unauthorized paths: $unexpected"
run_cmd git diff --cached --check
pass "authorized files staged only"

say_stage "STAGE 12 COMMIT PUSH"
if git diff --cached --quiet; then
  hold "no staged changes to commit"
fi
run_cmd git commit -m "$COMMIT_MESSAGE"
run_cmd git push origin HEAD:main
pass "commit pushed"

say_stage "STAGE 13 FINAL CHECKPOINT"
run_cmd git status --short --branch
run_cmd git log --oneline -10

say_stage "FINAL DECISION"
echo "PASS_${PHASE}_COMMIT_PUSH_COMPLETE"
echo "NEXT=$NEXT"
echo "BACKUP=$BACKUP_DIR"
echo "ROLLBACK=$ROLLBACK_SCRIPT"
echo "Reporte: $REPORT"
autocopy_report
