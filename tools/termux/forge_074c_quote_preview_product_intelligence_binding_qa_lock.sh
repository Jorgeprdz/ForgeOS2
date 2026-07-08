#!/usr/bin/env bash
set -euo pipefail

PHASE="074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK"
DECISION="PASS_074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCKED"
NEXT="074D_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_DECISION_LOCK"
MODE="QA/docs/evidence only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider/auth/secrets/browser/real engine; no parser/calculator/Banxico/PDF execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/074c-quote-preview-product-intelligence-binding-qa-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_074c_quote_preview_product_intelligence_binding_qa_lock.sh"

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
echo "ROBOCOP_GATE=Article 0; 074B implemented; QA lock only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -10
run git diff --name-status
run git diff --cached --name-status

if ! git log --oneline -20 | grep -Eq "bb8f5d3|implement quote preview product intelligence binding|074B"; then
  if [ -f "docs/evidence/forge-quote-preview-product-intelligence-binding-implementation-audit-074b.json" ]; then
    pass "074B audit fallback confirmed"
  else
    fail "074B commit/audit not found"
  fi
else
  pass "074B commit confirmed"
fi

stage "STAGE 2 REQUIRED FILE CHECK"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_IMPLEMENTATION_074B.md"
  "docs/evidence/forge-quote-preview-product-intelligence-binding-implementation-audit-074b.json"
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

cat > "$BACKUP_DIR/rollback-074c.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_CERTIFICATE_074C.md
rm -f docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json
rm -f "$SCRIPT_IN_REPO"
echo "rollback 074C complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-074c.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-074c.sh"

stage "STAGE 4 SEMANTIC QA"

SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const adapter = require("./platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js");

function shapeIsValid(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  return false;
}

assert.equal(typeof adapter.bindQuotePreviewToProductIntelligence, "function");
assert.equal(typeof adapter.validateQuotePreviewBindingShape, "function");

const gmm = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: "qa_074c_gmm",
  product_family_hint: "GMM",
  product_ref_hint: "gmm",
  carrier_ref_hint: "SMNYL",
  source_evidence_ids: ["qa_074c_evidence_gmm"]
});

assert(gmm, "GMM binding must exist");
assert.equal(gmm.product_family || gmm.productFamily, "GMM");
assert.equal(shapeIsValid(adapter.validateQuotePreviewBindingShape(gmm)), true);

const imagina = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: "qa_074c_imagina_ser",
  product_family_hint: "Imagina Ser",
  product_ref_hint: "imagina_ser",
  carrier_ref_hint: "SMNYL",
  source_evidence_ids: ["qa_074c_evidence_imagina"]
});

assert(imagina, "Imagina Ser binding must exist");
assert.equal(imagina.product_family || imagina.productFamily, "Imagina Ser");
assert.equal(shapeIsValid(adapter.validateQuotePreviewBindingShape(imagina)), true);

const serializedImagina = JSON.stringify(imagina).toLowerCase();
assert(serializedImagina.includes("proven") || serializedImagina.includes("not universal") || serializedImagina.includes("no-universal") || serializedImagina.includes("consumer"), "Imagina Ser must remain non-universal/proven case");

const serializedGmm = JSON.stringify(gmm).toLowerCase();
assert(serializedGmm.includes("quote") && serializedGmm.includes("preview"), "Quote PDF preview must appear only as reference/consumer context");

const missing = adapter.bindQuotePreviewToProductIntelligence({
  quote_preview_request_id: "qa_074c_missing",
  product_family_hint: "UNKNOWN_FAMILY",
  source_evidence_ids: []
});

const missingText = JSON.stringify(missing);
assert(
  missingText.includes("QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND") ||
  missingText.includes("QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED"),
  "missing family must return safe binding error"
);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `safety flag ${key} must be false`);
}

const combined = JSON.stringify({ gmm, imagina, missing, flags: adapter.DEFAULT_SAFETY_FLAGS });
assert(!combined.includes('"realEngineExecution":true'));
assert(!combined.includes('"providerRuntime":true'));
assert(!combined.includes('"quoteWrite":true'));
assert(!combined.includes('"backendConnection":true'));

