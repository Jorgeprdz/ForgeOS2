#!/usr/bin/env bash
set -euo pipefail

CHAIN="086ABCD_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_FAST_TRACK"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/086abcd-safe-ux-state-model-fast-track-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_086abcd_quote_preview_safe_ux_state_model_fast_track.sh"

PHASE_A="086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE"
DECISION_A="PASS_086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE"
LOCKED_A="QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPED"

PHASE_B="086B_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION"
DECISION_B="PASS_086B_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION"
LOCKED_B="QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"

PHASE_C="086C_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCK"
DECISION_C="PASS_086C_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCK"
LOCKED_C="QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCKED"

PHASE_D="086D_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK"
DECISION_D="PASS_086D_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK"
LOCKED_D="QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
NEXT_AFTER_D="087A_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_SCOPE"

BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no expected-value verification; no parser invocation; no deterministic calculation; no quote truth creation; no quote issuance; no quote send; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"

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
DETERMINISTIC_INPUT_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b.js"
DETERMINISTIC_INPUT_TEST="tests/quote-preview-pdf-engine-deterministic-input-source-trace-registry-adapter-084b-test.js"
BOUNDARY_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b.js"
BOUNDARY_TEST="tests/quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b-test.js"

ADAPTER="platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js"
TEST="tests/quote-preview-safe-ux-state-model-registry-adapter-086b-test.js"

ARCH_DOC_A="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE_086A.md"
EVIDENCE_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE_086A.md"
CERT_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE_CERTIFICATE_086A.md"
AUDIT_JSON_A="docs/evidence/forge-quote-preview-safe-ux-state-model-scope-audit-086a.json"

ARCH_DOC_B="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION_086B.md"
EVIDENCE_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION_086B.md"
CERT_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION_CERTIFICATE_086B.md"
AUDIT_JSON_B="docs/evidence/forge-quote-preview-safe-ux-state-model-implementation-audit-086b.json"

ARCH_DOC_C="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCK_086C.md"
EVIDENCE_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCK_086C.md"
CERT_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_QA_LOCK_CERTIFICATE_086C.md"
AUDIT_JSON_C="docs/evidence/forge-quote-preview-safe-ux-state-model-qa-audit-086c.json"

ARCH_DOC_D="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_086D.md"
EVIDENCE_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_086D.md"
CERT_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_CERTIFICATE_086D.md"
AUDIT_JSON_D="docs/evidence/forge-quote-preview-safe-ux-state-model-decision-audit-086d.json"

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${CHAIN}" | tee -a "$REPORT"; echo "REPORT=$REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

find_latest_discovery_json(){
  if [ -n "${DISCOVERY_JSON:-}" ] && [ -f "$DISCOVERY_JSON" ]; then printf "%s\n" "$DISCOVERY_JSON"; return 0; fi
  find /data/data/com.termux/files/home -path "*/forge-discovery-*/*DISCOVERY_077A_PRECHECK_EXISTING_QUOTE_PDF_TESTS_AND_ENGINES_REPORT_*.json" -type f 2>/dev/null | sort | tail -1
}

replace_or_append_block(){
  local path="$1"; local phase="$2"; local block_file="$3"
  python3 - <<PY "$path" "$phase" "$block_file"
from pathlib import Path
import sys
path = Path(sys.argv[1]); phase = sys.argv[2]; block = Path(sys.argv[3]).read_text()
text = path.read_text()
start = f"<!-- FORGE:{phase}:START -->"; end = f"<!-- FORGE:{phase}:END -->"
if start in text and end in text:
    before = text.split(start)[0]; after = text.split(end, 1)[1]
    text = before.rstrip() + "\n\n" + block.strip() + "\n" + after
else:
    text = text.rstrip() + "\n\n" + block.strip() + "\n"
path.write_text(text.rstrip() + "\n")
PY
}

trim_tree_files(){
  python3 - <<'PYTRIM'
from pathlib import Path
for path in [Path("FORGE_MASTER_BUILD_TREE.md"), Path("docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"), Path("docs/roadmap/FORGE_ROADMAP_LOCK_001.md")]:
    path.write_text(path.read_text().rstrip() + "\n")
    print(f"trimmed EOF blanks: {path}")
PYTRIM
}

safety_scan(){
  local files=("$@")
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|quoteTruthCreationAllowed\s*:\s*true|quoteIssuanceAllowed\s*:\s*true|quoteSendAllowed\s*:\s*true|providerRuntimeAllowed\s*:\s*true|backendConnectionAllowed\s*:\s*true|writeAllowed\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/write/quote marker"
  fi
  if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection|pdfRead|ocrExecution|parserExecution|calculatorExecution|banxicoCall|testExecution)"?\s*[:=]\s*true\b' "${files[@]}"; then
    fail "real-effect flag true found"
  fi
  pass "safety scan clean"
}

