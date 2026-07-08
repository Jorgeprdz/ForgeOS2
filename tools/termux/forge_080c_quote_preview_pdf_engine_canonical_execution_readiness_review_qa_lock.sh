#!/usr/bin/env bash
set -euo pipefail

PHASE="080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK"
DECISION="PASS_080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCKED"
NEXT="080D_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_DECISION_LOCK"
MODE="QA/docs/evidence only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/080c-quote-preview-pdf-engine-canonical-execution-readiness-review-qa-lock-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_080c_quote_preview_pdf_engine_canonical_execution_readiness_review_qa_lock.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
EVIDENCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
EVIDENCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"
PROVENANCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js"
PROVENANCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b-test.js"
READINESS_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js"
READINESS_TEST="tests/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK_080C.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK_080C.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK_CERTIFICATE_080C.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-qa-audit-080c.json"

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
echo "ROBOCOP_GATE=Article 0; 080B implementation closed; QA lock only; execution remains blocked"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 080B"
if git log --oneline -50 | grep -Eq "080B|implement quote preview pdf execution readiness review matrix|QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"; then
  pass "080B commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-audit-080b.json" ]; then
  pass "080B audit fallback found"
else
  fail "080B base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-audit-080b.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-audit-080b.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"|"next"\s*:\s*"080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK"' docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-audit-080b.json >/dev/null; then
    fail "080B audit exists but does not confirm PASS/080C next"
  fi
  pass "080B audit PASS/080C next confirmed"
else
  warn "080B audit file not found; relying on git log/tree markers"
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
  "$READINESS_ADAPTER"
  "$READINESS_TEST"
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

cat > "$BACKUP_DIR/rollback-080c.sh" <<ROLLBACK
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
echo "rollback 080C complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-080c.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-080c.sh"

stage "STAGE 6 REVALIDATE IMPLEMENTATION"
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"
run node --check "$READINESS_ADAPTER"
run node --check "$READINESS_TEST"
run node "$READINESS_TEST"

stage "STAGE 7 SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const readiness = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js");

function resultOk(result) {
  if (result === true) return true;
  if (result && result.ok === true) return true;
  if (result && result.valid === true) return true;
  if (result && result.isValid === true) return true;
  if (result && Array.isArray(result.errors) && result.errors.length === 0) return true;
  return false;
}

assert.equal(readiness.ADAPTER_ID, "forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1");
assert.equal(readiness.SCHEMA_VERSION, "forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1");
assert.equal(readiness.MODE, "read_only");
assert.equal(readiness.ROUTE_CLASS, "preview_safe");

const requiredExports = [
  "getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog",
  "getReadinessGateById",
  "getReadinessGatesByStatus",
  "getNotReadyExecutionGates",
  "getSatisfiedExecutionReadinessGates",
  "getBlockingExecutionReadinessGates",
  "buildReadinessGateSafeError",
  "validateReadinessGateShape",
  "validateReadinessReviewMatrixCatalog",
];

for (const name of requiredExports) {
  assert.equal(typeof readiness[name], "function", `${name} must be exported`);
}

const catalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
assert(catalog && typeof catalog === "object");

assert.equal(catalog.schemaVersion, readiness.SCHEMA_VERSION);
assert.equal(catalog.domainId, "quote_preview_pdf_engine_canonical_execution_readiness_review");
assert.equal(catalog.mode, "read_only");
assert.equal(catalog.routeClass, "preview_safe");
assert.equal(catalog.matrix_type, "local_static_read_only_execution_readiness_review_matrix");
assert.equal(catalog.overall_readiness, readiness.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.gates));
assert(catalog.gates.length >= 10);
assert.equal(resultOk(readiness.validateReadinessReviewMatrixCatalog(catalog)), true);

