#!/usr/bin/env bash
set -euo pipefail

PHASE="076D_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK"
DECISION="PASS_076D_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER"
NEXT="077A_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_TESTS_AND_ENGINES_RECONCILIATION_SCOPE"
MODE="docs/decision lock only; discovery-aware next"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF execution; no invented product/premium/coverage/projection/quote truth"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/076d-quote-preview-pdf-engine-repo-promotion-decision-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_076d_quote_preview_pdf_engine_repo_promotion_decision_lock.sh"

ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js"
TEST="tests/quote-preview-pdf-engine-repo-promotion-adapter-076b-test.js"
ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK_076D.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK_076D.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK_CERTIFICATE_076D.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-decision-audit-076d.json"

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

find_latest_discovery_json(){
  if [ -n "${DISCOVERY_JSON:-}" ] && [ -f "$DISCOVERY_JSON" ]; then
    printf "%s\n" "$DISCOVERY_JSON"
    return 0
  fi

  find /data/data/com.termux/files/home -path "*/forge-discovery-*/*DISCOVERY_077A_PRECHECK_EXISTING_QUOTE_PDF_TESTS_AND_ENGINES_REPORT_*.json" \
    -type f 2>/dev/null | sort | tail -1
}

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 076C QA closed; 077A redirected to existing tests/engines reconciliation"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 076C"
if git log --oneline -40 | grep -Eq "076C|lock quote preview pdf engine repo promotion qa|QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCKED"; then
  pass "076C commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-qa-audit-076c.json" ]; then
  pass "076C audit fallback found"
else
  fail "076C base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-qa-audit-076c.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-qa-audit-076c.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCKED"' docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-qa-audit-076c.json >/dev/null; then
    fail "076C audit exists but does not show PASS/QA lock"
  fi
  pass "076C audit PASS/QA lock confirmed"
else
  warn "076C audit file not found; relying on git log/tree markers"
fi

stage "STAGE 3 DISCOVERY EVIDENCE"
DISCOVERY_JSON_FOUND="$(find_latest_discovery_json || true)"
if [ -z "$DISCOVERY_JSON_FOUND" ] || [ ! -f "$DISCOVERY_JSON_FOUND" ]; then
  fail "Discovery JSON not found. Run forge_discovery_077a_precheck_existing_quote_pdf_tests_and_engines.sh first, or set DISCOVERY_JSON=/path/report.json"
fi

DISCOVERY_DIR="$(dirname "$DISCOVERY_JSON_FOUND")"
DISCOVERY_REPORT_MD="$(find "$DISCOVERY_DIR" -maxdepth 1 -type f -name '*DISCOVERY_077A_PRECHECK_EXISTING_QUOTE_PDF_TESTS_AND_ENGINES_REPORT_*.md' | sort | tail -1 || true)"

echo "DISCOVERY_JSON=$DISCOVERY_JSON_FOUND"
echo "DISCOVERY_DIR=$DISCOVERY_DIR"
echo "DISCOVERY_REPORT_MD=${DISCOVERY_REPORT_MD:-not_found}"

run python3 -m json.tool "$DISCOVERY_JSON_FOUND"

python3 - <<'PY' "$DISCOVERY_JSON_FOUND"
import json, sys
from pathlib import Path

p = Path(sys.argv[1])
data = json.loads(p.read_text())
rec = data.get("recommendation", {})
counts = data.get("counts", {})
if rec.get("do_not_create_new_pdf_extractor") is not True:
    raise SystemExit("Discovery recommendation does not explicitly block new extractor creation")
if rec.get("next_should_be_reconciliation_scope") != "077A_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_TESTS_AND_ENGINES_RECONCILIATION_SCOPE":
    raise SystemExit("Discovery next does not match existing tests/engines reconciliation scope")
if counts.get("test_files_total", 0) < 1:
    raise SystemExit("Discovery did not find tests")
print("DISCOVERY_EVIDENCE_VALID")
print(json.dumps({
    "counts": counts,
    "known_surfaces_present": data.get("known_surfaces_present", []),
    "next": rec.get("next_should_be_reconciliation_scope")
}, indent=2, ensure_ascii=False))
PY

pass "discovery evidence confirmed"

stage "STAGE 4 REQUIRED FILES"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ADAPTER"
  "$TEST"
  "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js"
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js"
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

stage "STAGE 5 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"

cat > "$BACKUP_DIR/rollback-076d.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f "$ARCH_DOC"
rm -f "$EVIDENCE_DOC"
rm -f "$CERT_DOC"
rm -f "$AUDIT_JSON"
rm -f "$SCRIPT_IN_REPO"
echo "rollback 076D complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-076d.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-076d.sh"

stage "STAGE 6 REVALIDATE 076B/076C AS BASIS"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "STAGE 7 DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const adapter = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js");

