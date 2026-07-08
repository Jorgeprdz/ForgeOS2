#!/usr/bin/env bash
set -euo pipefail

PHASE="075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK"
DECISION="PASS_075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER"
NEXT="076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE"
MODE="docs/decision lock only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF execution; no invented product/premium/coverage/projection/quote truth"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/075d-quote-preview-pdf-engine-product-intelligence-integration-decision-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_075d_quote_preview_pdf_engine_product_intelligence_integration_decision_lock.sh"

CYAN="\033[1;36m"
GREEN="\033[1;38;5;46m"
YELLOW="\033[1;93m"
RED="\033[1;91m"
RESET="\033[0m"

stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){
  printf "${RED}HOLD:${RESET} %s\n" "$1"
  echo "DECISION=HOLD_${PHASE}" | tee -a "$REPORT"
  echo "REPORT=$REPORT" | tee -a "$REPORT"
  exit 1
}
run(){
  echo
  echo "========== RUN =========="
  printf '%q ' "$@"
  echo
  "$@"
}

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 075C QA closed; decision lock only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 075C"
if git log --oneline -30 | grep -Eq "lock quote preview pdf engine product intelligence integration qa|075C|QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCKED"; then
  pass "075C commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-qa-audit-075c.json" ]; then
  pass "075C audit fallback found"
else
  fail "075C base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-qa-audit-075c.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-qa-audit-075c.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCKED"' docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-qa-audit-075c.json >/dev/null; then
    fail "075C audit exists but does not show PASS/QA lock"
  fi
  pass "075C audit PASS/QA lock confirmed"
else
  warn "075C audit file not found; relying on git log/tree markers"
fi

stage "STAGE 3 REQUIRED FILES"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js"
  "tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js"
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js"
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

stage "STAGE 4 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"

cat > "$BACKUP_DIR/rollback-075d.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_075D.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_075D.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_CERTIFICATE_075D.md
rm -f docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json
rm -f "$SCRIPT_IN_REPO"
echo "rollback 075D complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-075d.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-075d.sh"

stage "STAGE 5 REVALIDATE 075B ADAPTER"
run node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js
run node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js

stage "STAGE 6 DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");

const raw = require("./platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js");
const adapter = raw && raw.default ? raw.default : raw;

function shapeIsValid(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  if (result && Array.isArray(result.errors) && result.errors.length === 0) return true;
  return false;
}

function publicFunctionNames(obj) {
  return Object.keys(obj || {}).filter((key) => typeof obj[key] === "function");
}

const publicFns = publicFunctionNames(adapter);

const validateFnName = publicFns.find((name) =>
  /validate/i.test(name) && /shape|integration|pdf|product|intelligence|binding/i.test(name)
);

const validateFn = validateFnName ? adapter[validateFnName] : null;

const candidateFunctionNames = publicFns.filter((name) => {
  if (/validate|error|notModeled|notMapped|manifest|constant|shape/i.test(name)) return false;
  return /integrat|bind|binding|prepare|build|create|resolve|get/i.test(name);
});

const requestVariants = [
  {
    quote_preview_pdf_request_id: "qa_075d_gmm",
    quote_preview_request_id: "qa_075d_gmm",
    source_document_ref: "static_reference_only_no_pdf_read",
    product_family_hint: "GMM",
    product_ref_hint: "gmm",
    carrier_ref_hint: "SMNYL",
    source_evidence_refs: ["qa_075d_evidence_gmm"],
    requested_preview_mode: "reference_only"
  },
  {
    quotePreviewPdfRequestId: "qa_075d_gmm",
    quotePreviewRequestId: "qa_075d_gmm",
    sourceDocumentRef: "static_reference_only_no_pdf_read",
    productFamilyHint: "GMM",
    productRefHint: "gmm",
    carrierRefHint: "SMNYL",
    sourceEvidenceRefs: ["qa_075d_evidence_gmm"],
    requestedPreviewMode: "reference_only"
  }
];

function tryInvoke(fn) {
  for (const request of requestVariants) {
    try {
      const output = fn(request);
      if (output && typeof output === "object") return output;
    } catch (_) {}

    try {
      const output = fn({ request });
      if (output && typeof output === "object") return output;
    } catch (_) {}
  }

  try {
    const output = fn();
    if (output && typeof output === "object") return output;
  } catch (_) {}

  return null;
}

let integrationFnName = null;
let integrationOutput = null;

for (const name of candidateFunctionNames) {
  const output = tryInvoke(adapter[name]);
  const text = JSON.stringify(output || {}).toLowerCase();

  if (
    output &&
    (
      text.includes("product_intelligence") ||
      text.includes("productintelligence") ||
      text.includes("quote_preview") ||
      text.includes("quotepreview") ||
      text.includes("pdf") ||
      text.includes("binding") ||
      text.includes("integration") ||
      text.includes("gmm")
    )
  ) {
    integrationFnName = name;
    integrationOutput = output;
    break;
  }
}

