#!/usr/bin/env bash
set -euo pipefail

PHASE="078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK"
DECISION="PASS_078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCKED"
NEXT="078D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_DECISION_LOCK"
MODE="QA/docs/evidence only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/078c-quote-preview-pdf-engine-canonical-test-evidence-qa-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_078c_quote_preview_pdf_engine_canonical_test_evidence_qa_lock.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK_078C.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK_078C.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK_CERTIFICATE_078C.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-qa-audit-078c.json"

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
echo "ROBOCOP_GATE=Article 0; 078B implementation closed; QA lock only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 078B"
if git log --oneline -50 | grep -Eq "078B|implement quote preview pdf canonical test evidence registry|QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"; then
  pass "078B commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-implementation-audit-078b.json" ]; then
  pass "078B audit fallback found"
else
  fail "078B base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-implementation-audit-078b.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-implementation-audit-078b.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"|"next"\s*:\s*"078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK"' docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-implementation-audit-078b.json >/dev/null; then
    fail "078B audit exists but does not confirm PASS/078C next"
  fi
  pass "078B audit PASS/078C next confirmed"
else
  warn "078B audit file not found; relying on git log/tree markers"
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
  "$SURFACES_ADAPTER"
  "$SURFACES_TEST"
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

cat > "$BACKUP_DIR/rollback-078c.sh" <<ROLLBACK
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
echo "rollback 078C complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-078c.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-078c.sh"

stage "STAGE 6 REVALIDATE IMPLEMENTATION"
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "STAGE 7 SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const registry = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js");

function resultOk(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  if (result && Array.isArray(result.errors) && result.errors.length === 0) return true;
  return false;
}

assert.equal(registry.ADAPTER_ID, "forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1");
assert.equal(registry.SCHEMA_VERSION, "forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1");
assert.equal(registry.MODE, "read_only");
assert.equal(registry.ROUTE_CLASS, "preview_safe");

const requiredExports = [
  "getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog",
  "getCanonicalTestEvidenceById",
  "getCanonicalTestEvidenceByPath",
  "getCanonicalTestEvidenceByProductFamily",
  "getCanonicalTestEvidenceByEvidenceType",
  "getCanonicalDecisionRequiredTestEvidence",
  "getFixtureOnlyTestEvidence",
  "getGovernanceOnlyTestEvidence",
  "buildCanonicalTestEvidenceSafeError",
  "validateCanonicalTestEvidenceShape",
  "validateCanonicalTestEvidenceRegistryCatalog",
];

for (const name of requiredExports) {
  assert.equal(typeof registry[name], "function", `${name} must be exported`);
}

const catalog = registry.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();
assert(catalog && typeof catalog === "object", "catalog must be object");

assert.equal(catalog.schemaVersion, registry.SCHEMA_VERSION);
assert.equal(catalog.domainId, "quote_preview_pdf_engine_canonical_test_evidence");
assert.equal(catalog.mode, "read_only");
assert.equal(catalog.routeClass, "preview_safe");
assert.equal(catalog.registry_type, "local_static_read_only_canonical_test_evidence_registry");

for (const flagName of [
  "execution_allowed_in_registry",
  "real_pdf_tests_executed_in_registry",
  "parser_tests_executed_in_registry",
  "calculator_tests_executed_in_registry",
  "banxico_tests_executed_in_registry",
  "provider_tests_executed_in_registry",
]) {
  assert.equal(catalog[flagName], false, `${flagName} must be false`);
}

assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.evidence), "catalog.evidence must be array");
assert(catalog.evidence.length >= 10, "registry must contain meaningful evidence inventory");
assert.equal(resultOk(registry.validateCanonicalTestEvidenceRegistryCatalog(catalog)), true);

for (const entry of catalog.evidence) {
  for (const field of registry.REQUIRED_TEST_EVIDENCE_FIELDS) {
    assert(field in entry, `${entry.test_id} missing ${field}`);
  }
  assert.equal(resultOk(registry.validateCanonicalTestEvidenceShape(entry)), true);
}

const requiredIds = [
  "real_pdf_ocr_solucionline_candidate",
  "real_gmm_quote_candidate",
  "gmm_out_of_pocket_candidate",
  "real_retirement_scenario_candidate",
  "real_retirement_mxn_scenario_candidate",
  "imagina_ser_master_candidate",
  "imagina_ser_banxico_integration_candidate",
  "retirement_future_udi_projection_smoke_candidate",
  "quote_pdf_preview_fixture_candidate",
  "repo_promotion_guardrail_candidate",
  "existing_surfaces_mapping_guardrail_candidate",
];