for (const flag of [
  "execution_allowed_in_matrix",
  "pdf_read_allowed_in_matrix",
  "ocr_execution_allowed_in_matrix",
  "parser_execution_allowed_in_matrix",
  "calculator_execution_allowed_in_matrix",
  "banxico_call_allowed_in_matrix",
  "provider_call_allowed_in_matrix",
  "test_execution_allowed_in_matrix",
  "backend_connection_allowed_in_matrix",
  "quote_write_allowed_in_matrix",
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const gate of catalog.gates) {
  for (const field of readiness.REQUIRED_GATE_FIELDS) {
    assert(field in gate, `${gate.gate_id} missing ${field}`);
  }
  assert.equal(resultOk(readiness.validateReadinessGateShape(gate)), true);
}

const requiredSatisfied = [
  "canonical_surface_mapping_locked",
  "canonical_test_evidence_locked",
  "canonical_provenance_locked",
  "fixture_not_real_pdf_guard_ready",
  "governance_not_extraction_proof_guard_ready",
  "duplicate_engine_creation_guard_ready",
];

const requiredBlocking = [
  "real_pdf_file_or_hash_ready",
  "expected_value_source_trace_ready",
  "deterministic_input_source_trace_ready",
  "parser_ownership_resolved",
  "banxico_provider_runtime_gate_ready",
  "quote_truth_boundary_ready",
];

for (const gateId of requiredSatisfied) {
  const gate = readiness.getReadinessGateById(gateId);
  assert.equal(gate.gate_status, readiness.GATE_STATUSES.SATISFIED, `${gateId} must be satisfied`);
  assert.equal(gate.readiness_decision, readiness.READINESS_DECISIONS.READY, `${gateId} must be ready`);
}

for (const gateId of requiredBlocking) {
  const gate = readiness.getReadinessGateById(gateId);
  assert.notEqual(gate.readiness_decision, readiness.READINESS_DECISIONS.READY, `${gateId} must not be ready`);
  assert(gate.safe_errors.includes(readiness.SAFE_ERROR_CODES.EXECUTION_NOT_READY) || gate.safe_errors.length > 0, `${gateId} must have safe errors`);
}

const pdfGate = readiness.getReadinessGateById("real_pdf_file_or_hash_ready");
assert.equal(pdfGate.gate_status, readiness.GATE_STATUSES.NOT_READY);
assert(pdfGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.PDF_FILE_OR_HASH_REQUIRED));
assert(pdfGate.required_next_action.some((action) => String(action).includes("file paths or hashes")));

const expectedGate = readiness.getReadinessGateById("expected_value_source_trace_ready");
assert.equal(expectedGate.gate_status, readiness.GATE_STATUSES.NOT_READY);
assert(expectedGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.EXPECTED_VALUE_SOURCE_TRACE_REQUIRED));

const deterministicGate = readiness.getReadinessGateById("deterministic_input_source_trace_ready");
assert.equal(deterministicGate.gate_status, readiness.GATE_STATUSES.NOT_READY);
assert(deterministicGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED));

const parserGate = readiness.getReadinessGateById("parser_ownership_resolved");
assert.equal(parserGate.gate_status, readiness.GATE_STATUSES.DECISION_REQUIRED);
assert.equal(parserGate.readiness_decision, readiness.READINESS_DECISIONS.REVIEW_REQUIRED);
assert(parserGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.PARSER_OWNERSHIP_DECISION_REQUIRED));

const banxicoGate = readiness.getReadinessGateById("banxico_provider_runtime_gate_ready");
assert.equal(banxicoGate.gate_status, readiness.GATE_STATUSES.NOT_READY);
assert.equal(banxicoGate.execution_policy, readiness.EXECUTION_POLICIES.BLOCK_RUNTIME_PROVIDER_UNTIL_GATE);
assert(banxicoGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.BANXICO_RUNTIME_GATE_REQUIRED));

const quoteTruthGate = readiness.getReadinessGateById("quote_truth_boundary_ready");
assert.equal(quoteTruthGate.gate_status, readiness.GATE_STATUSES.NOT_READY);
assert.equal(quoteTruthGate.execution_policy, readiness.EXECUTION_POLICIES.BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY);
assert(quoteTruthGate.safe_errors.includes(readiness.SAFE_ERROR_CODES.QUOTE_TRUTH_BOUNDARY_REQUIRED));

const fixtureGuard = readiness.getReadinessGateById("fixture_not_real_pdf_guard_ready");
assert(fixtureGuard.safe_errors.includes(readiness.SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED));

const governanceGuard = readiness.getReadinessGateById("governance_not_extraction_proof_guard_ready");
assert(governanceGuard.safe_errors.includes(readiness.SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED));

