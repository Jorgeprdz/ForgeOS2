#!/usr/bin/env bash
set -euo pipefail

PHASE="068B_POLICY_READ_MODEL_IMPLEMENTATION"
REPO="/storage/emulated/0/Forge OS"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_$(date +%Y%m%d_%H%M%S).md"

mkdir -p "$(dirname "$REPORT")"
exec > >(tee "$REPORT") 2>&1

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
copy_report(){ sync || true; command -v termux-clipboard-set >/dev/null 2>&1 && termux-clipboard-set < "$REPORT" || true; }
hold(){ printf "${YELLOW}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${PHASE}"; echo "Reporte: $REPORT"; copy_report; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }
need(){ [ -f "$1" ] || hold "missing required file: $1"; pass "$1"; }
norm(){ python3 - "$1" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
p.write_text("\n".join(x.rstrip() for x in s.splitlines()).rstrip()+"\n")
PY
}

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=local/static/read-only implementation"
echo "BOUNDARY=no UI mutation; no backend real; no CRM/policy/quote writes; no provider/auth/secrets/browser/real engine"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 068A scoped; implementation local/static only"

stage "STAGE 1 CHECKPOINT"
cd "$REPO" || hold "cannot cd repo"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status
git branch --show-current | grep -qx main || hold "not on main"
if git log --format='%h %s' -20 | grep -Eq '^b210935[[:space:]]+docs: scope policy read model$' || git log --format='%s' -20 | grep -Fxq 'docs: scope policy read model'; then
  pass "expected 068A commit observed"
elif python3 - <<'PY068A'
import json
from pathlib import Path

p = Path("docs/evidence/forge-policy-read-model-scope-audit-068a.json")
if not p.exists():
    raise SystemExit(1)

audit = json.loads(p.read_text())
if audit.get("phase") != "068A_POLICY_READ_MODEL_SCOPE":
    raise SystemExit(1)
if not str(audit.get("status", "")).startswith("PASS"):
    raise SystemExit(1)
if audit.get("lockedDecision") != "POLICY_READ_MODEL_SCOPED":
    raise SystemExit(1)

print("068A audit fallback confirmed")
PY068A
then
  pass "068A audit confirmed"
else
  hold "expected 068A commit or audit not found"
fi
pass "main and 068A confirmed"

stage "STAGE 2 REQUIRED FILE CHECK"
need "FORGE_MASTER_BUILD_TREE.md"
need "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
need "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
need "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_SCOPE_068A.md"
need "docs/evidence/forge-policy-read-model-scope-audit-068a.json"
[ -f "schemas/policy.schema.json" ] && pass "schemas/policy.schema.json" || warn "schema not found; continuing with local static contract"
[ -f "fixtures/policy-demo.json" ] && pass "fixtures/policy-demo.json" || warn "fixture not found; implementation will use internal preview fixtures"

stage "STAGE 3 BACKUP"
BACKUP=".forge-backups/068b-policy-read-model-implementation-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  mkdir -p "$BACKUP/$(dirname "$f")"; cp "$f" "$BACKUP/$f"; pass "backup $f"
done
cat > "$BACKUP/rollback-068b.sh" <<RB
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO"
cp "$BACKUP/FORGE_MASTER_BUILD_TREE.md" FORGE_MASTER_BUILD_TREE.md
cp "$BACKUP/docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md" docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md
cp "$BACKUP/docs/roadmap/FORGE_ROADMAP_LOCK_001.md" docs/roadmap/FORGE_ROADMAP_LOCK_001.md
rm -f platform/adapters/policy-read-model/policy-read-model-adapter-068b.js
rm -f tests/policy-read-model-adapter-068b-test.js
rm -f docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md
rm -f docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md
rm -f docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_CERTIFICATE_068B.md
rm -f docs/evidence/forge-policy-read-model-implementation-audit-068b.json
rm -f tools/termux/forge_068b_policy_read_model_implementation.sh
echo "Rollback 068B complete"
RB
chmod +x "$BACKUP/rollback-068b.sh"
pass "rollback created"

stage "STAGE 4 APPLY IMPLEMENTATION"
mkdir -p platform/adapters/policy-read-model tests docs/architecture/source-truth docs/evidence tools/termux

cp "${BASH_SOURCE[0]}" tools/termux/forge_068b_policy_read_model_implementation.sh

cat > platform/adapters/policy-read-model/policy-read-model-adapter-068b.js <<'JS'
'use strict';