assert.equal(adapter.ADAPTER_ID, "forge.quote_preview.pdf_engine.repo_promotion.adapter.v1");
assert.equal(adapter.SCHEMA_VERSION, "forge.quote_preview.pdf_engine.repo_promotion.v1");
assert.equal(typeof adapter.getQuotePreviewPdfEnginePromotionManifest, "function");
assert.equal(typeof adapter.prepareQuotePreviewPdfEnginePromotionScope, "function");
assert.equal(typeof adapter.validateQuotePreviewPdfEnginePromotionShape, "function");

const manifest = adapter.getQuotePreviewPdfEnginePromotionManifest();

assert.equal(manifest.mode, "read_only");
assert.equal(manifest.routeClass, "preview_safe");
assert.equal(manifest.adapter_type, "local_static_read_only_reference_promotion_adapter");
assert.equal(manifest.promotion_constraints.product_intelligence_binding_required, true);
assert.equal(manifest.promotion_constraints.product_intelligence_upstream_semantic_authority, true);
assert.equal(manifest.promotion_constraints.quote_preview_pdf_engine_downstream_consumer_reference_only, true);
assert.equal(manifest.promotion_constraints.local_static_read_only, true);
assert.equal(manifest.promotion_constraints.reference_only, true);
assert.equal(manifest.promotion_constraints.executes_pdf_read, false);
assert.equal(manifest.promotion_constraints.executes_parser, false);
assert.equal(manifest.promotion_constraints.executes_calculator, false);
assert.equal(manifest.promotion_constraints.calls_banxico, false);
assert.equal(manifest.promotion_constraints.calls_provider, false);
assert.equal(manifest.promotion_constraints.writes_quote, false);
assert.equal(manifest.promotion_constraints.creates_quote_truth, false);

const expectedFamilies = ["GMM", "Vida Mujer", "AVE", "Imagina Ser", "ORVI", "SeguBeca"];
for (const family of expectedFamilies) {
  assert(manifest.product_families.includes(family), `manifest must include ${family}`);

  const output = adapter.prepareQuotePreviewPdfEnginePromotionScope({
    quote_preview_pdf_request_id: `qa_076d_${family}`,
    product_family_hint: family,
    source_document_ref: "static_reference_only_no_pdf_read",
    source_evidence_refs: [`qa_076d_${family}_evidence`],
  });

  assert.equal(output.readModelStatus, "ok", `${family} must produce ok promotion`);
  assert.equal(output.product_family, family);
  assert.equal(output.preview_constraints.product_intelligence_binding_required, true);
  assert.equal(output.preview_constraints.reference_only, true);
  assert.equal(output.preview_constraints.no_pdf_read, true);
  assert.equal(output.preview_constraints.no_parser_execution, true);
  assert.equal(output.preview_constraints.no_calculator_execution, true);
  assert.equal(output.preview_constraints.no_banxico_call, true);
  assert.equal(output.preview_constraints.no_provider_call, true);
  assert.equal(output.preview_constraints.no_quote_write, true);
  assert.equal(output.preview_constraints.no_quote_truth, true);
  assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(output).ok, true);
}

const imagina = adapter.prepareQuotePreviewPdfEnginePromotionScope({
  quote_preview_pdf_request_id: "qa_076d_imagina_ser",
  product_family_hint: "Imagina Ser",
  source_document_ref: "static_reference_only_no_pdf_read",
  source_evidence_refs: ["qa_076d_imagina_ser_evidence"],
});

assert.equal(imagina.preview_constraints.universal_architecture, false);
assert(JSON.stringify(imagina).includes("not_universal_architecture"));

const missing = adapter.prepareQuotePreviewPdfEnginePromotionScope({
  quote_preview_pdf_request_id: "qa_076d_missing",
  product_family_hint: "UNKNOWN_FAMILY",
  source_document_ref: "static_reference_only_no_pdf_read",
  source_evidence_refs: [],
});

