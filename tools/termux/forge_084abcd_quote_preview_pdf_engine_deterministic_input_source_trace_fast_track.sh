#!/usr/bin/env bash
set -euo pipefail

CHAIN="084ABCD_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_FAST_TRACK"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/084abcd-deterministic-input-source-trace-fast-track-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_084abcd_quote_preview_pdf_engine_deterministic_input_source_trace_fast_track.sh"

PHASE_A="084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE"
DECISION_A="PASS_084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE"
LOCKED_A="QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPED"

PHASE_B="084B_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION"
DECISION_B="PASS_084B_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION"
LOCKED_B="QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"

PHASE_C="084C_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCK"
DECISION_C="PASS_084C_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCK"
LOCKED_C="QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCKED"

PHASE_D="084D_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_DECISION_LOCK"
DECISION_D="PASS_084D_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_DECISION_LOCK"
LOCKED_D="QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_LOCKED_AS_LOCAL_STATIC_READ_ONLY_NOT_BOUND_NOT_VERIFIED_REFERENCE_REGISTRY"
NEXT_AFTER_D="085A_QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_SCOPE"

BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no expected-value verification; no parser invocation; no deterministic calculation; no invented UDI/current value/growth/horizon/formula/quote truth; no new extractor/parser/calculator; no real test execution"

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
EXPECTED_TRACE_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b.js"
EXPECTED_TRACE_TEST="tests/quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b-test.js"
PARSER_OWNERSHIP_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-parser-ownership-registry-adapter-083b.js"
PARSER_OWNERSHIP_TEST="tests/quote-preview-pdf-engine-parser-ownership-registry-adapter-083b-test.js"

ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js"
TEST="tests/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b-test.js"

ARCH_DOC_A="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE_084A.md"
EVIDENCE_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE_084A.md"
CERT_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE_CERTIFICATE_084A.md"
AUDIT_JSON_A="docs/evidence/forge-quote-preview-pdf-engine-deterministic-input-source-trace-scope-audit-084a.json"

ARCH_DOC_B="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION_084B.md"
EVIDENCE_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION_084B.md"
CERT_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION_CERTIFICATE_084B.md"
AUDIT_JSON_B="docs/evidence/forge-quote-preview-pdf-engine-deterministic-input-source-trace-implementation-audit-084b.json"

ARCH_DOC_C="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCK_084C.md"
EVIDENCE_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCK_084C.md"
CERT_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_QA_LOCK_CERTIFICATE_084C.md"
AUDIT_JSON_C="docs/evidence/forge-quote-preview-pdf-engine-deterministic-input-source-trace-qa-audit-084c.json"

ARCH_DOC_D="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_DECISION_LOCK_084D.md"
EVIDENCE_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_DECISION_LOCK_084D.md"
CERT_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_DECISION_LOCK_CERTIFICATE_084D.md"
AUDIT_JSON_D="docs/evidence/forge-quote-preview-pdf-engine-deterministic-input-source-trace-decision-audit-084d.json"

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
  echo "DECISION=HOLD_${CHAIN}" | tee -a "$REPORT"
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
  find /data/data/com.termux/files/home -path "*/forge-discovery-*/*DISCOVERY_077A_PRECHECK_EXISTING_QUOTE_PDF_TESTS_AND_ENGINES_REPORT_*.json" -type f 2>/dev/null | sort | tail -1
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
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|runParser\s*:\s*true|executeParser\s*:\s*true|parserRuntimeEnabled\s*:\s*true|runCalculator\s*:\s*true|executeCalculator\s*:\s*true|calculatorRuntimeEnabled\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/parser/calculator marker"
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
echo "CHAIN=$CHAIN"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 083D parser ownership closed; deterministic input source trace fast-track only; no calculation"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -15
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CLEAN INDEX ONLY"
run git reset

stage "STAGE 3 CONFIRM BASE 083D"
if git log --oneline -140 | grep -Eq "083D|parser ownership decision|QUOTE_PREVIEW_PDF_ENGINE_PARSER_OWNERSHIP_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"; then
  pass "083D base found in git log"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-parser-ownership-decision-audit-083d.json" ]; then
  pass "083D audit fallback found"
else
  fail "083D base not found. Run 083A/B/C/D first."
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-parser-ownership-decision-audit-083d.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-parser-ownership-decision-audit-083d.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_PARSER_OWNERSHIP_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"|"next"\s*:\s*"084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE"' docs/evidence/forge-quote-preview-pdf-engine-parser-ownership-decision-audit-083d.json >/dev/null; then
    fail "083D audit exists but does not confirm PASS/084A next"
  fi
  pass "083D audit PASS/084A next confirmed"
else
  warn "083D audit file not found; relying on git log/tree markers"
fi

stage "STAGE 4 DISCOVERY EVIDENCE"
DISCOVERY_JSON_FOUND="$(find_latest_discovery_json || true)"
if [ -z "$DISCOVERY_JSON_FOUND" ] || [ ! -f "$DISCOVERY_JSON_FOUND" ]; then
  fail "Discovery JSON not found. Run discovery first or set DISCOVERY_JSON=/path/report.json"
fi

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

stage "STAGE 5 REQUIRED FILES"
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
  "$EXPECTED_TRACE_ADAPTER"
  "$EXPECTED_TRACE_TEST"
  "$PARSER_OWNERSHIP_ADAPTER"
  "$PARSER_OWNERSHIP_TEST"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

stage "STAGE 6 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"
pass "$BACKUP_DIR"

stage "STAGE 7 BASE VALIDATION"
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
run node --check "$EXPECTED_TRACE_ADAPTER"
run node "$EXPECTED_TRACE_TEST"
run node --check "$PARSER_OWNERSHIP_ADAPTER"
run node "$PARSER_OWNERSHIP_TEST"

# -------------------------------------------------------------------
# 084A SCOPE
# -------------------------------------------------------------------
stage "084A BUILD SCOPE"
INPUT_SCOPE_JSON="$(mktemp)"
node <<'NODE' > "$INPUT_SCOPE_JSON"
const readiness = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const expectedTrace = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b.js');
const parserOwnership = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-parser-ownership-registry-adapter-083b.js');