const duplicateGuard = readiness.getReadinessGateById("duplicate_engine_creation_guard_ready");
assert(duplicateGuard.safe_errors.includes(readiness.SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED));

const notReady = readiness.getNotReadyExecutionGates();
for (const gateId of requiredBlocking) {
  assert(notReady.some((gate) => gate.gate_id === gateId), `${gateId} must be in notReady`);
}

const blocking = readiness.getBlockingExecutionReadinessGates();
for (const gateId of requiredBlocking) {
  assert(blocking.some((gate) => gate.gate_id === gateId), `${gateId} must be in blocking gates`);
}

const satisfied = readiness.getSatisfiedExecutionReadinessGates();
for (const gateId of requiredSatisfied) {
  assert(satisfied.some((gate) => gate.gate_id === gateId), `${gateId} must be in satisfied gates`);
}

const missing = readiness.getReadinessGateById("missing_gate_for_080c");
assert.equal(missing.readModelStatus, "error");
assert.equal(missing.readiness_decision, readiness.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert(missing.safe_errors.includes(readiness.SAFE_ERROR_CODES.READINESS_GATE_NOT_MAPPED));
assert(missing.safe_errors.includes(readiness.SAFE_ERROR_CODES.EXECUTION_NOT_READY));
assert.equal(resultOk(readiness.validateReadinessGateShape(missing)), true);

for (const [key, value] of Object.entries(readiness.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const gate of catalog.gates) {
  for (const [key, value] of Object.entries(gate.safety_flags || {})) {
    assert.equal(value, false, `${gate.gate_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: readiness.DEFAULT_SAFETY_FLAGS,
  safeErrors: readiness.SAFE_ERROR_CODES,
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
  adapterId: readiness.ADAPTER_ID,
  schemaVersion: readiness.SCHEMA_VERSION,
  catalogValidated: true,
  gateCount: catalog.gates.length,
  overallReadiness: catalog.overall_readiness,
  requiredSatisfiedValidated: requiredSatisfied,
  requiredBlockingValidated: requiredBlocking,
  realPdfFileHashGateBlocked: true,
  expectedValueSourceTraceGateBlocked: true,
  deterministicInputSourceTraceGateBlocked: true,
  parserOwnershipDecisionRequired: true,
  banxicoRuntimeGateBlocked: true,
  quoteTruthBoundaryBlocked: true,
  fixtureAsRealPdfGuardSatisfied: true,
  governanceAsExtractionProofGuardSatisfied: true,
  duplicateEngineCreationGuardSatisfied: true,
  missingGateSafeErrorValidated: true,
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
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review QA Lock 080C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

080C QA locks the local/static/read-only execution readiness review matrix implemented in 080B.

This phase validates that Forge remains not ready for execution and that every blocking gate is explicit.

## Base Confirmed

080B is closed as:

- \`PASS_080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION\`
- \`QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_LOCAL_STATIC_READ_ONLY_IMPLEMENTED\`
- \`NEXT=080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK\`

## QA Validated

- Adapter identity and schema are valid.
- Mode is \`read_only\`.
- Route class is \`preview_safe\`.
- Matrix shape validates.
- Required gate fields are present.
- Overall readiness remains \`not_ready_for_execution\`.
- Real PDF file/hash gate blocks execution.
- Expected-value source trace gate blocks execution.
- Deterministic input source trace gate blocks execution.
- Parser ownership gate remains decision-required.
- Banxico/provider runtime gate blocks runtime.
- Preview-vs-quote-truth boundary blocks quote truth.
- Fixture-as-real-PDF guard is satisfied.
- Governance-as-extraction-proof guard is satisfied.
- Duplicate engine/parser/calculator creation guard is satisfied.
- Missing gates return safe errors.
- All safety flags remain false.

## Not Authorized

080C does not authorize:

- PDF read;
- OCR execution;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- test execution;
- backend connection;
- quote generation;
- quote write or send;
- CRM, policy, pipeline, task, calendar, or message writes;
- invented product, premium, coverage, projection, expected value, or quote truth.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review QA Lock 080C

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

080C validates the 080B execution readiness review matrix as local/static/read-only and no-effect.

The matrix keeps Forge at \`not_ready_for_execution\`.

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
- \`node --check $EVIDENCE_ADAPTER\`
- \`node --check $EVIDENCE_TEST\`
- \`node $EVIDENCE_TEST\`
- \`node --check $PROVENANCE_ADAPTER\`
- \`node --check $PROVENANCE_TEST\`
- \`node $PROVENANCE_TEST\`
- \`node --check $READINESS_ADAPTER\`
- \`node --check $READINESS_TEST\`
- \`node $READINESS_TEST\`
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
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review QA Lock Certificate 080C

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

080C certifies that the Quote Preview PDF Engine Canonical Execution Readiness Review matrix is QA locked.

Certified statements:

- matrix is local/static/read-only;
- overall readiness is \`not_ready_for_execution\`;
- all blocking gates are explicit;
- real PDF file/hash gate blocks execution;
- expected-value source trace gate blocks execution;
- deterministic input source trace gate blocks execution;
- parser ownership remains decision-required;
- Banxico/provider runtime gate blocks runtime;
- preview-vs-quote-truth boundary blocks quote truth;
- satisfied guard gates remain satisfied;
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
    "phase": "080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
  },
  "next": "$NEXT",
  "adapter": "$READINESS_ADAPTER",
  "test": "$READINESS_TEST",
  "semanticQa": $(cat "$SEMANTIC_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "qaValidated": {
    "adapterIdentity": true,
    "schemaVersion": "forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1",
    "modeReadOnly": true,
    "routeClassPreviewSafe": true,
    "matrixShapeValidates": true,
    "requiredGateFieldsPresent": true,
    "overallReadinessNotReadyForExecution": true,
    "realPdfFileHashGateBlocked": true,
    "expectedValueSourceTraceGateBlocked": true,
    "deterministicInputSourceTraceGateBlocked": true,
    "parserOwnershipDecisionRequired": true,
    "banxicoRuntimeGateBlocked": true,
    "quoteTruthBoundaryBlocked": true,
    "fixtureAsRealPdfGuardSatisfied": true,
    "governanceAsExtractionProofGuardSatisfied": true,
    "duplicateEngineCreationGuardSatisfied": true,
    "missingGateSafeError": true,
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
    "backendConnection": false,
    "quoteGeneration": false,
    "quoteWrite": false,
    "quoteSend": false,
    "crmWrite": false,
    "policyWrite": false,
    "pipelineWrite": false,
    "taskCreate": false,
    "calendarCreate": false,
    "messageSend": false,
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
    "base080B": "PASS",
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
    "nodeCheckReadinessAdapter": "PASS",
    "nodeCheckReadinessTest": "PASS",
    "nodeReadinessTest": "PASS",
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
## 080C Quote Preview PDF Engine Canonical Execution Readiness Review QA Lock

080C QA locks the local/static/read-only execution readiness review matrix implemented in 080B.

Locked decision:
\`$LOCKED_DECISION\`

QA validated:

- adapter identity and schema are valid;
- mode \`read_only\`;
- route class \`preview_safe\`;
- matrix shape validates;
- required gate fields are present;
- overall readiness remains \`not_ready_for_execution\`;
- real PDF file/hash gate blocks execution;
- expected-value source trace gate blocks execution;
- deterministic input source trace gate blocks execution;
- parser ownership gate remains decision-required;
- Banxico/provider runtime gate blocks runtime;
- preview-vs-quote-truth boundary blocks quote truth;
- fixture-as-real-PDF guard is satisfied;
- governance-as-extraction-proof guard is satisfied;
- duplicate engine/parser/calculator creation guard is satisfied;
- missing gates return safe errors;
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
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"
run node --check "$READINESS_ADAPTER"
run node --check "$READINESS_TEST"
run node "$READINESS_TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|execution readiness|not_ready_for_execution|real PDF file/hash|expected-value source trace|parser ownership|quote truth boundary|Banxico/provider runtime" \
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
  "$READINESS_ADAPTER"
  "$READINESS_TEST"
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
run git commit -m "docs: lock quote preview pdf execution readiness review qa"
run git push origin HEAD:main

stage "STAGE 15 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK_COMMIT_PUSH_COMPLETE
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
