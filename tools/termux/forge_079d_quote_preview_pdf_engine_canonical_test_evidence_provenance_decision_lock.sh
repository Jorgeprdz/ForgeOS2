#!/usr/bin/env bash
set -euo pipefail

PHASE="079D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK"
DECISION="PASS_079D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
NEXT="080A_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_SCOPE"
MODE="docs/decision lock only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/079d-quote-preview-pdf-engine-canonical-test-evidence-provenance-decision-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_079d_quote_preview_pdf_engine_canonical_test_evidence_provenance_decision_lock.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
EVIDENCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
EVIDENCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"
PROVENANCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js"
PROVENANCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK_079D.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK_079D.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK_CERTIFICATE_079D.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-provenance-decision-audit-079d.json"

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
echo "ROBOCOP_GATE=Article 0; 079C QA closed; decision lock only; next is review scope, not execution"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 079C"
if git log --oneline -50 | grep -Eq "079C|lock quote preview pdf canonical test evidence provenance qa|QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCKED"; then
  pass "079C commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-provenance-qa-audit-079c.json" ]; then
  pass "079C audit fallback found"
else
  fail "079C base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-provenance-qa-audit-079c.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-provenance-qa-audit-079c.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCKED"|"next"\s*:\s*"079D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK"' docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-provenance-qa-audit-079c.json >/dev/null; then
    fail "079C audit exists but does not confirm PASS/079D next"
  fi
  pass "079C audit PASS/079D next confirmed"
else
  warn "079C audit file not found; relying on git log/tree markers"
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
  "$EVIDENCE_ADAPTER"
  "$EVIDENCE_TEST"
  "$PROVENANCE_ADAPTER"
  "$PROVENANCE_TEST"
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

cat > "$BACKUP_DIR/rollback-079d.sh" <<ROLLBACK
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
echo "rollback 079D complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-079d.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-079d.sh"

stage "STAGE 6 REVALIDATE 079B/079C BASIS"
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"

stage "STAGE 7 DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const provenance = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js");

function resultOk(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  if (result && Array.isArray(result.errors) && result.errors.length === 0) return true;
  return false;
}

assert.equal(provenance.ADAPTER_ID, "forge.quote_preview.pdf_engine.canonical_test_evidence.provenance.registry.adapter.v1");
assert.equal(provenance.SCHEMA_VERSION, "forge.quote_preview.pdf_engine.canonical_test_evidence.provenance.registry.v1");
assert.equal(provenance.MODE, "read_only");
assert.equal(provenance.ROUTE_CLASS, "preview_safe");

const catalog = provenance.getQuotePreviewPdfCanonicalTestEvidenceProvenanceRegistryCatalog();
assert(catalog && typeof catalog === "object");
assert.equal(catalog.schemaVersion, provenance.SCHEMA_VERSION);
assert.equal(catalog.domainId, "quote_preview_pdf_engine_canonical_test_evidence_provenance");
assert.equal(catalog.registry_type, "local_static_read_only_test_evidence_provenance_registry");
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.provenance));
assert(catalog.provenance.length >= 10);
assert.equal(resultOk(provenance.validateProvenanceRegistryCatalog(catalog)), true);

