#!/usr/bin/env bash
set -euo pipefail

PHASE="080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION"
DECISION="PASS_080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
NEXT="080C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_QA_LOCK"
MODE="local/static/read-only execution readiness review matrix implementation"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/080b-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_080b_quote_preview_pdf_engine_canonical_execution_readiness_review_implementation.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
EVIDENCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
EVIDENCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"
PROVENANCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js"
PROVENANCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b-test.js"
ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js"
TEST="tests/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION_080B.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION_080B.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION_CERTIFICATE_080B.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-implementation-audit-080b.json"

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
echo "ROBOCOP_GATE=Article 0; 080A scope closed; readiness matrix implementation only; not execution"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 080A"
if git log --oneline -50 | grep -Eq "080A|scope quote preview pdf execution readiness review|QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_SCOPED"; then
  pass "080A commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-scope-audit-080a.json" ]; then
  pass "080A audit fallback found"
else
  fail "080A base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-scope-audit-080a.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-scope-audit-080a.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_SCOPED"|"next"\s*:\s*"080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION"' docs/evidence/forge-quote-preview-pdf-engine-canonical-execution-readiness-review-scope-audit-080a.json >/dev/null; then
    fail "080A audit exists but does not confirm PASS/080B next"
  fi
  pass "080A audit PASS/080B next confirmed"
else
  warn "080A audit file not found; relying on git log/tree markers"
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

cat > "$BACKUP_DIR/rollback-080b.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f "$ADAPTER"
rm -f "$TEST"
rm -f "$ARCH_DOC"
rm -f "$EVIDENCE_DOC"
rm -f "$CERT_DOC"
rm -f "$AUDIT_JSON"
rm -f "$SCRIPT_IN_REPO"
echo "rollback 080B complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-080b.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-080b.sh"

stage "STAGE 6 REVALIDATE BASE REGISTRIES"
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"

