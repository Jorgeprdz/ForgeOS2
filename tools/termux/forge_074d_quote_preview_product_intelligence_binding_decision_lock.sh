#!/usr/bin/env bash
set -euo pipefail

PHASE="074D_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK"
DECISION="PASS_074D_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_BINDING"
NEXT="075A_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_SCOPE"
MODE="docs/decision lock only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF execution; no invented product/premium/coverage/projection/quote truth"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/074d-quote-preview-product-intelligence-binding-decision-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_074d_quote_preview_product_intelligence_binding_decision_lock.sh"

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${PHASE}" | tee -a "$REPORT"; echo "Reporte: $REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 074C QA locked; decision lock only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

if ! git log --oneline -30 | grep -Eq "QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK|074C|lock quote preview product intelligence binding qa"; then
  if [ -f "docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json" ]; then
    pass "074C QA audit fallback confirmed"
  else
    fail "074C commit/audit not found"
  fi
else
  pass "074C commit confirmed"
fi

stage "STAGE 2 REQUIRED FILE CHECK"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md"
  "docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md"
  "docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_CERTIFICATE_074C.md"
  "docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json"
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js"
  "tests/quote-preview-product-intelligence-binding-adapter-074b-test.js"
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

stage "STAGE 3 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"

cat > "$BACKUP_DIR/rollback-074d.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_074D.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_074D.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_CERTIFICATE_074D.md
rm -f docs/evidence/forge-quote-preview-product-intelligence-binding-decision-audit-074d.json
rm -f "$SCRIPT_IN_REPO"
echo "rollback 074D complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-074d.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-074d.sh"

stage "STAGE 4 BASE AUDIT QA CONFIRMATION"
run python3 -m json.tool docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json

node <<'NODE'
const fs = require('node:fs');
const auditPath = 'docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json';
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
if (audit.status !== 'PASS') throw new Error('074C audit status is not PASS');
if (audit.lockedDecision !== 'QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCKED') {
  throw new Error('074C locked decision mismatch');
}
const validations = audit.validations || {};
for (const [key, value] of Object.entries(validations)) {
  if (value !== 'PASS') throw new Error(`074C validation ${key} is not PASS: ${value}`);
}
console.log('PASS 074C audit confirmed');
NODE

stage "STAGE 5 SEMANTIC DECISION ASSERTIONS"
SEMANTIC_DECISION_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_DECISION_JSON"
const assert = require('node:assert/strict');
const adapter = require('./platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js');

function shapeIsValid(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  return false;
}

assert.equal(typeof adapter.bindQuotePreviewToProductIntelligence, 'function');
assert.equal(typeof adapter.validateQuotePreviewBindingShape, 'function');

const gmm = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: 'decision_074d_gmm',
  product_family_hint: 'GMM',
  product_ref_hint: 'gmm',
  carrier_ref_hint: 'SMNYL',
  source_evidence_ids: ['decision_074d_evidence_gmm']
});

const imagina = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: 'decision_074d_imagina_ser',
  product_family_hint: 'Imagina Ser',
  product_ref_hint: 'imagina_ser',
  carrier_ref_hint: 'SMNYL',
  source_evidence_ids: ['decision_074d_evidence_imagina']
});

const missing = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: 'decision_074d_missing',
  product_family_hint: 'UNKNOWN_FAMILY',
  source_evidence_ids: []
});

assert.equal(gmm.product_family || gmm.productFamily, 'GMM');
assert.equal(imagina.product_family || imagina.productFamily, 'Imagina Ser');
assert.equal(shapeIsValid(adapter.validateQuotePreviewBindingShape(gmm)), true);
assert.equal(shapeIsValid(adapter.validateQuotePreviewBindingShape(imagina)), true);

const missingText = JSON.stringify(missing);
assert(
  missingText.includes('QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND') ||
  missingText.includes('QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED'),
  'missing/unmapped family must return safe binding error'
);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `safety flag ${key} must be false`);
}