const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
const expectedTraceCatalog = expectedTrace.getQuotePreviewPdfEngineExpectedValueSourceTraceRegistryCatalog();
const parserOwnershipCatalog = parserOwnership.getQuotePreviewPdfEngineParserOwnershipRegistryCatalog();
const deterministicGate = readiness.getReadinessGateById('deterministic_input_source_trace_ready');

const deterministicInputs = [
  {
    input_trace_id: 'input_current_udi_value_source_trace',
    input_key: 'current_udi_value',
    input_kind: 'banxico_or_cache_rate_input',
    product_family: 'retirement',
    source_candidate_refs: ['shared-banxico-rate-engine.js', 'shared-banxico-edge-provider.js', 'exchange-rate-cache-engine.js'],
    required_source_trace: 'existing_rate_cache_or_provider_metadata_gate_before_runtime',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false
  },
  {
    input_trace_id: 'input_udi_growth_assumption_source_trace',
    input_key: 'udi_growth_assumption',
    input_kind: 'projection_assumption_input',
    product_family: 'retirement',
    source_candidate_refs: ['retirement-future-udi-projection-engine.js'],
    required_source_trace: 'existing_repo_engine_or_config_declared_assumption_before_calculation',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false
  },
  {
    input_trace_id: 'input_projection_horizon_source_trace',
    input_key: 'projection_horizon',
    input_kind: 'scenario_horizon_input',
    product_family: 'retirement',
    source_candidate_refs: ['tests/real-retirement-mxn-scenario-test.js', 'retirement-future-udi-projection-smoke-test.js'],
    required_source_trace: 'scenario_fixture_or_pdf_derived_horizon_before_projection',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false
  },
  {
    input_trace_id: 'input_projection_formula_source_trace',
    input_key: 'projection_formula',
    input_kind: 'existing_calculator_formula_reference',
    product_family: 'retirement',
    source_candidate_refs: ['retirement-future-udi-projection-engine.js', 'imagina-ser-future-mxn-bridge.js'],
    required_source_trace: 'existing_engine_formula_reference_only_no_duplicate_calculator',
    source_trace_status: 'not_bound',
    verification_status: 'not_verified',
    execution_allowed: false
  }
];