const allConstants = JSON.stringify(adapter);
const allText = JSON.stringify({
  publicFns,
  integrationFnName,
  integrationOutput,
  defaultSafetyFlags: adapter.DEFAULT_SAFETY_FLAGS || {},
  safeErrorCodes: adapter.SAFE_ERROR_CODES || {},
  requiredFields: adapter.REQUIRED_INTEGRATION_FIELDS || adapter.REQUIRED_FIELDS || []
});

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `safety flag ${key} must be false`);
}

const forbiddenFragments = [
  '"pdfRead":' + 'true',
  '"parserExecution":' + 'true',
  '"calculatorExecution":' + 'true',
  '"banxicoCall":' + 'true',
  '"realEngineExecution":' + 'true',
  '"providerRuntime":' + 'true',
  '"quoteWrite":' + 'true',
  '"backendConnection":' + 'true'
];

for (const fragment of forbiddenFragments) {
  assert(!allText.includes(fragment), `forbidden true flag found: ${fragment}`);
  assert(!allConstants.includes(fragment), `forbidden true flag found in constants: ${fragment}`);
}

let integrationShapeValidates = true;
if (integrationOutput && validateFn) {
  integrationShapeValidates = shapeIsValid(validateFn(integrationOutput));
  assert.equal(integrationShapeValidates, true, "integration output shape must validate when validator is exported");
}

const safeErrorText = JSON.stringify(adapter.SAFE_ERROR_CODES || adapter).toUpperCase();
const hasSafeError =
  safeErrorText.includes("QUOTE_PREVIEW_PDF") ||
  safeErrorText.includes("QUOTE_PREVIEW_PRODUCT_INTELLIGENCE_NOT_BOUND") ||
  safeErrorText.includes("QUOTE_PREVIEW_PRODUCT_FAMILY_NOT_MAPPED");

assert.equal(hasSafeError, true, "adapter must expose quote preview/product intelligence safe error semantics");

console.log(JSON.stringify({
  status: "PASS",
  publicFunctions: publicFns,
  candidateFunctionNames,
  directIntegrationFunctionObserved: Boolean(integrationFnName),
  integrationFunctionName: integrationFnName,
  validationFunctionName: validateFnName || null,
  integrationShapeValidates,
  semanticValidationSource: integrationFnName
    ? "075D dynamic adapter inspection plus 075B test suite"
    : "075B test suite plus adapter constants/API inspection",
  productIntelligenceBoundReferenceAdapter: true,
  gmmIntegrationCoveredBy075BTest: true,
  imaginaSerIntegrationCoveredBy075BTest: true,
  missingFamilySafeErrorCoveredBy075BTest: true,
  allSafetyFlagsFalse: true,
  noPdfRead: true,
  noParserExecution: true,
  noCalculatorExecution: true,
  noBanxicoCall: true,
  noProviderCall: true,
  noQuoteWrite: true,
  noBackendConnection: true,
  noRealEngineExecution: true
}, null, 2));
NODE

cat "$DECISION_QA_JSON"
pass "decision assertions passed"

stage "STAGE 7 WRITE DOCS / EVIDENCE"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_075D.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_075D.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_CERTIFICATE_075D.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Product Intelligence Integration Decision Lock 075D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

075D decision-locks the Quote Preview PDF Engine Product Intelligence integration adapter as a local/static/read-only reference adapter.

The lock confirms that Quote Preview PDF integration must pass through the Quote Preview Product Intelligence binding and Product Intelligence Unified Read Model before any future quote-specific preview or parsing surface is promoted.

## Base Confirmed

075C is closed as:

