#!/usr/bin/env bash
set -euo pipefail

PHASE="082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE"
DECISION="PASS_082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPED"
NEXT="082B_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_IMPLEMENTATION"
MODE="docs/scope only; expected-value source trace requirements before any assertion/execution"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no expected-value verification; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/082a-quote-preview-pdf-engine-expected-value-source-trace-scope-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_082a_quote_preview_pdf_engine_expected_value_source_trace_scope.sh"

SURFACES_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b.js"
SURFACES_TEST="tests/quote-preview-pdf-engine-existing-surfaces-canonical-mapping-adapter-077b-test.js"
EVIDENCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js"
EVIDENCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b-test.js"
PROVENANCE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js"
PROVENANCE_TEST="tests/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b-test.js"
READINESS_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js"
READINESS_TEST="tests/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b-test.js"
FILE_HASH_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-real-pdf-file-hash-provenance-registry-adapter-081b.js"
FILE_HASH_TEST="tests/quote-preview-pdf-engine-real-pdf-file-hash-provenance-registry-adapter-081b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE_082A.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE_082A.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE_CERTIFICATE_082A.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-expected-value-source-trace-scope-audit-082a.json"

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

replace_or_append_block(){
  local path="$1"
  local phase="$2"
  local block_file="$3"
  python3 - <<PY "$path" "$phase" "$block_file"
from pathlib import Path
import sys
path = Path(sys.argv[1])
phase = sys.argv[2]
block = Path(sys.argv[3]).read_text()
text = path.read_text()
start = f"<!-- FORGE:{phase}:START -->"
end = f"<!-- FORGE:{phase}:END -->"
if start in text and end in text:
    before = text.split(start)[0]
    after = text.split(end, 1)[1]
    text = before.rstrip() + "\n\n" + block.strip() + "\n" + after
else:
    text = text.rstrip() + "\n\n" + block.strip() + "\n"
path.write_text(text.rstrip() + "\n")
PY
}

trim_tree_files(){
  python3 - <<'PYTRIM'
from pathlib import Path
for path in [
    Path("FORGE_MASTER_BUILD_TREE.md"),
    Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"),
    Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md"),
]:
    path.write_text(path.read_text().rstrip() + "\n")
    print(f"trimmed EOF blanks: {path}")
PYTRIM
}

safety_scan(){
  local files=("$@")
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network marker"
  fi
  if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|ocrExecution|parserExecution|calculatorExecution|banxicoCall|testExecution)"?\s*[:=]\s*true\b' "${files[@]}"; then
    fail "real-effect flag true found"
  fi
  pass "safety scan clean"
}

commit_allowed_subset(){
  local msg="$1"
  shift
  local allowed=("$@")
  git add "${allowed[@]}"
  run git diff --cached --name-only
  run git diff --cached --check

  local allowed_file staged_file unexpected
  allowed_file="$(mktemp)"
  staged_file="$(mktemp)"
  printf "%s\n" "${allowed[@]}" | sort > "$allowed_file"
  git diff --cached --name-only | sort > "$staged_file"

  unexpected="$(comm -23 "$staged_file" "$allowed_file" || true)"
  if [ -n "$unexpected" ]; then
    echo "$unexpected"
    fail "staged files include files outside authorized boundary"
  fi

  if [ ! -s "$staged_file" ]; then
    fail "no staged changes for commit"
  fi

  pass "staged files are within authorized boundary"
  run git commit -m "$msg"
  run git push origin HEAD:main
}

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 081D file/hash provenance closed; expected-value source trace scope only; no verification/execution"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -15
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 081D"
if git log --oneline -80 | grep -Eq "081D|real file hash provenance decision|QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_NOT_VERIFIED_REFERENCE_REGISTRY"; then
  pass "081D commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-real-pdf-file-hash-provenance-decision-audit-081d.json" ]; then
  pass "081D audit fallback found"
else
  fail "081D base not found. Run 081B/C/D repair first."
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-real-pdf-file-hash-provenance-decision-audit-081d.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-real-pdf-file-hash-provenance-decision-audit-081d.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_NOT_VERIFIED_REFERENCE_REGISTRY"|"next"\s*:\s*"082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE"' docs/evidence/forge-quote-preview-pdf-engine-real-pdf-file-hash-provenance-decision-audit-081d.json >/dev/null; then
    fail "081D audit exists but does not confirm PASS/082A next"
  fi
  pass "081D audit PASS/082A next confirmed"
