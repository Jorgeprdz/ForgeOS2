#!/usr/bin/env bash
set -euo pipefail

PHASE="078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION"
DECISION="PASS_078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"
NEXT="078C_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_QA_LOCK"
MODE="local/static/read-only canonical test evidence registry implementation"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/078b-quote-preview-pdf-engine-canonical-test-evidence-implementation-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_078b_quote_preview_pdf_engine_canonical_test_evidence_implementation.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION_078B.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION_078B.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION_CERTIFICATE_078B.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-implementation-audit-078b.json"

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
echo "ROBOCOP_GATE=Article 0; 078A scope closed; registry implementation only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 078A"
if git log --oneline -50 | grep -Eq "078A|scope quote preview pdf canonical test evidence|QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_SCOPED"; then
  pass "078A commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-scope-audit-078a.json" ]; then
  pass "078A audit fallback found"
else
  fail "078A base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-scope-audit-078a.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-scope-audit-078a.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_SCOPED"|"next"\s*:\s*"078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION"' docs/evidence/forge-quote-preview-pdf-engine-canonical-test-evidence-scope-audit-078a.json >/dev/null; then
    fail "078A audit exists but does not confirm PASS/078B next"
  fi
  pass "078A audit PASS/078B next confirmed"
else
  warn "078A audit file not found; relying on git log/tree markers"
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

cat > "$BACKUP_DIR/rollback-078b.sh" <<ROLLBACK
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
echo "rollback 078B complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-078b.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-078b.sh"

stage "STAGE 6 REVALIDATE 077D REFERENCE CATALOG"
run node --check "$SURFACES_ADAPTER"
run node --check "$SURFACES_TEST"
run node "$SURFACES_TEST"

stage "STAGE 7 IMPLEMENT CANONICAL TEST EVIDENCE REGISTRY"
mkdir -p "$(dirname "$ADAPTER")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const surfaceMapping = require('./quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_canonical_test_evidence';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const EVIDENCE_TYPES = Object.freeze({
  REAL_PDF_OCR: 'real_pdf_ocr',
  REAL_PDF_GMM_PARSER: 'real_pdf_gmm_parser',
  REAL_OR_FIXTURE_GMM_COST_SUMMARY: 'real_or_fixture_gmm_cost_summary',
  REAL_PDF_RETIREMENT_PARSER: 'real_pdf_retirement_parser',
  REAL_PDF_RETIREMENT_PROJECTION: 'real_pdf_retirement_projection',
  IMAGINA_SER_FLOW: 'imagina_ser_flow',
  RATE_CACHE_METADATA: 'rate_cache_metadata',
  DETERMINISTIC_PROJECTION_SMOKE: 'deterministic_projection_smoke',
  PREVIEW_FIXTURE: 'preview_fixture',
  GOVERNANCE_GUARDRAIL: 'governance_guardrail',
});

const CANONICAL_STATUSES = Object.freeze({
  CANONICAL_CANDIDATE: 'canonical_candidate',
  CANONICAL_CANDIDATE_IF_PRESENT: 'canonical_candidate_if_present',
  SUPPORTING_CANDIDATE: 'supporting_candidate',
  FIXTURE_EVIDENCE_ONLY: 'fixture_evidence_only',
  GOVERNANCE_EVIDENCE_ONLY: 'governance_evidence_only',
  SECONDARY_OR_DECISION_REQUIRED: 'secondary_or_decision_required',
  CANONICAL_DECISION_REQUIRED: 'canonical_decision_required',
});

const EXECUTION_POLICIES = Object.freeze({
  NOT_EXECUTED_IN_REGISTRY: 'not_executed_in_registry',
  SAFE_GUARDRAIL_TEST_ONLY: 'safe_guardrail_test_only',
  REQUIRES_FUTURE_RUNTIME_GATE: 'requires_future_runtime_gate',
  REQUIRES_FIXTURE_PROVENANCE_REVIEW: 'requires_fixture_provenance_review',
  REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW: 'requires_expected_value_provenance_review',
});

