#!/usr/bin/env bash
set -euo pipefail

PHASE="077D_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK"
DECISION="PASS_077D_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_CATALOG"
NEXT="078A_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_SCOPE"
MODE="docs/decision lock only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/077d-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-decision-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_077d_quote_preview_pdf_engine_existing_surfaces_canonical_mapping_decision_lock.sh"

ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK_077D.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK_077D.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK_CERTIFICATE_077D.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-decision-audit-077d.json"

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
echo "ROBOCOP_GATE=Article 0; 077C QA closed; decision lock only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 077C"
if git log --oneline -50 | grep -Eq "077C|lock quote preview pdf existing surfaces canonical mapping qa|QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCKED"; then
  pass "077C commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-qa-audit-077c.json" ]; then
  pass "077C audit fallback found"
else
  fail "077C base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-qa-audit-077c.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-qa-audit-077c.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCKED"|"next"\s*:\s*"077D_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK"' docs/evidence/forge-quote-preview-pdf-engine-existing-surfaces-canonical-mapping-qa-audit-077c.json >/dev/null; then
    fail "077C audit exists but does not confirm PASS/077D next"
  fi
  pass "077C audit PASS/077D next confirmed"
else
  warn "077C audit file not found; relying on git log/tree markers"
fi

stage "STAGE 3 DISCOVERY EVIDENCE"
DISCOVERY_JSON_FOUND="$(find_latest_discovery_json || true)"
if [ -z "$DISCOVERY_JSON_FOUND" ] || [ ! -f "$DISCOVERY_JSON_FOUND" ]; then
  fail "Discovery JSON not found. Run discovery first or set DISCOVERY_JSON=/path/report.json"
fi

DISCOVERY_DIR="$(dirname "$DISCOVERY_JSON_FOUND")"
DISCOVERY_REPORT_MD="$(find "$DISCOVERY_DIR" -maxdepth 1 -type f -name '*DISCOVERY_077A_PRECHECK_EXISTING_QUOTE_PDF_TESTS_AND_ENGINES_REPORT_*.md' | sort | tail -1 || true)"

echo "DISCOVERY_JSON=$DISCOVERY_JSON_FOUND"
echo "DISCOVERY_DIR=$DISCOVERY_DIR"
echo "DISCOVERY_REPORT_MD=${DISCOVERY_REPORT_MD:-not_found}"

run python3 -m json.tool "$DISCOVERY_JSON_FOUND"

DISCOVERY_DIGEST_JSON="$(mktemp)"
python3 - <<'PY' "$DISCOVERY_JSON_FOUND" "$DISCOVERY_DIGEST_JSON"
import json, sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
data = json.loads(source.read_text())
rec = data.get("recommendation", {})
counts = data.get("counts", {})

if rec.get("do_not_create_new_pdf_extractor") is not True:
    raise SystemExit("Discovery does not block new extractor creation")
if counts.get("test_files_total", 0) < 1:
    raise SystemExit("Discovery did not find tests")

digest = {
    "discoveryJson": str(source),
    "counts": counts,
    "knownSurfacesPresent": data.get("known_surfaces_present", []),
    "realQuoteTestCandidateFiles": data.get("real_quote_test_candidate_files", []),
    "recommendation": rec,
    "artifacts": data.get("artifacts", {}),
}
target.write_text(json.dumps(digest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("DISCOVERY_DIGEST_VALID")
print(target.read_text())
PY

pass "discovery evidence confirmed"

stage "STAGE 4 REQUIRED FILES"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ADAPTER"
  "$TEST"
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

cat > "$BACKUP_DIR/rollback-077d.sh" <<ROLLBACK
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
echo "rollback 077D complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-077d.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-077d.sh"

stage "STAGE 6 REVALIDATE 077B / 077C BASIS"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "STAGE 7 DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const adapter = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js");

function shapeIsValid(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  if (result && Array.isArray(result.errors) && result.errors.length === 0) return true;
  return false;
}

assert.equal(adapter.ADAPTER_ID, "forge.quote_preview.pdf_engine.existing_surfaces.canonical_mapping.adapter.v1");
assert.equal(adapter.SCHEMA_VERSION, "forge.quote_preview.pdf_engine.existing_surfaces.canonical_mapping.v1");

const catalog = adapter.getQuotePreviewPdfExistingSurfacesCanonicalMappingCatalog();
assert(catalog && typeof catalog === "object", "catalog must be object");
assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, "quote_preview_pdf_engine_existing_surfaces_canonical_mapping");
assert.equal(catalog.mode, "read_only");
assert.equal(catalog.routeClass, "preview_safe");
assert.equal(catalog.no_new_extractor_before_reconciliation, true);
assert.equal(catalog.no_new_parser_before_reconciliation, true);
assert.equal(catalog.no_new_calculator_before_reconciliation, true);
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.surfaces), "catalog.surfaces must be array");
assert(catalog.surfaces.length >= 10, "catalog must contain meaningful surface inventory");
assert.equal(shapeIsValid(adapter.validateExistingSurfacesCanonicalMappingCatalog(catalog)), true);