for (const id of requiredIds) {
  const entry = registry.getCanonicalTestEvidenceById(id);
  assert.equal(resultOk(registry.validateCanonicalTestEvidenceShape(entry)), true, `${id} shape invalid`);
  assert.equal(entry.test_id, id, `${id} missing`);
}

const realPdf = registry.getCanonicalTestEvidenceById("real_pdf_ocr_solucionline_candidate");
assert.equal(realPdf.evidence_type, registry.EVIDENCE_TYPES.REAL_PDF_OCR);
assert.equal(realPdf.execution_policy, registry.EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY);
assert(realPdf.safe_errors.includes(registry.SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED));
assert(realPdf.safe_errors.includes(registry.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));

const gmm = registry.getCanonicalTestEvidenceById("real_gmm_quote_candidate");
assert.equal(gmm.evidence_type, registry.EVIDENCE_TYPES.REAL_PDF_GMM_PARSER);
assert(gmm.engine_refs.includes("product-intelligence/evidence/gmm-quote-parser.js"));
assert(gmm.safe_errors.includes(registry.SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED));

const gmmOut = registry.getCanonicalTestEvidenceById("gmm_out_of_pocket_candidate");
assert.equal(gmmOut.canonical_status, registry.CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED);
assert.equal(gmmOut.execution_policy, registry.EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW);
assert(gmmOut.safe_errors.includes(registry.SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED));

const retirement = registry.getCanonicalTestEvidenceById("real_retirement_scenario_candidate");
assert.equal(retirement.evidence_type, registry.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PARSER);
assert(retirement.engine_refs.includes("product-intelligence/evidence/solucionline-retirement-parser.js"));
assert(retirement.safe_errors.includes(registry.SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED));

const retirementMxn = registry.getCanonicalTestEvidenceById("real_retirement_mxn_scenario_candidate");
assert.equal(retirementMxn.evidence_type, registry.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PROJECTION);
assert(retirementMxn.engine_refs.includes("retirement-future-udi-projection-engine.js"));
assert(retirementMxn.engine_refs.includes("imagina-ser-future-mxn-bridge.js"));
assert(retirementMxn.safe_errors.includes(registry.SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED));

const banxico = registry.getCanonicalTestEvidenceById("imagina_ser_banxico_integration_candidate");
assert.equal(banxico.evidence_type, registry.EVIDENCE_TYPES.RATE_CACHE_METADATA);
assert.equal(banxico.execution_policy, registry.EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE);
assert(banxico.safe_errors.includes(registry.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));

const fixture = registry.getCanonicalTestEvidenceById("quote_pdf_preview_fixture_candidate");
assert.equal(fixture.evidence_type, registry.EVIDENCE_TYPES.PREVIEW_FIXTURE);
assert.equal(fixture.canonical_status, registry.CANONICAL_STATUSES.FIXTURE_EVIDENCE_ONLY);
assert(fixture.safe_errors.includes(registry.SAFE_ERROR_CODES.FIXTURE_NOT_REAL_PDF_EVIDENCE));
assert(fixture.blocked_growth.includes("misclassified_as_real_pdf_evidence"));

const guardrail = registry.getCanonicalTestEvidenceById("repo_promotion_guardrail_candidate");
assert.equal(guardrail.evidence_type, registry.EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL);
assert.equal(guardrail.canonical_status, registry.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);
assert(guardrail.safe_errors.includes(registry.SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF));
assert(guardrail.blocked_growth.includes("misclassified_as_extraction_proof"));

const mappingGuardrail = registry.getCanonicalTestEvidenceById("existing_surfaces_mapping_guardrail_candidate");
assert.equal(mappingGuardrail.evidence_type, registry.EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL);
assert.equal(mappingGuardrail.canonical_status, registry.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);

const pathLookup = registry.getCanonicalTestEvidenceByPath("tests/real-gmm-quote-test.js");
assert.equal(pathLookup.test_id, "real_gmm_quote_candidate");

const gmmFamily = registry.getCanonicalTestEvidenceByProductFamily("GMM");
assert(gmmFamily.some((entry) => entry.test_id === "real_gmm_quote_candidate"));
assert(gmmFamily.some((entry) => entry.test_id === "gmm_out_of_pocket_candidate"));

const fixtureOnly = registry.getFixtureOnlyTestEvidence();
assert.equal(fixtureOnly.length, 1);
assert.equal(fixtureOnly[0].test_id, "quote_pdf_preview_fixture_candidate");