for (const flag of [
  "execution_allowed_in_registry",
  "pdf_read_allowed_in_registry",
  "ocr_execution_allowed_in_registry",
  "parser_execution_allowed_in_registry",
  "calculator_execution_allowed_in_registry",
  "banxico_call_allowed_in_registry",
  "provider_call_allowed_in_registry",
  "test_execution_allowed_in_registry",
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

const realPdf = provenance.getProvenanceById("prov_real_pdf_ocr_solucionline_file");
assert.equal(realPdf.provenance_type, provenance.PROVENANCE_TYPES.REAL_PDF_FILE);
assert.equal(realPdf.source_hash_required, true);
assert(realPdf.safe_errors.includes(provenance.SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED));
assert(realPdf.safe_errors.includes(provenance.SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED));

const fixture = provenance.getProvenanceById("prov_quote_pdf_preview_fixture_text");
assert.equal(fixture.provenance_status, provenance.PROVENANCE_STATUSES.FIXTURE_ONLY);
assert(fixture.blocked_misuse.includes("fixture_as_real_pdf"));
assert(fixture.safe_errors.includes(provenance.SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED));

const governance = provenance.getProvenanceById("prov_repo_promotion_governance_assertion");
assert.equal(governance.provenance_status, provenance.PROVENANCE_STATUSES.GOVERNANCE_ONLY);
assert(governance.blocked_misuse.includes("extraction_claim"));
assert(governance.safe_errors.includes(provenance.SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED));

const gmmExpected = provenance.getProvenanceById("prov_gmm_out_of_pocket_expected_values");
assert.equal(gmmExpected.expected_value_source_required, true);
assert(gmmExpected.safe_errors.includes(provenance.SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUE_BLOCKED));

const retirementMxn = provenance.getProvenanceById("prov_real_retirement_mxn_expected_values");
assert(retirementMxn.engine_refs.includes("retirement-future-udi-projection-engine.js"));
assert(retirementMxn.engine_refs.includes("imagina-ser-future-mxn-bridge.js"));
assert(retirementMxn.safe_errors.includes(provenance.SAFE_ERROR_CODES.UNTRACEABLE_PROJECTION_BLOCKED));

const deterministic = provenance.getProvenanceById("prov_retirement_future_udi_deterministic_inputs");
assert(deterministic.blocked_misuse.includes("invented_udi_growth"));
assert(deterministic.blocked_misuse.includes("invented_current_udi"));

const providerMetadata = provenance.getProvenanceById("prov_imagina_ser_banxico_provider_metadata");
assert.equal(providerMetadata.provenance_status, provenance.PROVENANCE_STATUSES.RUNTIME_GATE_REQUIRED);
assert(providerMetadata.safe_errors.includes(provenance.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));
assert(providerMetadata.safe_errors.includes(provenance.SAFE_ERROR_CODES.PROVIDER_RUNTIME_GATE_REQUIRED));

const engineRefs = provenance.getProvenanceById("prov_engine_refs_existing_catalog_requirement");
assert(engineRefs.blocked_misuse.includes("new_engine_creation"));
assert(engineRefs.blocked_misuse.includes("duplicate_parser_creation"));
assert(engineRefs.blocked_misuse.includes("duplicate_calculator_creation"));
assert(engineRefs.safe_errors.includes(provenance.SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED));

const missing = provenance.getProvenanceById("unknown_provenance_for_079d");
assert.equal(missing.readModelStatus, "error");
assert(missing.safe_errors.includes(provenance.SAFE_ERROR_CODES.PROVENANCE_NOT_MAPPED));
assert(missing.safe_errors.includes(provenance.SAFE_ERROR_CODES.PROVENANCE_EXECUTION_NOT_AUTHORIZED));
assert.equal(resultOk(provenance.validateProvenanceShape(missing)), true);

for (const [key, value] of Object.entries(provenance.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const entry of catalog.provenance) {
  for (const [key, value] of Object.entries(entry.safety_flags || {})) {
    assert.equal(value, false, `${entry.provenance_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: provenance.DEFAULT_SAFETY_FLAGS,
  safeErrors: provenance.SAFE_ERROR_CODES,
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
  locked_as: "local_static_read_only_reference_registry",
  adapter_id: provenance.ADAPTER_ID,
  schema_version: provenance.SCHEMA_VERSION,
  catalog_validated: true,
  provenance_count: catalog.provenance.length,
  fixture_as_real_pdf_blocked: true,
  governance_as_extraction_proof_blocked: true,
  invented_expected_value_blocked: true,
  untraceable_projection_blocked: true,
  deterministic_inputs_require_trace: true,
  provider_runtime_gate_required: true,
  duplicate_engine_parser_calculator_creation_blocked: true,
  missing_provenance_safe_error_validated: true,
  all_safety_flags_false: true,
  next_is_readiness_review_not_execution: true,
  blocked_execution: {
    pdf_read: true,
    ocr_execution: true,
    parser_execution: true,
    calculator_execution: true,
    banxico_call: true,
    provider_call: true,
    test_execution: true,
    quote_write: true,
    backend_connection: true,
    real_engine_execution: true
  }
}, null, 2));
NODE

cat "$DECISION_QA_JSON"
pass "decision assertions passed"

stage "STAGE 8 WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Test Evidence Provenance Decision Lock 079D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

079D decision-locks the 079B/079C canonical test evidence provenance registry as a local/static/read-only reference registry.

This phase freezes provenance classification. It does not authorize execution.

## Base Confirmed

079C is closed as:

- \`PASS_079C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCKED\`
- \`NEXT=079D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK\`

## Locked Meaning

The 079B provenance registry is approved only as:

- local/static;
- read-only;
- reference registry;
- provenance classification;
- source trace requirement registry;
- no-effect architecture guardrail.

## Confirmed Decisions

- Real PDF file provenance requires file path or hash before any future execution gate.
- Fixture text provenance remains fixture-only.
- Governance assertion provenance remains governance-only.
- Fixture-as-real-PDF claims are blocked.
- Governance-as-extraction-proof claims are blocked.
- Expected financial values require source trace.
- Deterministic projection inputs require traceable source.
- Banxico/provider metadata requires future runtime gate.
- Existing engine references are required.
- Duplicate engine, parser, provider, and calculator creation is blocked.
- Product Intelligence remains upstream semantic authority.
- Quote Preview remains downstream consumer.
- All safety flags remain false.
- No test/PDF/OCR/parser/calculator/Banxico/provider execution is authorized.

## Next Architectural Unlock

080A may scope canonical execution readiness review only.

080A must be an architecture review gate. It must decide whether Forge is ready to move toward controlled fixture/PDF execution later, or whether unresolved provenance/parser/expected-value gaps must be closed first.

080A must not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico, call providers, connect backend, write quotes, or create real effects.

## Not Authorized

079D does not authorize:

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
# Forge Quote Preview PDF Engine Canonical Test Evidence Provenance Decision Lock 079D

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

079D locks the 079B/079C canonical test evidence provenance registry as a local/static/read-only reference registry.

The lock confirms provenance classification only. It does not authorize execution.

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
- \`node --check $SURFACES_ADAPTER\`
- \`node --check $SURFACES_TEST\`
- \`node $SURFACES_TEST\`
- \`node --check $EVIDENCE_ADAPTER\`
- \`node --check $EVIDENCE_TEST\`
- \`node $EVIDENCE_TEST\`
- \`node --check $PROVENANCE_ADAPTER\`
- \`node --check $PROVENANCE_TEST\`
- \`node $PROVENANCE_TEST\`
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
# Forge Quote Preview PDF Engine Canonical Test Evidence Provenance Decision Lock Certificate 079D

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

079D certifies that the Quote Preview PDF Engine Canonical Test Evidence Provenance registry is decision-locked as a local/static/read-only reference registry.

Certified statements:

- provenance registry is read-only;
- provenance is classified without execution;
- real PDF file provenance requires file/hash;
- expected value provenance requires source trace;
- deterministic inputs require traceable source;
- Banxico/provider metadata requires future runtime gate;
- fixture-as-real-PDF is blocked;
- governance-as-extraction-proof is blocked;
- duplicate engine/parser/calculator creation is blocked;
- no real tests are executed;
- no PDFs are read;
- no OCR/parsers/calculators/Banxico/providers are executed;
- all safety flags remain false;
- next work is canonical execution readiness review scope, not execution.

## No-Effect Boundary

This decision lock authorizes no PDF reads, OCR execution, parser execution, calculator execution, Banxico calls, test execution, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "079C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_QA_LOCKED"
  },
  "next": "$NEXT",
  "lockedAs": "local_static_read_only_reference_registry",
  "surfacesAdapter": "$SURFACES_ADAPTER",
  "testEvidenceAdapter": "$EVIDENCE_ADAPTER",
  "provenanceAdapter": "$PROVENANCE_ADAPTER",
  "provenanceTest": "$PROVENANCE_TEST",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "confirmed": {
    "provenanceRegistryShapeValidates": true,
    "realPdfFileProvenanceRequiresFileOrHash": true,
    "fixtureTextProvenanceFixtureOnly": true,
    "governanceAssertionProvenanceGovernanceOnly": true,
    "fixtureAsRealPdfBlocked": true,
    "governanceAsExtractionProofBlocked": true,
    "expectedValuesRequireSourceTrace": true,
    "deterministicInputsRequireSourceTrace": true,
    "banxicoProviderMetadataRequiresRuntimeGate": true,
    "engineReferencesRequired": true,
    "duplicateEngineParserCalculatorCreationBlocked": true,
    "productIntelligenceUpstream": true,
    "quotePreviewDownstream": true,
    "allSafetyFlagsFalse": true
  },
  "nextScope": {
    "phase": "$NEXT",
    "purpose": "canonical_execution_readiness_review_scope",
    "architecturePause": true,
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
    "base079C": "PASS",
    "discoveryJson": "PASS",
    "nodeCheckSurfacesAdapter": "PASS",
    "nodeCheckSurfacesTest": "PASS",
    "nodeSurfacesTest": "PASS",
    "nodeCheckEvidenceAdapter": "PASS",
    "nodeCheckEvidenceTest": "PASS",
    "nodeEvidenceTest": "PASS",
    "nodeCheckProvenanceAdapter": "PASS",
    "nodeCheckProvenanceTest": "PASS",
    "nodeProvenanceTest": "PASS",
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
## 079D Quote Preview PDF Engine Canonical Test Evidence Provenance Decision Lock

079D decision-locks the 079B/079C canonical test evidence provenance registry as a local/static/read-only reference registry.

Locked decision:
\`$LOCKED_DECISION\`

Confirmed:

- provenance registry is locked as read-only reference registry;
- real PDF file provenance requires file path or hash;
- fixture text provenance remains fixture-only;
- governance assertion provenance remains governance-only;
- fixture-as-real-PDF claims are blocked;
- governance-as-extraction-proof claims are blocked;
- expected financial values require source trace;
- deterministic projection inputs require traceable source;
- Banxico/provider metadata requires future runtime gate;
- existing engine references are required;
- duplicate engine, parser, provider, and calculator creation is blocked;
- Product Intelligence remains upstream;
- Quote Preview remains downstream;
- all safety flags remain false;
- no test/PDF/OCR/parser/calculator/Banxico/provider execution is authorized.

Next:

- \`$NEXT\` is an architecture review scope, not execution.

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
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|reference registry|execution readiness review|file path or hash|fixture-only|governance-only|source trace|future runtime gate|duplicate engine" \
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
  "$SURFACES_ADAPTER"
  "$SURFACES_TEST"
  "$EVIDENCE_ADAPTER"
  "$EVIDENCE_TEST"
  "$PROVENANCE_ADAPTER"
  "$PROVENANCE_TEST"
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
run git commit -m "docs: lock quote preview pdf canonical test evidence provenance decision"
run git push origin HEAD:main

stage "STAGE 15 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_079D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_PROVENANCE_DECISION_LOCK_COMMIT_PUSH_COMPLETE
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