const surfaces = catalog.surfaces;
const byPath = new Map(surfaces.map((surface) => [surface.file_path, surface]));

function getByPath(path) {
  const surface = byPath.get(path);
  assert(surface, `missing required surface path ${path}`);
  assert.equal(shapeIsValid(adapter.validateExistingSurfaceCanonicalMappingShape(surface)), true);
  return surface;
}

function includesAny(list, values) {
  const normalized = (list || []).map((item) => String(item));
  return values.some((value) => normalized.includes(value));
}

const criticalPaths = [
  "policy-operations/evidence/policy-ocr-engine.js",
  "product-intelligence/evidence/forge-quote-pdf-preview-engine.js",
  "product-intelligence/evidence/solucionline-retirement-parser.js",
  "product-intelligence/evidence/gmm-quote-parser.js",
  "gmm-quote-summary-engine.js",
  "retirement-future-udi-projection-engine.js",
  "imagina-ser-future-mxn-bridge.js",
  "exchange-rate-cache-engine.js",
  "shared-banxico-rate-engine.js",
  "shared-banxico-edge-provider.js",
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js",
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js",
  "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js",
  "platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js"
];

for (const path of criticalPaths) getByPath(path);

const extraction = getByPath("policy-operations/evidence/policy-ocr-engine.js");
assert.equal(extraction.canonical_candidate, true);
assert.equal(extraction.product_intelligence_binding_required, true);
assert.equal(extraction.quote_preview_downstream_only, true);
assert(includesAny(extraction.blocked_growth, ["parser_ownership", "calculator_ownership", "quote_truth_creation"]));

const preview = getByPath("product-intelligence/evidence/forge-quote-pdf-preview-engine.js");
assert.equal(preview.canonical_candidate, true);
assert(includesAny(preview.blocked_growth, ["universal_parser", "universal_calculator", "quote_truth_creation"]));

const solucionline = getByPath("product-intelligence/evidence/solucionline-retirement-parser.js");
assert(
  String(solucionline.canonical_status).includes("decision") ||
  JSON.stringify(solucionline.safe_errors || []).includes("CANONICAL_DECISION_REQUIRED"),
  "Solucionline parser must remain decision-required or explicitly safe-error gated"
);

const gmmParser = getByPath("product-intelligence/evidence/gmm-quote-parser.js");
const gmmSummary = getByPath("gmm-quote-summary-engine.js");
assert.notEqual(gmmParser.surface_type, gmmSummary.surface_type, "GMM parser and summary must stay separated");
assert(includesAny(gmmParser.blocked_growth, ["summary_ownership", "quote_truth_creation"]));
assert(includesAny(gmmSummary.blocked_growth, ["parser_ownership", "quote_truth_creation"]));

const promotion = getByPath("platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js");
assert(includesAny(promotion.blocked_growth, ["pdf_read", "ocr_execution", "parser_execution", "calculator_execution", "banxico_call", "quote_truth_creation"]));

const decisionRequired = adapter.getCanonicalDecisionRequiredSurfaces();
assert(Array.isArray(decisionRequired), "decision required surfaces must be array");
assert(decisionRequired.length >= 1, "at least one surface must remain canonical_decision_required");
assert(
  decisionRequired.some((surface) => surface.file_path === "product-intelligence/evidence/solucionline-retirement-parser.js") ||
  decisionRequired.some((surface) => String(surface.surface_id || "").includes("solucionline")),
  "Solucionline parser boundary must remain decision-required"
);