const governanceOnly = registry.getGovernanceOnlyTestEvidence();
assert(governanceOnly.length >= 2);
assert(governanceOnly.some((entry) => entry.test_id === "repo_promotion_guardrail_candidate"));
assert(governanceOnly.some((entry) => entry.test_id === "existing_surfaces_mapping_guardrail_candidate"));

const decisionRequired = registry.getCanonicalDecisionRequiredTestEvidence();
assert(decisionRequired.some((entry) => entry.test_id === "gmm_out_of_pocket_candidate"));
assert(decisionRequired.some((entry) => entry.test_id === "real_retirement_scenario_candidate"));
assert(decisionRequired.some((entry) => entry.test_id === "real_retirement_mxn_scenario_candidate"));

const missing = registry.getCanonicalTestEvidenceById("missing_test_for_078c");
assert.equal(missing.readModelStatus, "error");
assert.equal(missing.canonical_candidate, false);
assert(missing.safe_errors.includes(registry.SAFE_ERROR_CODES.TEST_EVIDENCE_NOT_MAPPED));
assert(missing.safe_errors.includes(registry.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));
assert.equal(resultOk(registry.validateCanonicalTestEvidenceShape(missing)), true);

for (const [key, value] of Object.entries(registry.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const entry of catalog.evidence) {
  for (const [key, value] of Object.entries(entry.safety_flags || {})) {
    assert.equal(value, false, `${entry.test_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: registry.DEFAULT_SAFETY_FLAGS,
  safeErrors: registry.SAFE_ERROR_CODES,
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
  '"backendConnection":' + 'true',
  '"testExecution":' + 'true'
];

for (const fragment of forbiddenFragments) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

console.log(JSON.stringify({
  status: "PASS",
  adapterId: registry.ADAPTER_ID,
  schemaVersion: registry.SCHEMA_VERSION,
  catalogValidated: true,
  evidenceCount: catalog.evidence.length,
  requiredEvidenceIdsValidated: requiredIds,
  realPdfOcrCandidateValidated: true,
  gmmParserCandidateValidated: true,
  gmmExpectedValueProvenanceGateValidated: true,
  retirementParserDecisionRequiredValidated: true,
  retirementMxnProjectionGateValidated: true,
  banxicoRuntimeGateValidated: true,
  fixtureNotRealPdfEvidenceValidated: true,
  governanceNotExtractionProofValidated: true,
  pathLookupValidated: true,
  productFamilyLookupValidated: true,
  fixtureOnlyLookupValidated: true,
  governanceOnlyLookupValidated: true,
  decisionRequiredLookupValidated: true,
  missingEvidenceSafeErrorValidated: true,
  allSafetyFlagsFalse: true,
  noPdfRead: true,
  noOcrExecution: true,
  noParserExecution: true,
  noCalculatorExecution: true,
  noBanxicoCall: true,
  noProviderCall: true,
  noTestExecution: true,
  noQuoteWrite: true,
  noBackendConnection: true,
  noRealEngineExecution: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"
pass "semantic QA passed"

stage "STAGE 8 WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Test Evidence QA Lock 078C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

078C QA locks the local/static/read-only canonical test evidence registry implemented in 078B.

This phase validates that the registry classifies evidence without executing real tests, reading PDFs, running OCR, running parsers, running calculators, calling Banxico/providers, connecting backend, writing quotes, or creating real effects.

## Base Confirmed

078B is closed as:

- \`PASS_078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION\`
- \`QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED\`
- \`NEXT=078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK\`

## QA Validated

- Adapter identity and schema are valid.
- Mode is \`read_only\`.
- Route class is \`preview_safe\`.
- Registry shape validates.
- Required evidence fields are present.
- No test execution is allowed.
- No real PDF tests are executed.
- No parser tests are executed.
- No calculator tests are executed.
- No Banxico/provider tests are executed.
- Real PDF/OCR evidence candidate is classified.
- GMM parser evidence candidate is classified.
- GMM expected-value provenance gate is present.
- Retirement/Solucionline parser evidence remains decision-required.
- Retirement MXN projection evidence requires provenance review.
- Banxico/cache metadata candidate requires a future runtime gate.
- Preview fixture evidence is explicitly not real PDF evidence.
- Governance guardrail evidence is explicitly not extraction proof.
- Missing evidence returns safe error.
- All safety flags remain false.

## Not Authorized

078C does not authorize:

- PDF read;
- OCR execution;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- test execution;
- quote generation;
- quote write or send;
- CRM, policy, pipeline, task, calendar, or message writes;
- backend connection;
- real engine execution;
- invented product, premium, coverage, projection, expected value, or quote truth.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Test Evidence QA Lock 078C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

078C validates the 078B canonical test evidence registry as local/static/read-only and no-effect.

The registry classifies evidence only. It does not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico/providers, connect backend, or write quotes.

## Discovery Evidence

Discovery JSON:

\`$DISCOVERY_JSON_FOUND\`

Discovery report:

\`${DISCOVERY_REPORT_MD:-not_found}\`

Discovery digest:

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Semantic QA

\`\`\`json
$(cat "$SEMANTIC_QA_JSON")
\`\`\`

## Commands

- \`node --check $SURFACES_ADAPTER\`
- \`node --check $SURFACES_TEST\`
- \`node $SURFACES_TEST\`
- \`node --check $ADAPTER\`
- \`node --check $TEST\`
- \`node $TEST\`
- semantic QA assertions
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
# Forge Quote Preview PDF Engine Canonical Test Evidence QA Lock Certificate 078C

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

078C certifies that the Quote Preview PDF Engine Canonical Test Evidence registry is QA locked.

Certified statements:

- registry is local/static/read-only;
- registry classifies existing/candidate tests only;
- real tests are not executed;
- PDFs are not read;
- OCR/parsers/calculators/Banxico/providers are not executed;
- fixture tests are not real PDF evidence;
- governance tests are not extraction proof;
- provider integration candidates require later runtime gate;
- expected financial values require provenance review;
- missing evidence returns safe errors;
- all safety flags remain false.

## No-Effect Boundary

This QA lock authorizes no PDF reads, OCR execution, parser execution, calculator execution, Banxico calls, test execution, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
  },
  "next": "$NEXT",
  "adapter": "$ADAPTER",
  "test": "$TEST",
  "semanticQa": $(cat "$SEMANTIC_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "qaValidated": {
    "adapterIdentity": true,
    "schemaVersion": "forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1",
    "modeReadOnly": true,
    "routeClassPreviewSafe": true,
    "registryShapeValidates": true,
    "requiredEvidenceFieldsPresent": true,
    "realPdfOcrCandidateClassified": true,
    "gmmParserCandidateClassified": true,
    "gmmExpectedValueProvenanceGatePresent": true,
    "retirementParserDecisionRequired": true,
    "retirementMxnProjectionProvenanceGatePresent": true,
    "banxicoRuntimeGatePresent": true,
    "fixtureNotRealPdfEvidence": true,
    "governanceNotExtractionProof": true,
    "missingEvidenceSafeError": true,
    "allSafetyFlagsFalse": true
  },
  "notAuthorized": {
    "pdfRead": false,
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "testExecution": false,
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
    "inventedExpectedValueTruth": false,
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
    "banxicoCall": false,
    "testExecution": false
  },
  "validations": {
    "base078B": "PASS",
    "discoveryJson": "PASS",
    "nodeCheckSurfacesAdapter": "PASS",
    "nodeCheckSurfacesTest": "PASS",
    "nodeSurfacesTest": "PASS",
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

stage "STAGE 9 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 078C Quote Preview PDF Engine Canonical Test Evidence QA Lock

078C QA locks the local/static/read-only canonical test evidence registry implemented in 078B.

Locked decision:
\`$LOCKED_DECISION\`

QA validated:

- adapter identity and schema are valid;
- mode \`read_only\`;
- route class \`preview_safe\`;
- registry shape validates;
- required evidence fields are present;
- no test execution is allowed;
- no real PDF tests are executed;
- no parser tests are executed;
- no calculator tests are executed;
- no Banxico/provider tests are executed;
- real PDF/OCR evidence candidate is classified;
- GMM parser evidence candidate is classified;
- GMM expected-value provenance gate is present;
- retirement/Solucionline parser evidence remains decision-required;
- retirement MXN projection evidence requires provenance review;
- Banxico/cache metadata candidate requires future runtime gate;
- preview fixture evidence is not real PDF evidence;
- governance guardrail evidence is not extraction proof;
- missing evidence returns safe error;
- all safety flags remain false.

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
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|canonical test evidence|fixture|governance|not real PDF evidence|not extraction proof|expected-value provenance|runtime gate" \
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

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|ocrExecution|parserExecution|calculatorExecution|banxicoCall|testExecution)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
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
run git commit -m "docs: lock quote preview pdf canonical test evidence qa"
run git push origin HEAD:main

stage "STAGE 15 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK_COMMIT_PUSH_COMPLETE
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