const SCHEMA_VERSION = 'forge.backend.read_model.v1';
const SAFE_ERROR_CODE = 'POLICY_READ_MODEL_NOT_MODELED';

const safetyFlags = Object.freeze({
  crmWrite: false,
  pipelineWrite: false,
  policyWrite: false,
  quoteWrite: false,
  taskCreate: false,
  calendarCreate: false,
  messageSend: false,
  authReal: false,
  providerRuntime: false,
  secretAccess: false,
  browserPersistence: false,
  realEngineExecution: false,
  realEffectsAllowed: false,
  realEffectsEnabled: false,
  backendConnection: false
});

const blockedEffects = Object.freeze([
  'policy_create',
  'policy_update',
  'policy_delete',
  'policy_cancel',
  'policy_renew',
  'premium_real_claim',
  'coverage_truth_without_evidence',
  'provider_call',
  'crm_write',
  'pipeline_write',
  'quote_write',
  'task_create',
  'calendar_create',
  'message_send',
  'auth_real',
  'secret_access',
  'browser_persistence',
  'real_engine_execution'
]);

const policyFixtures = Object.freeze([
  Object.freeze({
    policy_id: 'policy_preview_lariza_gmm',
    client_ref: { entity_type: 'client', entity_id: 'client_preview_lariza' },
    display_name: 'Lariza GMM policy preview',
    policy_type: 'gmm',
    carrier_ref: { source: 'preview_static', display_name: 'carrier pending evidence' },
    policy_status: 'modeled_preview',
    coverage_summary: 'Coverage summary pending canonical evidence',
    effective_date: null,
    expiration_date: null,
    renewal_state: 'unknown_source_pending_mapping',
    premium_preview: { amount: null, currency: null, status: 'not_modeled' },
    payment_state: 'unknown_source_pending_mapping',
    document_refs: ['policy_evidence_preview_lariza_gmm'],
    opportunity_refs: ['opp_preview_lariza_review'],
    quote_refs: [],
    advisor_notes_refs: [],
    risk_flags: ['missing_effective_dates', 'premium_not_modeled'],
    next_action: { type: 'review_policy_evidence', label: 'Review policy evidence before treating as fact' },
    source_evidence_ids: ['policy_evidence_preview_lariza_gmm'],
    freshness_metadata: { status: 'preview_static', checked_at: null },
    audit_event: 'read_model_used',
    blocked_effects: blockedEffects,
    safety_flags: safetyFlags
  }),
  Object.freeze({
    policy_id: 'policy_preview_octavio_life',
    client_ref: { entity_type: 'client', entity_id: 'client_preview_octavio' },
    display_name: 'Octavio life policy preview',
    policy_type: 'life',
    carrier_ref: { source: 'preview_static', display_name: 'carrier pending evidence' },
    policy_status: 'modeled_preview',
    coverage_summary: 'Policy detail pending source ownership',
    effective_date: null,
    expiration_date: null,
    renewal_state: 'unknown_source_pending_mapping',
    premium_preview: { amount: null, currency: null, status: 'not_modeled' },
    payment_state: 'unknown_source_pending_mapping',
    document_refs: ['policy_evidence_preview_octavio_life'],
    opportunity_refs: ['opp_preview_octavio_open'],
    quote_refs: [],
    advisor_notes_refs: [],
    risk_flags: ['source_ownership_pending'],
    next_action: { type: 'confirm_policy_source', label: 'Confirm canonical policy source before use' },
    source_evidence_ids: ['policy_evidence_preview_octavio_life'],
    freshness_metadata: { status: 'preview_static', checked_at: null },
    audit_event: 'read_model_used',
    blocked_effects: blockedEffects,
    safety_flags: safetyFlags
  })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPolicyReadModelManifest() {
  return {
    adapterId: 'forge.policy.read_model.adapter.v1',
    adapterType: 'local_static_fixture',
    adapterMode: 'read_only',
    routeClass: 'read_only',
    domainId: 'policy',
    schemaVersion: SCHEMA_VERSION,
    freshness: { status: 'preview_static' },
    canonicalPolicyTruthClaimed: false,
    safeErrorCode: SAFE_ERROR_CODE,
    safetyFlags: clone(safetyFlags),
    blockedEffects: clone(blockedEffects)
  };
}

function buildEnvelope({ records, emptyState = null, error = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: 'policy',
    routeClass: 'read_only',
    readModel: {
      status: error ? 'error' : emptyState ? 'empty' : 'ok',
      records,
      emptyState,
      error
    },
    audit: {
      event: 'read_model_used',
      source: 'forge.policy.read_model.adapter.v1'
    },
    freshness: { status: 'preview_static' },
    blockedEffects: clone(blockedEffects),
    safetyFlags: clone(safetyFlags),
    canonicalPolicyTruthClaimed: false
  };
}

function listPolicies() {
  return buildEnvelope({ records: clone(policyFixtures) });
}

function getPolicyDetail(policyId) {
  if (!policyId || typeof policyId !== 'string') {
    return buildEnvelope({
      records: [],
      error: { code: SAFE_ERROR_CODE, message: 'Policy id is required for preview read model detail.' }
    });
  }

  const found = policyFixtures.find((policy) => policy.policy_id === policyId);
  if (!found) {
    return buildEnvelope({
      records: [],
      emptyState: { reason: 'filter_no_match', policy_id: policyId },
      error: { code: SAFE_ERROR_CODE, message: 'Policy is not modeled in local static preview.' }
    });
  }

  return buildEnvelope({ records: [clone(found)] });
}

module.exports = {
  SAFE_ERROR_CODE,
  getPolicyReadModelManifest,
  listPolicies,
  getPolicyDetail
};
JS

cat > tests/policy-read-model-adapter-068b-test.js <<'JS'
'use strict';

const assert = require('assert');
const {
  SAFE_ERROR_CODE,
  getPolicyReadModelManifest,
  listPolicies,
  getPolicyDetail
} = require('../platform/adapters/policy-read-model/policy-read-model-adapter-068b');

function assertAllSafetyFlagsFalse(flags) {
  for (const [key, value] of Object.entries(flags)) {
    assert.strictEqual(value, false, `${key} must be false`);
  }
}

const manifest = getPolicyReadModelManifest();
assert.strictEqual(manifest.adapterId, 'forge.policy.read_model.adapter.v1');
assert.strictEqual(manifest.adapterType, 'local_static_fixture');
assert.strictEqual(manifest.adapterMode, 'read_only');
assert.strictEqual(manifest.routeClass, 'read_only');
assert.strictEqual(manifest.domainId, 'policy');
assert.strictEqual(manifest.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(manifest.freshness.status, 'preview_static');
assert.strictEqual(manifest.canonicalPolicyTruthClaimed, false);
assert.strictEqual(manifest.safeErrorCode, SAFE_ERROR_CODE);
assertAllSafetyFlagsFalse(manifest.safetyFlags);

const list = listPolicies();
assert.strictEqual(list.schemaVersion, 'forge.backend.read_model.v1');
assert.strictEqual(list.readModel.status, 'ok');
assert.strictEqual(list.readModel.records.length, 2);
assert.strictEqual(list.audit.event, 'read_model_used');
assert.strictEqual(list.freshness.status, 'preview_static');
assert.strictEqual(list.canonicalPolicyTruthClaimed, false);
assertAllSafetyFlagsFalse(list.safetyFlags);

for (const policy of list.readModel.records) {
  assert.ok(policy.policy_id);
  assert.ok(policy.client_ref.entity_id);
  assert.ok(policy.source_evidence_ids.length > 0);
  assert.ok(policy.freshness_metadata.status);
  assert.strictEqual(policy.audit_event, 'read_model_used');
  assertAllSafetyFlagsFalse(policy.safety_flags);
  assert.ok(policy.blocked_effects.includes('policy_update'));
  assert.notStrictEqual(policy.premium_preview.status, 'real_fact');
}

const lariza = getPolicyDetail('policy_preview_lariza_gmm');
assert.strictEqual(lariza.readModel.records[0].client_ref.entity_id, 'client_preview_lariza');
assert.strictEqual(lariza.readModel.records[0].policy_type, 'gmm');

const missing = getPolicyDetail('policy_missing');
assert.strictEqual(missing.readModel.status, 'error');
assert.strictEqual(missing.readModel.emptyState.reason, 'filter_no_match');
assert.strictEqual(missing.readModel.error.code, 'POLICY_READ_MODEL_NOT_MODELED');

const invalid = getPolicyDetail();
assert.strictEqual(invalid.readModel.error.code, 'POLICY_READ_MODEL_NOT_MODELED');

console.log('PASS policy read model adapter 068B');
JS

pass "implementation and test written"

stage "STAGE 5 WRITE DOCS / EVIDENCE"
cat > docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md <<'MD'
# Forge Policy Read Model Implementation 068B

Phase: `068B_POLICY_READ_MODEL_IMPLEMENTATION`

Decision: `PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION`

Locked decision: `POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED`

068B implements a local/static/read-only Policy Read Model adapter.

## Files

- `platform/adapters/policy-read-model/policy-read-model-adapter-068b.js`
- `tests/policy-read-model-adapter-068b-test.js`

## Boundary

The adapter is not canonical Policy Truth. It does not issue, mutate, cancel, renew, price, or validate policies as real facts.

It does not connect backend, provider, CRM, quote, task, calendar, message, auth, secrets, browser persistence, or real engine execution.

Safe error: `POLICY_READ_MODEL_NOT_MODELED`

NEXT=068C_POLICY_READ_MODEL_QA_LOCK
MD

cat > docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md <<'MD'
# Evidence 068B

Phase: `068B_POLICY_READ_MODEL_IMPLEMENTATION`

Result: `PASS`

Evidence:
- local/static read-only adapter created;
- two preview policy fixtures modeled;
- safe empty/error behavior implemented;
- evidence and freshness included for non-empty records;
- all safety flags false;
- tests added.

DECISION=PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION

LOCKED_DECISION=POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED

NEXT=068C_POLICY_READ_MODEL_QA_LOCK
MD

cat > docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_CERTIFICATE_068B.md <<'MD'
# Certificate 068B

DECISION=PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION

LOCKED_DECISION=POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED

NEXT=068C_POLICY_READ_MODEL_QA_LOCK

No UI mutation. No backend real. No CRM write. No policy write. No quote write. No provider. No auth. No secrets. No browser persistence. No real engine execution.
MD

cat > docs/evidence/forge-policy-read-model-implementation-audit-068b.json <<'JSON'
{
  "phase": "068B_POLICY_READ_MODEL_IMPLEMENTATION",
  "status": "PASS",
  "decision": "PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION",
  "lockedDecision": "POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED",
  "basePhase": "068A_POLICY_READ_MODEL_SCOPE",
  "baseCommit": "b210935",
  "adapter": "platform/adapters/policy-read-model/policy-read-model-adapter-068b.js",
  "test": "tests/policy-read-model-adapter-068b-test.js",
  "adapterId": "forge.policy.read_model.adapter.v1",
  "adapterType": "local_static_fixture",
  "adapterMode": "read_only",
  "routeClass": "read_only",
  "domainId": "policy",
  "schemaVersion": "forge.backend.read_model.v1",
  "freshnessStatus": "preview_static",
  "safeErrorCode": "POLICY_READ_MODEL_NOT_MODELED",
  "canonicalPolicyTruthClaimed": false,
  "policyWrite": false,
  "crmWrite": false,
  "pipelineWrite": false,
  "quoteWrite": false,
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
  "backendConnection": false,
  "next": "068C_POLICY_READ_MODEL_QA_LOCK"
}
JSON
pass "docs/evidence written"

stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"
python3 - <<'PY'
from pathlib import Path
block = """<!-- FORGE:068B_POLICY_READ_MODEL_IMPLEMENTATION:START -->
## 068B Policy Read Model Implementation

Status: PASS

Locked decision:

`POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED`

Implemented:
- `platform/adapters/policy-read-model/policy-read-model-adapter-068b.js`
- `tests/policy-read-model-adapter-068b-test.js`

Boundary:
- local/static/read-only only;
- no canonical policy truth;
- no policy issuance or mutation;
- no backend/provider/auth/secrets/browser persistence;
- no CRM/pipeline/policy/quote writes;
- safe error `POLICY_READ_MODEL_NOT_MODELED`;
- schema `forge.backend.read_model.v1`;
- all safety flags false.

DECISION=PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION

LOCKED_DECISION=POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED

NEXT=068C_POLICY_READ_MODEL_QA_LOCK
<!-- FORGE:068B_POLICY_READ_MODEL_IMPLEMENTATION:END -->
"""
for file in ["FORGE_MASTER_BUILD_TREE.md","docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md","docs/roadmap/FORGE_ROADMAP_LOCK_001.md"]:
    p=Path(file); text=p.read_text()
    start="<!-- FORGE:068B_POLICY_READ_MODEL_IMPLEMENTATION:START -->"
    end="<!-- FORGE:068B_POLICY_READ_MODEL_IMPLEMENTATION:END -->"
    if start in text and end in text:
        before, rest=text.split(start,1); _, after=rest.split(end,1)
        text=before.rstrip()+"\n\n"+block+after.lstrip("\n")
    else:
        text=text.rstrip()+"\n\n"+block
    p.write_text(text)
PY
pass "build tree / roadmap updated"

stage "STAGE 7 NORMALIZE FILES"
allowed=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/adapters/policy-read-model/policy-read-model-adapter-068b.js"
  "tests/policy-read-model-adapter-068b-test.js"
  "docs/architecture/source-truth/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md"
  "docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_068B.md"
  "docs/evidence/FORGE_POLICY_READ_MODEL_IMPLEMENTATION_CERTIFICATE_068B.md"
  "docs/evidence/forge-policy-read-model-implementation-audit-068b.json"
  "tools/termux/forge_068b_policy_read_model_implementation.sh"
)
for f in "${allowed[@]}"; do norm "$f"; done
pass "normalized files"

stage "STAGE 8 VALIDATION"
run bash -n tools/termux/forge_068b_policy_read_model_implementation.sh
run node --check platform/adapters/policy-read-model/policy-read-model-adapter-068b.js
run node --check tests/policy-read-model-adapter-068b-test.js
run node tests/policy-read-model-adapter-068b-test.js
run python3 -m json.tool docs/evidence/forge-policy-read-model-implementation-audit-068b.json
run rg -n "068B_POLICY_READ_MODEL_IMPLEMENTATION|PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION|POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED|POLICY_READ_MODEL_NOT_MODELED|068C_POLICY_READ_MODEL_QA_LOCK" "${allowed[@]:0:9}"
run git diff --check

stage "STAGE 9 SAFETY SCAN"
scan=("${allowed[@]:0:9}")
if rg -n "localStorage|sessionStorage|fetch\\(|XMLHttpRequest|navigator\\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\\s*true|networkCallsAllowed:\\s*true|browserStorageEnabled:\\s*true|mayCreateTruth:\\s*true|maySendMessage:\\s*true|mayWriteCrm:\\s*true|mayCreateCalendarEvent:\\s*true" "${scan[@]}"; then hold "browser/runtime/action token found"; fi
if rg -n "crmWrite: true|pipelineWrite: true|policyWrite: true|quoteWrite: true|taskCreate: true|calendarCreate: true|messageSend: true|authReal: true|providerRuntime: true|secretAccess: true|browserPersistence: true|realEngineExecution: true|realEffectsAllowed: true|realEffectsEnabled: true|backendConnection: true|\\\"crmWrite\\\": true|\\\"pipelineWrite\\\": true|\\\"policyWrite\\\": true|\\\"quoteWrite\\\": true|\\\"taskCreate\\\": true|\\\"calendarCreate\\\": true|\\\"messageSend\\\": true|\\\"authReal\\\": true|\\\"providerRuntime\\\": true|\\\"secretAccess\\\": true|\\\"browserPersistence\\\": true|\\\"realEngineExecution\\\": true|\\\"realEffectsAllowed\\\": true|\\\"realEffectsEnabled\\\": true|\\\"backendConnection\\\": true" "${scan[@]}"; then hold "enabled real-effect marker found"; fi
pass "safety scan clean"

stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 068B has no UI mutation"

stage "STAGE 11 STAGE AUTHORIZED FILES"
git add "${allowed[@]}"
run git diff --cached --name-only
exp="$(mktemp)"; act="$(mktemp)"
printf "%s\n" "${allowed[@]}" | sort > "$exp"
git diff --cached --name-only | sort > "$act"
diff -u "$exp" "$act" || hold "staged set differs from authorized files"
rm -f "$exp" "$act"
pass "only authorized files staged"
run git diff --cached --check

stage "STAGE 12 COMMIT PUSH"
git diff --cached --quiet && hold "nothing staged for commit"
run git commit -m "feat: implement policy read model adapter"
run git push origin HEAD:main

stage "STAGE 13 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

stage "FINAL DECISION"
echo "PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION_COMMIT_PUSH_COMPLETE"
echo "DECISION=PASS_068B_POLICY_READ_MODEL_IMPLEMENTATION"
echo "LOCKED_DECISION=POLICY_READ_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
echo "NEXT=068C_POLICY_READ_MODEL_QA_LOCK"
echo "BACKUP=$BACKUP"
echo "ROLLBACK=$BACKUP/rollback-068b.sh"
echo "Reporte: $REPORT"
copy_report