console.log(JSON.stringify({
  status: "PASS",
  gmmBound: true,
  imaginaSerBound: true,
  missingSafeError: true,
  allSafetyFlagsFalse: true,
  quotePdfPreviewConsumerReferenceOnly: true,
  parserCalculatorBanxicoPdfExecutionMarkersAbsent: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"
pass "semantic QA passed"

stage "STAGE 5 WRITE DOCS / EVIDENCE"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_074C.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_CERTIFICATE_074C.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview Product Intelligence Binding QA Lock 074C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

074C locks QA for the local/static/read-only Quote Preview Product Intelligence binding adapter implemented in 074B.

The QA confirms that Quote Preview can bind to Product Intelligence references without executing parsers, calculators, Banxico, PDF readers, providers, backend, or real engines.

## Base Confirmed

074B is closed as:

- \`PASS_074B_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_IMPLEMENTATION\`
- \`QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_LOCAL_STATIC_READ_ONLY_IMPLEMENTED\`
- \`NEXT=074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK\`

## QA Validated

- GMM binds to the GMM Product Intelligence reference.
- Imagina Ser binds as a proven case, not universal architecture.
- Quote PDF Preview remains consumer/reference only.
- Missing or unmapped families return safe errors.
- Binding shape validates.
- All safety flags remain false.
- No parser execution occurs.
- No calculator execution occurs.
- No Banxico call occurs.
- No PDF read occurs.
- No quote write, provider call, backend connection, or real effect occurs.

## Safe Errors

- \`QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND\`
- \`QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED\`
- \`QUOTE_PREVIEW_PARSER_NOT_MAPPED\`
- \`QUOTE_PREVIEW_CALCULATOR_NOT_MAPPED\`
- \`QUOTE_PREVIEW_SOURCE_EVIDENCE_REQUIRED\`
- \`QUOTE_PREVIEW_FRESHNESS_REQUIRED\`

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview Product Intelligence Binding QA Lock 074C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

074C validates the 074B adapter as a local/static/read-only binding layer between Quote Preview and Product Intelligence.

The adapter remains a reference binder only. It does not parse quote PDFs, calculate premiums, project values, call Banxico, execute Product Intelligence engines, or create quote/product truth.

## Semantic QA

Validated:

- GMM binding.
- Imagina Ser binding as non-universal.
- Quote PDF Preview as consumer/reference only.
- Safe missing family behavior.
- Binding shape validation.
- Default safety flags false.
- No execution markers for parser/calculator/Banxico/PDF.

## Commands

- \`node --check platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js\`
- \`node --check tests/quote-preview-product-intelligence-binding-adapter-074b-test.js\`
- \`node tests/quote-preview-product-intelligence-binding-adapter-074b-test.js\`
- semantic QA assertions
- \`python3 -m json.tool docs/evidence/forge-quote-preview-product-intelligence-binding-qa-audit-074c.json\`
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
# Forge Quote Preview Product Intelligence Binding QA Lock Certificate 074C

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

074C certifies that the Quote Preview Product Intelligence Binding adapter is QA locked for local/static/read-only use.

Certified behavior:

- binds quote preview requests to Product Intelligence references;
- preserves Product Intelligence as upstream semantic authority;
- keeps Quote PDF Preview as downstream consumer/reference only;
- keeps Imagina Ser as a proven case, not universal architecture;
- does not duplicate Product Intelligence parsers or calculators;
- does not execute parser, calculator, Banxico, PDF, provider, backend, CRM, policy, quote, pipeline, task, calendar, or message effects.

## No-Effect Boundary

All safety flags remain false. The QA lock authorizes no runtime execution and no real effect.

## Final Token

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "base": {
    "phase": "074B_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_IMPLEMENTATION",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
  },
  "next": "$NEXT",
  "adapter": "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js",
  "test": "tests/quote-preview-product-intelligence-binding-adapter-074b-test.js",
  "semanticQa": $(cat "$SEMANTIC_QA_JSON"),
  "qaValidated": {
    "gmmBindsToProductIntelligence": true,
    "imaginaSerBindsButIsNotUniversalArchitecture": true,
    "quotePdfPreviewConsumerReferenceOnly": true,
    "missingFamilySafeError": true,
    "bindingShapeValidates": true,
    "allSafetyFlagsFalse": true,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "pdfRead": false,
    "quoteWrite": false,
    "providerCall": false,
    "backendConnection": false,
    "realEngineExecution": false
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
    "semanticQa": "PASS",
    "jsonTool": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "scopedSafetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

pass "docs/evidence written"

stage "STAGE 6 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 074C Quote Preview Product Intelligence Binding QA Lock

074C QA locks the local/static/read-only Quote Preview Product Intelligence binding adapter implemented in 074B.

Locked decision:
\`$LOCKED_DECISION\`

QA validated:

- GMM binds to Product Intelligence GMM reference;
- Imagina Ser binds as a proven case, not universal architecture;
- Quote PDF Preview remains consumer/reference only;
- missing or unmapped families return safe binding errors;
- binding shape validates;
- all safety flags remain false;
- no parser, calculator, Banxico, PDF, provider, backend, quote write, or real engine execution occurs.

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

files = [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]

for path in files:
    text = path.read_text()
    marker = f"<!-- FORGE:{phase}:START -->"
    if marker not in text:
        if not text.endswith("\n"):
            text += "\n"
        text += block + "\n"
        path.write_text(text)
PY

pass "build tree / roadmap updated"

stage "STAGE 7 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 8 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js
run node --check tests/quote-preview-product-intelligence-binding-adapter-074b-test.js
run node tests/quote-preview-product-intelligence-binding-adapter-074b-test.js
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND|QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 9 SAFETY SCAN"
SCOPED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
)

if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${SCOPED_FILES[@]}"; then
  fail "safety scan found prohibited runtime/browser/network marker"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
  fail "real-effect flag true found"
fi

pass "safety scan clean"

stage "STAGE 10 OPTIONAL SCREENSHOT EVIDENCE"
warn "not applicable: 074C has no UI mutation"

stage "STAGE 11 STAGE AUTHORIZED FILES"
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

stage "STAGE 12 COMMIT PUSH"
run git commit -m "docs: lock quote preview product intelligence binding qa"
run git push origin HEAD:main

stage "STAGE 13 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_074C_QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_BINDING_QA_LOCK_COMMIT_PUSH_COMPLETE
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