assert.equal(missing.readModelStatus, "error");
assert.equal(missing.safe_error.code, adapter.SAFE_ERROR_CODES.PRODUCT_FAMILY_NOT_MAPPED);
assert.equal(adapter.validateQuotePreviewPdfEnginePromotionShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

const combined = JSON.stringify({
  manifest,
  imagina,
  missing,
  flags: adapter.DEFAULT_SAFETY_FLAGS,
  safeErrors: adapter.SAFE_ERROR_CODES,
  requiredFields: adapter.REQUIRED_PROMOTION_FIELDS,
});

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
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

assert(combined.includes("product-intelligence-read-model-adapter-073d.js"));
assert(combined.includes("quote-preview-product-intelligence-binding-adapter-074b.js"));
assert(combined.includes("quote-preview-pdf-product-intelligence-integration-adapter-075b.js"));
assert(combined.includes("forge-quote-pdf-preview-engine.js"));

console.log(JSON.stringify({
  status: "PASS",
  lockedAs: "local_static_read_only_reference_adapter",
  adapterId: adapter.ADAPTER_ID,
  schemaVersion: adapter.SCHEMA_VERSION,
  productFamiliesValidated: expectedFamilies,
  productIntelligenceBindingRequired: true,
  productIntelligenceUpstreamSemanticAuthority: true,
  quotePreviewPdfEngineDownstreamConsumerReferenceOnly: true,
  imaginaSerNotUniversal: true,
  missingFamilySafeError: true,
  promotionShapeValidates: true,
  allSafetyFlagsFalse: true,
  referenceChainPresent: true,
  discoveryAwareNext: "077A_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_TESTS_AND_ENGINES_RECONCILIATION_SCOPE",
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

stage "STAGE 8 PREPARE DISCOVERY DIGEST"
DISCOVERY_DIGEST_JSON="$(mktemp)"
python3 - <<'PY' "$DISCOVERY_JSON_FOUND" "$DISCOVERY_DIGEST_JSON"
import json, sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
data = json.loads(source.read_text())
digest = {
    "discoveryJson": str(source),
    "counts": data.get("counts", {}),
    "knownSurfacesPresent": data.get("known_surfaces_present", []),
    "recommendation": data.get("recommendation", {}),
    "artifacts": data.get("artifacts", {}),
}
target.write_text(json.dumps(digest, indent=2, ensure_ascii=False) + "\n")
PY
cat "$DISCOVERY_DIGEST_JSON"

stage "STAGE 9 WRITE DOCS / EVIDENCE"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Repo Promotion Decision Lock 076D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

076D decision-locks the Quote Preview PDF Engine repo promotion adapter as a local/static/read-only reference adapter.

This decision is discovery-aware: the next phase is not a new extractor. It is reconciliation of existing quote/PDF tests and engines discovered in the repo.

## Base Confirmed

076C is closed as:

- \`PASS_076C_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCKED\`
- \`NEXT=076D_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK\`

## Discovery Evidence

Discovery JSON:

\`$DISCOVERY_JSON_FOUND\`

Discovery report:

\`${DISCOVERY_REPORT_MD:-not_found}\`

Discovery confirmed:

- existing tests were found;
- existing quote/PDF/preview/parser/engine candidates were inventoried;
- new PDF extractor creation must not proceed before reconciliation;
- next phase must be \`$NEXT\`.

## Locked Meaning

The Quote Preview PDF Engine repo promotion adapter is locked as:

- local/static;
- read-only;
- reference-only;
- Product Intelligence-bound;
- preview-safe;
- no-effect.

## Confirmed Behavior

- Adapter manifest is valid.
- Schema is \`forge.quote_preview.pdf_engine.repo_promotion.v1\`.
- Product Intelligence binding is required.
- Product Intelligence remains upstream semantic authority.
- Quote Preview PDF Engine remains downstream consumer/reference only.
- Product families are mapped: GMM, Vida Mujer, AVE, Imagina Ser, ORVI, SeguBeca.
- Imagina Ser remains a proven case, not universal architecture.
- Missing/unmapped product family returns safe error.
- Promotion shape validates.
- Reference chain includes 073D, 074B, 075B, and PDF preview engine refs.
- All safety flags remain false.

## Not Authorized

076D does not authorize:

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

077A may scope reconciliation of existing quote/PDF tests and engines only.

077A must not create a new extractor. It must inventory and reconcile:

- existing quote/PDF tests;
- real quote fixtures;
- existing PDF preview/extractor surfaces;
- existing parser/engine/calculator surfaces;
- Product Intelligence binding requirements;
- evidence/freshness requirements;
- safety boundaries and no-effect defaults.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Repo Promotion Decision Lock 076D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

076D locks the 076B/076C repo promotion adapter as local/static/read-only and Product Intelligence-bound.

This decision is based on both 076C QA and the 077A precheck discovery showing that the repo already contains existing quote/PDF tests and engine candidates. Therefore, the next phase must reconcile existing surfaces rather than create a new extractor.

## Discovery Evidence

- Discovery JSON: \`$DISCOVERY_JSON_FOUND\`
- Discovery report: \`${DISCOVERY_REPORT_MD:-not_found}\`

Digest:

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Decision Evidence

Validated:

- 076C QA lock present.
- 076B adapter syntax passes.
- 076B test syntax passes.
- 076B test passes.
- Decision assertions pass.
- Product Intelligence binding required.
- Product Intelligence upstream authority preserved.
- Quote Preview PDF Engine downstream consumer/reference only.
- All scoped product families mapped.
- Imagina Ser non-universal status preserved.
- Missing family safe error.
- Promotion shape validation.
- Safety flags false.
- Reference chain present.
- No execution true flags.
- Discovery redirects next work to existing tests/engines reconciliation.

## Commands

- \`python3 -m json.tool "$DISCOVERY_JSON_FOUND"\`
- \`node --check $ADAPTER\`
- \`node --check $TEST\`
- \`node $TEST\`
- decision assertion Node script
- \`python3 -m json.tool $AUDIT_JSON\`
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
# Forge Quote Preview PDF Engine Repo Promotion Decision Lock Certificate 076D

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

076D certifies that the Quote Preview PDF Engine repo promotion adapter is decision-locked as a local/static/read-only reference adapter.

Certified statements:

- adapter is Product Intelligence-bound;
- Product Intelligence remains upstream semantic authority;
- Quote Preview PDF Engine remains downstream consumer/reference only;
- adapter is local/static/read-only;
- adapter is reference-only;
- all scoped product families are mapped;
- Imagina Ser is not universal architecture;
- missing/unmapped product families return safe errors;
- all safety flags remain false;
- no PDF/parser/calculator/Banxico/provider/backend/quote execution is authorized;
- next work must reconcile existing quote/PDF tests and engines before any extractor promotion.

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
    "phase": "076C_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_QA_LOCKED"
  },
  "next": "$NEXT",
  "adapter": "$ADAPTER",
  "test": "$TEST",
  "lockedAs": "local_static_read_only_reference_adapter",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "confirmed": {
    "manifestValid": true,
    "schemaVersion": "forge.quote_preview.pdf_engine.repo_promotion.v1",
    "productIntelligenceBindingRequired": true,
    "productIntelligenceUpstreamSemanticAuthority": true,
    "quotePreviewPdfEngineDownstreamConsumerReferenceOnly": true,
    "localStaticReadOnly": true,
    "referenceOnly": true,
    "allProductFamiliesMapped": true,
    "imaginaSerNotUniversalArchitecture": true,
    "missingFamilySafeError": true,
    "promotionShapeValidates": true,
    "allSafetyFlagsFalse": true,
    "referenceChainPresent": true,
    "existingTestsAndEnginesReconciliationRequiredNext": true,
    "newPdfExtractorCreationAllowedNext": false
  },
  "productFamilies": [
    "GMM",
    "Vida Mujer",
    "AVE",
    "Imagina Ser",
    "ORVI",
    "SeguBeca"
  ],
  "referenceChain": [
    "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js",
    "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js",
    "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js",
    "product-intelligence/evidence/forge-quote-pdf-preview-engine.js"
  ],
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
    "backendConnection": false,
    "pdfRead": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false
  },
  "validations": {
    "discoveryJson": "PASS",
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

stage "STAGE 10 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 076D Quote Preview PDF Engine Repo Promotion Decision Lock

076D decision-locks the Quote Preview PDF Engine repo promotion adapter as a local/static/read-only reference adapter.

Locked decision:
\`$LOCKED_DECISION\`

Discovery-aware redirect:

- discovery report: \`$DISCOVERY_JSON_FOUND\`;
- the repo already has quote/PDF tests and engine candidates;
- no new PDF extractor may be created before reconciliation;
- next phase is \`$NEXT\`.

Confirmed:

- adapter manifest is valid;
- schema \`forge.quote_preview.pdf_engine.repo_promotion.v1\`;
- Product Intelligence binding is required;
- Product Intelligence remains upstream semantic authority;
- Quote Preview PDF Engine remains downstream consumer/reference only;
- GMM, Vida Mujer, AVE, Imagina Ser, ORVI, and SeguBeca are mapped;
- Imagina Ser remains a proven case, not universal architecture;
- missing/unmapped product families return safe errors;
- promotion shape validates;
- reference chain includes 073D, 074B, 075B, and PDF preview engine refs;
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

stage "STAGE 10B TRIM TREE EOF BLANKS"
python3 - <<'PYTRIM'
from pathlib import Path

for path in [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]:
    text = path.read_text()
    path.write_text(text.rstrip() + "\n")
    print(f"trimmed EOF blanks: {path}")
PYTRIM

stage "STAGE 11 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 12 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER|existing quote/PDF tests and engines|no new PDF extractor" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 13 SAFETY SCAN"
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

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|parserExecution|calculatorExecution|banxicoCall)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
  fail "real-effect flag true found"
fi

pass "safety scan clean"

stage "STAGE 14 STAGE AUTHORIZED FILES"
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

stage "STAGE 15 COMMIT PUSH"
run git commit -m "docs: lock quote preview pdf engine repo promotion decision"
run git push origin HEAD:main

stage "STAGE 16 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_076D_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_DECISION_LOCK_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT
DISCOVERY_JSON=$DISCOVERY_JSON_FOUND
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