else
  warn "081D audit file not found; relying on git log/tree markers"
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

if rec.get("do_not_create_new_pdf_extractor") is not True:
    raise SystemExit("Discovery does not block new extractor creation")

digest = {
    "discoveryJson": str(source),
    "counts": data.get("counts", {}),
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
  "$FILE_HASH_ADAPTER"
  "$FILE_HASH_TEST"
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

cat > "$BACKUP_DIR/rollback-082a.sh" <<ROLLBACK
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
echo "rollback 082A complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-082a.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-082a.sh"

stage "STAGE 6 REVALIDATE REFERENCE REGISTRIES"
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
run node --check "$FILE_HASH_ADAPTER"
run node --check "$FILE_HASH_TEST"
run node "$FILE_HASH_TEST"

stage "STAGE 7 BUILD EXPECTED-VALUE SOURCE TRACE SCOPE"
EXPECTED_TRACE_SCOPE_JSON="$(mktemp)"
node <<'NODE' > "$EXPECTED_TRACE_SCOPE_JSON"
const evidence = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-registry-adapter-078b.js');
const provenance = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-test-evidence-provenance-registry-adapter-079b.js');
const readiness = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const fileHash = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-real-pdf-file-hash-provenance-registry-adapter-081b.js');

const evidenceCatalog = evidence.getQuotePreviewPdfCanonicalTestEvidenceRegistryCatalog();
const provenanceCatalog = provenance.getQuotePreviewPdfCanonicalTestEvidenceProvenanceRegistryCatalog();
const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
const fileHashCatalog = fileHash.getQuotePreviewPdfEngineRealPdfFileHashProvenanceRegistryCatalog();

const readinessGate = readiness.getReadinessGateById('expected_value_source_trace_ready');

const traceCandidates = [
  {
    trace_id: 'trace_gmm_out_of_pocket_expected_values',
    test_id: 'gmm_out_of_pocket_candidate',
    expected_value_kind: 'gmm_out_of_pocket_expected_value',
    product_family: 'gmm',
    provenance_ref: 'prov_gmm_out_of_pocket_expected_values',
    required_source_trace: 'pdf_derived_fields_or_fixture_source_or_existing_summary_engine',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false,
    blocked_misuse: [
      'invented_expected_value',
      'fixture_as_real_pdf',
      'governance_as_extraction_proof',
      'parser_execution_before_source_trace'
    ],
    safe_errors: [
      'QUOTE_PREVIEW_EXPECTED_VALUE_SOURCE_TRACE_NOT_BOUND',
      'QUOTE_PREVIEW_EXPECTED_VALUE_NOT_VERIFIED',
      'QUOTE_PREVIEW_EXPECTED_VALUE_EXECUTION_NOT_AUTHORIZED'
    ]
  },
  {
    trace_id: 'trace_real_retirement_mxn_expected_values',
    test_id: 'real_retirement_mxn_scenario_candidate',
    expected_value_kind: 'retirement_mxn_projection_expected_value',
    product_family: 'retirement',
    provenance_ref: 'prov_real_retirement_mxn_expected_values',
    required_source_trace: 'pdf_derived_fields_plus_existing_projection_engine_inputs',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false,
    blocked_misuse: [
      'invented_expected_value',
      'untraceable_projection',
      'invented_udi_growth',
      'invented_current_udi',
      'calculator_execution_before_source_trace'
    ],
    safe_errors: [
      'QUOTE_PREVIEW_EXPECTED_VALUE_SOURCE_TRACE_NOT_BOUND',
      'QUOTE_PREVIEW_EXPECTED_VALUE_NOT_VERIFIED',
      'QUOTE_PREVIEW_UNTRACEABLE_PROJECTION_BLOCKED',
      'QUOTE_PREVIEW_EXPECTED_VALUE_EXECUTION_NOT_AUTHORIZED'
    ]
  },
  {
    trace_id: 'trace_retirement_future_udi_deterministic_inputs',
    test_id: 'retirement_future_udi_projection_smoke_candidate',
    expected_value_kind: 'deterministic_projection_input_trace',
    product_family: 'retirement',
    provenance_ref: 'prov_retirement_future_udi_deterministic_inputs',
    required_source_trace: 'existing_repo_engine_or_config_for_udi_current_value_and_growth_assumption',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false,
    blocked_misuse: [
      'invented_udi_growth',
      'invented_current_udi',
      'calculator_execution_before_input_trace'
    ],
    safe_errors: [
      'QUOTE_PREVIEW_DETERMINISTIC_INPUT_SOURCE_TRACE_NOT_BOUND',
      'QUOTE_PREVIEW_DETERMINISTIC_INPUT_NOT_VERIFIED',
      'QUOTE_PREVIEW_EXPECTED_VALUE_EXECUTION_NOT_AUTHORIZED'
    ]
  }
];

const scope = {
  status: 'PASS',
  phase: '082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE',
  scope_type: 'expected_value_source_trace_scope_only',
  base_readiness_gate: readinessGate.gate_id,
  base_readiness_gate_status: readinessGate.gate_status,
  base_readiness_decision: readinessGate.readiness_decision,
  overall_readiness_before_082a: readinessCatalog.overall_readiness,
  file_hash_registry_status_before_082a: fileHashCatalog.overall_binding_status,
  execution_allowed_in_082a: false,
  pdf_read_allowed_in_082a: false,
  pdf_hash_computation_allowed_in_082a: false,
  ocr_execution_allowed_in_082a: false,
  parser_execution_allowed_in_082a: false,
  calculator_execution_allowed_in_082a: false,
  banxico_call_allowed_in_082a: false,
  provider_call_allowed_in_082a: false,
  test_execution_allowed_in_082a: false,
  backend_connection_allowed_in_082a: false,
  quote_write_allowed_in_082a: false,
  source_registry_refs: {
    evidence: {
      adapter_id: evidenceCatalog.adapter_id,
      schemaVersion: evidenceCatalog.schemaVersion,
      evidence_count: Array.isArray(evidenceCatalog.evidence) ? evidenceCatalog.evidence.length : 0
    },
    provenance: {
      adapter_id: provenanceCatalog.adapter_id,
      schemaVersion: provenanceCatalog.schemaVersion,
      provenance_count: Array.isArray(provenanceCatalog.provenance) ? provenanceCatalog.provenance.length : 0
    },
    readiness: {
      adapter_id: readinessCatalog.adapter_id,
      schemaVersion: readinessCatalog.schemaVersion,
      overall_readiness: readinessCatalog.overall_readiness
    },
    file_hash: {
      adapter_id: fileHashCatalog.adapter_id,
      schemaVersion: fileHashCatalog.schemaVersion,
      overall_binding_status: fileHashCatalog.overall_binding_status
    }
  },
  trace_candidate_count: traceCandidates.length,
  trace_candidates: traceCandidates,
  required_082b_output: {
    adapter_type: 'local_static_read_only_expected_value_source_trace_registry',
    must_not_read_pdfs: true,
    must_not_compute_hashes: true,
    must_not_run_ocr: true,
    must_not_run_parsers: true,
    must_not_run_calculators: true,
    must_not_call_banxico: true,
    must_not_execute_tests: true,
    must_not_connect_backend: true,
    must_not_verify_expected_values: true,
    must_record_source_trace_requirements_only: true,
    must_preserve_not_verified_status: true,
    required_fields: [
      'trace_id',
      'test_id',
      'expected_value_kind',
      'product_family',
      'source_registry_refs',
      'required_source_trace',
      'source_trace_status',
      'verification_status',
      'execution_allowed',
      'blocked_misuse',
      'safe_errors',
      'safety_flags'
    ]
  },
  blocked_misuse: [
    'invented_expected_value',
    'hardcoded_financial_truth_without_source',
    'fixture_as_real_pdf',
    'governance_as_extraction_proof',
    'untraceable_projection',
    'invented_udi_growth',
    'invented_current_udi',
    'calculator_execution_disguised_as_trace',
    'parser_execution_disguised_as_trace',
    'banxico_call_disguised_as_trace'
  ],
  next_decision_after_082d: 'parser_ownership_gate_or_deterministic_input_source_trace_gate_after_expected_value_source_trace_decision',
  safety_flags: {
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
    testExecution: false
  }
};

if (scope.overall_readiness_before_082a !== 'not_ready_for_execution') {
  throw new Error('082A requires not_ready_for_execution base');
}
if (traceCandidates.length < 1) {
  throw new Error('082A must scope expected-value trace candidates');
}
if (scope.calculator_execution_allowed_in_082a !== false || scope.parser_execution_allowed_in_082a !== false) {
  throw new Error('082A must not execute calculators or parsers');
}

console.log(JSON.stringify(scope, null, 2));
NODE

cat "$EXPECTED_TRACE_SCOPE_JSON"
pass "expected-value source trace scope built"

stage "STAGE 8 WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Expected Value Source Trace Scope 082A

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

082A scopes expected-value source trace for the Quote Preview PDF Engine path.

This phase follows 081D, where real PDF file/hash provenance was locked as a local/static/read-only not-verified reference registry.

082A addresses the next blocking gate:

\`expected_value_source_trace_ready\`

## Important Boundary

082A does not verify expected values.

082A does not read PDFs.

082A does not run OCR, parsers, calculators, Banxico, providers, backend, or tests.

082A only scopes the source-trace registry required before any expected financial value can be used as an assertion.

Because "expected value" without a source is just numerology wearing a tie.

## Base Confirmed

081D is closed as:

- \`PASS_081D_QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_DECISION_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_NOT_VERIFIED_REFERENCE_REGISTRY\`
- \`NEXT=082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE\`

## Scoped Expected-Value Trace Candidates

082A scopes source trace for:

- \`gmm_out_of_pocket_candidate\`
- \`real_retirement_mxn_scenario_candidate\`
- \`retirement_future_udi_projection_smoke_candidate\`

## Required 082B Shape

082B must implement a local/static/read-only expected-value source trace registry.

Required fields:

- \`trace_id\`
- \`test_id\`
- \`expected_value_kind\`
- \`product_family\`
- \`source_registry_refs\`
- \`required_source_trace\`
- \`source_trace_status\`
- \`verification_status\`
- \`execution_allowed\`
- \`blocked_misuse\`
- \`safe_errors\`
- \`safety_flags\`

## Required 082B Decisions

082B must preserve:

- \`source_trace_status=not_bound\`
- \`verification_status=not_verified\`
- \`execution_allowed=false\`
- no PDF read;
- no parser execution;
- no calculator execution;
- no Banxico/provider call;
- no expected-value verification;
- no invented financial truth.

## Blocked Misuse

082B must block:

- invented expected values;
- hardcoded financial truth without source;
- fixture-as-real-PDF;
- governance-as-extraction-proof;
- untraceable projection;
- invented UDI growth;
- invented current UDI;
- calculator execution disguised as trace;
- parser execution disguised as trace;
- Banxico call disguised as trace.

## Not Authorized

082A does not authorize:

- PDF read;
- PDF hash computation;
- OCR execution;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- test execution;
- expected-value verification;
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
# Forge Quote Preview PDF Engine Expected Value Source Trace Scope 082A

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

082A scopes expected-value source trace.

It does not verify expected values, read PDFs, run OCR, run parsers, run calculators, call Banxico/providers, connect backend, write quotes, or execute tests.

## Discovery Evidence

Discovery JSON:

\`$DISCOVERY_JSON_FOUND\`

Discovery report:

\`${DISCOVERY_REPORT_MD:-not_found}\`

Discovery digest:

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Expected-Value Source Trace Scope

\`\`\`json
$(cat "$EXPECTED_TRACE_SCOPE_JSON")
\`\`\`

## Commands

- \`python3 -m json.tool "$DISCOVERY_JSON_FOUND"\`
- base adapter/test validations 077B/078B/079B/080B/081B
- local/static/read-only expected-value source trace scope builder
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
# Forge Quote Preview PDF Engine Expected Value Source Trace Scope Certificate 082A

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

082A certifies that expected-value source trace has been scoped before any expected-value assertion or execution gate.

Certified statements:

- 081D not-verified file/hash registry is the base;
- expected-value source trace is the active blocking gate;
- expected-value candidates are identified from existing registries;
- 082B must implement a local/static/read-only expected-value source trace registry;
- expected values remain not verified;
- source traces remain not bound;
- execution remains false;
- all safety flags remain false.

## No-Effect Boundary

This scope authorizes no expected-value verification, PDF reads, hash computation over PDFs, OCR execution, parser execution, calculator execution, Banxico calls, test execution, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "081D_QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_REAL_PDF_FILE_HASH_PROVENANCE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_NOT_VERIFIED_REFERENCE_REGISTRY"
  },
  "next": "$NEXT",
  "scopeType": "expected_value_source_trace_scope_only",
  "executionReadiness": "not_ready_for_execution",
  "activeBlockingGate": "expected_value_source_trace_ready",
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "expectedValueSourceTraceScope": $(cat "$EXPECTED_TRACE_SCOPE_JSON"),
  "required082B": {
    "adapterType": "local_static_read_only_expected_value_source_trace_registry",
    "mustNotReadPdfs": true,
    "mustNotComputeHashes": true,
    "mustNotRunOcr": true,
    "mustNotRunParsers": true,
    "mustNotRunCalculators": true,
    "mustNotCallBanxico": true,
    "mustNotExecuteTests": true,
    "mustNotConnectBackend": true,
    "mustNotVerifyExpectedValues": true,
    "mustRecordSourceTraceRequirementsOnly": true,
    "mustPreserveNotVerifiedStatus": true
  },
  "scopedCandidates": {
    "gmmOutOfPocketExpectedValues": true,
    "realRetirementMxnExpectedValues": true,
    "retirementFutureUdiDeterministicInputs": true
  },
  "blockedMisuse": {
    "inventedExpectedValue": true,
    "hardcodedFinancialTruthWithoutSource": true,
    "fixtureAsRealPdf": true,
    "governanceAsExtractionProof": true,
    "untraceableProjection": true,
    "inventedUdiGrowth": true,
    "inventedCurrentUdi": true,
    "calculatorExecutionDisguisedAsTrace": true,
    "parserExecutionDisguisedAsTrace": true,
    "banxicoCallDisguisedAsTrace": true
  },
  "notAuthorized": {
    "pdfRead": false,
    "pdfHashComputation": false,
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "testExecution": false,
    "expectedValueVerification": false,
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
    "base081D": "PASS",
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
    "nodeCheckFileHashAdapter": "PASS",
    "nodeCheckFileHashTest": "PASS",
    "nodeFileHashTest": "PASS",
    "expectedTraceScopeBuild": "PASS",
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
TREE_BLOCK="$(mktemp)"
cat > "$TREE_BLOCK" <<EOF
<!-- FORGE:$PHASE:START -->
## 082A Quote Preview PDF Engine Expected Value Source Trace Scope

082A scopes expected-value source trace for the Quote Preview PDF Engine path.

Locked decision:
\`$LOCKED_DECISION\`

Base:

- 081D locked real PDF file/hash provenance as a local/static/read-only not-verified reference registry.

Active blocking gate:

- \`expected_value_source_trace_ready\`

Scoped trace candidates:

- \`gmm_out_of_pocket_candidate\`
- \`real_retirement_mxn_scenario_candidate\`
- \`retirement_future_udi_projection_smoke_candidate\`

082B must implement a local/static/read-only expected-value source trace registry.

082B must preserve:

- \`source_trace_status=not_bound\`
- \`verification_status=not_verified\`
- \`execution_allowed=false\`
- no PDF read;
- no parser execution;
- no calculator execution;
- no Banxico/provider call;
- no expected-value verification.

Blocked misuse:

- invented expected values;
- hardcoded financial truth without source;
- fixture-as-real-PDF;
- governance-as-extraction-proof;
- untraceable projection;
- invented UDI growth/current UDI;
- calculator/parser/Banxico execution disguised as trace.

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
<!-- FORGE:$PHASE:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE" "$TREE_BLOCK"
done

trim_tree_files
pass "build tree / roadmap updated"

stage "STAGE 10 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 11 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$SURFACES_ADAPTER"
run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"
run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"
run node "$PROVENANCE_TEST"
run node --check "$READINESS_ADAPTER"
run node "$READINESS_TEST"
run node --check "$FILE_HASH_ADAPTER"
run node "$FILE_HASH_TEST"
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|expected-value source trace|source_trace_status=not_bound|verification_status=not_verified|invented expected|untraceable projection|calculator execution disguised" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 12 SAFETY SCAN"
safety_scan \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

stage "STAGE 13 COMMIT PUSH"
commit_allowed_subset \
  "docs: scope quote preview pdf expected value source trace" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$SCRIPT_IN_REPO"

stage "STAGE 14 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -12

SUMMARY=$(cat <<EOF
PASS_082A_QUOTE_PREVIEW_PDF_ENGINE_EXPECTED_VALUE_SOURCE_TRACE_SCOPE_COMMIT_PUSH_COMPLETE
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