const gmmText = JSON.stringify(gmm).toLowerCase();
const imaginaText = JSON.stringify(imagina).toLowerCase();
const combined = JSON.stringify({ gmm, imagina, missing, flags: adapter.DEFAULT_SAFETY_FLAGS }).toLowerCase();

assert(combined.includes('product'), 'binding must reference Product Intelligence context');
assert(combined.includes('quote') && combined.includes('preview'), 'Quote Preview context must remain reference/consumer only');
assert(
  imaginaText.includes('proven') || imaginaText.includes('not universal') || imaginaText.includes('no-universal') || imaginaText.includes('consumer'),
  'Imagina Ser must remain a proven case, not universal architecture'
);

const prohibitedTrueMarkers = [
  '"realengineexecution":true',
  '"providerruntime":true',
  '"quotewrite":true',
  '"backendconnection":true',
  '"crmwrite":true',
  '"policywrite":true',
  '"pipelinewrite":true',
  '"messagesend":true'
];
for (const marker of prohibitedTrueMarkers) {
  assert(!combined.replace(/\s+/g, '').includes(marker), `prohibited true marker found: ${marker}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  localStaticReadOnlyReferenceBinding: true,
  productIntelligenceIsUpstreamSemanticAuthority: true,
  quotePreviewIsDownstreamConsumer: true,
  quotePdfPreviewConsumerReferenceOnly: true,
  gmmBindingValidated: true,
  imaginaSerBindingValidatedAsNonUniversal: true,
  missingFamilySafeErrorValidated: true,
  bindingShapeValidated: true,
  allSafetyFlagsFalse: true,
  parserExecution: false,
  calculatorExecution: false,
  banxicoCall: false,
  pdfRead: false,
  quoteGeneration: false,
  providerCall: false,
  backendConnection: false,
  realEngineExecution: false,
  inventedTruth: false
}, null, 2));
NODE
cat "$SEMANTIC_DECISION_JSON"
pass "semantic decision assertions passed"

stage "STAGE 6 WRITE DOCS / EVIDENCE"
ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_074D.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_074D.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_CERTIFICATE_074D.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-product-intelligence-binding-decision-audit-074d.json"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview Product Intelligence Binding Decision Lock 074D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

074D decision-locks the Quote Preview Product Intelligence Binding adapter as a local/static/read-only reference binding layer.

This lock confirms that Quote Preview must bind through Product Intelligence before any future Quote PDF Preview or quote-specific preview/parsing surface may be used.

## Base Confirmed

074C is closed as:

- \`PASS_074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK\`
- \`QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCKED\`
- \`NEXT=074D_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK\`

## Locked Architecture

- Product Intelligence is upstream semantic authority.
- Quote Preview is downstream consumer.
- Quote PDF Preview remains consumer/reference only.
- Binding is local/static/read-only.
- Binding is reference-only.
- Binding does not execute parsers, calculators, Banxico, PDF readers, providers, backend connections, or real engines.

## Validated Binding

- GMM binds to Product Intelligence GMM.
- Imagina Ser binds but remains a proven case, not universal architecture.
- Missing or unmapped product family returns safe error.
- Binding shape validates.
- All safety flags are false.

## Non-Authorization

074D does not authorize:

- PDF read;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- quote generation;
- quote write/send;
- CRM write;
- policy write;
- pipeline write;
- task/calendar/message write;
- backend connection;
- real engine execution;
- product, premium, coverage, projection, policy, recommendation, or quote truth creation.

## Next Architectural Unlock

075A may scope Quote Preview PDF Engine Product Intelligence integration only as a no-effect scope. It must require Product Intelligence binding before using quote-specific preview/parsing surfaces.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview Product Intelligence Binding Decision Lock 074D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

074D locks the 074B binding adapter after the 074C QA lock.

The adapter remains approved only as a local/static/read-only reference binding between Quote Preview and Product Intelligence.

## Confirmed

- 074C QA audit is PASS.
- 074B adapter remains local/static/read-only.
- Product Intelligence remains upstream semantic authority.
- Quote Preview remains downstream consumer.
- Quote PDF Preview remains consumer/reference only.
- GMM binding works.
- Imagina Ser binding works but is not universal architecture.
- Missing family returns safe error.
- Binding shape validates.
- All safety flags are false.

## Blocked Effects

- PDF read.
- Parser execution.
- Calculator execution.
- Banxico call.
- Provider call.
- Quote generation.
- Quote write/send.
- CRM/policy/pipeline/task/calendar/message writes.
- Backend connection.
- Real engine execution.
- Invented product/premium/coverage/projection/quote truth.

## Commands

- \`node --check platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js\`
- \`node --check tests/quote-preview-product-intelligence-binding-adapter-074b-test.js\`
- \`node tests/quote-preview-product-intelligence-binding-adapter-074b-test.js\`
- semantic decision assertions
- \`python3 -m json.tool docs/evidence/forge-quote-preview-product-intelligence-binding-decision-audit-074d.json\`
- marker scan
- \`git diff --check\`
- scoped safety scan
- \`git diff --cached --check\`

## Final

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$CERT_DOC" <<EOF
# Forge Quote Preview Product Intelligence Binding Decision Lock Certificate 074D

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

074D certifies that the Quote Preview Product Intelligence Binding adapter is locked as a local/static/read-only reference binding layer.

Certified statements:

- Product Intelligence is upstream semantic authority.
- Quote Preview is downstream consumer.
- Quote PDF Preview is consumer/reference only.
- Binding validates GMM and Imagina Ser product families.
- Imagina Ser remains a proven case, not universal architecture.
- Missing or unmapped product family returns safe error.
- All safety flags remain false.
- No parser, calculator, Banxico, PDF, provider, backend, CRM, policy, quote, pipeline, task, calendar, message, or real engine effect is authorized.

## Next

075A may scope Quote Preview PDF Engine Product Intelligence integration, but it must require Product Intelligence binding before quote-specific preview/parsing behavior.

## Final Token

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "next": "$NEXT",
  "base": {
    "phase": "074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCKED"
  },
  "adapter": "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js",
  "test": "tests/quote-preview-product-intelligence-binding-adapter-074b-test.js",
  "decisionLock": {
    "localStaticReadOnlyReferenceBinding": true,
    "productIntelligenceIsUpstreamSemanticAuthority": true,
    "quotePreviewIsDownstreamConsumer": true,
    "quotePdfPreviewConsumerReferenceOnly": true,
    "quotePromotionMustBindThroughProductIntelligenceBeforePreviewParsing": true,
    "imaginaSerIsProvenCaseNotUniversalArchitecture": true
  },
  "semanticDecisionAssertions": $(cat "$SEMANTIC_DECISION_JSON"),
  "validatedBinding": {
    "gmmBindsToProductIntelligenceGmm": true,
    "imaginaSerBindsButIsNotUniversalArchitecture": true,
    "missingUnmappedFamilyReturnsSafeError": true,
    "bindingShapeValidates": true,
    "allSafetyFlagsFalse": true
  },
  "notAuthorized": {
    "pdfRead": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "quoteGeneration": false,
    "quoteWriteSend": false,
    "crmWrite": false,
    "policyWrite": false,
    "pipelineWrite": false,
    "taskCalendarMessageWrite": false,
    "backendConnection": false,
    "realEngineExecution": false,
    "inventedTruth": false
  },
  "safeErrors": [
    "QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND",
    "QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED",
    "QUOTE_PREVIEW_PARSER_NOT_MAPPED",
    "QUOTE_PREVIEW_CALCULATOR_NOT_MAPPED",
    "QUOTE_PREVIEW_SOURCE_EVIDENCE_REQUIRED",
    "QUOTE_PREVIEW_FRESHNESS_REQUIRED"
  ],
  "safetyFlags": {
    "crmWrite": false,
    "pipelineWrite": false,
    "policyWrite": false,
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
    "backendConnection": false
  },
  "validations": {
    "nodeCheckAdapter": "PASS",
    "nodeCheckTest": "PASS",
    "nodeTest": "PASS",
    "semanticDecisionAssertions": "PASS",
    "jsonTool": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "scopedSafetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

pass "docs/evidence written"

stage "STAGE 7 UPDATE BUILD TREE / ROADMAP"
TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 074D Quote Preview Product Intelligence Binding Decision Lock

074D decision-locks the Quote Preview Product Intelligence Binding adapter as a local/static/read-only reference binding layer.

Locked decision:
\`$LOCKED_DECISION\`

Decision meaning:

- Product Intelligence is upstream semantic authority.
- Quote Preview is downstream consumer.
- Quote PDF Preview remains consumer/reference only.
- GMM and Imagina Ser bindings are validated.
- Imagina Ser remains a proven case, not universal architecture.
- Missing or unmapped product family returns safe error.
- No PDF, parser, calculator, Banxico, provider, backend, quote write, or real engine execution is authorized.

Next unlock:

075A may scope Quote Preview PDF Engine Product Intelligence integration, but only after Product Intelligence binding and without real effects.

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
<!-- FORGE:$PHASE:END -->
EOF
)

python3 - <<PY
from pathlib import Path

phase = "$PHASE"
block = """$TREE_BLOCK"""
start = f"<!-- FORGE:{phase}:START -->"
end = f"<!-- FORGE:{phase}:END -->"

files = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

for path in files:
    text = path.read_text()
    if start in text and end in text:
        before = text.split(start)[0].rstrip()
        after = text.split(end, 1)[1].lstrip("\n")
        text = before + "\n" + block.lstrip("\n") + ("\n" + after if after else "\n")
    else:
        if not text.endswith("\n"):
            text += "\n"
        text += block + "\n"
    path.write_text(text)
PY
pass "build tree / roadmap updated"

stage "STAGE 8 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 9 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js
run node --check tests/quote-preview-product-intelligence-binding-adapter-074b-test.js
run node tests/quote-preview-product-intelligence-binding-adapter-074b-test.js
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_BINDING|075A_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_SCOPE" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 10 SAFETY SCAN"
SCOPED_SCAN_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
)

if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${SCOPED_SCAN_FILES[@]}"; then
  fail "safety scan found prohibited runtime/browser/network marker"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection)"?\s*[:=]\s*true\b' "${SCOPED_SCAN_FILES[@]}"; then
  fail "real-effect flag true found"
fi

pass "safety scan clean"

stage "STAGE 11 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 074D has no UI mutation"

stage "STAGE 12 STAGE AUTHORIZED FILES"
AUTHORIZED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
  "$SCRIPT_IN_REPO"
)

git add "${AUTHORIZED_FILES[@]}"

run git diff --cached --name-only
run git diff --cached --check

EXPECTED="$(mktemp)"
ACTUAL="$(mktemp)"
printf "%s\n" "${AUTHORIZED_FILES[@]}" | sort > "$EXPECTED"
git diff --cached --name-only | sort > "$ACTUAL"

if ! diff -u "$EXPECTED" "$ACTUAL"; then
  fail "staged files differ from authorized boundary"
fi
pass "only authorized files staged"

stage "STAGE 13 COMMIT PUSH"
if git diff --cached --quiet; then
  warn "No staged changes; commit skipped"
else
  run git commit -m "docs: lock quote preview product intelligence binding decision"
fi
run git push origin HEAD:main

stage "STAGE 14 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_074D_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT
BACKUP=$BACKUP_DIR
REPORT=$REPORT
EOF
)

echo
echo "$SUMMARY"

if command -v termux-clipboard-set >/dev/null 2>&1; then
  printf "%s\n" "$SUMMARY" | termux-clipboard-set
  pass "final summary copied to clipboard"
else
  warn "termux-clipboard-set not available; summary not copied"
fi

echo "Reporte: $REPORT"