commit_allowed_subset(){
  local msg="$1"; shift; local allowed=("$@")
  git add "${allowed[@]}"
  run git diff --cached --name-only
  run git diff --cached --check
  local allowed_file staged_file unexpected
  allowed_file="$(mktemp)"; staged_file="$(mktemp)"
  printf "%s\n" "${allowed[@]}" | sort > "$allowed_file"
  git diff --cached --name-only | sort > "$staged_file"
  unexpected="$(comm -23 "$staged_file" "$allowed_file" || true)"
  if [ -n "$unexpected" ]; then echo "$unexpected"; fail "staged files include files outside authorized boundary"; fi
  if [ ! -s "$staged_file" ]; then fail "no staged changes for commit"; fi
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
echo "ROBOCOP_GATE=Article 0; 085D preview-vs-quote-truth boundary closed; safe UX state model fast-track only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -15
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CLEAN INDEX ONLY"
run git reset

stage "STAGE 3 CONFIRM BASE 085D"
if git log --oneline -180 | grep -Eq "085D|preview vs quote truth boundary decision|QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"; then
  pass "085D base found in git log"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-preview-vs-quote-truth-boundary-decision-audit-085d.json" ]; then
  pass "085D audit fallback found"
else
  fail "085D base not found. Run 085A/B/C/D first."
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-preview-vs-quote-truth-boundary-decision-audit-085d.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-preview-vs-quote-truth-boundary-decision-audit-085d.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"|"next"\s*:\s*"086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE"' docs/evidence/forge-quote-preview-pdf-engine-preview-vs-quote-truth-boundary-decision-audit-085d.json >/dev/null; then
    fail "085D audit exists but does not confirm PASS/086A next"
  fi
  pass "085D audit PASS/086A next confirmed"
fi

stage "STAGE 4 DISCOVERY EVIDENCE"
DISCOVERY_JSON_FOUND="$(find_latest_discovery_json || true)"
[ -n "$DISCOVERY_JSON_FOUND" ] && [ -f "$DISCOVERY_JSON_FOUND" ] || fail "Discovery JSON not found"

DISCOVERY_DIGEST_JSON="$(mktemp)"
python3 - <<'PY' "$DISCOVERY_JSON_FOUND" "$DISCOVERY_DIGEST_JSON"
import json, sys
from pathlib import Path
source = Path(sys.argv[1]); target = Path(sys.argv[2])
data = json.loads(source.read_text()); rec = data.get("recommendation", {})
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
  "$SURFACES_ADAPTER" "$SURFACES_TEST"
  "$EVIDENCE_ADAPTER" "$EVIDENCE_TEST"
  "$PROVENANCE_ADAPTER" "$PROVENANCE_TEST"
  "$READINESS_ADAPTER" "$READINESS_TEST"
  "$FILE_HASH_ADAPTER" "$FILE_HASH_TEST"
  "$EXPECTED_TRACE_ADAPTER" "$EXPECTED_TRACE_TEST"
  "$PARSER_OWNERSHIP_ADAPTER" "$PARSER_OWNERSHIP_TEST"
  "$DETERMINISTIC_INPUT_ADAPTER" "$DETERMINISTIC_INPUT_TEST"
  "$BOUNDARY_ADAPTER" "$BOUNDARY_TEST"
)
for f in "${REQUIRED_FILES[@]}"; do [ -f "$f" ] || fail "Missing required file: $f"; pass "$f"; done

stage "STAGE 6 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"
pass "$BACKUP_DIR"

stage "STAGE 7 BASE VALIDATION"
run node --check "$SURFACES_ADAPTER"; run node "$SURFACES_TEST"
run node --check "$EVIDENCE_ADAPTER"; run node "$EVIDENCE_TEST"
run node --check "$PROVENANCE_ADAPTER"; run node "$PROVENANCE_TEST"
run node --check "$READINESS_ADAPTER"; run node "$READINESS_TEST"
run node --check "$FILE_HASH_ADAPTER"; run node "$FILE_HASH_TEST"
run node --check "$EXPECTED_TRACE_ADAPTER"; run node "$EXPECTED_TRACE_TEST"
run node --check "$PARSER_OWNERSHIP_ADAPTER"; run node "$PARSER_OWNERSHIP_TEST"
run node --check "$DETERMINISTIC_INPUT_ADAPTER"; run node "$DETERMINISTIC_INPUT_TEST"
run node --check "$BOUNDARY_ADAPTER"; run node "$BOUNDARY_TEST"

# -------------------------------------------------------------------
# 086A SCOPE
# -------------------------------------------------------------------
stage "086A BUILD SCOPE"
UX_SCOPE_JSON="$(mktemp)"
node <<'NODE' > "$UX_SCOPE_JSON"
const readiness = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const boundary = require('./platform/adapters/quote-preview/quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b.js');

const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
const boundaryCatalog = boundary.getQuotePreviewPdfEnginePreviewVsQuoteTruthBoundaryRegistryCatalog();