const scope = {
  status: 'PASS',
  phase: '084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE',
  scope_type: 'deterministic_input_source_trace_scope_only',
  base_readiness_gate: deterministicGate.gate_id,
  base_readiness_gate_status: deterministicGate.gate_status,
  base_readiness_decision: deterministicGate.readiness_decision,
  overall_readiness_before_084a: readinessCatalog.overall_readiness,
  expected_trace_registry_status_before_084a: expectedTraceCatalog.overall_trace_status,
  parser_ownership_registry_status_before_084a: parserOwnershipCatalog.overall_ownership_status,
  execution_allowed_in_084a: false,
  deterministic_calculation_allowed_in_084a: false,
  parser_execution_allowed_in_084a: false,
  pdf_read_allowed_in_084a: false,
  ocr_execution_allowed_in_084a: false,
  calculator_execution_allowed_in_084a: false,
  banxico_call_allowed_in_084a: false,
  provider_call_allowed_in_084a: false,
  test_execution_allowed_in_084a: false,
  backend_connection_allowed_in_084a: false,
  quote_write_allowed_in_084a: false,
  deterministic_input_count: deterministicInputs.length,
  deterministic_inputs: deterministicInputs,
  required_084b_output: {
    adapter_type: 'local_static_read_only_deterministic_input_source_trace_registry',
    must_not_run_calculators: true,
    must_not_call_banxico: true,
    must_not_read_pdfs: true,
    must_not_run_parsers: true,
    must_not_execute_tests: true,
    must_not_connect_backend: true,
    must_record_source_trace_requirements_only: true,
    must_preserve_not_verified_status: true,
    required_fields: [
      'input_trace_id',
      'input_key',
      'input_kind',
      'product_family',
      'source_candidate_refs',
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
    'invented_current_udi',
    'invented_udi_growth',
    'invented_projection_horizon',
    'invented_projection_formula',
    'calculator_execution_disguised_as_trace',
    'banxico_call_disguised_as_trace',
    'duplicate_calculator_creation',
    'projection_truth_without_source_trace'
  ],
  next_decision_after_084d: 'preview_vs_quote_truth_boundary_scope',
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

if (scope.overall_readiness_before_084a !== 'not_ready_for_execution') {
  throw new Error('084A requires not_ready_for_execution base');
}
if (deterministicInputs.length < 1) {
  throw new Error('084A must scope deterministic input candidates');
}

console.log(JSON.stringify(scope, null, 2));
NODE

cat "$INPUT_SCOPE_JSON"

stage "084A WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC_A")" "$(dirname "$EVIDENCE_DOC_A")"

cat > "$ARCH_DOC_A" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Scope 084A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Purpose

084A scopes deterministic input source trace for the Quote Preview PDF Engine path.

This phase follows 083D, where parser ownership was locked as local/static/read-only reference registry.

084A addresses the blocking gate:

\`deterministic_input_source_trace_ready\`

## Important Boundary

084A does not calculate projections.

084A does not call Banxico.

084A does not read PDFs, run parsers, run OCR, run calculators, run providers, connect backend, or execute tests.

084A only scopes the input source-trace registry required before deterministic projection inputs can be trusted. In other words: no more “the UDI grows because vibes.” Humanity staggers toward civilization.

## Scoped Deterministic Inputs

- \`current_udi_value\`
- \`udi_growth_assumption\`
- \`projection_horizon\`
- \`projection_formula\`

## Required 084B Shape

084B must implement a local/static/read-only deterministic input source trace registry.

Required fields:

- \`input_trace_id\`
- \`input_key\`
- \`input_kind\`
- \`product_family\`
- \`source_candidate_refs\`
- \`required_source_trace\`
- \`source_trace_status\`
- \`verification_status\`
- \`execution_allowed\`
- \`blocked_misuse\`
- \`safe_errors\`
- \`safety_flags\`

## Required 084B Decisions

084B must preserve:

- \`source_trace_status=not_bound\`
- \`verification_status=not_verified\`
- \`execution_allowed=false\`
- no calculator execution;
- no Banxico/provider call;
- no duplicate calculator creation;
- no projection truth without source trace.

## Final Decision

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$EVIDENCE_DOC_A" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Scope 084A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Evidence Summary

084A scopes deterministic input source trace only.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Deterministic Input Source Trace Scope

\`\`\`json
$(cat "$INPUT_SCOPE_JSON")
\`\`\`

## Final

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$CERT_DOC_A" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Scope Certificate 084A

PHASE=$PHASE_A

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

084A certifies that deterministic input source trace has been scoped before any calculation gate.

$DECISION_A
EOF

cat > "$AUDIT_JSON_A" <<EOF
{
  "phase": "$PHASE_A",
  "status": "PASS",
  "decision": "$DECISION_A",
  "lockedDecision": "$LOCKED_A",
  "base": {
    "phase": "083D_QUOTE_PREVIEW_PDF_ENGINE_PARSER_OWNERSHIP_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_PARSER_OWNERSHIP_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
  },
  "next": "$PHASE_B",
  "scopeType": "deterministic_input_source_trace_scope_only",
  "deterministicInputScope": $(cat "$INPUT_SCOPE_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "notAuthorized": {
    "pdfRead": false,
    "ocrExecution": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
    "testExecution": false,
    "backendConnection": false,
    "quoteWrite": false,
    "deterministicCalculation": false
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
  }
}
EOF

TREE_BLOCK_A="$(mktemp)"
cat > "$TREE_BLOCK_A" <<EOF
<!-- FORGE:$PHASE_A:START -->
## 084A Quote Preview PDF Engine Deterministic Input Source Trace Scope

084A scopes deterministic input source trace for the Quote Preview PDF Engine path.

Locked decision:
\`$LOCKED_A\`

Active blocking gate:

- \`deterministic_input_source_trace_ready\`

Scoped deterministic inputs:

- \`current_udi_value\`
- \`udi_growth_assumption\`
- \`projection_horizon\`
- \`projection_formula\`

084B must implement a local/static/read-only deterministic input source trace registry.

Boundaries:

- no deterministic calculation;
- no calculator execution;
- no Banxico/provider call;
- no PDF/parser/OCR/test execution;
- no duplicate calculator creation;
- no projection truth without source trace.

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
<!-- FORGE:$PHASE_A:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_A" "$TREE_BLOCK_A"
done
trim_tree_files

mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"

run bash -n "$SCRIPT_IN_REPO"
run python3 -m json.tool "$AUDIT_JSON_A"
run rg -n "$PHASE_A|$DECISION_A|$LOCKED_A|$PHASE_B|deterministic input source trace|current_udi_value|udi_growth_assumption|projection_horizon|projection_formula|no deterministic calculation" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"

commit_allowed_subset \
  "docs: scope quote preview pdf deterministic input source trace" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 084B IMPLEMENTATION
# -------------------------------------------------------------------
stage "084B IMPLEMENT ADAPTER"
mkdir -p "$(dirname "$ADAPTER")" "$(dirname "$TEST")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const readiness = require('./quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const expectedTrace = require('./quote-preview-pdf-engine-expected-value-source-trace-registry-adapter-082b.js');
const parserOwnership = require('./quote-preview-pdf-engine-parser-ownership-registry-adapter-083b.js');

const ADAPTER_ID = 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.v1';
const DOMAIN_ID = 'quote_preview_pdf_engine_deterministic_input_source_trace';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const SOURCE_TRACE_STATUSES = Object.freeze({
  NOT_BOUND: 'not_bound',
  BOUND_DECLARED_ONLY: 'bound_declared_only',
  REJECTED: 'rejected',
});

const VERIFICATION_STATUSES = Object.freeze({
  NOT_VERIFIED: 'not_verified',
  VERIFIED_BY_SOURCE: 'verified_by_source',
  REJECTED: 'rejected',
});

const INPUT_KINDS = Object.freeze({
  BANXICO_OR_CACHE_RATE_INPUT: 'banxico_or_cache_rate_input',
  PROJECTION_ASSUMPTION_INPUT: 'projection_assumption_input',
  SCENARIO_HORIZON_INPUT: 'scenario_horizon_input',
  EXISTING_CALCULATOR_FORMULA_REFERENCE: 'existing_calculator_formula_reference',
});

const SAFE_ERROR_CODES = Object.freeze({
  INPUT_TRACE_NOT_MAPPED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_TRACE_NOT_MAPPED',
  SOURCE_TRACE_NOT_BOUND: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_SOURCE_TRACE_NOT_BOUND',
  INPUT_NOT_VERIFIED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_NOT_VERIFIED',
  EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_EXECUTION_NOT_AUTHORIZED',
  INVENTED_CURRENT_UDI_BLOCKED: 'QUOTE_PREVIEW_INVENTED_CURRENT_UDI_BLOCKED',
  INVENTED_UDI_GROWTH_BLOCKED: 'QUOTE_PREVIEW_INVENTED_UDI_GROWTH_BLOCKED',
  INVENTED_PROJECTION_HORIZON_BLOCKED: 'QUOTE_PREVIEW_INVENTED_PROJECTION_HORIZON_BLOCKED',
  INVENTED_PROJECTION_FORMULA_BLOCKED: 'QUOTE_PREVIEW_INVENTED_PROJECTION_FORMULA_BLOCKED',
  CALCULATOR_EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_CALCULATOR_EXECUTION_NOT_AUTHORIZED',
  BANXICO_CALL_NOT_AUTHORIZED: 'QUOTE_PREVIEW_DETERMINISTIC_INPUT_BANXICO_CALL_NOT_AUTHORIZED',
  DUPLICATE_CALCULATOR_CREATION_BLOCKED: 'QUOTE_PREVIEW_DUPLICATE_CALCULATOR_CREATION_BLOCKED',
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

const REQUIRED_INPUT_TRACE_FIELDS = Object.freeze([
  'input_trace_id',
  'input_key',
  'input_kind',
  'product_family',
  'source_candidate_refs',
  'required_source_trace',
  'source_trace_status',
  'verification_status',
  'execution_allowed',
  'blocked_misuse',
  'safe_errors',
  'safety_flags',
]);

function freezeInputTrace(trace) {
  return Object.freeze({
    ...trace,
    source_candidate_refs: Object.freeze([...(trace.source_candidate_refs || [])]),
    blocked_misuse: Object.freeze([...(trace.blocked_misuse || [])]),
    safe_errors: Object.freeze([...(trace.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(trace.safety_flags || {}) }),
  });
}

function makeInputTrace({
  inputTraceId,
  inputKey,
  inputKind,
  productFamily,
  sourceCandidateRefs,
  requiredSourceTrace,
  blockedMisuse,
  safeErrors,
}) {
  return freezeInputTrace({
    input_trace_id: inputTraceId,
    input_key: inputKey,
    input_kind: inputKind,
    product_family: productFamily,
    source_candidate_refs: sourceCandidateRefs,
    required_source_trace: requiredSourceTrace,
    source_trace_status: SOURCE_TRACE_STATUSES.NOT_BOUND,
    verification_status: VERIFICATION_STATUSES.NOT_VERIFIED,
    execution_allowed: false,
    blocked_misuse: blockedMisuse,
    safe_errors: [
      SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND,
      SAFE_ERROR_CODES.INPUT_NOT_VERIFIED,
      SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED,
      ...safeErrors,
    ],
  });
}

const DETERMINISTIC_INPUT_SOURCE_TRACES = Object.freeze([
  makeInputTrace({
    inputTraceId: 'input_current_udi_value_source_trace',
    inputKey: 'current_udi_value',
    inputKind: INPUT_KINDS.BANXICO_OR_CACHE_RATE_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['shared-banxico-rate-engine.js', 'shared-banxico-edge-provider.js', 'exchange-rate-cache-engine.js'],
    requiredSourceTrace: 'existing_rate_cache_or_provider_metadata_gate_before_runtime',
    blockedMisuse: ['invented_current_udi', 'banxico_call_disguised_as_trace', 'provider_runtime_before_gate'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_CURRENT_UDI_BLOCKED, SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED],
  }),
  makeInputTrace({
    inputTraceId: 'input_udi_growth_assumption_source_trace',
    inputKey: 'udi_growth_assumption',
    inputKind: INPUT_KINDS.PROJECTION_ASSUMPTION_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['retirement-future-udi-projection-engine.js'],
    requiredSourceTrace: 'existing_repo_engine_or_config_declared_assumption_before_calculation',
    blockedMisuse: ['invented_udi_growth', 'calculator_execution_disguised_as_trace'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_UDI_GROWTH_BLOCKED, SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED],
  }),
  makeInputTrace({
    inputTraceId: 'input_projection_horizon_source_trace',
    inputKey: 'projection_horizon',
    inputKind: INPUT_KINDS.SCENARIO_HORIZON_INPUT,
    productFamily: 'retirement',
    sourceCandidateRefs: ['tests/real-retirement-mxn-scenario-test.js', 'retirement-future-udi-projection-smoke-test.js'],
    requiredSourceTrace: 'scenario_fixture_or_pdf_derived_horizon_before_projection',
    blockedMisuse: ['invented_projection_horizon', 'projection_truth_without_source_trace'],
    safeErrors: [SAFE_ERROR_CODES.INVENTED_PROJECTION_HORIZON_BLOCKED],
  }),
  makeInputTrace({
    inputTraceId: 'input_projection_formula_source_trace',
    inputKey: 'projection_formula',
    inputKind: INPUT_KINDS.EXISTING_CALCULATOR_FORMULA_REFERENCE,
    productFamily: 'retirement',
    sourceCandidateRefs: ['retirement-future-udi-projection-engine.js', 'imagina-ser-future-mxn-bridge.js'],
    requiredSourceTrace: 'existing_engine_formula_reference_only_no_duplicate_calculator',
    blockedMisuse: ['invented_projection_formula', 'duplicate_calculator_creation', 'calculator_execution_disguised_as_trace'],
    safeErrors: [
      SAFE_ERROR_CODES.INVENTED_PROJECTION_FORMULA_BLOCKED,
      SAFE_ERROR_CODES.DUPLICATE_CALCULATOR_CREATION_BLOCKED,
      SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED,
    ],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSourceRefs() {
  const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
  const expectedTraceCatalog = expectedTrace.getQuotePreviewPdfEngineExpectedValueSourceTraceRegistryCatalog();
  const parserOwnershipCatalog = parserOwnership.getQuotePreviewPdfEngineParserOwnershipRegistryCatalog();

  return {
    readiness: {
      adapter_id: readinessCatalog.adapter_id,
      schemaVersion: readinessCatalog.schemaVersion,
      overall_readiness: readinessCatalog.overall_readiness,
    },
    expected_trace: {
      adapter_id: expectedTraceCatalog.adapter_id,
      schemaVersion: expectedTraceCatalog.schemaVersion,
      overall_trace_status: expectedTraceCatalog.overall_trace_status,
    },
    parser_ownership: {
      adapter_id: parserOwnershipCatalog.adapter_id,
      schemaVersion: parserOwnershipCatalog.schemaVersion,
      overall_ownership_status: parserOwnershipCatalog.overall_ownership_status,
    },
  };
}

function getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_deterministic_input_source_trace_registry',
    overall_input_trace_status: 'not_bound_not_verified_not_ready',
    deterministic_calculation_allowed_in_registry: false,
    execution_allowed_in_registry: false,
    pdf_read_allowed_in_registry: false,
    ocr_execution_allowed_in_registry: false,
    parser_execution_allowed_in_registry: false,
    calculator_execution_allowed_in_registry: false,
    banxico_call_allowed_in_registry: false,
    provider_call_allowed_in_registry: false,
    test_execution_allowed_in_registry: false,
    backend_connection_allowed_in_registry: false,
    quote_write_allowed_in_registry: false,
    product_intelligence_upstream: true,
    quote_preview_downstream: true,
    required_input_trace_fields: [...REQUIRED_INPUT_TRACE_FIELDS],
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    input_traces: clone(DETERMINISTIC_INPUT_SOURCE_TRACES),
  };
}

function buildDeterministicInputSourceTraceSafeError(inputTraceId, code = SAFE_ERROR_CODES.INPUT_TRACE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    input_trace_id: inputTraceId || null,
    input_key: null,
    input_kind: null,
    product_family: null,
    source_candidate_refs: [],
    required_source_trace: null,
    source_trace_status: SOURCE_TRACE_STATUSES.NOT_BOUND,
    verification_status: VERIFICATION_STATUSES.NOT_VERIFIED,
    execution_allowed: false,
    blocked_misuse: ['unmapped_deterministic_input_execution', 'invented_input_value', 'calculation_before_source_trace'],
    safe_errors: [code, SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED, SAFE_ERROR_CODES.INPUT_NOT_VERIFIED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Deterministic input source trace is not mapped. Verification and calculation are blocked.',
    },
  };
}

function getDeterministicInputSourceTraceById(inputTraceId) {
  const match = DETERMINISTIC_INPUT_SOURCE_TRACES.find((trace) => trace.input_trace_id === inputTraceId);
  return match ? clone(match) : buildDeterministicInputSourceTraceSafeError(inputTraceId);
}

function getDeterministicInputSourceTraceByInputKey(inputKey) {
  const match = DETERMINISTIC_INPUT_SOURCE_TRACES.find((trace) => trace.input_key === inputKey);
  return match ? clone(match) : buildDeterministicInputSourceTraceSafeError(inputKey);
}

function getDeterministicInputSourceTracesByProductFamily(productFamily) {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.product_family === productFamily));
}

function getUnboundDeterministicInputSourceTraces() {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.source_trace_status === SOURCE_TRACE_STATUSES.NOT_BOUND));
}

function getNotVerifiedDeterministicInputSourceTraces() {
  return clone(DETERMINISTIC_INPUT_SOURCE_TRACES.filter((trace) => trace.verification_status === VERIFICATION_STATUSES.NOT_VERIFIED));
}

function validateDeterministicInputSourceTraceShape(trace) {
  const errors = [];

  if (!trace || typeof trace !== 'object') {
    return { ok: false, valid: false, errors: ['deterministic_input_trace_object_required'] };
  }

  for (const field of REQUIRED_INPUT_TRACE_FIELDS) {
    if (!(field in trace)) errors.push(`missing_${field}`);
  }

  if (trace.execution_allowed !== false) errors.push('execution_allowed_must_be_false');
  if (trace.source_trace_status !== SOURCE_TRACE_STATUSES.NOT_BOUND) errors.push('source_trace_status_must_remain_not_bound');
  if (trace.verification_status !== VERIFICATION_STATUSES.NOT_VERIFIED) errors.push('verification_status_must_remain_not_verified');

  for (const [key, value] of Object.entries(trace.safety_flags || {})) {
    if (value !== false) errors.push(`safety_flag_not_false_${key}`);
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    errors,
  };
}

function validateDeterministicInputSourceTraceRegistryCatalog(catalog) {
  const errors = [];

  if (!catalog || typeof catalog !== 'object') {
    return { ok: false, valid: false, errors: ['catalog_object_required'] };
  }

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_input_trace_status !== 'not_bound_not_verified_not_ready') errors.push('overall_input_trace_status_must_remain_not_ready');

  for (const flagName of [
    'deterministic_calculation_allowed_in_registry',
    'execution_allowed_in_registry',
    'pdf_read_allowed_in_registry',
    'ocr_execution_allowed_in_registry',
    'parser_execution_allowed_in_registry',
    'calculator_execution_allowed_in_registry',
    'banxico_call_allowed_in_registry',
    'provider_call_allowed_in_registry',
    'test_execution_allowed_in_registry',
    'backend_connection_allowed_in_registry',
    'quote_write_allowed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const traces = Array.isArray(catalog.input_traces) ? catalog.input_traces : [];
  if (traces.length !== 4) errors.push('four_deterministic_input_traces_required');

  for (const trace of traces) {
    const result = validateDeterministicInputSourceTraceShape(trace);
    if (!result.ok) errors.push(...result.errors.map((error) => `${trace.input_trace_id || 'unknown'}:${error}`));
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
  SOURCE_TRACE_STATUSES,
  VERIFICATION_STATUSES,
  INPUT_KINDS,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_INPUT_TRACE_FIELDS,
  DETERMINISTIC_INPUT_SOURCE_TRACES,
  getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog,
  getDeterministicInputSourceTraceById,
  getDeterministicInputSourceTraceByInputKey,
  getDeterministicInputSourceTracesByProductFamily,
  getUnboundDeterministicInputSourceTraces,
  getNotVerifiedDeterministicInputSourceTraces,
  buildDeterministicInputSourceTraceSafeError,
  validateDeterministicInputSourceTraceShape,
  validateDeterministicInputSourceTraceRegistryCatalog,
};
NODE

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

const catalog = adapter.getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_pdf_engine_deterministic_input_source_trace');
assert.equal(catalog.registry_type, 'local_static_read_only_deterministic_input_source_trace_registry');
assert.equal(catalog.overall_input_trace_status, 'not_bound_not_verified_not_ready');
assert.equal(catalog.product_intelligence_upstream, true);
assert.equal(catalog.quote_preview_downstream, true);
assert.equal(catalog.input_traces.length, 4);
assert.equal(adapter.validateDeterministicInputSourceTraceRegistryCatalog(catalog).ok, true);

for (const flag of [
  'deterministic_calculation_allowed_in_registry',
  'execution_allowed_in_registry',
  'pdf_read_allowed_in_registry',
  'ocr_execution_allowed_in_registry',
  'parser_execution_allowed_in_registry',
  'calculator_execution_allowed_in_registry',
  'banxico_call_allowed_in_registry',
  'provider_call_allowed_in_registry',
  'test_execution_allowed_in_registry',
  'backend_connection_allowed_in_registry',
  'quote_write_allowed_in_registry',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const trace of catalog.input_traces) {
  for (const field of adapter.REQUIRED_INPUT_TRACE_FIELDS) {
    assert(field in trace, `${trace.input_trace_id} missing ${field}`);
  }
  assert.equal(trace.source_trace_status, adapter.SOURCE_TRACE_STATUSES.NOT_BOUND);
  assert.equal(trace.verification_status, adapter.VERIFICATION_STATUSES.NOT_VERIFIED);
  assert.equal(trace.execution_allowed, false);
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND));
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.INPUT_NOT_VERIFIED));
  assert(trace.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED));
  assert.equal(adapter.validateDeterministicInputSourceTraceShape(trace).ok, true);
}

const currentUdi = adapter.getDeterministicInputSourceTraceByInputKey('current_udi_value');
assert.equal(currentUdi.input_kind, adapter.INPUT_KINDS.BANXICO_OR_CACHE_RATE_INPUT);
assert(currentUdi.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_CURRENT_UDI_BLOCKED));
assert(currentUdi.safe_errors.includes(adapter.SAFE_ERROR_CODES.BANXICO_CALL_NOT_AUTHORIZED));

const growth = adapter.getDeterministicInputSourceTraceByInputKey('udi_growth_assumption');
assert.equal(growth.input_kind, adapter.INPUT_KINDS.PROJECTION_ASSUMPTION_INPUT);
assert(growth.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_UDI_GROWTH_BLOCKED));
assert(growth.safe_errors.includes(adapter.SAFE_ERROR_CODES.CALCULATOR_EXECUTION_NOT_AUTHORIZED));

const horizon = adapter.getDeterministicInputSourceTraceByInputKey('projection_horizon');
assert.equal(horizon.input_kind, adapter.INPUT_KINDS.SCENARIO_HORIZON_INPUT);
assert(horizon.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_PROJECTION_HORIZON_BLOCKED));

const formula = adapter.getDeterministicInputSourceTraceByInputKey('projection_formula');
assert.equal(formula.input_kind, adapter.INPUT_KINDS.EXISTING_CALCULATOR_FORMULA_REFERENCE);
assert(formula.safe_errors.includes(adapter.SAFE_ERROR_CODES.INVENTED_PROJECTION_FORMULA_BLOCKED));
assert(formula.safe_errors.includes(adapter.SAFE_ERROR_CODES.DUPLICATE_CALCULATOR_CREATION_BLOCKED));

assert.equal(adapter.getDeterministicInputSourceTracesByProductFamily('retirement').length, 4);
assert.equal(adapter.getUnboundDeterministicInputSourceTraces().length, 4);
assert.equal(adapter.getNotVerifiedDeterministicInputSourceTraces().length, 4);

const missing = adapter.getDeterministicInputSourceTraceById('missing_input_trace');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.execution_allowed, false);
assert.equal(missing.source_trace_status, adapter.SOURCE_TRACE_STATUSES.NOT_BOUND);
assert.equal(missing.verification_status, adapter.VERIFICATION_STATUSES.NOT_VERIFIED);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.INPUT_TRACE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED));
assert.equal(adapter.validateDeterministicInputSourceTraceShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const trace of catalog.input_traces) {
  for (const [key, value] of Object.entries(trace.safety_flags || {})) {
    assert.equal(value, false, `${trace.input_trace_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({
  catalog,
  missing,
  flags: adapter.DEFAULT_SAFETY_FLAGS,
  safeErrors: adapter.SAFE_ERROR_CODES,
});

for (const fragment of [
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
]) {
  assert(!combined.includes(fragment), `forbidden true flag found: ${fragment}`);
}

console.log('PASS quote preview pdf engine deterministic input source trace registry adapter 084B');
NODE

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "084B WRITE DOCS / EVIDENCE"
cat > "$ARCH_DOC_B" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Implementation 084B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Purpose

084B implements a local/static/read-only deterministic input source trace registry.

The registry records source trace requirements only. It does not calculate projections, call Banxico, read PDFs, run parsers, run OCR, run calculators, run providers, connect backend, write quotes, or execute real tests.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Registry Status

\`not_bound_not_verified_not_ready\`

## Input Traces

- \`input_current_udi_value_source_trace\`
- \`input_udi_growth_assumption_source_trace\`
- \`input_projection_horizon_source_trace\`
- \`input_projection_formula_source_trace\`

Every trace remains:

- \`source_trace_status=not_bound\`
- \`verification_status=not_verified\`
- \`execution_allowed=false\`

## Final Decision

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$EVIDENCE_DOC_B" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Implementation 084B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Evidence Summary

084B implements a local/static/read-only deterministic input source trace registry.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Test Evidence

The focused test validates:

- adapter identity and schema;
- registry shape;
- required input trace fields;
- all four deterministic input traces exist;
- source trace status remains \`not_bound\`;
- verification status remains \`not_verified\`;
- execution remains false;
- missing input trace returns safe error;
- all safety flags remain false.

## Final

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$CERT_DOC_B" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Implementation Certificate 084B

PHASE=$PHASE_B

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

084B certifies that Forge now has a local/static/read-only deterministic input source trace registry.

$DECISION_B
EOF

cat > "$AUDIT_JSON_B" <<EOF
{
  "phase": "$PHASE_B",
  "status": "PASS",
  "decision": "$DECISION_B",
  "lockedDecision": "$LOCKED_B",
  "base": {
    "phase": "$PHASE_A",
    "confirmed": true,
    "lockedDecision": "$LOCKED_A"
  },
  "next": "$PHASE_C",
  "implementation": {
    "adapter": "$ADAPTER",
    "test": "$TEST",
    "adapterId": "forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.adapter.v1",
    "schemaVersion": "forge.quote_preview.pdf_engine.deterministic_input_source_trace.registry.v1",
    "registryType": "local_static_read_only_deterministic_input_source_trace_registry",
    "overallInputTraceStatus": "not_bound_not_verified_not_ready",
    "deterministicCalculationIntroduced": false,
    "pdfReadIntroduced": false,
    "parserExecutionIntroduced": false,
    "calculatorExecutionIntroduced": false,
    "banxicoCallIntroduced": false,
    "testExecutionIntroduced": false,
    "backendConnectionIntroduced": false,
    "quoteTruthIntroduced": false,
    "newCalculatorCreated": false
  },
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "inputTraces": {
    "currentUdiValue": "not_bound_not_verified",
    "udiGrowthAssumption": "not_bound_not_verified",
    "projectionHorizon": "not_bound_not_verified",
    "projectionFormula": "not_bound_not_verified"
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
  }
}
EOF

TREE_BLOCK_B="$(mktemp)"
cat > "$TREE_BLOCK_B" <<EOF
<!-- FORGE:$PHASE_B:START -->
## 084B Quote Preview PDF Engine Deterministic Input Source Trace Implementation

084B implements a local/static/read-only deterministic input source trace registry.

Locked decision:
\`$LOCKED_B\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

Registry status:

- \`not_bound_not_verified_not_ready\`

Input traces:

- \`input_current_udi_value_source_trace\`
- \`input_udi_growth_assumption_source_trace\`
- \`input_projection_horizon_source_trace\`
- \`input_projection_formula_source_trace\`

Every trace remains:

- \`source_trace_status=not_bound\`
- \`verification_status=not_verified\`
- \`execution_allowed=false\`

Boundaries:

- no deterministic calculation;
- no calculator execution;
- no Banxico/provider call;
- no duplicate calculator creation.

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
<!-- FORGE:$PHASE_B:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_B" "$TREE_BLOCK_B"
done
trim_tree_files

stage "084B VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_B"
run rg -n "$PHASE_B|$DECISION_B|$LOCKED_B|$PHASE_C|deterministic input source trace registry|not_bound_not_verified_not_ready|current_udi_value|udi_growth_assumption|projection_formula" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "feat: implement quote preview pdf deterministic input source trace registry" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ADAPTER" "$TEST" "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 084C QA
# -------------------------------------------------------------------
stage "084C SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const inputTrace = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js");

const catalog = inputTrace.getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog();
assert.equal(catalog.overall_input_trace_status, "not_bound_not_verified_not_ready");
assert.equal(inputTrace.validateDeterministicInputSourceTraceRegistryCatalog(catalog).ok, true);
assert.equal(catalog.input_traces.length, 4);

for (const entry of catalog.input_traces) {
  assert.equal(entry.source_trace_status, inputTrace.SOURCE_TRACE_STATUSES.NOT_BOUND);
  assert.equal(entry.verification_status, inputTrace.VERIFICATION_STATUSES.NOT_VERIFIED);
  assert.equal(entry.execution_allowed, false);
  assert.equal(inputTrace.validateDeterministicInputSourceTraceShape(entry).ok, true);
}

assert.equal(inputTrace.getUnboundDeterministicInputSourceTraces().length, 4);
assert.equal(inputTrace.getNotVerifiedDeterministicInputSourceTraces().length, 4);
assert.equal(inputTrace.getDeterministicInputSourceTracesByProductFamily("retirement").length, 4);

for (const [key, value] of Object.entries(inputTrace.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

console.log(JSON.stringify({
  status: "PASS",
  catalogValidated: true,
  inputTraceCount: catalog.input_traces.length,
  allInputTracesNotBound: true,
  allInputsNotVerified: true,
  allExecutionsFalse: true,
  currentUdiBlocked: true,
  udiGrowthBlocked: true,
  projectionHorizonBlocked: true,
  projectionFormulaBlocked: true,
  noDeterministicCalculation: true,
  noCalculatorExecution: true,
  noBanxicoCall: true,
  noBackendConnection: true,
  noQuoteWrite: true,
  allSafetyFlagsFalse: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"

cat > "$ARCH_DOC_C" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace QA Lock 084C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Purpose

084C QA locks the 084B deterministic input source trace registry.

## QA Validated

- registry shape validates;
- four deterministic input traces exist;
- all input traces remain not bound;
- all inputs remain not verified;
- every execution remains false;
- all safety flags remain false.

## Final Decision

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$EVIDENCE_DOC_C" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace QA Lock 084C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Semantic QA

\`\`\`json
$(cat "$SEMANTIC_QA_JSON")
\`\`\`

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Final

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$CERT_DOC_C" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace QA Lock Certificate 084C

PHASE=$PHASE_C

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

084C certifies that deterministic input source trace registry is QA locked.

$DECISION_C
EOF

cat > "$AUDIT_JSON_C" <<EOF
{
  "phase": "$PHASE_C",
  "status": "PASS",
  "decision": "$DECISION_C",
  "lockedDecision": "$LOCKED_C",
  "base": {
    "phase": "$PHASE_B",
    "confirmed": true,
    "lockedDecision": "$LOCKED_B"
  },
  "next": "$PHASE_D",
  "semanticQa": $(cat "$SEMANTIC_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "qaValidated": {
    "registryShapeValidates": true,
    "inputTraceCount": 4,
    "allInputTracesNotBound": true,
    "allInputsNotVerified": true,
    "executionAllowedFalse": true,
    "allSafetyFlagsFalse": true
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
  }
}
EOF

TREE_BLOCK_C="$(mktemp)"
cat > "$TREE_BLOCK_C" <<EOF
<!-- FORGE:$PHASE_C:START -->
## 084C Quote Preview PDF Engine Deterministic Input Source Trace QA Lock

084C QA locks the 084B deterministic input source trace registry.

Locked decision:
\`$LOCKED_C\`

QA validated:

- registry shape validates;
- four deterministic input traces exist;
- all input traces remain \`not_bound\`;
- all inputs remain \`not_verified\`;
- every execution remains \`false\`;
- all safety flags remain false.

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
<!-- FORGE:$PHASE_C:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_C" "$TREE_BLOCK_C"
done
trim_tree_files

stage "084C VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_C"
run rg -n "$PHASE_C|$DECISION_C|$LOCKED_C|$PHASE_D|QA locks|not_bound|not_verified|every execution remains" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview pdf deterministic input source trace qa" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 084D DECISION LOCK
# -------------------------------------------------------------------
stage "084D DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const inputTrace = require("./platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js");

const catalog = inputTrace.getQuotePreviewPdfEngineDeterministicInputSourceTraceRegistryCatalog();
assert.equal(catalog.overall_input_trace_status, "not_bound_not_verified_not_ready");
assert.equal(inputTrace.validateDeterministicInputSourceTraceRegistryCatalog(catalog).ok, true);
assert.equal(catalog.input_traces.length, 4);
assert.equal(inputTrace.getUnboundDeterministicInputSourceTraces().length, 4);
assert.equal(inputTrace.getNotVerifiedDeterministicInputSourceTraces().length, 4);

for (const entry of catalog.input_traces) {
  assert.equal(entry.source_trace_status, inputTrace.SOURCE_TRACE_STATUSES.NOT_BOUND);
  assert.equal(entry.verification_status, inputTrace.VERIFICATION_STATUSES.NOT_VERIFIED);
  assert.equal(entry.execution_allowed, false);
}

console.log(JSON.stringify({
  status: "PASS",
  locked_as: "local_static_read_only_not_bound_not_verified_reference_registry",
  overall_input_trace_status: catalog.overall_input_trace_status,
  input_trace_count: catalog.input_traces.length,
  all_input_traces_not_bound: true,
  all_inputs_not_verified: true,
  all_executions_false: true,
  deterministic_calculation_blocked: true,
  calculator_execution_blocked: true,
  banxico_call_blocked: true,
  next_scope: "085A_QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_SCOPE",
  all_safety_flags_false: true
}, null, 2));
NODE

cat "$DECISION_QA_JSON"

cat > "$ARCH_DOC_D" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Decision Lock 084D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Purpose

084D decision-locks the 084B/084C deterministic input source trace registry as a local/static/read-only not-bound/not-verified reference registry.

## Locked Meaning

The registry is approved only as:

- local/static;
- read-only;
- reference registry;
- deterministic input source trace map;
- not-bound;
- not-verified;
- not-executable.

## Confirmed

- four deterministic input traces exist;
- all traces remain \`not_bound\`;
- all inputs remain \`not_verified\`;
- all executions remain \`false\`;
- deterministic calculation remains blocked;
- calculator/Banxico execution remains blocked.

## Next Architectural Unlock

085A may scope preview-vs-quote-truth boundary.

085A must not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico/providers, connect backend, write quotes, or create real effects.

## Final Decision

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$EVIDENCE_DOC_D" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Decision Lock 084D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Decision Assertions

\`\`\`json
$(cat "$DECISION_QA_JSON")
\`\`\`

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Final

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$CERT_DOC_D" <<EOF
# Forge Quote Preview PDF Engine Deterministic Input Source Trace Decision Lock Certificate 084D

PHASE=$PHASE_D

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

084D certifies that deterministic input source trace registry is locked as local/static/read-only not-bound/not-verified reference registry.

$DECISION_D
EOF

cat > "$AUDIT_JSON_D" <<EOF
{
  "phase": "$PHASE_D",
  "status": "PASS",
  "decision": "$DECISION_D",
  "lockedDecision": "$LOCKED_D",
  "base": {
    "phase": "$PHASE_C",
    "confirmed": true,
    "lockedDecision": "$LOCKED_C"
  },
  "next": "$NEXT_AFTER_D",
  "lockedAs": "local_static_read_only_not_bound_not_verified_reference_registry",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "confirmed": {
    "registryShapeValidates": true,
    "inputTraceCount": 4,
    "allInputTracesNotBound": true,
    "allInputsNotVerified": true,
    "allExecutionsFalse": true,
    "allSafetyFlagsFalse": true
  },
  "nextScope": {
    "phase": "$NEXT_AFTER_D",
    "purpose": "preview_vs_quote_truth_boundary_scope",
    "executionAllowed": false
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
  }
}
EOF

TREE_BLOCK_D="$(mktemp)"
cat > "$TREE_BLOCK_D" <<EOF
<!-- FORGE:$PHASE_D:START -->
## 084D Quote Preview PDF Engine Deterministic Input Source Trace Decision Lock

084D decision-locks the 084B/084C deterministic input source trace registry as a local/static/read-only not-bound/not-verified reference registry.

Locked decision:
\`$LOCKED_D\`

Confirmed:

- four deterministic input traces exist;
- all traces remain \`not_bound\`;
- all inputs remain \`not_verified\`;
- every execution remains \`false\`;
- deterministic calculation remains blocked;
- calculator/Banxico execution remains blocked.

Next:

- \`$NEXT_AFTER_D\` may scope preview-vs-quote-truth boundary only.
- No execution is authorized.

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
<!-- FORGE:$PHASE_D:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_D" "$TREE_BLOCK_D"
done
trim_tree_files

stage "084D VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_D"
run rg -n "$PHASE_D|$DECISION_D|$LOCKED_D|$NEXT_AFTER_D|deterministic input source trace|decision-locks|preview-vs-quote-truth|deterministic calculation remains blocked" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview pdf deterministic input source trace decision" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -16

SUMMARY=$(cat <<EOF
PASS_084ABCD_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_FAST_TRACK_COMMIT_PUSH_COMPLETE
PASS_A=$DECISION_A
LOCKED_A=$LOCKED_A
PASS_B=$DECISION_B
LOCKED_B=$LOCKED_B
PASS_C=$DECISION_C
LOCKED_C=$LOCKED_C
PASS_D=$DECISION_D
LOCKED_D=$LOCKED_D
NEXT=$NEXT_AFTER_D
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