const missing = adapter.getExistingSurfaceCanonicalMappingById("unknown_surface_for_077d");
assert(missing && typeof missing === "object", "missing surface must return safe object");
assert.equal(missing.readModelStatus, "error");
assert.equal(shapeIsValid(adapter.validateExistingSurfaceCanonicalMappingShape(missing)), true);
assert(
  JSON.stringify(missing.safe_errors || []).includes("NEW_EXTRACTOR_BLOCKED") ||
  JSON.stringify(missing.safe_error || {}).includes("not mapped"),
  "missing surface must be safely blocked"
);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const surface of surfaces) {
  for (const [key, value] of Object.entries(surface.safety_flags || {})) {
    assert.equal(value, false, `${surface.surface_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: adapter.DEFAULT_SAFETY_FLAGS,
  safeErrors: adapter.SAFE_ERROR_CODES,
});

const forbiddenFragments = [
  '"pdfRead":' + 'true',
  '"ocrExecution":' + 'true',
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

console.log(JSON.stringify({
  status: "PASS",
  locked_as: "local_static_read_only_reference_catalog",
  adapter_id: adapter.ADAPTER_ID,
  schema_version: adapter.SCHEMA_VERSION,
  catalog_validated: true,
  surface_count: surfaces.length,
  critical_paths_validated: criticalPaths,
  no_new_extractor_before_reconciliation: true,
  no_new_parser_before_reconciliation: true,
  no_new_calculator_before_reconciliation: true,
  pdf_extraction_candidate_validated: true,
  preview_orchestration_candidate_validated: true,
  solucionline_parser_decision_required: true,
  gmm_parser_summary_separated: true,
  promotion_guardrail_growth_blocked: true,
  canonical_decision_required_surface_ids: decisionRequired.map((surface) => surface.surface_id),
  canonical_decision_required_surface_paths: decisionRequired.map((surface) => surface.file_path),
  missing_surface_safe_error_validated: true,
  all_safety_flags_false: true,
  blocked_execution: {
    pdf_read: true,
    ocr_execution: true,
    parser_execution: true,
    calculator_execution: true,
    banxico_call: true,
    provider_call: true,
    quote_write: true,
    backend_connection: true,
    real_engine_execution: true
  }
}, null, 2));
NODE

cat "$DECISION_QA_JSON"
pass "decision assertions passed"

stage "STAGE 8 WRITE DOCS / EVIDENCE"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Existing Surfaces Canonical Mapping Decision Lock 077D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

077D decision-locks the existing quote/PDF surfaces canonical mapping as a local/static/read-only reference catalog.

This phase freezes the 077B/077C mapping as the current source of truth for existing surface classification, while preserving decision-required boundaries for tests and parser ownership.

## Base Confirmed

077C is closed as:

- \`PASS_077C_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCKED\`
- \`NEXT=077D_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK\`

## Locked Meaning

The 077B mapping is approved only as:

- local/static;
- read-only;
- reference catalog;
- existing surfaces inventory;
- canonical candidate registry;
- decision-required registry;
- blocked-growth registry;
- no-effect architecture guardrail.

## Confirmed Decisions

- No new PDF extractor is authorized before reconciliation locks.
- No new parser is authorized before reconciliation locks.
- No new calculator is authorized before reconciliation locks.
- Product Intelligence remains upstream semantic authority.
- Quote Preview remains downstream consumer.
- PDF extraction candidate remains \`policy-operations/evidence/policy-ocr-engine.js\`.
- PDF preview/orchestration candidate remains \`product-intelligence/evidence/forge-quote-pdf-preview-engine.js\`.
- Solucionline parser boundary remains decision-required.
- GMM parser and GMM summary remain separated.
- UDI projection and Imagina Ser bridge remain mapped existing surfaces.
- Banxico/rate surfaces remain mapped and no runtime/provider execution is authorized.
- 076B promotion adapter remains a guardrail and must not grow into extraction, parsing, calculation, Banxico, provider, or quote behavior.
- Missing surfaces return safe errors.
- All safety flags remain false.

## Decision-Required Surfaces

At least these areas remain decision-required for later phases:

- Solucionline parser ownership;
- real quote/PDF test canonical evidence source;
- fixture vs real-PDF evidence boundary;
- parser vs preview/orchestrator responsibilities;
- provider/cache usage boundary for Banxico/rates.

## Next Architectural Unlock

078A may scope canonical test evidence only.

078A must not execute PDFs, OCR, parsers, calculators, Banxico, providers, backend calls, quote writes, or real effects. It must classify which existing tests become canonical evidence and which remain secondary/fixture/smoke tests.

## Not Authorized

077D does not authorize:

- PDF read;
- OCR execution;
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

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Existing Surfaces Canonical Mapping Decision Lock 077D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

077D locks the 077B/077C existing surfaces canonical mapping as a local/static/read-only reference catalog.

The lock confirms that Forge has a mapped view of existing quote/PDF surfaces before further test evidence or execution-related work.

## Discovery Evidence

Discovery JSON:

\`$DISCOVERY_JSON_FOUND\`

Discovery report:

\`${DISCOVERY_REPORT_MD:-not_found}\`

Discovery digest:

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Decision Assertions

\`\`\`json
$(cat "$DECISION_QA_JSON")
\`\`\`

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
# Forge Quote Preview PDF Engine Existing Surfaces Canonical Mapping Decision Lock Certificate 077D

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

077D certifies that the Quote Preview PDF Engine Existing Surfaces Canonical Mapping is decision-locked as a local/static/read-only reference catalog.

Certified statements:

- existing surfaces are mapped before further implementation;
- no new PDF extractor is authorized;
- no new parser is authorized;
- no new calculator is authorized;
- no Banxico/provider runtime is authorized;
- Product Intelligence remains upstream;
- Quote Preview remains downstream;
- candidate canonical boundaries are represented;
- decision-required surfaces remain explicit;
- blocked growth is explicit;
- all safety flags remain false;
- next work is canonical test evidence scoping.

## No-Effect Boundary

This decision lock authorizes no PDF reads, OCR execution, parser execution, calculator execution, Banxico calls, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "077C_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_QA_LOCKED"
  },
  "next": "$NEXT",
  "lockedAs": "local_static_read_only_reference_catalog",
  "adapter": "$ADAPTER",
  "test": "$TEST",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "confirmed": {
    "catalogShapeValidates": true,
    "noNewExtractorBeforeReconciliation": true,
    "noNewParserBeforeReconciliation": true,
    "noNewCalculatorBeforeReconciliation": true,
    "productIntelligenceUpstream": true,
    "quotePreviewDownstream": true,
    "pdfExtractionCandidateMapped": true,
    "previewOrchestrationCandidateMapped": true,
    "solucionlineParserDecisionRequired": true,
    "gmmParserSummarySeparated": true,
    "promotionGuardrailGrowthBlocked": true,
    "missingSurfaceSafeError": true,
    "allSafetyFlagsFalse": true
  },
  "nextScope": {
    "phase": "$NEXT",
    "purpose": "canonical_test_evidence_scope",
    "implementationReadiness": false,
    "executionAllowed": false
  },
  "notAuthorized": {
    "pdfRead": false,
    "ocrExecution": false,
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
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false
  },
  "validations": {
    "base077C": "PASS",
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

stage "STAGE 9 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 077D Quote Preview PDF Engine Existing Surfaces Canonical Mapping Decision Lock

077D decision-locks the existing quote/PDF surfaces canonical mapping as a local/static/read-only reference catalog.

Locked decision:
\`$LOCKED_DECISION\`

Confirmed:

- 077B/077C mapping is locked as a reference catalog;
- no new PDF extractor is authorized before reconciliation locks;
- no new parser is authorized before reconciliation locks;
- no new calculator is authorized before reconciliation locks;
- Product Intelligence remains upstream;
- Quote Preview remains downstream;
- PDF extraction candidate remains \`policy-operations/evidence/policy-ocr-engine.js\`;
- PDF preview/orchestration candidate remains \`product-intelligence/evidence/forge-quote-pdf-preview-engine.js\`;
- Solucionline parser boundary remains decision-required;
- GMM parser and GMM summary remain separated;
- UDI projection and Imagina Ser bridge remain mapped;
- Banxico/rate surfaces remain mapped without runtime authorization;
- 076B promotion adapter remains blocked from extraction/parser/calculation growth;
- missing surfaces return safe errors;
- all safety flags remain false.

Next:

- \`$NEXT\` may scope canonical test evidence only, with no execution.

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

stage "STAGE 9B TRIM TREE EOF BLANKS"
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

stage "STAGE 10 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 11 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|reference catalog|canonical test evidence|policy-ocr-engine.js|solucionline-retirement-parser.js|gmm-quote-parser.js" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 12 SAFETY SCAN"
SCOPED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
  "$ADAPTER"
  "$TEST"
)

if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${SCOPED_FILES[@]}"; then
  fail "safety scan found prohibited runtime/browser/network marker"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|ocrExecution|parserExecution|calculatorExecution|banxicoCall)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
  fail "real-effect flag true found"
fi

pass "safety scan clean"

stage "STAGE 13 STAGE AUTHORIZED FILES"
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

stage "STAGE 14 COMMIT PUSH"
run git commit -m "docs: lock quote preview pdf existing surfaces canonical mapping decision"
run git push origin HEAD:main

stage "STAGE 15 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_077D_QUOTE_PREVIEW_PDF_ENGINE_EXISTING_SURFACES_CANONICAL_MAPPING_DECISION_LOCK_COMMIT_PUSH_COMPLETE
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