const scopedStates = [
  {
    state_id: 'empty',
    state_kind: 'neutral',
    display_label: 'Sin PDF cargado',
    required_badges: ['preview'],
    visible_allowed: true,
    preview_reference_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'pdf_candidate_detected',
    state_kind: 'informational',
    display_label: 'PDF candidato detectado',
    required_badges: ['preview', 'no_verificado'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'file_hash_not_verified',
    state_kind: 'warning',
    display_label: 'Archivo no verificado',
    required_badges: ['preview', 'archivo_no_verificado'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'source_trace_not_bound',
    state_kind: 'warning',
    display_label: 'Valores sin fuente trazada',
    required_badges: ['preview', 'sin_source_trace'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'parser_owner_decision_required',
    state_kind: 'blocked',
    display_label: 'Parser pendiente de ownership',
    required_badges: ['preview', 'parser_bloqueado'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'deterministic_inputs_not_verified',
    state_kind: 'warning',
    display_label: 'Inputs determinísticos no verificados',
    required_badges: ['preview', 'inputs_no_verificados'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'preview_reference_available',
    state_kind: 'preview_ready',
    display_label: 'Preview de referencia disponible',
    required_badges: ['preview', 'no_es_cotizacion'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'quote_truth_blocked',
    state_kind: 'blocked',
    display_label: 'Cotización real bloqueada',
    required_badges: ['no_es_cotizacion', 'quote_truth_bloqueado'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    state_id: 'ready_for_human_review',
    state_kind: 'human_review',
    display_label: 'Listo para revisión humana',
    required_badges: ['preview', 'requiere_revision_humana'],
    visible_allowed: true,
    preview_reference_allowed: true,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  }
];

const scope = {
  status: 'PASS',
  phase: '086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE',
  scope_type: 'safe_ux_state_model_scope_only',
  overall_readiness_before_086a: readinessCatalog.overall_readiness,
  preview_vs_quote_truth_boundary_status_before_086a: boundaryCatalog.overall_boundary_status,
  visible_state_count: scopedStates.length,
  scoped_states: scopedStates,
  required_086b_output: {
    adapter_type: 'local_static_read_only_safe_ux_state_model_registry',
    must_not_mutate_ui: true,
    must_not_create_quote_truth: true,
    must_not_write_quote: true,
    must_not_send_quote: true,
    must_not_connect_backend: true,
    must_require_preview_labeling: true,
    must_block_quote_truth_actions: true,
    required_fields: [
      'state_id',
      'state_kind',
      'display_label',
      'description',
      'visible_allowed',
      'preview_reference_allowed',
      'quote_truth_allowed',
      'execution_allowed',
      'write_allowed',
      'allowed_actions',
      'blocked_actions',
      'required_badges',
      'safe_errors',
      'safety_flags'
    ]
  },
  blocked_actions_global: [
    'issue_quote',
    'send_quote',
    'write_quote',
    'write_crm',
    'write_policy',
    'write_pipeline',
    'connect_provider',
    'connect_backend',
    'run_parser',
    'run_calculator',
    'call_banxico'
  ],
  next_decision_after_086d: 'quote_preview_safe_ux_component_contract_scope',
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

if (scope.overall_readiness_before_086a !== 'not_ready_for_execution') throw new Error('086A requires not_ready_for_execution base');
if (scope.preview_vs_quote_truth_boundary_status_before_086a !== 'preview_boundary_mapped_quote_truth_blocked') throw new Error('086A requires 085D boundary base');
console.log(JSON.stringify(scope, null, 2));
NODE

cat "$UX_SCOPE_JSON"

stage "086A WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC_A")" "$(dirname "$EVIDENCE_DOC_A")"

cat > "$ARCH_DOC_A" <<EOF
# Forge Quote Preview Safe UX State Model Scope 086A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Purpose

086A scopes the safe UX state model for Quote Preview.

This phase follows 085D, where Preview vs Quote Truth boundary was locked as local/static/read-only reference registry.

## Important Boundary

086A does not mutate UI.

086A does not create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or execute real tests.

086A only scopes the state model that later UI components may consume.

## Scoped Safe UX States

- \`empty\`
- \`pdf_candidate_detected\`
- \`file_hash_not_verified\`
- \`source_trace_not_bound\`
- \`parser_owner_decision_required\`
- \`deterministic_inputs_not_verified\`
- \`preview_reference_available\`
- \`quote_truth_blocked\`
- \`ready_for_human_review\`

## Required 086B Shape

086B must implement a local/static/read-only safe UX state model registry.

Required fields:

- \`state_id\`
- \`state_kind\`
- \`display_label\`
- \`description\`
- \`visible_allowed\`
- \`preview_reference_allowed\`
- \`quote_truth_allowed\`
- \`execution_allowed\`
- \`write_allowed\`
- \`allowed_actions\`
- \`blocked_actions\`
- \`required_badges\`
- \`safe_errors\`
- \`safety_flags\`

## Required 086B Decisions

086B must preserve:

- preview labeling;
- quote truth blocked;
- quote write/send blocked;
- CRM/policy/pipeline writes blocked;
- provider/backend connection blocked;
- parser/calculator/Banxico execution blocked;
- no UI mutation.

## Final Decision

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$EVIDENCE_DOC_A" <<EOF
# Forge Quote Preview Safe UX State Model Scope 086A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Evidence Summary

086A scopes safe UX states only.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## UX State Scope

\`\`\`json
$(cat "$UX_SCOPE_JSON")
\`\`\`

## Final

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$CERT_DOC_A" <<EOF
# Forge Quote Preview Safe UX State Model Scope Certificate 086A

PHASE=$PHASE_A

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

086A certifies that safe UX states have been scoped before component contracts.

$DECISION_A
EOF

cat > "$AUDIT_JSON_A" <<EOF
{
  "phase": "$PHASE_A",
  "status": "PASS",
  "decision": "$DECISION_A",
  "lockedDecision": "$LOCKED_A",
  "base": {
    "phase": "085D_QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_PREVIEW_VS_QUOTE_TRUTH_BOUNDARY_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
  },
  "next": "$PHASE_B",
  "scopeType": "safe_ux_state_model_scope_only",
  "safeUxStateScope": $(cat "$UX_SCOPE_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "notAuthorized": {
    "uiMutation": false,
    "quoteTruthCreation": false,
    "quoteIssuance": false,
    "quoteSend": false,
    "providerRuntime": false,
    "backendConnection": false,
    "quoteWrite": false,
    "crmWrite": false,
    "policyWrite": false,
    "pipelineWrite": false
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
## 086A Quote Preview Safe UX State Model Scope

086A scopes the safe UX state model for Quote Preview.

Locked decision:
\`$LOCKED_A\`

Scoped safe UX states:

- \`empty\`
- \`pdf_candidate_detected\`
- \`file_hash_not_verified\`
- \`source_trace_not_bound\`
- \`parser_owner_decision_required\`
- \`deterministic_inputs_not_verified\`
- \`preview_reference_available\`
- \`quote_truth_blocked\`
- \`ready_for_human_review\`

086B must implement a local/static/read-only safe UX state model registry.

Boundaries:

- no UI mutation;
- no quote truth creation;
- no quote write/send;
- no CRM/policy/pipeline writes;
- no provider/backend connection;
- no parser/calculator/Banxico execution.

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
run rg -n "$PHASE_A|$DECISION_A|$LOCKED_A|$PHASE_B|Safe UX State Model|pdf_candidate_detected|quote_truth_blocked|ready_for_human_review|no UI mutation" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"

commit_allowed_subset \
  "docs: scope quote preview safe ux state model" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 086B IMPLEMENTATION
# -------------------------------------------------------------------
stage "086B IMPLEMENT ADAPTER"
mkdir -p "$(dirname "$ADAPTER")" "$(dirname "$TEST")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const readiness = require('./quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js');
const boundary = require('./quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b.js');

const ADAPTER_ID = 'forge.quote_preview.safe_ux_state_model.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.safe_ux_state_model.registry.v1';
const DOMAIN_ID = 'quote_preview_safe_ux_state_model';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const STATE_KINDS = Object.freeze({
  NEUTRAL: 'neutral',
  INFORMATIONAL: 'informational',
  WARNING: 'warning',
  BLOCKED: 'blocked',
  PREVIEW_READY: 'preview_ready',
  HUMAN_REVIEW: 'human_review',
});

const SAFE_ACTIONS = Object.freeze({
  VIEW_EMPTY_STATE: 'view_empty_state',
  VIEW_REFERENCE_PREVIEW: 'view_reference_preview',
  OPEN_EVIDENCE_PANEL: 'open_evidence_panel',
  OPEN_PROVENANCE_PANEL: 'open_provenance_panel',
  REQUEST_HUMAN_REVIEW: 'request_human_review',
  COPY_PREVIEW_REFERENCE_SUMMARY: 'copy_preview_reference_summary',
});

const BLOCKED_ACTIONS = Object.freeze({
  ISSUE_QUOTE: 'issue_quote',
  SEND_QUOTE: 'send_quote',
  WRITE_QUOTE: 'write_quote',
  WRITE_CRM: 'write_crm',
  WRITE_POLICY: 'write_policy',
  WRITE_PIPELINE: 'write_pipeline',
  CONNECT_PROVIDER: 'connect_provider',
  CONNECT_BACKEND: 'connect_backend',
  RUN_PARSER: 'run_parser',
  RUN_CALCULATOR: 'run_calculator',
  CALL_BANXICO: 'call_banxico',
  READ_PDF: 'read_pdf',
});

const BADGES = Object.freeze({
  PREVIEW: 'preview',
  NO_ES_COTIZACION: 'no_es_cotizacion',
  NO_VERIFICADO: 'no_verificado',
  ARCHIVO_NO_VERIFICADO: 'archivo_no_verificado',
  SIN_SOURCE_TRACE: 'sin_source_trace',
  PARSER_BLOQUEADO: 'parser_bloqueado',
  INPUTS_NO_VERIFICADOS: 'inputs_no_verificados',
  QUOTE_TRUTH_BLOQUEADO: 'quote_truth_bloqueado',
  REQUIERE_REVISION_HUMANA: 'requiere_revision_humana',
});

const SAFE_ERROR_CODES = Object.freeze({
  UX_STATE_NOT_MAPPED: 'QUOTE_PREVIEW_UX_STATE_NOT_MAPPED',
  QUOTE_TRUTH_NOT_AUTHORIZED: 'QUOTE_PREVIEW_UX_QUOTE_TRUTH_NOT_AUTHORIZED',
  WRITE_NOT_AUTHORIZED: 'QUOTE_PREVIEW_UX_WRITE_NOT_AUTHORIZED',
  EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_UX_EXECUTION_NOT_AUTHORIZED',
  PREVIEW_LABEL_REQUIRED: 'QUOTE_PREVIEW_UX_PREVIEW_LABEL_REQUIRED',
  HUMAN_REVIEW_REQUIRED: 'QUOTE_PREVIEW_UX_HUMAN_REVIEW_REQUIRED',
  SOURCE_TRACE_NOT_BOUND: 'QUOTE_PREVIEW_UX_SOURCE_TRACE_NOT_BOUND',
  FILE_HASH_NOT_VERIFIED: 'QUOTE_PREVIEW_UX_FILE_HASH_NOT_VERIFIED',
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

const REQUIRED_UX_STATE_FIELDS = Object.freeze([
  'state_id',
  'state_kind',
  'display_label',
  'description',
  'visible_allowed',
  'preview_reference_allowed',
  'quote_truth_allowed',
  'execution_allowed',
  'write_allowed',
  'allowed_actions',
  'blocked_actions',
  'required_badges',
  'safe_errors',
  'safety_flags',
]);

const GLOBAL_BLOCKED_ACTIONS = Object.freeze(Object.values(BLOCKED_ACTIONS));

function freezeState(state) {
  return Object.freeze({
    ...state,
    allowed_actions: Object.freeze([...(state.allowed_actions || [])]),
    blocked_actions: Object.freeze([...(state.blocked_actions || [])]),
    required_badges: Object.freeze([...(state.required_badges || [])]),
    safe_errors: Object.freeze([...(state.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(state.safety_flags || {}) }),
  });
}

function makeState({
  stateId,
  stateKind,
  displayLabel,
  description,
  previewReferenceAllowed,
  allowedActions,
  requiredBadges,
  safeErrors,
}) {
  return freezeState({
    state_id: stateId,
    state_kind: stateKind,
    display_label: displayLabel,
    description,
    visible_allowed: true,
    preview_reference_allowed: previewReferenceAllowed,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false,
    allowed_actions: allowedActions,
    blocked_actions: [...GLOBAL_BLOCKED_ACTIONS],
    required_badges: requiredBadges,
    safe_errors: [
      SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.WRITE_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED,
      ...safeErrors,
    ],
  });
}

const SAFE_UX_STATES = Object.freeze([
  makeState({
    stateId: 'empty',
    stateKind: STATE_KINDS.NEUTRAL,
    displayLabel: 'Sin PDF cargado',
    description: 'No hay PDF candidato ni datos de preview disponibles.',
    previewReferenceAllowed: false,
    allowedActions: [SAFE_ACTIONS.VIEW_EMPTY_STATE],
    requiredBadges: [BADGES.PREVIEW],
    safeErrors: [SAFE_ERROR_CODES.PREVIEW_LABEL_REQUIRED],
  }),
  makeState({
    stateId: 'pdf_candidate_detected',
    stateKind: STATE_KINDS.INFORMATIONAL,
    displayLabel: 'PDF candidato detectado',
    description: 'Hay un PDF candidato, pero todavía no está verificado ni autorizado para lectura o ejecución.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW, SAFE_ACTIONS.OPEN_EVIDENCE_PANEL],
    requiredBadges: [BADGES.PREVIEW, BADGES.NO_VERIFICADO, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.FILE_HASH_NOT_VERIFIED],
  }),
  makeState({
    stateId: 'file_hash_not_verified',
    stateKind: STATE_KINDS.WARNING,
    displayLabel: 'Archivo no verificado',
    description: 'El archivo candidato no tiene hash verificado. Sólo puede mostrarse como referencia.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW, SAFE_ACTIONS.OPEN_EVIDENCE_PANEL],
    requiredBadges: [BADGES.PREVIEW, BADGES.ARCHIVO_NO_VERIFICADO, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.FILE_HASH_NOT_VERIFIED],
  }),
  makeState({
    stateId: 'source_trace_not_bound',
    stateKind: STATE_KINDS.WARNING,
    displayLabel: 'Valores sin fuente trazada',
    description: 'Los valores esperados o inputs no tienen source trace bound. No pueden tratarse como verdad.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW, SAFE_ACTIONS.OPEN_PROVENANCE_PANEL],
    requiredBadges: [BADGES.PREVIEW, BADGES.SIN_SOURCE_TRACE, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND],
  }),
  makeState({
    stateId: 'parser_owner_decision_required',
    stateKind: STATE_KINDS.BLOCKED,
    displayLabel: 'Parser pendiente de ownership',
    description: 'El parser candidato requiere decisión de ownership. No se ejecuta parser.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.OPEN_EVIDENCE_PANEL, SAFE_ACTIONS.REQUEST_HUMAN_REVIEW],
    requiredBadges: [BADGES.PREVIEW, BADGES.PARSER_BLOQUEADO, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.HUMAN_REVIEW_REQUIRED],
  }),
  makeState({
    stateId: 'deterministic_inputs_not_verified',
    stateKind: STATE_KINDS.WARNING,
    displayLabel: 'Inputs determinísticos no verificados',
    description: 'Inputs como UDI, crecimiento, horizonte o fórmula no están verificados. No hay cálculo autorizado.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.OPEN_PROVENANCE_PANEL, SAFE_ACTIONS.REQUEST_HUMAN_REVIEW],
    requiredBadges: [BADGES.PREVIEW, BADGES.INPUTS_NO_VERIFICADOS, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.SOURCE_TRACE_NOT_BOUND],
  }),
  makeState({
    stateId: 'preview_reference_available',
    stateKind: STATE_KINDS.PREVIEW_READY,
    displayLabel: 'Preview de referencia disponible',
    description: 'Puede mostrarse un preview de referencia con etiquetas de no cotización y no verificado.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW, SAFE_ACTIONS.OPEN_EVIDENCE_PANEL, SAFE_ACTIONS.COPY_PREVIEW_REFERENCE_SUMMARY],
    requiredBadges: [BADGES.PREVIEW, BADGES.NO_ES_COTIZACION, BADGES.NO_VERIFICADO],
    safeErrors: [SAFE_ERROR_CODES.PREVIEW_LABEL_REQUIRED],
  }),
  makeState({
    stateId: 'quote_truth_blocked',
    stateKind: STATE_KINDS.BLOCKED,
    displayLabel: 'Cotización real bloqueada',
    description: 'La cotización real está bloqueada hasta que existan gates de provider/backend autorizados.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.OPEN_EVIDENCE_PANEL, SAFE_ACTIONS.REQUEST_HUMAN_REVIEW],
    requiredBadges: [BADGES.NO_ES_COTIZACION, BADGES.QUOTE_TRUTH_BLOQUEADO],
    safeErrors: [SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED],
  }),
  makeState({
    stateId: 'ready_for_human_review',
    stateKind: STATE_KINDS.HUMAN_REVIEW,
    displayLabel: 'Listo para revisión humana',
    description: 'El preview puede revisarse por humano, pero no puede convertirse en cotización real ni escribirse.',
    previewReferenceAllowed: true,
    allowedActions: [SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW, SAFE_ACTIONS.OPEN_EVIDENCE_PANEL, SAFE_ACTIONS.REQUEST_HUMAN_REVIEW],
    requiredBadges: [BADGES.PREVIEW, BADGES.REQUIERE_REVISION_HUMANA, BADGES.NO_ES_COTIZACION],
    safeErrors: [SAFE_ERROR_CODES.HUMAN_REVIEW_REQUIRED],
  }),
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSourceRefs() {
  const readinessCatalog = readiness.getQuotePreviewPdfCanonicalExecutionReadinessReviewMatrixCatalog();
  const boundaryCatalog = boundary.getQuotePreviewPdfEnginePreviewVsQuoteTruthBoundaryRegistryCatalog();
  return {
    readiness: {
      adapter_id: readinessCatalog.adapter_id,
      schemaVersion: readinessCatalog.schemaVersion,
      overall_readiness: readinessCatalog.overall_readiness,
    },
    preview_vs_quote_truth_boundary: {
      adapter_id: boundaryCatalog.adapter_id,
      schemaVersion: boundaryCatalog.schemaVersion,
      overall_boundary_status: boundaryCatalog.overall_boundary_status,
    },
  };
}

function getQuotePreviewSafeUxStateModelRegistryCatalog() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_safe_ux_state_model_registry',
    overall_ux_state_status: 'safe_state_model_mapped_no_effects',
    ui_mutation_allowed_in_registry: false,
    quote_truth_creation_allowed_in_registry: false,
    quote_issuance_allowed_in_registry: false,
    quote_send_allowed_in_registry: false,
    quote_write_allowed_in_registry: false,
    crm_write_allowed_in_registry: false,
    policy_write_allowed_in_registry: false,
    pipeline_write_allowed_in_registry: false,
    provider_runtime_allowed_in_registry: false,
    backend_connection_allowed_in_registry: false,
    parser_execution_allowed_in_registry: false,
    calculator_execution_allowed_in_registry: false,
    banxico_call_allowed_in_registry: false,
    required_ux_state_fields: [...REQUIRED_UX_STATE_FIELDS],
    safe_actions: Object.values(SAFE_ACTIONS),
    blocked_actions: Object.values(BLOCKED_ACTIONS),
    badges: Object.values(BADGES),
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    states: clone(SAFE_UX_STATES),
  };
}

function buildSafeUxStateModelSafeError(stateId, code = SAFE_ERROR_CODES.UX_STATE_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    state_id: stateId || null,
    state_kind: STATE_KINDS.BLOCKED,
    display_label: 'Estado UX no mapeado',
    description: 'El estado UX solicitado no está mapeado. Todo efecto real permanece bloqueado.',
    visible_allowed: true,
    preview_reference_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false,
    allowed_actions: [SAFE_ACTIONS.REQUEST_HUMAN_REVIEW],
    blocked_actions: [...GLOBAL_BLOCKED_ACTIONS],
    required_badges: [BADGES.NO_ES_COTIZACION, BADGES.QUOTE_TRUTH_BLOQUEADO],
    safe_errors: [code, SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED, SAFE_ERROR_CODES.WRITE_NOT_AUTHORIZED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Safe UX state is not mapped. Quote truth, execution, and writes are blocked.',
    },
  };
}

function getSafeUxStateById(stateId) {
  const match = SAFE_UX_STATES.find((state) => state.state_id === stateId);
  return match ? clone(match) : buildSafeUxStateModelSafeError(stateId);
}

function getSafeUxStatesByKind(stateKind) {
  return clone(SAFE_UX_STATES.filter((state) => state.state_kind === stateKind));
}

function getVisibleSafeUxStates() {
  return clone(SAFE_UX_STATES.filter((state) => state.visible_allowed === true));
}

function getPreviewReferenceAllowedSafeUxStates() {
  return clone(SAFE_UX_STATES.filter((state) => state.preview_reference_allowed === true));
}

function getQuoteTruthBlockedSafeUxStates() {
  return clone(SAFE_UX_STATES.filter((state) => state.quote_truth_allowed === false));
}

function getExecutableSafeUxStates() {
  return clone(SAFE_UX_STATES.filter((state) => state.execution_allowed === true));
}

function getWritableSafeUxStates() {
  return clone(SAFE_UX_STATES.filter((state) => state.write_allowed === true));
}

function validateSafeUxStateShape(state) {
  const errors = [];
  if (!state || typeof state !== 'object') return { ok: false, valid: false, errors: ['ux_state_object_required'] };

  for (const field of REQUIRED_UX_STATE_FIELDS) {
    if (!(field in state)) errors.push(`missing_${field}`);
  }

  if (state.quote_truth_allowed !== false) errors.push('quote_truth_allowed_must_be_false');
  if (state.execution_allowed !== false) errors.push('execution_allowed_must_be_false');
  if (state.write_allowed !== false) errors.push('write_allowed_must_be_false');

  const badges = Array.isArray(state.required_badges) ? state.required_badges : [];
  if (!badges.includes(BADGES.NO_ES_COTIZACION) && state.state_id !== 'empty') {
    errors.push('non_empty_state_must_include_no_es_cotizacion_badge');
  }

  for (const [key, value] of Object.entries(state.safety_flags || {})) {
    if (value !== false) errors.push(`safety_flag_not_false_${key}`);
  }

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

function validateSafeUxStateModelRegistryCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object') return { ok: false, valid: false, errors: ['catalog_object_required'] };

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_ux_state_status !== 'safe_state_model_mapped_no_effects') errors.push('overall_ux_state_status_must_remain_no_effects');

  for (const flagName of [
    'ui_mutation_allowed_in_registry',
    'quote_truth_creation_allowed_in_registry',
    'quote_issuance_allowed_in_registry',
    'quote_send_allowed_in_registry',
    'quote_write_allowed_in_registry',
    'crm_write_allowed_in_registry',
    'policy_write_allowed_in_registry',
    'pipeline_write_allowed_in_registry',
    'provider_runtime_allowed_in_registry',
    'backend_connection_allowed_in_registry',
    'parser_execution_allowed_in_registry',
    'calculator_execution_allowed_in_registry',
    'banxico_call_allowed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const states = Array.isArray(catalog.states) ? catalog.states : [];
  if (states.length !== 9) errors.push('nine_safe_ux_states_required');

  for (const state of states) {
    const result = validateSafeUxStateShape(state);
    if (!result.ok) errors.push(...result.errors.map((error) => `${state.state_id || 'unknown'}:${error}`));
  }

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  STATE_KINDS,
  SAFE_ACTIONS,
  BLOCKED_ACTIONS,
  BADGES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_UX_STATE_FIELDS,
  SAFE_UX_STATES,
  getQuotePreviewSafeUxStateModelRegistryCatalog,
  getSafeUxStateById,
  getSafeUxStatesByKind,
  getVisibleSafeUxStates,
  getPreviewReferenceAllowedSafeUxStates,
  getQuoteTruthBlockedSafeUxStates,
  getExecutableSafeUxStates,
  getWritableSafeUxStates,
  buildSafeUxStateModelSafeError,
  validateSafeUxStateShape,
  validateSafeUxStateModelRegistryCatalog,
};
NODE

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.safe_ux_state_model.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.safe_ux_state_model.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

const catalog = adapter.getQuotePreviewSafeUxStateModelRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_safe_ux_state_model');
assert.equal(catalog.registry_type, 'local_static_read_only_safe_ux_state_model_registry');
assert.equal(catalog.overall_ux_state_status, 'safe_state_model_mapped_no_effects');
assert.equal(catalog.states.length, 9);
assert.equal(adapter.validateSafeUxStateModelRegistryCatalog(catalog).ok, true);

for (const flag of [
  'ui_mutation_allowed_in_registry',
  'quote_truth_creation_allowed_in_registry',
  'quote_issuance_allowed_in_registry',
  'quote_send_allowed_in_registry',
  'quote_write_allowed_in_registry',
  'crm_write_allowed_in_registry',
  'policy_write_allowed_in_registry',
  'pipeline_write_allowed_in_registry',
  'provider_runtime_allowed_in_registry',
  'backend_connection_allowed_in_registry',
  'parser_execution_allowed_in_registry',
  'calculator_execution_allowed_in_registry',
  'banxico_call_allowed_in_registry',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const state of catalog.states) {
  for (const field of adapter.REQUIRED_UX_STATE_FIELDS) assert(field in state, `${state.state_id} missing ${field}`);
  assert.equal(state.quote_truth_allowed, false);
  assert.equal(state.execution_allowed, false);
  assert.equal(state.write_allowed, false);
  assert(state.safe_errors.includes(adapter.SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED));
  assert(state.safe_errors.includes(adapter.SAFE_ERROR_CODES.WRITE_NOT_AUTHORIZED));
  assert(state.safe_errors.includes(adapter.SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED));
  assert.equal(adapter.validateSafeUxStateShape(state).ok, true);
}

const preview = adapter.getSafeUxStateById('preview_reference_available');
assert.equal(preview.state_kind, adapter.STATE_KINDS.PREVIEW_READY);
assert.equal(preview.preview_reference_allowed, true);
assert.equal(preview.quote_truth_allowed, false);
assert(preview.required_badges.includes(adapter.BADGES.NO_ES_COTIZACION));
assert(preview.allowed_actions.includes(adapter.SAFE_ACTIONS.VIEW_REFERENCE_PREVIEW));
assert(preview.blocked_actions.includes(adapter.BLOCKED_ACTIONS.ISSUE_QUOTE));
assert(preview.blocked_actions.includes(adapter.BLOCKED_ACTIONS.WRITE_QUOTE));

const blocked = adapter.getSafeUxStateById('quote_truth_blocked');
assert.equal(blocked.state_kind, adapter.STATE_KINDS.BLOCKED);
assert(blocked.required_badges.includes(adapter.BADGES.QUOTE_TRUTH_BLOQUEADO));
assert.equal(blocked.quote_truth_allowed, false);

const human = adapter.getSafeUxStateById('ready_for_human_review');
assert.equal(human.state_kind, adapter.STATE_KINDS.HUMAN_REVIEW);
assert(human.allowed_actions.includes(adapter.SAFE_ACTIONS.REQUEST_HUMAN_REVIEW));
assert(human.required_badges.includes(adapter.BADGES.REQUIERE_REVISION_HUMANA));

assert.equal(adapter.getVisibleSafeUxStates().length, 9);
assert.equal(adapter.getPreviewReferenceAllowedSafeUxStates().length, 8);
assert.equal(adapter.getQuoteTruthBlockedSafeUxStates().length, 9);
assert.equal(adapter.getExecutableSafeUxStates().length, 0);
assert.equal(adapter.getWritableSafeUxStates().length, 0);
assert.equal(adapter.getSafeUxStatesByKind(adapter.STATE_KINDS.WARNING).length, 3);
assert.equal(adapter.getSafeUxStatesByKind(adapter.STATE_KINDS.BLOCKED).length, 2);

const missing = adapter.getSafeUxStateById('missing_state');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.quote_truth_allowed, false);
assert.equal(missing.execution_allowed, false);
assert.equal(missing.write_allowed, false);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.UX_STATE_NOT_MAPPED));
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED));
assert.equal(adapter.validateSafeUxStateShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const state of catalog.states) {
  for (const [key, value] of Object.entries(state.safety_flags || {})) {
    assert.equal(value, false, `${state.state_id}.${key} must be false`);
  }
}

const combined = JSON.stringify({ catalog, missing, flags: adapter.DEFAULT_SAFETY_FLAGS });
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

console.log('PASS quote preview safe ux state model registry adapter 086B');
NODE

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "086B WRITE DOCS / EVIDENCE"
cat > "$ARCH_DOC_B" <<EOF
# Forge Quote Preview Safe UX State Model Implementation 086B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Purpose

086B implements a local/static/read-only safe UX state model registry.

The registry defines display-safe UX states for Quote Preview. It does not mutate UI, create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, or execute real effects.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Registry Status

\`safe_state_model_mapped_no_effects\`

## Safe UX States

- \`empty\`
- \`pdf_candidate_detected\`
- \`file_hash_not_verified\`
- \`source_trace_not_bound\`
- \`parser_owner_decision_required\`
- \`deterministic_inputs_not_verified\`
- \`preview_reference_available\`
- \`quote_truth_blocked\`
- \`ready_for_human_review\`

Every state preserves:

- \`quote_truth_allowed=false\`
- \`execution_allowed=false\`
- \`write_allowed=false\`

## Final Decision

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$EVIDENCE_DOC_B" <<EOF
# Forge Quote Preview Safe UX State Model Implementation 086B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Evidence Summary

086B implements a local/static/read-only safe UX state model registry.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Test Evidence

The focused test validates:

- adapter identity and schema;
- registry shape;
- nine safe UX states exist;
- every state blocks quote truth;
- every state blocks execution;
- every state blocks writes;
- preview state requires "no es cotización" badge;
- human review state exposes safe human review action;
- no executable or writable states exist;
- all safety flags remain false.

## Final

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$CERT_DOC_B" <<EOF
# Forge Quote Preview Safe UX State Model Implementation Certificate 086B

PHASE=$PHASE_B

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

086B certifies that Forge now has a local/static/read-only safe UX state model registry.

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
    "adapterId": "forge.quote_preview.safe_ux_state_model.registry.adapter.v1",
    "schemaVersion": "forge.quote_preview.safe_ux_state_model.registry.v1",
    "registryType": "local_static_read_only_safe_ux_state_model_registry",
    "overallUxStateStatus": "safe_state_model_mapped_no_effects",
    "uiMutationIntroduced": false,
    "quoteTruthCreationIntroduced": false,
    "providerRuntimeIntroduced": false,
    "backendConnectionIntroduced": false,
    "quoteWriteIntroduced": false,
    "quoteSendIntroduced": false
  },
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "safeUxStates": {
    "count": 9,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "previewLabelRequired": true,
    "humanReviewStatePresent": true
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
## 086B Quote Preview Safe UX State Model Implementation

086B implements a local/static/read-only safe UX state model registry.

Locked decision:
\`$LOCKED_B\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

Registry status:

- \`safe_state_model_mapped_no_effects\`

Safe UX states:

- \`empty\`
- \`pdf_candidate_detected\`
- \`file_hash_not_verified\`
- \`source_trace_not_bound\`
- \`parser_owner_decision_required\`
- \`deterministic_inputs_not_verified\`
- \`preview_reference_available\`
- \`quote_truth_blocked\`
- \`ready_for_human_review\`

Every state preserves:

- \`quote_truth_allowed=false\`
- \`execution_allowed=false\`
- \`write_allowed=false\`

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
<!-- FORGE:$PHASE_B:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_B" "$TREE_BLOCK_B"
done
trim_tree_files

stage "086B VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_B"
run rg -n "$PHASE_B|$DECISION_B|$LOCKED_B|$PHASE_C|safe UX state model registry|safe_state_model_mapped_no_effects|quote_truth_allowed=false|ready_for_human_review" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "feat: implement quote preview safe ux state model registry" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ADAPTER" "$TEST" "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 086C QA
# -------------------------------------------------------------------
stage "086C SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const ux = require("./platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js");

const catalog = ux.getQuotePreviewSafeUxStateModelRegistryCatalog();
assert.equal(catalog.overall_ux_state_status, "safe_state_model_mapped_no_effects");
assert.equal(ux.validateSafeUxStateModelRegistryCatalog(catalog).ok, true);
assert.equal(catalog.states.length, 9);
assert.equal(ux.getVisibleSafeUxStates().length, 9);
assert.equal(ux.getPreviewReferenceAllowedSafeUxStates().length, 8);
assert.equal(ux.getQuoteTruthBlockedSafeUxStates().length, 9);
assert.equal(ux.getExecutableSafeUxStates().length, 0);
assert.equal(ux.getWritableSafeUxStates().length, 0);

for (const state of catalog.states) {
  assert.equal(state.quote_truth_allowed, false);
  assert.equal(state.execution_allowed, false);
  assert.equal(state.write_allowed, false);
  assert.equal(ux.validateSafeUxStateShape(state).ok, true);
}

assert.equal(ux.getSafeUxStateById("preview_reference_available").required_badges.includes(ux.BADGES.NO_ES_COTIZACION), true);
assert.equal(ux.getSafeUxStateById("quote_truth_blocked").required_badges.includes(ux.BADGES.QUOTE_TRUTH_BLOQUEADO), true);
assert.equal(ux.getSafeUxStateById("ready_for_human_review").allowed_actions.includes(ux.SAFE_ACTIONS.REQUEST_HUMAN_REVIEW), true);

for (const [key, value] of Object.entries(ux.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

console.log(JSON.stringify({
  status: "PASS",
  catalogValidated: true,
  stateCount: catalog.states.length,
  visibleStateCount: ux.getVisibleSafeUxStates().length,
  previewReferenceAllowedCount: ux.getPreviewReferenceAllowedSafeUxStates().length,
  quoteTruthBlockedCount: ux.getQuoteTruthBlockedSafeUxStates().length,
  executableStateCount: ux.getExecutableSafeUxStates().length,
  writableStateCount: ux.getWritableSafeUxStates().length,
  previewLabelRequired: true,
  quoteTruthBlockedStatePresent: true,
  humanReviewStatePresent: true,
  allSafetyFlagsFalse: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"

cat > "$ARCH_DOC_C" <<EOF
# Forge Quote Preview Safe UX State Model QA Lock 086C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Purpose

086C QA locks the 086B safe UX state model registry.

## QA Validated

- registry shape validates;
- nine safe UX states exist;
- all states are visible-safe read models;
- quote truth is blocked in every state;
- execution is blocked in every state;
- writes are blocked in every state;
- preview labeling is required;
- human review state exists;
- all safety flags remain false.

## Final Decision

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$EVIDENCE_DOC_C" <<EOF
# Forge Quote Preview Safe UX State Model QA Lock 086C

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
# Forge Quote Preview Safe UX State Model QA Lock Certificate 086C

PHASE=$PHASE_C

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

086C certifies that safe UX state model registry is QA locked.

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
    "stateCount": 9,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "previewLabelRequired": true,
    "humanReviewStatePresent": true,
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
## 086C Quote Preview Safe UX State Model QA Lock

086C QA locks the 086B safe UX state model registry.

Locked decision:
\`$LOCKED_C\`

QA validated:

- registry shape validates;
- nine safe UX states exist;
- quote truth is blocked in every state;
- execution is blocked in every state;
- writes are blocked in every state;
- preview labeling is required;
- human review state exists;
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

stage "086C VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_C"
run rg -n "$PHASE_C|$DECISION_C|$LOCKED_C|$PHASE_D|QA locks|nine safe UX states|quote truth is blocked|human review state" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe ux state model qa" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 086D DECISION
# -------------------------------------------------------------------
stage "086D DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const ux = require("./platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js");

const catalog = ux.getQuotePreviewSafeUxStateModelRegistryCatalog();
assert.equal(catalog.overall_ux_state_status, "safe_state_model_mapped_no_effects");
assert.equal(ux.validateSafeUxStateModelRegistryCatalog(catalog).ok, true);
assert.equal(catalog.states.length, 9);
assert.equal(ux.getExecutableSafeUxStates().length, 0);
assert.equal(ux.getWritableSafeUxStates().length, 0);
assert.equal(ux.getQuoteTruthBlockedSafeUxStates().length, 9);

for (const state of catalog.states) {
  assert.equal(state.quote_truth_allowed, false);
  assert.equal(state.execution_allowed, false);
  assert.equal(state.write_allowed, false);
}

console.log(JSON.stringify({
  status: "PASS",
  locked_as: "local_static_read_only_reference_registry",
  overall_ux_state_status: catalog.overall_ux_state_status,
  state_count: catalog.states.length,
  quote_truth_blocked_count: ux.getQuoteTruthBlockedSafeUxStates().length,
  executable_state_count: ux.getExecutableSafeUxStates().length,
  writable_state_count: ux.getWritableSafeUxStates().length,
  preview_label_required: true,
  human_review_state_present: true,
  next_scope: "087A_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_SCOPE",
  all_safety_flags_false: true
}, null, 2));
NODE

cat "$DECISION_QA_JSON"

cat > "$ARCH_DOC_D" <<EOF
# Forge Quote Preview Safe UX State Model Decision Lock 086D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Purpose

086D decision-locks the 086B/086C safe UX state model registry as a local/static/read-only reference registry.

## Locked Meaning

The registry is approved only as:

- local/static;
- read-only;
- safe UX state reference model;
- no UI mutation;
- no quote truth;
- no execution;
- no writes.

## Confirmed

- nine safe UX states exist;
- quote truth is blocked in every state;
- execution is blocked in every state;
- writes are blocked in every state;
- preview label is required;
- human review state exists.

## Next Architectural Unlock

087A may scope safe UX component contracts.

087A must not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico/providers, connect backend, write quotes, mutate UI, or create real effects.

## Final Decision

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$EVIDENCE_DOC_D" <<EOF
# Forge Quote Preview Safe UX State Model Decision Lock 086D

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
# Forge Quote Preview Safe UX State Model Decision Lock Certificate 086D

PHASE=$PHASE_D

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

086D certifies that safe UX state model registry is locked as local/static/read-only reference registry.

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
  "lockedAs": "local_static_read_only_reference_registry",
  "decisionAssertions": $(cat "$DECISION_QA_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "confirmed": {
    "registryShapeValidates": true,
    "stateCount": 9,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "previewLabelRequired": true,
    "humanReviewStatePresent": true,
    "allSafetyFlagsFalse": true
  },
  "nextScope": {
    "phase": "$NEXT_AFTER_D",
    "purpose": "quote_preview_safe_ux_component_contract_scope",
    "executionAllowed": false,
    "uiMutationAllowed": false
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
## 086D Quote Preview Safe UX State Model Decision Lock

086D decision-locks the 086B/086C safe UX state model registry as a local/static/read-only reference registry.

Locked decision:
\`$LOCKED_D\`

Confirmed:

- nine safe UX states exist;
- quote truth is blocked in every state;
- execution is blocked in every state;
- writes are blocked in every state;
- preview label is required;
- human review state exists.

Next:

- \`$NEXT_AFTER_D\` may scope safe UX component contracts.
- No UI mutation or execution is authorized.

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
<!-- FORGE:$PHASE_D:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_D" "$TREE_BLOCK_D"
done
trim_tree_files

stage "086D VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_D"
run rg -n "$PHASE_D|$DECISION_D|$LOCKED_D|$NEXT_AFTER_D|Safe UX State Model|decision-locks|safe UX component contracts|No UI mutation" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe ux state model decision" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -16

SUMMARY=$(cat <<EOF
PASS_086ABCD_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_FAST_TRACK_COMMIT_PUSH_COMPLETE
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