const SAFE_ERROR_CODES = Object.freeze({
  TEST_EVIDENCE_NOT_MAPPED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_NOT_MAPPED',
  TEST_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_EXECUTION_NOT_AUTHORIZED',
  PDF_READ_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_PDF_READ_NOT_AUTHORIZED',
  PARSER_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_PARSER_EXECUTION_NOT_AUTHORIZED',
  CALCULATOR_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_CALCULATOR_EXECUTION_NOT_AUTHORIZED',
  BANXICO_CALL_NOT_AUTHORIZED: 'QUOTE_PREVIEW_PDF_CANONICAL_TEST_EVIDENCE_BANXICO_CALL_NOT_AUTHORIZED',
  FIXTURE_NOT_REAL_PDF_EVIDENCE: 'QUOTE_PREVIEW_PDF_FIXTURE_NOT_REAL_PDF_EVIDENCE',
  GOVERNANCE_NOT_EXTRACTION_PROOF: 'QUOTE_PREVIEW_PDF_GOVERNANCE_NOT_EXTRACTION_PROOF',
  INVENTED_EXPECTED_VALUES_BLOCKED: 'QUOTE_PREVIEW_PDF_INVENTED_EXPECTED_VALUES_BLOCKED',
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

const REQUIRED_TEST_EVIDENCE_FIELDS = Object.freeze([
  'test_id',
  'file_path',
  'evidence_type',
  'product_family',
  'source_surface_refs',
  'engine_refs',
  'fixture_refs',
  'canonical_candidate',
  'canonical_status',
  'evidence_role',
  'execution_policy',
  'blocked_growth',
  'safe_errors',
  'safety_flags',
]);

function freezeEvidence(evidence) {
  return Object.freeze({
    ...evidence,
    product_family: Object.freeze([...(evidence.product_family || [])]),
    source_surface_refs: Object.freeze([...(evidence.source_surface_refs || [])]),
    engine_refs: Object.freeze([...(evidence.engine_refs || [])]),
    fixture_refs: Object.freeze([...(evidence.fixture_refs || [])]),
    blocked_growth: Object.freeze([...(evidence.blocked_growth || [])]),
    safe_errors: Object.freeze([...(evidence.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(evidence.safety_flags || {}) }),
  });
}

const CANONICAL_TEST_EVIDENCE_REGISTRY = Object.freeze([
  freezeEvidence({
    test_id: 'real_pdf_ocr_solucionline_candidate',
    file_path: 'tests/real-pdf-ocr-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_OCR,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['pdf_extraction_policy_ocr_engine'],
    engine_refs: ['policy-operations/evidence/policy-ocr-engine.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_CANDIDATE_IF_PRESENT,
    evidence_role: 'candidate canonical real PDF/OCR evidence for local extraction',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['invented_expected_values', 'parser_ownership', 'calculator_ownership', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_gmm_quote_candidate',
    file_path: 'tests/real-gmm-quote-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_GMM_PARSER,
    product_family: ['GMM'],
    source_surface_refs: ['pdf_extraction_policy_ocr_engine', 'parser_gmm_quote'],
    engine_refs: [
      'policy-operations/evidence/policy-ocr-engine.js',
      'product-intelligence/evidence/gmm-quote-parser.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_CANDIDATE_IF_PRESENT,
    evidence_role: 'candidate canonical GMM real quote parser evidence',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['summary_ownership', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'gmm_out_of_pocket_candidate',
    file_path: 'tests/gmm-out-of-pocket-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_OR_FIXTURE_GMM_COST_SUMMARY,
    product_family: ['GMM'],
    source_surface_refs: ['parser_gmm_quote', 'summary_gmm_quote'],
    engine_refs: [
      'product-intelligence/evidence/gmm-quote-parser.js',
      'gmm-quote-summary-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate GMM out-of-pocket evidence after expected-value provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_expected_values', 'quote_truth_creation', 'summary_parser_boundary_drift'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_retirement_scenario_candidate',
    file_path: 'tests/real-retirement-scenario-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PARSER,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['parser_solucionline_retirement', 'pdf_preview_forge_quote_pdf_preview_engine'],
    engine_refs: [
      'product-intelligence/evidence/solucionline-retirement-parser.js',
      'product-intelligence/evidence/forge-quote-pdf-preview-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate retirement/Solucionline parser evidence after parser ownership decision',
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['parallel_parser_growth_before_decision', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'real_retirement_mxn_scenario_candidate',
    file_path: 'tests/real-retirement-mxn-scenario-test.js',
    evidence_type: EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PROJECTION,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['parser_solucionline_retirement', 'calculator_retirement_future_udi_projection', 'bridge_imagina_ser_future_mxn'],
    engine_refs: [
      'product-intelligence/evidence/solucionline-retirement-parser.js',
      'retirement-future-udi-projection-engine.js',
      'imagina-ser-future-mxn-bridge.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate retirement MXN projection evidence after UDI/MXN provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_projection_values', 'calculator_duplication', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PARSER_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'imagina_ser_master_candidate',
    file_path: 'imagina-ser-master-test.js',
    evidence_type: EVIDENCE_TYPES.IMAGINA_SER_FLOW,
    product_family: ['Imagina Ser'],
    source_surface_refs: ['bridge_imagina_ser_future_mxn', 'rates_exchange_rate_cache'],
    engine_refs: [
      'imagina-ser-future-mxn-bridge.js',
      'retirement-future-udi-projection-engine.js',
      'exchange-rate-cache-engine.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: 'candidate Imagina Ser flow evidence after provider/cache boundary review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE,
    blocked_growth: ['provider_runtime_without_gate', 'invented_expected_values', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'imagina_ser_banxico_integration_candidate',
    file_path: 'imagina-ser-banxico-integration-test.js',
    evidence_type: EVIDENCE_TYPES.RATE_CACHE_METADATA,
    product_family: ['Imagina Ser'],
    source_surface_refs: ['rates_exchange_rate_cache', 'rates_shared_banxico_direct', 'rates_shared_banxico_edge_provider'],
    engine_refs: [
      'exchange-rate-cache-engine.js',
      'shared-banxico-rate-engine.js',
      'shared-banxico-edge-provider.js',
    ],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.SECONDARY_OR_DECISION_REQUIRED,
    evidence_role: 'rate/cache evidence candidate; runtime/provider execution requires later gate',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE,
    blocked_growth: ['provider_runtime_without_gate', 'secret_access', 'network_call_without_gate'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED,
    ],
  }),
  freezeEvidence({
    test_id: 'retirement_future_udi_projection_smoke_candidate',
    file_path: 'retirement-future-udi-projection-smoke-test.js',
    evidence_type: EVIDENCE_TYPES.DETERMINISTIC_PROJECTION_SMOKE,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['calculator_retirement_future_udi_projection'],
    engine_refs: ['retirement-future-udi-projection-engine.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.SUPPORTING_CANDIDATE,
    evidence_role: 'supporting deterministic UDI projection evidence after input provenance review',
    execution_policy: EXECUTION_POLICIES.REQUIRES_EXPECTED_VALUE_PROVENANCE_REVIEW,
    blocked_growth: ['invented_projection_values', 'calculator_duplication'],
    safe_errors: [
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED,
    ],
  }),
  freezeEvidence({
    test_id: 'quote_pdf_preview_fixture_candidate',
    file_path: 'tests/product-intelligence/forge-quote-pdf-preview-engine-test.js',
    evidence_type: EVIDENCE_TYPES.PREVIEW_FIXTURE,
    product_family: ['Imagina Ser', 'Solucionline'],
    source_surface_refs: ['pdf_preview_forge_quote_pdf_preview_engine'],
    engine_refs: ['product-intelligence/evidence/forge-quote-pdf-preview-engine.js'],
    fixture_refs: ['text_fixture'],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.FIXTURE_EVIDENCE_ONLY,
    evidence_role: 'preview fixture evidence only; not proof of real PDF/OCR extraction',
    execution_policy: EXECUTION_POLICIES.REQUIRES_FIXTURE_PROVENANCE_REVIEW,
    blocked_growth: ['misclassified_as_real_pdf_evidence', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.FIXTURE_NOT_REAL_PDF_EVIDENCE,
      SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED,
    ],
  }),
  freezeEvidence({
    test_id: 'repo_promotion_guardrail_candidate',
    file_path: 'tests/quote-preview-pdf-engine-repo-promotion-adapter-076b-test.js',
    evidence_type: EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL,
    product_family: ['GMM', 'Vida Mujer', 'AVE', 'Imagina Ser', 'ORVI', 'SeguBeca'],
    source_surface_refs: ['quote_preview_pdf_engine_repo_promotion_adapter_076b'],
    engine_refs: ['platform/adapters/quote-preview/quote-preview-pdf-engine-repo-promotion-adapter-076b.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY,
    evidence_role: 'governance evidence only; validates no-effect promotion guardrail, not extraction',
    execution_policy: EXECUTION_POLICIES.SAFE_GUARDRAIL_TEST_ONLY,
    blocked_growth: ['misclassified_as_extraction_proof', 'parser_execution', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF,
    ],
  }),
  freezeEvidence({
    test_id: 'existing_surfaces_mapping_guardrail_candidate',
    file_path: 'tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js',
    evidence_type: EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL,
    product_family: ['GMM', 'Vida Mujer', 'AVE', 'Imagina Ser', 'ORVI', 'SeguBeca'],
    source_surface_refs: ['quote_preview_pdf_engine_existing_surfaces_canonical_mapping'],
    engine_refs: ['platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js'],
    fixture_refs: [],
    canonical_candidate: true,
    canonical_status: CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY,
    evidence_role: 'governance evidence only; validates reference catalog shape, not extraction',
    execution_policy: EXECUTION_POLICIES.SAFE_GUARDRAIL_TEST_ONLY,
    blocked_growth: ['misclassified_as_extraction_proof', 'misclassified_as_parser_proof', 'quote_truth_creation'],
    safe_errors: [
      SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF,
    ],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSurfaceCatalog() {
  return surfaceMapping.getQuotePreviewPdfExistingSurfacesCanonicalMappingCatalog();
}

function getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog() {
  const surfacesCatalog = getSurfaceCatalog();

  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_canonical_test_evidence_registry',
    execution_allowed_in_registry: false,
    real_pdf_tests_executed_in_registry: false,
    parser_tests_executed_in_registry: false,
    calculator_tests_executed_in_registry: false,
    banxico_tests_executed_in_registry: false,
    provider_tests_executed_in_registry: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_test_evidence_fields: [...REQUIRED_TEST_EVIDENCE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    surface_catalog_ref: {
      adapter_id: surfacesCatalog.adapter_id,
      schemaVersion: surfacesCatalog.schemaVersion,
      surface_count: Array.isArray(surfacesCatalog.surfaces) ? surfacesCatalog.surfaces.length : 0,
    },
    evidence: clone(CANONICAL_TEST_EVIDENCE_REGISTRY),
  };
}

function getCanonicalTestEvidenceById(testId) {
  const match = CANONICAL_TEST_EVIDENCE_REGISTRY.find((entry) => entry.test_id === testId);
  return match ? clone(match) : buildCanonicalTestEvidenceSafeError(testId);
}

function getCanonicalTestEvidenceByPath(filePath) {
  const match = CANONICAL_TEST_EVIDENCE_REGISTRY.find((entry) => entry.file_path === filePath);
  return match ? clone(match) : buildCanonicalTestEvidenceSafeError(filePath);
}

function getCanonicalTestEvidenceByProductFamily(productFamily) {
  const normalized = String(productFamily || '').trim().toLowerCase();
  return clone(
    CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) =>
      entry.product_family.some((family) => String(family).trim().toLowerCase() === normalized)
    )
  );
}

function getCanonicalTestEvidenceByEvidenceType(evidenceType) {
  const normalized = String(evidenceType || '').trim().toLowerCase();
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type.toLowerCase() === normalized));
}

function getCanonicalDecisionRequiredTestEvidence() {
  return clone(
    CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) =>
      [
        CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
        CANONICAL_STATUSES.SECONDARY_OR_DECISION_REQUIRED,
      ].includes(entry.canonical_status)
    )
  );
}

function getFixtureOnlyTestEvidence() {
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type === EVIDENCE_TYPES.PREVIEW_FIXTURE));
}

function getGovernanceOnlyTestEvidence() {
  return clone(CANONICAL_TEST_EVIDENCE_REGISTRY.filter((entry) => entry.evidence_type === EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL));
}

function buildCanonicalTestEvidenceSafeError(testId, code = SAFE_ERROR_CODES.TEST_EVIDENCE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    test_id: testId || null,
    file_path: null,
    evidence_type: null,
    product_family: [],
    source_surface_refs: [],
    engine_refs: [],
    fixture_refs: [],
    canonical_candidate: false,
    canonical_status: CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED,
    evidence_role: null,
    execution_policy: EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY,
    blocked_growth: ['new_test_creation_before_catalog_decision'],
    safe_errors: [code, SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Canonical test evidence is not mapped. New test/evidence creation is blocked before catalog decision.',
    },
  };
}

function validateCanonicalTestEvidenceShape(entry) {
  const errors = [];

  if (!entry || typeof entry !== 'object') {
    return { ok: false, valid: false, errors: ['test_evidence_object_required'] };
  }

  for (const field of REQUIRED_TEST_EVIDENCE_FIELDS) {
    if (!(field in entry)) errors.push(`missing_${field}`);
  }

  if (entry.safety_flags) {
    for (const [key, value] of Object.entries(entry.safety_flags)) {
      if (value !== false) errors.push(`safety_flag_not_false_${key}`);
    }
  }

  const serialized = JSON.stringify(entry);
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

function validateCanonicalTestEvidenceRegistryCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');

  for (const flagName of [
    'execution_allowed_in_registry',
    'real_pdf_tests_executed_in_registry',
    'parser_tests_executed_in_registry',
    'calculator_tests_executed_in_registry',
    'banxico_tests_executed_in_registry',
    'provider_tests_executed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const evidence = Array.isArray(catalog.evidence) ? catalog.evidence : [];
  if (!evidence.length) errors.push('evidence_required');

  for (const entry of evidence) {
    const result = validateCanonicalTestEvidenceShape(entry);
    if (!result.ok) errors.push(...result.errors.map((error) => `${entry.test_id || 'unknown'}:${error}`));
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
  EVIDENCE_TYPES,
  CANONICAL_STATUSES,
  EXECUTION_POLICIES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_TEST_EVIDENCE_FIELDS,
  CANONICAL_TEST_EVIDENCE_REGISTRY,
  getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog,
  getCanonicalTestEvidenceById,
  getCanonicalTestEvidenceByPath,
  getCanonicalTestEvidenceByProductFamily,
  getCanonicalTestEvidenceByEvidenceType,
  getCanonicalDecisionRequiredTestEvidence,
  getFixtureOnlyTestEvidence,
  getGovernanceOnlyTestEvidence,
  buildCanonicalTestEvidenceSafeError,
  validateCanonicalTestEvidenceShape,
  validateCanonicalTestEvidenceRegistryCatalog,
};
NODE

pass "$ADAPTER written"

stage "STAGE 8 IMPLEMENT TEST"
mkdir -p "$(dirname "$TEST")"

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

assert.equal(typeof adapter.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceById, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByPath, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByProductFamily, 'function');
assert.equal(typeof adapter.getCanonicalTestEvidenceByEvidenceType, 'function');
assert.equal(typeof adapter.getCanonicalDecisionRequiredTestEvidence, 'function');
assert.equal(typeof adapter.getFixtureOnlyTestEvidence, 'function');
assert.equal(typeof adapter.getGovernanceOnlyTestEvidence, 'function');
assert.equal(typeof adapter.validateCanonicalTestEvidenceShape, 'function');
assert.equal(typeof adapter.validateCanonicalTestEvidenceRegistryCatalog, 'function');

const catalog = adapter.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_canonical_test_evidence');
assert.equal(catalog.mode, 'read_only');
assert.equal(catalog.routeClass, 'preview_safe');
assert.equal(catalog.registry_type, 'local_static_read_only_canonical_test_evidence_registry');
assert.equal(catalog.execution_allowed_in_registry, false);
assert.equal(catalog.real_pdf_tests_executed_in_registry, false);
assert.equal(catalog.parser_tests_executed_in_registry, false);
assert.equal(catalog.calculator_tests_executed_in_registry, false);
assert.equal(catalog.banxico_tests_executed_in_registry, false);
assert.equal(catalog.provider_tests_executed_in_registry, false);
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert.equal(adapter.validateCanonicalTestEvidenceRegistryCatalog(catalog).ok, true);

assert(Array.isArray(catalog.evidence));
assert(catalog.evidence.length >= 10);

for (const entry of catalog.evidence) {
  for (const field of adapter.REQUIRED_TEST_EVIDENCE_FIELDS) {
    assert(field in entry, `${entry.test_id} missing ${field}`);
  }
  assert.equal(adapter.validateCanonicalTestEvidenceShape(entry).ok, true);
}

const byId = (testId) => adapter.getCanonicalTestEvidenceById(testId);

const realPdf = byId('real_pdf_ocr_solucionline_candidate');
assert.equal(realPdf.file_path, 'tests/real-pdf-ocr-test.js');
assert.equal(realPdf.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_OCR);
assert.equal(realPdf.execution_policy, adapter.EXECUTION_POLICIES.NOT_EXECUTED_IN_REGISTRY);
assert(realPdf.safe_errors.includes(adapter.SAFE_ERROR_CODES.PDF_READ_NOT_AUTHORIZED));
assert(realPdf.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));

const gmm = byId('real_gmm_quote_candidate');
assert.equal(gmm.file_path, 'tests/real-gmm-quote-test.js');
assert.equal(gmm.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_GMM_PARSER);
assert(gmm.engine_refs.includes('product-intelligence/evidence/gmm-quote-parser.js'));

const gmmOutOfPocket = byId('gmm_out_of_pocket_candidate');
assert.equal(gmmOutOfPocket.canonical_status, adapter.CANONICAL_STATUSES.CANONICAL_DECISION_REQUIRED);
assert(gmmOutOfPocket.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_EXPECTED_VALUES_BLOCKED));

const retirementParser = byId('real_retirement_scenario_candidate');
assert.equal(retirementParser.file_path, 'tests/real-retirement-scenario-test.js');
assert.equal(retirementParser.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PARSER);
assert(retirementParser.engine_refs.includes('product-intelligence/evidence/solucionline-retirement-parser.js'));

const retirementMxn = byId('real_retirement_mxn_scenario_candidate');
assert.equal(retirementMxn.evidence_type, adapter.EVIDENCE_TYPES.REAL_PDF_RETIREMENT_PROJECTION);
assert(retirementMxn.engine_refs.includes('retirement-future-udi-projection-engine.js'));
assert(retirementMxn.engine_refs.includes('imagina-ser-future-mxn-bridge.js'));

const banxico = byId('imagina_ser_banxico_integration_candidate');
assert.equal(banxico.execution_policy, adapter.EXECUTION_POLICIES.REQUIRES_FUTURE_RUNTIME_GATE);
assert(banxico.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));

const fixture = byId('quote_pdf_preview_fixture_candidate');
assert.equal(fixture.evidence_type, adapter.EVIDENCE_TYPES.PREVIEW_FIXTURE);
assert.equal(fixture.canonical_status, adapter.CANONICAL_STATUSES.FIXTURE_EVIDENCE_ONLY);
assert(fixture.safe_errors.includes(adapter.SAFE_ERROR_CODES.FIXTURE_NOT_REAL_PDF_EVIDENCE));

const governance = byId('repo_promotion_guardrail_candidate');
assert.equal(governance.evidence_type, adapter.EVIDENCE_TYPES.GOVERNANCE_GUARDRAIL);
assert.equal(governance.canonical_status, adapter.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);
assert(governance.safe_errors.includes(adapter.SAFE_ERROR_CODES.GOVERNANCE_NOT_EXTRACTION_PROOF));

const mappingGovernance = byId('existing_surfaces_mapping_guardrail_candidate');
assert.equal(mappingGovernance.file_path, 'tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js');
assert.equal(mappingGovernance.canonical_status, adapter.CANONICAL_STATUSES.GOVERNANCE_EVIDENCE_ONLY);

const byPath = adapter.getCanonicalTestEvidenceByPath('tests/real-gmm-quote-test.js');
assert.equal(byPath.test_id, 'real_gmm_quote_candidate');

const gmmEntries = adapter.getCanonicalTestEvidenceByProductFamily('GMM');
assert(gmmEntries.some((entry) => entry.test_id === 'real_gmm_quote_candidate'));
assert(gmmEntries.some((entry) => entry.test_id === 'gmm_out_of_pocket_candidate'));

const previewEntries = adapter.getCanonicalTestEvidenceByEvidenceType(adapter.EVIDENCE_TYPES.PREVIEW_FIXTURE);
assert(previewEntries.some((entry) => entry.test_id === 'quote_pdf_preview_fixture_candidate'));

const decisionRequired = adapter.getCanonicalDecisionRequiredTestEvidence();
assert(decisionRequired.some((entry) => entry.test_id === 'real_retirement_scenario_candidate'));
assert(decisionRequired.some((entry) => entry.test_id === 'real_retirement_mxn_scenario_candidate'));

const fixtures = adapter.getFixtureOnlyTestEvidence();
assert.equal(fixtures.length, 1);
assert.equal(fixtures[0].test_id, 'quote_pdf_preview_fixture_candidate');

const governanceOnly = adapter.getGovernanceOnlyTestEvidence();
assert(governanceOnly.length >= 2);
assert(governanceOnly.some((entry) => entry.test_id === 'repo_promotion_guardrail_candidate'));

const missing = adapter.getCanonicalTestEvidenceById('missing_test');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.canonical_candidate, false);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EVIDENCE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.TEST_EXECUTION_NOT_AUTHORIZED));
assert.equal(adapter.validateCanonicalTestEvidenceShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
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

console.log('PASS quote preview pdf engine canonical test evidence registry adapter 078B');
NODE

pass "$TEST written"

stage "STAGE 9 WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Canonical Test Evidence Implementation 078B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

078B implements a local/static/read-only canonical test evidence registry for the Quote Preview PDF Engine path.

The registry classifies existing/candidate tests by evidence role. It does not execute real tests, read PDFs, run OCR, run parsers, run calculators, call Banxico, call providers, connect backend, write quotes, or create real effects.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Adapter Contract

- \`ADAPTER_ID\`: \`forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1\`
- \`SCHEMA_VERSION\`: \`forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1\`
- \`domainId\`: \`quote_preview_pdf_engine_canonical_test_evidence\`
- \`mode\`: \`read_only\`
- \`routeClass\`: \`preview_safe\`

## Registry Categories

078B classifies:

- real PDF/OCR evidence candidates;
- real GMM parser evidence candidates;
- GMM cost summary candidates;
- real retirement/Solucionline parser candidates;
- real retirement MXN projection candidates;
- Imagina Ser flow candidates;
- Banxico/cache metadata candidates;
- deterministic UDI projection smoke candidates;
- preview fixture evidence;
- governance guardrail evidence.

## Critical Boundaries

078B explicitly keeps:

- fixture tests separate from real PDF evidence;
- governance tests separate from extraction proof;
- provider/rate integration separate from runtime-safe provider calls;
- preview summaries separate from quote truth;
- expected financial values blocked unless their provenance is confirmed;
- real PDF/OCR/parser/calculator execution unauthorized.

## Registry Fields

Each evidence entry contains:

- \`test_id\`
- \`file_path\`
- \`evidence_type\`
- \`product_family\`
- \`source_surface_refs\`
- \`engine_refs\`
- \`fixture_refs\`
- \`canonical_candidate\`
- \`canonical_status\`
- \`evidence_role\`
- \`execution_policy\`
- \`blocked_growth\`
- \`safe_errors\`
- \`safety_flags\`

## Not Authorized

078B does not authorize:

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
# Forge Quote Preview PDF Engine Canonical Test Evidence Implementation 078B

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

078B implements a local/static/read-only canonical test evidence registry.

It classifies existing test evidence candidates without executing them.

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
- registry shape;
- required evidence fields;
- no execution flags;
- real PDF/OCR evidence candidate classification;
- GMM parser evidence candidate classification;
- GMM expected-value provenance gate;
- retirement/Solucionline parser decision-required classification;
- retirement MXN projection provenance gate;
- Banxico/cache runtime gate;
- preview fixture evidence is not real PDF evidence;
- governance evidence is not extraction proof;
- missing evidence safe error;
- all safety flags false.

## Commands

- \`node --check $SURFACES_ADAPTER\`
- \`node --check $SURFACES_TEST\`
- \`node $SURFACES_TEST\`
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
# Forge Quote Preview PDF Engine Canonical Test Evidence Implementation Certificate 078B

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

078B certifies that Forge now has a local/static/read-only canonical test evidence registry for the Quote Preview PDF Engine path.

Certified statements:

- existing/candidate tests are classified before further promotion;
- no real tests are executed;
- no PDFs are read;
- no OCR/parsers/calculators/Banxico/providers are executed;
- fixture tests are not real PDF evidence;
- governance tests are not extraction proof;
- provider integration candidates require later runtime gate;
- expected financial values require provenance review;
- Product Intelligence remains upstream;
- Quote Preview remains downstream;
- all safety flags remain false.

## No-Effect Boundary

This implementation authorizes no PDF reads, OCR execution, parser execution, calculator execution, Banxico calls, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "078A_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_SCOPE",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_SCOPED"
  },
  "next": "$NEXT",
  "implementation": {
    "adapter": "$ADAPTER",
    "test": "$TEST",
    "adapterId": "forge.quote_preview.pdf_engine.canonical_test_evidence.registry.adapter.v1",
    "schemaVersion": "forge.quote_preview.pdf_engine.canonical_test_evidence.registry.v1",
    "domainId": "quote_preview_pdf_engine_canonical_test_evidence",
    "mode": "read_only",
    "routeClass": "preview_safe",
    "registryType": "local_static_read_only_canonical_test_evidence_registry",
    "testExecutionIntroduced": false,
    "pdfReadIntroduced": false,
    "ocrExecutionIntroduced": false,
    "parserExecutionIntroduced": false,
    "calculatorExecutionIntroduced": false,
    "banxicoCallIntroduced": false,
    "providerExecutionIntroduced": false,
    "newExtractorCreated": false,
    "newParserCreated": false,
    "newCalculatorCreated": false
  },
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "classifiedEvidenceTypes": [
    "real_pdf_ocr",
    "real_pdf_gmm_parser",
    "real_or_fixture_gmm_cost_summary",
    "real_pdf_retirement_parser",
    "real_pdf_retirement_projection",
    "imagina_ser_flow",
    "rate_cache_metadata",
    "deterministic_projection_smoke",
    "preview_fixture",
    "governance_guardrail"
  ],
  "classificationRules": {
    "fixtureTestsAreNotRealPdfEvidence": true,
    "governanceTestsAreNotExtractionProof": true,
    "providerIntegrationTestsNeedRuntimeGate": true,
    "previewSummariesAreNotQuoteTruth": true,
    "inventedExpectedFinancialValuesBlocked": true
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
    "base078A": "PASS",
    "discoveryJson": "PASS",
    "nodeCheckSurfacesAdapter": "PASS",
    "nodeCheckSurfacesTest": "PASS",
    "nodeSurfacesTest": "PASS",
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
## 078B Quote Preview PDF Engine Canonical Test Evidence Implementation

078B implements a local/static/read-only canonical test evidence registry for the Quote Preview PDF Engine path.

Locked decision:
\`$LOCKED_DECISION\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

The registry classifies existing/candidate tests without executing them.

Classified evidence types:

- real PDF/OCR evidence candidates;
- real GMM parser evidence candidates;
- GMM cost summary candidates;
- real retirement/Solucionline parser candidates;
- real retirement MXN projection candidates;
- Imagina Ser flow candidates;
- Banxico/cache metadata candidates;
- deterministic UDI projection smoke candidates;
- preview fixture evidence;
- governance guardrail evidence.

Boundaries:

- fixture tests are not real PDF evidence;
- governance tests are not extraction proof;
- provider integration candidates require later runtime gate;
- preview summaries are not quote truth;
- expected financial values require provenance review;
- no PDF/OCR/parser/calculator/Banxico/provider/test execution is authorized.

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
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|canonical test evidence|fixture tests|governance tests|not extraction proof|not real PDF evidence|expected financial values" \
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
run git commit -m "feat: implement quote preview pdf canonical test evidence registry"
run git push origin HEAD:main

stage "STAGE 16 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_078B_QUOTE_PREVIEW_PDF_ENGINE_CANONICAL_TEST_EVIDENCE_IMPLEMENTATION_COMMIT_PUSH_COMPLETE
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