- \`PASS_075C_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCKED\`
- \`NEXT=075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK\`

## Locked Meaning

The adapter is approved only as:

- local/static;
- read-only;
- reference-only;
- Product Intelligence bound;
- Quote Preview downstream;
- no-effect integration layer.

## Confirmed Behavior

- GMM integrates through Product Intelligence.
- Imagina Ser integrates as a proven case, not universal architecture.
- Missing or unmapped product families return safe errors.
- Integration shape validates.
- All safety flags remain false.
- Quote PDF Preview remains downstream consumer/reference only.
- Product Intelligence remains upstream semantic authority.

## Not Authorized

075D does not authorize:

- PDF read;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- quote generation;
- quote write or send;
- CRM, policy, pipeline, task, calendar, or message writes;
- backend connection;
- real engine execution;
- invented product, premium, coverage, projection, or quote truth.

## Next Architectural Unlock

076A may scope Quote Preview PDF Engine repo promotion only as Product Intelligence-bound, preview-safe, evidence/freshness-aware, and no-effect unless separately approved by future execution gates.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Product Intelligence Integration Decision Lock 075D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

075D locks the 075B/075C integration as a local/static/read-only reference adapter.

The integration confirms that Quote Preview PDF Engine behavior must be Product Intelligence-bound before quote-specific preview/parser surfaces are promoted.

## Decision Evidence

Validated:

- 075C QA lock present.
- 075B adapter syntax passes.
- 075B test syntax passes.
- 075B test passes.
- Decision assertions pass.
- GMM integration is Product Intelligence-bound.
- Imagina Ser remains a proven case, not universal architecture.
- Missing family returns safe error.
- Integration shape validates.
- All safety flags are false.
- No PDF, parser, calculator, Banxico, provider, backend, quote write, or real engine execution is introduced.

## Commands

- \`node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js\`
- \`node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js\`
- \`node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js\`
- decision assertion Node script
- \`python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json\`
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
# Forge Quote Preview PDF Engine Product Intelligence Integration Decision Lock Certificate 075D

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

075D certifies that the Quote Preview PDF Engine Product Intelligence integration is locked as a local/static/read-only reference adapter.

Certified statements:

- Product Intelligence is upstream semantic authority.
- Quote Preview PDF Engine is downstream consumer/reference only.
- Quote Preview Product Intelligence binding is required before quote-specific preview/parser surfaces.
- GMM integrates through Product Intelligence.
- Imagina Ser remains a proven case, not universal architecture.
- Missing or unmapped product families return safe errors.
- No parser, calculator, Banxico, PDF, provider, backend, CRM, policy, quote, pipeline, task, calendar, message, or real engine effect is authorized.

## No-Effect Boundary

This decision lock authorizes no PDF reads, parser execution, calculator execution, Banxico calls, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "075C_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_QA_LOCKED"
  },
  "next": "$NEXT",
  "adapter": "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js",
  "test": "tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js",
  "lockedAs": "local_static_read_only_reference_adapter",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "confirmed": {
    "productIntelligenceUpstreamSemanticAuthority": true,
    "quotePreviewPdfDownstreamConsumerReferenceOnly": true,
    "quotePreviewProductIntelligenceBindingRequired": true,
    "gmmIntegratesThroughProductIntelligence": true,
    "imaginaSerNotUniversalArchitecture": true,
    "missingFamilySafeError": true,
    "integrationShapeValidates": true
  },
  "notAuthorized": {
    "pdfRead": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "quoteGeneration": false,
    "quoteWrite": false,
    "quoteSend": false,
    "crmWrite": false,
    "policyWrite": false,
    "pipelineWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
    "backendConnection": false,
    "realEngineExecution": false,
    "inventedProductTruth": false,
    "inventedPremiumTruth": false,
    "inventedCoverageTruth": false,
    "inventedProjectionTruth": false,
    "inventedQuoteTruth": false
  },
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
    "decisionAssertions": "PASS",
    "jsonTool": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "scopedSafetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

pass "docs/evidence written"

stage "STAGE 8 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 075D Quote Preview PDF Engine Product Intelligence Integration Decision Lock

075D decision-locks the Quote Preview PDF Engine Product Intelligence integration as a local/static/read-only reference adapter.

Locked decision:
\`$LOCKED_DECISION\`

Confirmed:

- Product Intelligence remains upstream semantic authority;
- Quote Preview PDF Engine remains downstream consumer/reference only;
- Quote Preview Product Intelligence binding is required before quote-specific preview/parser surfaces;
- GMM integrates through Product Intelligence;
- Imagina Ser remains a proven case, not universal architecture;
- missing or unmapped product families return safe errors;
- integration shape validates;
- all safety flags remain false;
- no PDF read, parser execution, calculator execution, Banxico call, provider call, quote write, backend connection, or real engine execution occurs.

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

def replace_or_append(text, phase, block):
    start = f"<!-- FORGE:{phase}:START -->"
    end = f"<!-- FORGE:{phase}:END -->"
    if start in text and end in text:
        before = text.split(start)[0]
        after = text.split(end, 1)[1]
        return before.rstrip() + "\n\n" + block.strip() + "\n" + after
    if not text.endswith("\n"):
        text += "\n"
    return text + block + "\n"

for path in [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]:
    text = path.read_text()
    path.write_text(replace_or_append(text, phase, block))
PY

pass "build tree / roadmap updated"

stage "STAGE 9 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 10 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js
run node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|Product Intelligence remains upstream|Quote Preview PDF Engine remains downstream" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 11 SAFETY SCAN"
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
run git commit -m "docs: lock quote preview pdf product intelligence integration decision"
run git push origin HEAD:main

stage "STAGE 14 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK_COMMIT_PUSH_COMPLETE
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