stage "STAGE 7 IMPLEMENT READINESS MATRIX"
mkdir -p "$(dirname "$ADAPTER")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const surfaces = require('./quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js');
const evidence = require('./quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js');
const provenance = require('./quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_canonical_execution_readiness_review';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const GATE_STATUSES = Object.freeze({
  SATISFIED: 'satisfied',
  NOT_READY: 'not_ready',
  DECISION_REQUIRED: 'decision_required',
});

const READINESS_DECISIONS = Object.freeze({
  READY: 'ready',
  NOT_READY_FOR_EXECUTION: 'not_ready_for_execution',
  REVIEW_REQUIRED: 'review_required',
});

const EXECUTION_POLICIES = Object.freeze({
  NO_EXECUTION_IN_MATRIX: 'no_execution_in_matrix',
  BLOCK_EXECUTION_UNTIL_GATE_SATISFIED: 'block_execution_until_gate_satisfied',
  BLOCK_RUNTIME_PROVIDER_UNTIL_GATE: 'block_runtime_provider_until_gate',
  BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY: 'block_quote_truth_until_boundary',
});

const SAFE_ERROR_CODES = Object.freeze({
  READINESS_GATE_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_EXECUTION_READINESS_GATE_NOT_MAPPED',
  EXECUTION_NOT_READY: 'QUOTE_PREVIEW_PDF_EXECUTION_NOT_READY',
  PDF_FILE_OR_HASH_REQUIRED: 'QUOTE_PREVIEW_PDF_REAL_FILE_OR_HASH_REQUIRED',
  EXPECTED_VALUE_SOURCE_TRACE_REQUIRED: 'QUOTE_PREVIEW_PDF_EXPECTED_VALUE_SOURCE_TRACE_REQUIRED',
  DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED: 'QUOTE_PREVIEW_PDF_DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED',
  PARSER_OWNERSHIP_DECISION_REQUIRED: 'QUOTE_PREVIEW_PDF_PARSER_OWNERSHIP_DECISION_REQUIRED',
  BANXICO_RUNTIME_GATE_REQUIRED: 'QUOTE_PREVIEW_PDF_BANXICO_RUNTIME_GATE_REQUIRED',
  QUOTE_TRUTH_BOUNDARY_REQUIRED: 'QUOTE_PREVIEW_PDF_QUOTE_TRUTH_BOUNDARY_REQUIRED',
  FIXTURE_AS_REAL_PDF_BLOCKED: 'QUOTE_PREVIEW_PDF_FIXTURE_AS_REAL_PDF_BLOCKED',
  GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED: 'QUOTE_PREVIEW_PDF_GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED',
  DUPLICATE_ENGINE_CREATION_BLOCKED: 'QUOTE_PREVIEW_PDF_DUPLICATE_ENGINE_CREATION_BLOCKED',
});

const DEFAULT_SAFETY_FLAGS = Object.freeze({
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
  backendConnection: false,
  pdfRead: false,
  ocrExecution: false,
  parserExecution: false,
  calculatorExecution: false,
  banxicoCall: false,
  testExecution: false,
});

const REQUIRED_GATE_FIELDS = Object.freeze([
  'gate_id',
  'gate_status',
  'source_phase',
  'source_registry_refs',
  'blocking_reason',
  'readiness_decision',
  'required_next_action',
  'execution_policy',
  'safe_errors',
  'safety_flags',
]);

function freezeGate(gate) {
  return Object.freeze({
    ...gate,
    source_registry_refs: Object.freeze([...(gate.source_registry_refs || [])]),
    blocking_reason: Object.freeze([...(gate.blocking_reason || [])]),
    required_next_action: Object.freeze([...(gate.required_next_action || [])]),
    safe_errors: Object.freeze([...(gate.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(gate.safety_flags || {}) }),
  });
}

const READINESS_MATRIX = Object.freeze([
  freezeGate({
    gate_id: 'canonical_surface_mapping_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '077D',
    source_registry_refs: ['quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'canonical_test_evidence_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '078D',
    source_registry_refs: ['quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'canonical_provenance_locked',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [],
  }),
  freezeGate({
    gate_id: 'real_pdf_file_or_hash_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_real_pdf_ocr_solucionline_file', 'prov_real_gmm_quote_pdf_file', 'prov_real_retirement_parser_pdf_file'],
    blocking_reason: ['real PDF provenance requires file path or source hash before execution'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind real PDF fixtures to explicit file paths or hashes before any PDF/OCR execution gate'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.PDF_FILE_OR_HASH_REQUIRED],
  }),
  freezeGate({
    gate_id: 'expected_value_source_trace_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_gmm_out_of_pocket_expected_values', 'prov_real_retirement_mxn_expected_values'],
    blocking_reason: ['expected financial values require source trace before becoming execution assertions'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind expected values to PDF-derived fields, fixture sources, or existing deterministic engines'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.EXPECTED_VALUE_SOURCE_TRACE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'deterministic_input_source_trace_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_retirement_future_udi_deterministic_inputs'],
    blocking_reason: ['UDI/current value/growth inputs require traceable repo/config source before calculator execution'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['bind UDI/current/growth inputs to existing repo engine/config and documented provenance'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'parser_ownership_resolved',
    gate_status: GATE_STATUSES.DECISION_REQUIRED,
    source_phase: '077D/078D/079D',
    source_registry_refs: ['parser_solucionline_retirement', 'real_retirement_scenario_candidate'],
    blocking_reason: ['Solucionline parser ownership remains decision-required before execution promotion'],
    readiness_decision: READINESS_DECISIONS.REVIEW_REQUIRED,
    required_next_action: ['resolve parser ownership and preview/orchestrator boundary before parser execution gate'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.PARSER_OWNERSHIP_DECISION_REQUIRED],
  }),
  freezeGate({
    gate_id: 'banxico_provider_runtime_gate_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '079B/079D',
    source_registry_refs: ['prov_imagina_ser_master_rate_cache_boundary', 'prov_imagina_ser_banxico_provider_metadata'],
    blocking_reason: ['Banxico/provider metadata requires a separate future runtime gate'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['define provider/cache runtime gate separately before any Banxico/provider call'],
    execution_policy: EXECUTION_POLICIES.BLOCK_RUNTIME_PROVIDER_UNTIL_GATE,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.BANXICO_RUNTIME_GATE_REQUIRED],
  }),
  freezeGate({
    gate_id: 'fixture_not_real_pdf_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_quote_pdf_preview_fixture_text'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED],
  }),
  freezeGate({
    gate_id: 'governance_not_extraction_proof_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_repo_promotion_governance_assertion', 'prov_existing_surfaces_mapping_governance_assertion'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED],
  }),
  freezeGate({
    gate_id: 'duplicate_engine_creation_guard_ready',
    gate_status: GATE_STATUSES.SATISFIED,
    source_phase: '079D',
    source_registry_refs: ['prov_engine_refs_existing_catalog_requirement'],
    blocking_reason: [],
    readiness_decision: READINESS_DECISIONS.READY,
    required_next_action: [],
    execution_policy: EXECUTION_POLICIES.NO_EXECUTION_IN_MATRIX,
    safe_errors: [SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED],
  }),
  freezeGate({
    gate_id: 'quote_truth_boundary_ready',
    gate_status: GATE_STATUSES.NOT_READY,
    source_phase: '073D-079D',
    source_registry_refs: ['quote_preview_downstream', 'product_intelligence_upstream'],
    blocking_reason: ['preview-vs-quote-truth boundary must be decided before any quote execution or write'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['define controlled preview execution vs quote truth boundary and forbid writes until separately authorized'],
    execution_policy: EXECUTION_POLICIES.BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY,
    safe_errors: [SAFE_ERROR_CODES.EXECUTION_NOT_READY, SAFE_ERROR_CODES.QUOTE_TRUTH_BOUNDARY_REQUIRED],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSourceRefs() {
  const surfaceCatalog = surfaces.getQuotePreviewPdfExistingSurfacesCanonicalMappingCatalog();
  const evidenceCatalog = evidence.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();
  const provenanceCatalog = provenance.getQuotePreviewPdfCanonicalTestEvidenceProvenanceRegistryCatalog();

  return {
    surfaces: {
      adapter_id: surfaceCatalog.adapter_id,
      schemaVersion: surfaceCatalog.schemaVersion,
      surface_count: Array.isArray(surfaceCatalog.surfaces) ? surfaceCatalog.surfaces.length : 0,
    },
    evidence: {
      adapter_id: evidenceCatalog.adapter_id,
      schemaVersion: evidenceCatalog.schemaVersion,
      evidence_count: Array.isArray(evidenceCatalog.evidence) ? evidenceCatalog.evidence.length : 0,
    },
    provenance: {
      adapter_id: provenanceCatalog.adapter_id,
      schemaVersion: provenanceCatalog.schemaVersion,
      provenance_count: Array.isArray(provenanceCatalog.provenance) ? provenanceCatalog.provenance.length : 0,
    },
  };
}

function getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog() {
  const gates = clone(READINESS_MATRIX);
  const notReady = gates.filter((gate) => gate.readiness_decision !== READINESS_DECISIONS.READY);

  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    matrix_type: 'local_static_read_only_execution_readiness_review_matrix',
    overall_readiness: notReady.length ? READINESS_DECISIONS.NOT_READY_FOR_EXECUTION : READINESS_DECISIONS.READY,
    execution_allowed_in_matrix: false,
    pdf_read_allowed_in_matrix: false,
    ocr_execution_allowed_in_matrix: false,
    parser_execution_allowed_in_matrix: false,
    calculator_execution_allowed_in_matrix: false,
    banxico_call_allowed_in_matrix: false,
    provider_call_allowed_in_matrix: false,
    test_execution_allowed_in_matrix: false,
    backend_connection_allowed_in_matrix: false,
    quote_write_allowed_in_matrix: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_gate_fields: [...REQUIRED_GATE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    gates,
  };
}

function getReadinessGateById(gateId) {
  const match = READINESS_MATRIX.find((gate) => gate.gate_id === gateId);
  return match ? clone(match) : buildReadinessGateSafeError(gateId);
}

function getReadinessGatesByStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return clone(READINESS_MATRIX.filter((gate) => gate.gate_status.toLowerCase() === normalized));
}

function getNotReadyExecutionGates() {
  return clone(READINESS_MATRIX.filter((gate) => gate.readiness_decision !== READINESS_DECISIONS.READY));
}

function getSatisfiedExecutionReadinessGates() {
  return clone(READINESS_MATRIX.filter((gate) => gate.readiness_decision === READINESS_DECISIONS.READY));
}

function getBlockingExecutionReadinessGates() {
  return clone(
    READINESS_MATRIX.filter((gate) =>
      gate.gate_status !== GATE_STATUSES.SATISFIED ||
      gate.readiness_decision !== READINESS_DECISIONS.READY
    )
  );
}

function buildReadinessGateSafeError(gateId, code = SAFE_ERROR_CODES.READINESS_GATE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    gate_id: gateId || null,
    gate_status: GATE_STATUSES.DECISION_REQUIRED,
    source_phase: null,
    source_registry_refs: [],
    blocking_reason: ['readiness gate is not mapped'],
    readiness_decision: READINESS_DECISIONS.NOT_READY_FOR_EXECUTION,
    required_next_action: ['map readiness gate before any execution decision'],
    execution_policy: EXECUTION_POLICIES.BLOCK_EXECUTION_UNTIL_GATE_SATISFIED,
    safe_errors: [code, SAFE_ERROR_CODES.EXECUTION_NOT_READY],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Execution readiness gate is not mapped. Execution is blocked.',
    },
  };
}

function validateReadinessGateShape(gate) {
  const errors = [];

  if (!gate || typeof gate !== 'object') {
    return { ok: false, valid: false, errors: ['readiness_gate_object_required'] };
  }

  for (const field of REQUIRED_GATE_FIELDS) {
    if (!(field in gate)) errors.push(`missing_${field}`);
  }

  if (gate.safety_flags) {
    for (const [key, value] of Object.entries(gate.safety_flags)) {
      if (value !== false) errors.push(`safety_flag_not_false_${key}`);
    }
  }

  const serialized = JSON.stringify(gate);
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
    '"testExecution":' + 'true',
  ];

  for (const fragment of forbiddenFragments) {
    if (serialized.includes(fragment)) errors.push(`forbidden_true_fragment_${fragment}`);
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

function validateReadinessReviewMatrixCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_readiness !== READINESS_DECISIONS.NOT_READY_FOR_EXECUTION) {
    errors.push('overall_readiness_must_remain_not_ready_for_execution');
  }

  for (const flagName of [
    'execution_allowed_in_matrix',
    'pdf_read_allowed_in_matrix',
    'ocr_execution_allowed_in_matrix',
    'parser_execution_allowed_in_matrix',
    'calculator_execution_allowed_in_matrix',
    'banxico_call_allowed_in_matrix',
    'provider_call_allowed_in_matrix',
    'test_execution_allowed_in_matrix',
    'backend_connection_allowed_in_matrix',
    'quote_write_allowed_in_matrix',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const gates = Array.isArray(catalog.gates) ? catalog.gates : [];
  if (!gates.length) errors.push('gates_required');

  for (const gate of gates) {
    const result = validateReadinessGateShape(gate);
    if (!result.ok) errors.push(...result.errors.map((error) => `${gate.gate_id || 'unknown'}:${error}`));
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  GATE_STATUSES,
  READINESS_DECISIONS,
  EXECUTION_POLICIES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_GATE_FIELDS,
  READINESS_MATRIX,
  getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog,
  getReadinessGateById,
  getReadinessGatesByStatus,
  getNotReadyExecutionGates,
  getSatisfiedExecutionReadinessGates,
  getBlockingExecutionReadinessGates,
  buildReadinessGateSafeError,
  validateReadinessGateShape,
  validateReadinessReviewMatrixCatalog,
};
NODE

pass "$ADAPTER written"

stage "STAGE 8 IMPLEMENT TEST"
mkdir -p "$(dirname "$TEST")"

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

assert.equal(typeof adapter.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog, 'function');
assert.equal(typeof adapter.getReadinessGateById, 'function');
assert.equal(typeof adapter.getReadinessGatesByStatus, 'function');
assert.equal(typeof adapter.getNotReadyExecutionGates, 'function');
assert.equal(typeof adapter.getSatisfiedExecutionReadinessGates, 'function');
assert.equal(typeof adapter.getBlockingExecutionReadinessGates, 'function');
assert.equal(typeof adapter.validateReadinessGateShape, 'function');
assert.equal(typeof adapter.validateReadinessReviewMatrixCatalog, 'function');

const catalog = adapter.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_canonical_execution_readiness_review');
assert.equal(catalog.mode, 'read_only');
assert.equal(catalog.routeClass, 'preview_safe');
assert.equal(catalog.matrix_type, 'local_static_read_only_execution_readiness_review_matrix');
assert.equal(catalog.overall_readiness, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);

for (const flag of [
  'execution_allowed_in_matrix',
  'pdf_read_allowed_in_matrix',
  'ocr_execution_allowed_in_matrix',
  'parser_execution_allowed_in_matrix',
  'calculator_execution_allowed_in_matrix',
  'banxico_call_allowed_in_matrix',
  'provider_call_allowed_in_matrix',
  'test_execution_allowed_in_matrix',
  'backend_connection_allowed_in_matrix',
  'quote_write_allowed_in_matrix',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert(Array.isArray(catalog.gates));
assert(catalog.gates.length >= 10);
assert.equal(adapter.validateReadinessReviewMatrixCatalog(catalog).ok, true);

for (const gate of catalog.gates) {
  for (const field of adapter.REQUIRED_GATE_FIELDS) {
    assert(field in gate, `${gate.gate_id} missing ${field}`);
  }
  assert.equal(adapter.validateReadinessGateShape(gate).ok, true);
}

const surfaceGate = adapter.getReadinessGateById('canonical_surface_mapping_locked');
assert.equal(surfaceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert.equal(surfaceGate.readiness_decision, adapter.READINESS_DECISIONS.READY);

const evidenceGate = adapter.getReadinessGateById('canonical_test_evidence_locked');
assert.equal(evidenceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);

const provenanceGate = adapter.getReadinessGateById('canonical_provenance_locked');
assert.equal(provenanceGate.gate_status, adapter.GATE_STATUSES.SATISFIED);

const pdfGate = adapter.getReadinessGateById('real_pdf_file_or_hash_ready');
assert.equal(pdfGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(pdfGate.readiness_decision, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert(pdfGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.PDF_FILE_OR_HASH_REQUIRED));

const expectedGate = adapter.getReadinessGateById('expected_value_source_trace_ready');
assert.equal(expectedGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert(expectedGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXPECTED_VALUE_SOURCE_TRACE_REQUIRED));

const deterministicGate = adapter.getReadinessGateById('deterministic_input_source_trace_ready');
assert.equal(deterministicGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert(deterministicGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.DETERMINISTIC_INPUT_SOURCE_TRACE_REQUIRED));

const parserGate = adapter.getReadinessGateById('parser_ownership_resolved');
assert.equal(parserGate.gate_status, adapter.GATE_STATUSES.DECISION_REQUIRED);
assert.equal(parserGate.readiness_decision, adapter.READINESS_DECISIONS.REVIEW_REQUIRED);
assert(parserGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.PARSER_OWNERSHIP_DECISION_REQUIRED));

const banxicoGate = adapter.getReadinessGateById('banxico_provider_runtime_gate_ready');
assert.equal(banxicoGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(banxicoGate.execution_policy, adapter.EXECUTION_POLICIES.BLOCK_RUNTIME_PROVIDER_UNTIL_GATE);
assert(banxicoGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_RUNTIME_GATE_REQUIRED));

const fixtureGuard = adapter.getReadinessGateById('fixture_not_real_pdf_guard_ready');
assert.equal(fixtureGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(fixtureGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.FIXTURE_AS_REAL_PDF_BLOCKED));

const governanceGuard = adapter.getReadinessGateById('governance_not_extraction_proof_guard_ready');
assert.equal(governanceGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(governanceGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.GOVERNANCE_AS_EXTRACTION_PROOF_BLOCKED));

const duplicateGuard = adapter.getReadinessGateById('duplicate_engine_creation_guard_ready');
assert.equal(duplicateGuard.gate_status, adapter.GATE_STATUSES.SATISFIED);
assert(duplicateGuard.safe_errors.includes(adapter.SAFE_ERROR_CODES.DUPLICATE_ENGINE_CREATION_BLOCKED));

const quoteTruthGate = adapter.getReadinessGateById('quote_truth_boundary_ready');
assert.equal(quoteTruthGate.gate_status, adapter.GATE_STATUSES.NOT_READY);
assert.equal(quoteTruthGate.execution_policy, adapter.EXECUTION_POLICIES.BLOCK_QUOTE_TRUTH_UNTIL_BOUNDARY);
assert(quoteTruthGate.safe_errors.includes(adapter.SAFE_ERROR_CODES.QUOTE_TRUTH_BOUNDARY_REQUIRED));

const notReady = adapter.getNotReadyExecutionGates();
assert(notReady.some((gate) => gate.gate_id === 'real_pdf_file_or_hash_ready'));
assert(notReady.some((gate) => gate.gate_id === 'expected_value_source_trace_ready'));
assert(notReady.some((gate) => gate.gate_id === 'parser_ownership_resolved'));
assert(notReady.some((gate) => gate.gate_id === 'quote_truth_boundary_ready'));

const satisfied = adapter.getSatisfiedExecutionReadinessGates();
assert(satisfied.some((gate) => gate.gate_id === 'canonical_surface_mapping_locked'));
assert(satisfied.some((gate) => gate.gate_id === 'fixture_not_real_pdf_guard_ready'));

const blocking = adapter.getBlockingExecutionReadinessGates();
assert(blocking.length >= notReady.length);
assert(blocking.some((gate) => gate.gate_id === 'banxico_provider_runtime_gate_ready'));

const missing = adapter.getReadinessGateById('missing_gate');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.readiness_decision, adapter.READINESS_DECISIONS.NOT_READY_FOR_EXECUTION);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.READINESS_GATE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_READY));
assert.equal(adapter.validateReadinessGateShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
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
  '"backendConnection":' + 'true',
  '"testExecution":' + 'true',
];

for (const fragment of forbiddenFragments) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

console.log('PASS quote preview pdf engine canonical execution readiness review matrix adapter 080B');
NODE

pass "$TEST written"

stage "STAGE 9 WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review Implementation 080B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

080B implements a local/static/read-only execution readiness review matrix for the Quote Preview PDF Engine path.

The matrix does not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico, call providers, connect backend, write quotes, or create real effects.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Adapter Contract

- \`ADAPTER_ID\`: \`forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1\`
- \`SCHEMA_VERSION\`: \`forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1\`
- \`domainId\`: \`quote_preview_pdf_engine_canonical_execution_readiness_review\`
- \`mode\`: \`read_only\`
- \`routeClass\`: \`preview_safe\`

## Overall Readiness

The matrix explicitly reports:

\`not_ready_for_execution\`

Human civilization narrowly avoids wiring financial execution to optimistic vibes. Small victory.

## Satisfied Gates

- canonical surface mapping locked;
- canonical test evidence locked;
- canonical provenance locked;
- fixture-as-real-PDF guard ready;
- governance-as-extraction-proof guard ready;
- duplicate engine/parser/calculator creation guard ready.

## Blocking / Not-Ready Gates

- real PDF file/hash readiness;
- expected-value source trace readiness;
- deterministic input source trace readiness;
- parser ownership resolution;
- Banxico/provider runtime gate;
- preview-vs-quote-truth boundary.

## Required Gate Fields

Each gate contains:

- \`gate_id\`
- \`gate_status\`
- \`source_phase\`
- \`source_registry_refs\`
- \`blocking_reason\`
- \`readiness_decision\`
- \`required_next_action\`
- \`execution_policy\`
- \`safe_errors\`
- \`safety_flags\`

## Not Authorized

080B does not authorize:

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
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review Implementation 080B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

080B implements a local/static/read-only execution readiness review matrix.

It reports \`not_ready_for_execution\` and records the gates blocking controlled execution.

## Discovery Evidence

Discovery JSON:

\`$DISCOVERY_JSON_FOUND\`

Discovery report:

\`${DISCOVERY_REPORT_MD:-not_found}\`

Discovery digest:

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Test Evidence

The focused test validates:

- adapter identity and schema;
- matrix shape;
- required gate fields;
- overall readiness remains not ready;
- real PDF file/hash gate blocks execution;
- expected value source trace gate blocks execution;
- deterministic input source trace gate blocks execution;
- parser ownership gate requires decision;
- Banxico/provider runtime gate blocks runtime;
- quote truth boundary blocks quote truth;
- satisfied guard gates remain satisfied;
- missing gates return safe errors;
- all safety flags false.

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
- \`node --check $ADAPTER\`
- \`node --check $TEST\`
- \`node $TEST\`
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
# Forge Quote Preview PDF Engine Canonical Execution Readiness Review Implementation Certificate 080B

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

080B certifies that Forge now has a local/static/read-only execution readiness review matrix.

Certified statements:

- readiness matrix is read-only;
- overall readiness is \`not_ready_for_execution\`;
- execution remains blocked;
- PDF file/hash readiness remains open;
- expected value source trace readiness remains open;
- deterministic input source trace readiness remains open;
- parser ownership remains decision-required;
- Banxico/provider runtime gate remains open;
- preview-vs-quote-truth boundary remains open;
- all safety flags remain false.

## No-Effect Boundary

This implementation authorizes no PDF reads, OCR execution, parser execution, calculator execution, Banxico calls, test execution, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "080A_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_SCOPE",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_SCOPED"
  },
  "next": "$NEXT",
  "implementation": {
    "adapter": "$ADAPTER",
    "test": "$TEST",
    "adapterId": "forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.adapter.v1",
    "schemaVersion": "forge.quote_preview.pdf_engine.canonical_execution_readiness.review_matrix.v1",
    "domainId": "quote_preview_pdf_engine_canonical_execution_readiness_review",
    "mode": "read_only",
    "routeClass": "preview_safe",
    "matrixType": "local_static_read_only_execution_readiness_review_matrix",
    "overallReadiness": "not_ready_for_execution",
    "testExecutionIntroduced": false,
    "pdfReadIntroduced": false,
    "ocrExecutionIntroduced": false,
    "parserExecutionIntroduced": false,
    "calculatorExecutionIntroduced": false,
    "banxicoCallIntroduced": false,
    "providerExecutionIntroduced": false,
    "backendConnectionIntroduced": false,
    "quoteTruthIntroduced": false,
    "newExtractorCreated": false,
    "newParserCreated": false,
    "newCalculatorCreated": false
  },
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "satisfiedGates": [
    "canonical_surface_mapping_locked",
    "canonical_test_evidence_locked",
    "canonical_provenance_locked",
    "fixture_not_real_pdf_guard_ready",
    "governance_not_extraction_proof_guard_ready",
    "duplicate_engine_creation_guard_ready"
  ],
  "notReadyOrDecisionRequiredGates": [
    "real_pdf_file_or_hash_ready",
    "expected_value_source_trace_ready",
    "deterministic_input_source_trace_ready",
    "parser_ownership_resolved",
    "banxico_provider_runtime_gate_ready",
    "quote_truth_boundary_ready"
  ],
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
    "base080A": "PASS",
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
    "nodeCheckAdapter": "PASS",
    "nodeCheckTest": "PASS",
    "nodeTest": "PASS",
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
## 080B Quote Preview PDF Engine Canonical Execution Readiness Review Implementation

080B implements a local/static/read-only execution readiness review matrix.

Locked decision:
\`$LOCKED_DECISION\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

Overall readiness:

- \`not_ready_for_execution\`

Satisfied gates:

- canonical surface mapping locked;
- canonical test evidence locked;
- canonical provenance locked;
- fixture-as-real-PDF guard ready;
- governance-as-extraction-proof guard ready;
- duplicate engine/parser/calculator creation guard ready.

Blocking/not-ready gates:

- real PDF file/hash readiness;
- expected-value source trace readiness;
- deterministic input source trace readiness;
- parser ownership resolution;
- Banxico/provider runtime gate;
- preview-vs-quote-truth boundary.

Boundaries:

- no PDF/OCR/parser/calculator/Banxico/provider/test execution is authorized;
- no backend connection is authorized;
- no quote truth or quote write is authorized.

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
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"
run node --check "$EVIDENCE_TEST"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node --check "$PROVENANCE_TEST"
run node "$PROVENANCE_TEST"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|execution readiness|not_ready_for_execution|real PDF file/hash|expected-value source trace|parser ownership|quote truth boundary" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$ADAPTER" "$TEST"

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

stage "STAGE 14 STAGE AUTHORIZED FILES"
AUTHORIZED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ADAPTER"
  "$TEST"
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
run git commit -m "feat: implement quote preview pdf execution readiness review matrix"
run git push origin HEAD:main

stage "STAGE 16 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_080B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_EXECUTION_READINESS_REVIEW_IMPLEMENTATION_COMMIT_PUSH_COMPLETE
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
