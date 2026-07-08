#!/usr/bin/env bash
set -euo pipefail

CHAIN="088ABCD_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_FAST_TRACK"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/088abcd-safe-screen-composition-fast-track-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_088abcd_quote_preview_safe_screen_composition_fast_track.sh"

PHASE_A="088A_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE"
DECISION_A="PASS_088A_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE"
LOCKED_A="QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPED"

PHASE_B="088B_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_IMPLEMENTATION"
DECISION_B="PASS_088B_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_IMPLEMENTATION"
LOCKED_B="QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"

PHASE_C="088C_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCK"
DECISION_C="PASS_088C_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCK"
LOCKED_C="QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCKED"

PHASE_D="088D_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK"
DECISION_D="PASS_088D_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK"
LOCKED_D="QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
NEXT_AFTER_D="089A_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE"

BOUNDARY="no UI mutation; no component rendering; no screen rendering; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no expected-value verification; no parser invocation; no deterministic calculation; no quote truth creation; no quote issuance; no quote send; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator; no real test execution"

READINESS_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b.js"
READINESS_TEST="tests/quote-preview-pdf-engine-canonical-execution-readiness-review-matrix-adapter-080b-test.js"
BOUNDARY_ADAPTER="platform/adapters/quote-preview/quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b.js"
BOUNDARY_TEST="tests/quote-preview-pdf-engine-preview-vs-quote-truth-boundary-registry-adapter-085b-test.js"
UX_STATE_ADAPTER="platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js"
UX_STATE_TEST="tests/quote-preview-safe-ux-state-model-registry-adapter-086b-test.js"
COMPONENT_CONTRACT_ADAPTER="platform/adapters/quote-preview/quote-preview-safe-ux-component-contract-registry-adapter-087b.js"
COMPONENT_CONTRACT_TEST="tests/quote-preview-safe-ux-component-contract-registry-adapter-087b-test.js"

ADAPTER="platform/adapters/quote-preview/quote-preview-safe-screen-composition-registry-adapter-088b.js"
TEST="tests/quote-preview-safe-screen-composition-registry-adapter-088b-test.js"

ARCH_DOC_A="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE_088A.md"
EVIDENCE_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE_088A.md"
CERT_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE_CERTIFICATE_088A.md"
AUDIT_JSON_A="docs/evidence/forge-quote-preview-safe-screen-composition-scope-audit-088a.json"

ARCH_DOC_B="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_IMPLEMENTATION_088B.md"
EVIDENCE_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_IMPLEMENTATION_088B.md"
CERT_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_IMPLEMENTATION_CERTIFICATE_088B.md"
AUDIT_JSON_B="docs/evidence/forge-quote-preview-safe-screen-composition-implementation-audit-088b.json"

ARCH_DOC_C="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCK_088C.md"
EVIDENCE_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCK_088C.md"
CERT_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_QA_LOCK_CERTIFICATE_088C.md"
AUDIT_JSON_C="docs/evidence/forge-quote-preview-safe-screen-composition-qa-audit-088c.json"

ARCH_DOC_D="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md"
EVIDENCE_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md"
CERT_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_CERTIFICATE_088D.md"
AUDIT_JSON_D="docs/evidence/forge-quote-preview-safe-screen-composition-decision-audit-088d.json"

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
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|renderAllowed\s*:\s*true|screenRenderAllowed\s*:\s*true|uiMutationAllowed\s*:\s*true|writeAllowed\s*:\s*true|quoteTruthAllowed\s*:\s*true|providerRuntimeAllowed\s*:\s*true|backendConnectionAllowed\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/write/ui/render marker"
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
echo "ROBOCOP_GATE=Article 0; 087D component contract closed; safe screen composition only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -15
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CLEAN INDEX ONLY"
run git reset

stage "STAGE 3 CONFIRM BASE 087D"
if git log --oneline -220 | grep -Eq "087D|safe ux component contract decision|QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"; then
  pass "087D base found in git log"
elif [ -f "docs/evidence/forge-quote-preview-safe-ux-component-contract-decision-audit-087d.json" ]; then
  pass "087D audit fallback found"
else
  fail "087D base not found. Run 087A/B/C/D first."
fi

if [ -f "docs/evidence/forge-quote-preview-safe-ux-component-contract-decision-audit-087d.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-safe-ux-component-contract-decision-audit-087d.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"|"next"\s*:\s*"088A_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE"' docs/evidence/forge-quote-preview-safe-ux-component-contract-decision-audit-087d.json >/dev/null; then
    fail "087D audit exists but does not confirm PASS/088A next"
  fi
  pass "087D audit PASS/088A next confirmed"
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
  "$READINESS_ADAPTER" "$READINESS_TEST"
  "$BOUNDARY_ADAPTER" "$BOUNDARY_TEST"
  "$UX_STATE_ADAPTER" "$UX_STATE_TEST"
  "$COMPONENT_CONTRACT_ADAPTER" "$COMPONENT_CONTRACT_TEST"
)
for f in "${REQUIRED_FILES[@]}"; do [ -f "$f" ] || fail "Missing required file: $f"; pass "$f"; done

stage "STAGE 6 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"
pass "$BACKUP_DIR"

stage "STAGE 7 BASE VALIDATION"
run node --check "$READINESS_ADAPTER"; run node "$READINESS_TEST"
run node --check "$BOUNDARY_ADAPTER"; run node "$BOUNDARY_TEST"
run node --check "$UX_STATE_ADAPTER"; run node "$UX_STATE_TEST"
run node --check "$COMPONENT_CONTRACT_ADAPTER"; run node "$COMPONENT_CONTRACT_TEST"

# -------------------------------------------------------------------
# 088A SCOPE
# -------------------------------------------------------------------
stage "088A BUILD SCOPE"
SCREEN_SCOPE_JSON="$(mktemp)"
node <<'NODE' > "$SCREEN_SCOPE_JSON"
const ux = require('./platform/adapters/quote-preview/quote-preview-safe-ux-state-model-registry-adapter-086b.js');
const components = require('./platform/adapters/quote-preview/quote-preview-safe-ux-component-contract-registry-adapter-087b.js');

const uxCatalog = ux.getQuotePreviewSafeUxStateModelRegistryCatalog();
const componentCatalog = components.getQuotePreviewSafeUxComponentContractRegistryCatalog();

const compositions = [
  {
    composition_id: 'quote_preview_empty_screen',
    screen_name: 'QuotePreviewEmptyScreen',
    composition_kind: 'empty_state_screen_composition',
    supported_state_ids: ['empty'],
    layout_mode_refs: ['desktop_single_column', 'mobile_single_column'],
    slot_order: ['shell', 'status', 'badges', 'action_bar'],
    primary_component_ids: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_action_bar'],
    secondary_component_ids: [],
    required_badges: ['preview', 'no_es_cotizacion'],
    allowed_actions: ['view_empty_state'],
    blocked_actions: ['issue_quote', 'send_quote', 'write_quote', 'write_crm', 'write_policy', 'write_pipeline', 'connect_provider', 'connect_backend', 'run_parser', 'run_calculator', 'call_banxico', 'read_pdf'],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    composition_id: 'quote_preview_intake_screen',
    screen_name: 'QuotePreviewIntakeScreen',
    composition_kind: 'intake_status_screen_composition',
    supported_state_ids: ['pdf_candidate_detected', 'file_hash_not_verified'],
    layout_mode_refs: ['desktop_two_column', 'tablet_two_column', 'mobile_single_column'],
    slot_order: ['shell', 'status', 'badges', 'warning_stack', 'evidence_panel', 'action_bar'],
    primary_component_ids: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_warning_stack', 'quote_preview_action_bar'],
    secondary_component_ids: ['quote_preview_evidence_panel'],
    required_badges: ['preview', 'no_es_cotizacion', 'no_verificado'],
    allowed_actions: ['view_reference_preview', 'open_evidence_panel'],
    blocked_actions: ['issue_quote', 'send_quote', 'write_quote', 'read_pdf', 'run_parser', 'connect_backend'],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    composition_id: 'quote_preview_blocked_screen',
    screen_name: 'QuotePreviewBlockedScreen',
    composition_kind: 'blocked_warning_screen_composition',
    supported_state_ids: ['source_trace_not_bound', 'parser_owner_decision_required', 'deterministic_inputs_not_verified', 'quote_truth_blocked'],
    layout_mode_refs: ['desktop_two_column', 'mobile_single_column'],
    slot_order: ['shell', 'status', 'badges', 'warning_stack', 'evidence_panel', 'human_review_card', 'action_bar'],
    primary_component_ids: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_warning_stack', 'quote_preview_human_review_card', 'quote_preview_action_bar'],
    secondary_component_ids: ['quote_preview_evidence_panel'],
    required_badges: ['preview', 'no_es_cotizacion', 'quote_truth_bloqueado'],
    allowed_actions: ['open_evidence_panel', 'open_provenance_panel', 'request_human_review'],
    blocked_actions: ['issue_quote', 'send_quote', 'write_quote', 'write_crm', 'write_policy', 'connect_provider', 'connect_backend', 'run_parser', 'run_calculator', 'call_banxico'],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    composition_id: 'quote_preview_reference_screen',
    screen_name: 'QuotePreviewReferenceScreen',
    composition_kind: 'reference_preview_screen_composition',
    supported_state_ids: ['preview_reference_available'],
    layout_mode_refs: ['desktop_two_column', 'tablet_two_column', 'mobile_single_column'],
    slot_order: ['shell', 'status', 'badges', 'value_table', 'evidence_panel', 'warning_stack', 'action_bar'],
    primary_component_ids: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_value_table', 'quote_preview_action_bar'],
    secondary_component_ids: ['quote_preview_evidence_panel', 'quote_preview_warning_stack'],
    required_badges: ['preview', 'no_es_cotizacion', 'no_verificado'],
    allowed_actions: ['view_reference_preview', 'open_evidence_panel', 'open_provenance_panel', 'copy_preview_reference_summary'],
    blocked_actions: ['issue_quote', 'send_quote', 'write_quote', 'write_crm', 'write_policy', 'write_pipeline', 'connect_provider', 'connect_backend', 'run_calculator'],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  },
  {
    composition_id: 'quote_preview_human_review_screen',
    screen_name: 'QuotePreviewHumanReviewScreen',
    composition_kind: 'human_review_screen_composition',
    supported_state_ids: ['ready_for_human_review'],
    layout_mode_refs: ['desktop_two_column', 'mobile_single_column'],
    slot_order: ['shell', 'status', 'badges', 'value_table', 'evidence_panel', 'human_review_card', 'action_bar'],
    primary_component_ids: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_value_table', 'quote_preview_human_review_card', 'quote_preview_action_bar'],
    secondary_component_ids: ['quote_preview_evidence_panel'],
    required_badges: ['preview', 'no_es_cotizacion', 'requiere_revision_humana'],
    allowed_actions: ['view_reference_preview', 'open_evidence_panel', 'open_provenance_panel', 'request_human_review', 'copy_preview_reference_summary'],
    blocked_actions: ['issue_quote', 'send_quote', 'write_quote', 'write_crm', 'write_policy', 'write_pipeline', 'connect_provider', 'connect_backend'],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false
  }
];

const scope = {
  status: 'PASS',
  phase: '088A_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_SCOPE',
  scope_type: 'safe_screen_composition_scope_only',
  safe_ux_state_status_before_088a: uxCatalog.overall_ux_state_status,
  component_contract_status_before_088a: componentCatalog.overall_component_contract_status,
  screen_composition_count: compositions.length,
  compositions,
  required_088b_output: {
    adapter_type: 'local_static_read_only_safe_screen_composition_registry',
    must_not_render_screen: true,
    must_not_mutate_ui: true,
    must_not_create_quote_truth: true,
    must_not_write_quote: true,
    must_not_connect_backend: true,
    must_map_compositions_to_safe_states_and_component_contracts: true,
    required_fields: [
      'composition_id',
      'screen_name',
      'composition_kind',
      'supported_state_ids',
      'layout_mode_refs',
      'slot_order',
      'primary_component_ids',
      'secondary_component_ids',
      'required_badges',
      'allowed_actions',
      'blocked_actions',
      'render_allowed',
      'ui_mutation_allowed',
      'quote_truth_allowed',
      'execution_allowed',
      'write_allowed',
      'safe_errors',
      'safety_flags'
    ]
  },
  next_decision_after_088d: 'quote_preview_safe_visual_layout_spec_scope',
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

if (scope.safe_ux_state_status_before_088a !== 'safe_state_model_mapped_no_effects') throw new Error('088A requires 086D safe UX state model base');
if (scope.component_contract_status_before_088a !== 'component_contracts_mapped_no_render_no_effects') throw new Error('088A requires 087D component contract base');
console.log(JSON.stringify(scope, null, 2));
NODE

cat "$SCREEN_SCOPE_JSON"

stage "088A WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC_A")" "$(dirname "$EVIDENCE_DOC_A")"

cat > "$ARCH_DOC_A" <<EOF
# Forge Quote Preview Safe Screen Composition Scope 088A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Purpose

088A scopes safe screen composition for Quote Preview.

This phase follows 087D, where safe UX component contracts were locked as local/static/read-only reference registry.

## Important Boundary

088A does not render screens.

088A does not mutate UI.

088A does not create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or execute real tests.

088A only scopes how safe components can be composed into screen-level contracts.

## Scoped Screen Compositions

- \`QuotePreviewEmptyScreen\`
- \`QuotePreviewIntakeScreen\`
- \`QuotePreviewBlockedScreen\`
- \`QuotePreviewReferenceScreen\`
- \`QuotePreviewHumanReviewScreen\`

## Required 088B Shape

088B must implement a local/static/read-only safe screen composition registry.

## Final Decision

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$EVIDENCE_DOC_A" <<EOF
# Forge Quote Preview Safe Screen Composition Scope 088A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Evidence Summary

088A scopes safe screen composition only.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Screen Composition Scope

\`\`\`json
$(cat "$SCREEN_SCOPE_JSON")
\`\`\`

## Final

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$CERT_DOC_A" <<EOF
# Forge Quote Preview Safe Screen Composition Scope Certificate 088A

PHASE=$PHASE_A

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

088A certifies that safe screen composition has been scoped before visual layout spec.

$DECISION_A
EOF

cat > "$AUDIT_JSON_A" <<EOF
{
  "phase": "$PHASE_A",
  "status": "PASS",
  "decision": "$DECISION_A",
  "lockedDecision": "$LOCKED_A",
  "base": {
    "phase": "087D_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
  },
  "next": "$PHASE_B",
  "scopeType": "safe_screen_composition_scope_only",
  "screenCompositionScope": $(cat "$SCREEN_SCOPE_JSON"),
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "notAuthorized": {
    "screenRendering": false,
    "componentRendering": false,
    "uiMutation": false,
    "quoteTruthCreation": false,
    "quoteWrite": false,
    "backendConnection": false
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
## 088A Quote Preview Safe Screen Composition Scope

088A scopes safe screen composition for Quote Preview.

Locked decision:
\`$LOCKED_A\`

Scoped screen compositions:

- \`QuotePreviewEmptyScreen\`
- \`QuotePreviewIntakeScreen\`
- \`QuotePreviewBlockedScreen\`
- \`QuotePreviewReferenceScreen\`
- \`QuotePreviewHumanReviewScreen\`

088B must implement a local/static/read-only safe screen composition registry.

Boundaries:

- no screen rendering;
- no component rendering;
- no UI mutation;
- no quote truth creation;
- no quote write/send;
- no provider/backend connection.

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
run rg -n "$PHASE_A|$DECISION_A|$LOCKED_A|$PHASE_B|Safe Screen Composition|QuotePreviewReferenceScreen|QuotePreviewHumanReviewScreen|no screen rendering" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"

commit_allowed_subset \
  "docs: scope quote preview safe screen composition" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 088B IMPLEMENTATION
# -------------------------------------------------------------------
stage "088B IMPLEMENT ADAPTER"
mkdir -p "$(dirname "$ADAPTER")" "$(dirname "$TEST")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const ux = require('./quote-preview-safe-ux-state-model-registry-adapter-086b.js');
const components = require('./quote-preview-safe-ux-component-contract-registry-adapter-087b.js');

const ADAPTER_ID = 'forge.quote_preview.safe_screen_composition.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.safe_screen_composition.registry.v1';
const DOMAIN_ID = 'quote_preview_safe_screen_composition';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const COMPOSITION_KINDS = Object.freeze({
  EMPTY_STATE_SCREEN_COMPOSITION: 'empty_state_screen_composition',
  INTAKE_STATUS_SCREEN_COMPOSITION: 'intake_status_screen_composition',
  BLOCKED_WARNING_SCREEN_COMPOSITION: 'blocked_warning_screen_composition',
  REFERENCE_PREVIEW_SCREEN_COMPOSITION: 'reference_preview_screen_composition',
  HUMAN_REVIEW_SCREEN_COMPOSITION: 'human_review_screen_composition',
});

const LAYOUT_MODES = Object.freeze({
  DESKTOP_SINGLE_COLUMN: 'desktop_single_column',
  DESKTOP_TWO_COLUMN: 'desktop_two_column',
  TABLET_TWO_COLUMN: 'tablet_two_column',
  MOBILE_SINGLE_COLUMN: 'mobile_single_column',
});

const SAFE_ERROR_CODES = Object.freeze({
  SCREEN_COMPOSITION_NOT_MAPPED: 'QUOTE_PREVIEW_SCREEN_COMPOSITION_NOT_MAPPED',
  SCREEN_RENDERING_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_RENDERING_NOT_AUTHORIZED',
  COMPONENT_RENDERING_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_COMPONENT_RENDERING_NOT_AUTHORIZED',
  UI_MUTATION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_UI_MUTATION_NOT_AUTHORIZED',
  QUOTE_TRUTH_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_QUOTE_TRUTH_NOT_AUTHORIZED',
  WRITE_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_WRITE_NOT_AUTHORIZED',
  EXECUTION_NOT_AUTHORIZED: 'QUOTE_PREVIEW_SCREEN_EXECUTION_NOT_AUTHORIZED',
  PREVIEW_LABEL_REQUIRED: 'QUOTE_PREVIEW_SCREEN_PREVIEW_LABEL_REQUIRED',
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

const REQUIRED_SCREEN_COMPOSITION_FIELDS = Object.freeze([
  'composition_id',
  'screen_name',
  'composition_kind',
  'supported_state_ids',
  'layout_mode_refs',
  'slot_order',
  'primary_component_ids',
  'secondary_component_ids',
  'required_badges',
  'allowed_actions',
  'blocked_actions',
  'render_allowed',
  'ui_mutation_allowed',
  'quote_truth_allowed',
  'execution_allowed',
  'write_allowed',
  'safe_errors',
  'safety_flags',
]);

const ALL_BLOCKED_ACTIONS = Object.freeze([
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
  'call_banxico',
  'read_pdf',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function freezeComposition(composition) {
  return Object.freeze({
    ...composition,
    supported_state_ids: Object.freeze([...(composition.supported_state_ids || [])]),
    layout_mode_refs: Object.freeze([...(composition.layout_mode_refs || [])]),
    slot_order: Object.freeze([...(composition.slot_order || [])]),
    primary_component_ids: Object.freeze([...(composition.primary_component_ids || [])]),
    secondary_component_ids: Object.freeze([...(composition.secondary_component_ids || [])]),
    required_badges: Object.freeze([...(composition.required_badges || [])]),
    allowed_actions: Object.freeze([...(composition.allowed_actions || [])]),
    blocked_actions: Object.freeze([...(composition.blocked_actions || [])]),
    safe_errors: Object.freeze([...(composition.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(composition.safety_flags || {}) }),
  });
}

function buildComposition({
  compositionId,
  screenName,
  compositionKind,
  supportedStateIds,
  layoutModeRefs,
  slotOrder,
  primaryComponentIds,
  secondaryComponentIds,
  requiredBadges,
  allowedActions,
  blockedActions = ALL_BLOCKED_ACTIONS,
}) {
  return freezeComposition({
    composition_id: compositionId,
    screen_name: screenName,
    composition_kind: compositionKind,
    supported_state_ids: supportedStateIds,
    layout_mode_refs: layoutModeRefs,
    slot_order: slotOrder,
    primary_component_ids: primaryComponentIds,
    secondary_component_ids: secondaryComponentIds,
    required_badges: requiredBadges,
    allowed_actions: allowedActions,
    blocked_actions: blockedActions,
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false,
    safe_errors: [
      SAFE_ERROR_CODES.SCREEN_RENDERING_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.COMPONENT_RENDERING_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.UI_MUTATION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.WRITE_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.EXECUTION_NOT_AUTHORIZED,
      SAFE_ERROR_CODES.PREVIEW_LABEL_REQUIRED,
    ],
  });
}

const SCREEN_COMPOSITIONS = Object.freeze([
  buildComposition({
    compositionId: 'quote_preview_empty_screen',
    screenName: 'QuotePreviewEmptyScreen',
    compositionKind: COMPOSITION_KINDS.EMPTY_STATE_SCREEN_COMPOSITION,
    supportedStateIds: ['empty'],
    layoutModeRefs: [LAYOUT_MODES.DESKTOP_SINGLE_COLUMN, LAYOUT_MODES.MOBILE_SINGLE_COLUMN],
    slotOrder: ['shell', 'status', 'badges', 'action_bar'],
    primaryComponentIds: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_action_bar'],
    secondaryComponentIds: [],
    requiredBadges: ['preview', 'no_es_cotizacion'],
    allowedActions: ['view_empty_state'],
  }),
  buildComposition({
    compositionId: 'quote_preview_intake_screen',
    screenName: 'QuotePreviewIntakeScreen',
    compositionKind: COMPOSITION_KINDS.INTAKE_STATUS_SCREEN_COMPOSITION,
    supportedStateIds: ['pdf_candidate_detected', 'file_hash_not_verified'],
    layoutModeRefs: [LAYOUT_MODES.DESKTOP_TWO_COLUMN, LAYOUT_MODES.TABLET_TWO_COLUMN, LAYOUT_MODES.MOBILE_SINGLE_COLUMN],
    slotOrder: ['shell', 'status', 'badges', 'warning_stack', 'evidence_panel', 'action_bar'],
    primaryComponentIds: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_warning_stack', 'quote_preview_action_bar'],
    secondaryComponentIds: ['quote_preview_evidence_panel'],
    requiredBadges: ['preview', 'no_es_cotizacion', 'no_verificado'],
    allowedActions: ['view_reference_preview', 'open_evidence_panel'],
    blockedActions: ['issue_quote', 'send_quote', 'write_quote', 'read_pdf', 'run_parser', 'connect_backend'],
  }),
  buildComposition({
    compositionId: 'quote_preview_blocked_screen',
    screenName: 'QuotePreviewBlockedScreen',
    compositionKind: COMPOSITION_KINDS.BLOCKED_WARNING_SCREEN_COMPOSITION,
    supportedStateIds: ['source_trace_not_bound', 'parser_owner_decision_required', 'deterministic_inputs_not_verified', 'quote_truth_blocked'],
    layoutModeRefs: [LAYOUT_MODES.DESKTOP_TWO_COLUMN, LAYOUT_MODES.MOBILE_SINGLE_COLUMN],
    slotOrder: ['shell', 'status', 'badges', 'warning_stack', 'evidence_panel', 'human_review_card', 'action_bar'],
    primaryComponentIds: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_warning_stack', 'quote_preview_human_review_card', 'quote_preview_action_bar'],
    secondaryComponentIds: ['quote_preview_evidence_panel'],
    requiredBadges: ['preview', 'no_es_cotizacion', 'quote_truth_bloqueado'],
    allowedActions: ['open_evidence_panel', 'open_provenance_panel', 'request_human_review'],
  }),
  buildComposition({
    compositionId: 'quote_preview_reference_screen',
    screenName: 'QuotePreviewReferenceScreen',
    compositionKind: COMPOSITION_KINDS.REFERENCE_PREVIEW_SCREEN_COMPOSITION,
    supportedStateIds: ['preview_reference_available'],
    layoutModeRefs: [LAYOUT_MODES.DESKTOP_TWO_COLUMN, LAYOUT_MODES.TABLET_TWO_COLUMN, LAYOUT_MODES.MOBILE_SINGLE_COLUMN],
    slotOrder: ['shell', 'status', 'badges', 'value_table', 'evidence_panel', 'warning_stack', 'action_bar'],
    primaryComponentIds: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_value_table', 'quote_preview_action_bar'],
    secondaryComponentIds: ['quote_preview_evidence_panel', 'quote_preview_warning_stack'],
    requiredBadges: ['preview', 'no_es_cotizacion', 'no_verificado'],
    allowedActions: ['view_reference_preview', 'open_evidence_panel', 'open_provenance_panel', 'copy_preview_reference_summary'],
  }),
  buildComposition({
    compositionId: 'quote_preview_human_review_screen',
    screenName: 'QuotePreviewHumanReviewScreen',
    compositionKind: COMPOSITION_KINDS.HUMAN_REVIEW_SCREEN_COMPOSITION,
    supportedStateIds: ['ready_for_human_review'],
    layoutModeRefs: [LAYOUT_MODES.DESKTOP_TWO_COLUMN, LAYOUT_MODES.MOBILE_SINGLE_COLUMN],
    slotOrder: ['shell', 'status', 'badges', 'value_table', 'evidence_panel', 'human_review_card', 'action_bar'],
    primaryComponentIds: ['quote_preview_shell', 'quote_preview_status_card', 'quote_preview_badges_bar', 'quote_preview_value_table', 'quote_preview_human_review_card', 'quote_preview_action_bar'],
    secondaryComponentIds: ['quote_preview_evidence_panel'],
    requiredBadges: ['preview', 'no_es_cotizacion', 'requiere_revision_humana'],
    allowedActions: ['view_reference_preview', 'open_evidence_panel', 'open_provenance_panel', 'request_human_review', 'copy_preview_reference_summary'],
  }),
]);

function getSourceRefs() {
  const uxCatalog = ux.getQuotePreviewSafeUxStateModelRegistryCatalog();
  const componentCatalog = components.getQuotePreviewSafeUxComponentContractRegistryCatalog();
  return {
    safe_ux_state_model: {
      adapter_id: uxCatalog.adapter_id,
      schemaVersion: uxCatalog.schemaVersion,
      overall_ux_state_status: uxCatalog.overall_ux_state_status,
      state_count: uxCatalog.states.length,
    },
    safe_ux_component_contract: {
      adapter_id: componentCatalog.adapter_id,
      schemaVersion: componentCatalog.schemaVersion,
      overall_component_contract_status: componentCatalog.overall_component_contract_status,
      component_contract_count: componentCatalog.component_contracts.length,
    },
  };
}

function getQuotePreviewSafeScreenCompositionRegistryCatalog() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_safe_screen_composition_registry',
    overall_screen_composition_status: 'screen_compositions_mapped_no_render_no_effects',
    screen_rendering_allowed_in_registry: false,
    component_rendering_allowed_in_registry: false,
    ui_mutation_allowed_in_registry: false,
    quote_truth_allowed_in_registry: false,
    execution_allowed_in_registry: false,
    write_allowed_in_registry: false,
    quote_write_allowed_in_registry: false,
    crm_write_allowed_in_registry: false,
    policy_write_allowed_in_registry: false,
    pipeline_write_allowed_in_registry: false,
    provider_runtime_allowed_in_registry: false,
    backend_connection_allowed_in_registry: false,
    required_screen_composition_fields: [...REQUIRED_SCREEN_COMPOSITION_FIELDS],
    layout_modes: Object.values(LAYOUT_MODES),
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    screen_compositions: clone(SCREEN_COMPOSITIONS),
  };
}

function buildScreenCompositionSafeError(compositionId, code = SAFE_ERROR_CODES.SCREEN_COMPOSITION_NOT_MAPPED) {
  return {
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    readModelStatus: 'error',
    composition_id: compositionId || null,
    screen_name: null,
    composition_kind: null,
    supported_state_ids: [],
    layout_mode_refs: [],
    slot_order: [],
    primary_component_ids: [],
    secondary_component_ids: [],
    required_badges: ['no_es_cotizacion'],
    allowed_actions: [],
    blocked_actions: [...ALL_BLOCKED_ACTIONS],
    render_allowed: false,
    ui_mutation_allowed: false,
    quote_truth_allowed: false,
    execution_allowed: false,
    write_allowed: false,
    safe_errors: [code, SAFE_ERROR_CODES.SCREEN_RENDERING_NOT_AUTHORIZED, SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED, SAFE_ERROR_CODES.WRITE_NOT_AUTHORIZED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code,
      message: 'Screen composition is not mapped. Screen rendering, quote truth, execution, and writes are blocked.',
    },
  };
}

function getScreenCompositionById(compositionId) {
  const match = SCREEN_COMPOSITIONS.find((composition) => composition.composition_id === compositionId);
  return match ? clone(match) : buildScreenCompositionSafeError(compositionId);
}

function getScreenCompositionByName(screenName) {
  const match = SCREEN_COMPOSITIONS.find((composition) => composition.screen_name === screenName);
  return match ? clone(match) : buildScreenCompositionSafeError(screenName);
}

function getScreenCompositionsByStateId(stateId) {
  return clone(SCREEN_COMPOSITIONS.filter((composition) => composition.supported_state_ids.includes(stateId)));
}

function getScreenCompositionsByLayoutMode(layoutMode) {
  return clone(SCREEN_COMPOSITIONS.filter((composition) => composition.layout_mode_refs.includes(layoutMode)));
}

function getNonRenderingScreenCompositions() {
  return clone(SCREEN_COMPOSITIONS.filter((composition) => composition.render_allowed === false));
}

function getNonWritableScreenCompositions() {
  return clone(SCREEN_COMPOSITIONS.filter((composition) => composition.write_allowed === false));
}

function getQuoteTruthBlockedScreenCompositions() {
  return clone(SCREEN_COMPOSITIONS.filter((composition) => composition.quote_truth_allowed === false));
}

function validateScreenCompositionShape(composition) {
  const errors = [];
  if (!composition || typeof composition !== 'object') return { ok: false, valid: false, errors: ['screen_composition_object_required'] };

  for (const field of REQUIRED_SCREEN_COMPOSITION_FIELDS) {
    if (!(field in composition)) errors.push(`missing_${field}`);
  }

  if (composition.render_allowed !== false) errors.push('render_allowed_must_be_false');
  if (composition.ui_mutation_allowed !== false) errors.push('ui_mutation_allowed_must_be_false');
  if (composition.quote_truth_allowed !== false) errors.push('quote_truth_allowed_must_be_false');
  if (composition.execution_allowed !== false) errors.push('execution_allowed_must_be_false');
  if (composition.write_allowed !== false) errors.push('write_allowed_must_be_false');

  const badges = Array.isArray(composition.required_badges) ? composition.required_badges : [];
  if (!badges.includes('no_es_cotizacion')) errors.push('screen_composition_must_include_no_es_cotizacion_badge');

  for (const [key, value] of Object.entries(composition.safety_flags || {})) {
    if (value !== false) errors.push(`safety_flag_not_false_${key}`);
  }

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

function validateScreenCompositionRegistryCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object') return { ok: false, valid: false, errors: ['catalog_object_required'] };

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_screen_composition_status !== 'screen_compositions_mapped_no_render_no_effects') errors.push('overall_screen_composition_status_must_remain_no_effects');

  for (const flagName of [
    'screen_rendering_allowed_in_registry',
    'component_rendering_allowed_in_registry',
    'ui_mutation_allowed_in_registry',
    'quote_truth_allowed_in_registry',
    'execution_allowed_in_registry',
    'write_allowed_in_registry',
    'quote_write_allowed_in_registry',
    'crm_write_allowed_in_registry',
    'policy_write_allowed_in_registry',
    'pipeline_write_allowed_in_registry',
    'provider_runtime_allowed_in_registry',
    'backend_connection_allowed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  const compositions = Array.isArray(catalog.screen_compositions) ? catalog.screen_compositions : [];
  if (compositions.length !== 5) errors.push('five_screen_compositions_required');

  const componentCatalog = components.getQuotePreviewSafeUxComponentContractRegistryCatalog();
  const validComponentIds = new Set(componentCatalog.component_contracts.map((contract) => contract.component_id));
  const stateCatalog = ux.getQuotePreviewSafeUxStateModelRegistryCatalog();
  const validStateIds = new Set(stateCatalog.states.map((state) => state.state_id));

  for (const composition of compositions) {
    const result = validateScreenCompositionShape(composition);
    if (!result.ok) errors.push(...result.errors.map((error) => `${composition.composition_id || 'unknown'}:${error}`));

    for (const stateId of composition.supported_state_ids || []) {
      if (!validStateIds.has(stateId)) errors.push(`${composition.composition_id}:unknown_state_${stateId}`);
    }

    for (const componentId of [...(composition.primary_component_ids || []), ...(composition.secondary_component_ids || [])]) {
      if (!validComponentIds.has(componentId)) errors.push(`${composition.composition_id}:unknown_component_${componentId}`);
    }
  }

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  COMPOSITION_KINDS,
  LAYOUT_MODES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  REQUIRED_SCREEN_COMPOSITION_FIELDS,
  SCREEN_COMPOSITIONS,
  getQuotePreviewSafeScreenCompositionRegistryCatalog,
  getScreenCompositionById,
  getScreenCompositionByName,
  getScreenCompositionsByStateId,
  getScreenCompositionsByLayoutMode,
  getNonRenderingScreenCompositions,
  getNonWritableScreenCompositions,
  getQuoteTruthBlockedScreenCompositions,
  buildScreenCompositionSafeError,
  validateScreenCompositionShape,
  validateScreenCompositionRegistryCatalog,
};
NODE

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');

const adapter = require('../platform/adapters/quote-preview/quote-preview-safe-screen-composition-registry-adapter-088b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.safe_screen_composition.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.safe_screen_composition.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

const catalog = adapter.getQuotePreviewSafeScreenCompositionRegistryCatalog();

assert.equal(catalog.schemaVersion, adapter.SCHEMA_VERSION);
assert.equal(catalog.domainId, 'quote_preview_safe_screen_composition');
assert.equal(catalog.registry_type, 'local_static_read_only_safe_screen_composition_registry');
assert.equal(catalog.overall_screen_composition_status, 'screen_compositions_mapped_no_render_no_effects');
assert.equal(catalog.screen_compositions.length, 5);
assert.equal(adapter.validateScreenCompositionRegistryCatalog(catalog).ok, true);

for (const flag of [
  'screen_rendering_allowed_in_registry',
  'component_rendering_allowed_in_registry',
  'ui_mutation_allowed_in_registry',
  'quote_truth_allowed_in_registry',
  'execution_allowed_in_registry',
  'write_allowed_in_registry',
  'quote_write_allowed_in_registry',
  'crm_write_allowed_in_registry',
  'policy_write_allowed_in_registry',
  'pipeline_write_allowed_in_registry',
  'provider_runtime_allowed_in_registry',
  'backend_connection_allowed_in_registry',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const composition of catalog.screen_compositions) {
  for (const field of adapter.REQUIRED_SCREEN_COMPOSITION_FIELDS) assert(field in composition, `${composition.composition_id} missing ${field}`);
  assert.equal(composition.render_allowed, false);
  assert.equal(composition.ui_mutation_allowed, false);
  assert.equal(composition.quote_truth_allowed, false);
  assert.equal(composition.execution_allowed, false);
  assert.equal(composition.write_allowed, false);
  assert(composition.required_badges.includes('no_es_cotizacion'));
  assert(composition.safe_errors.includes(adapter.SAFE_ERROR_CODES.SCREEN_RENDERING_NOT_AUTHORIZED));
  assert(composition.safe_errors.includes(adapter.SAFE_ERROR_CODES.COMPONENT_RENDERING_NOT_AUTHORIZED));
  assert(composition.safe_errors.includes(adapter.SAFE_ERROR_CODES.QUOTE_TRUTH_NOT_AUTHORIZED));
  assert.equal(adapter.validateScreenCompositionShape(composition).ok, true);
}

assert.equal(adapter.getNonRenderingScreenCompositions().length, 5);
assert.equal(adapter.getNonWritableScreenCompositions().length, 5);
assert.equal(adapter.getQuoteTruthBlockedScreenCompositions().length, 5);

const reference = adapter.getScreenCompositionByName('QuotePreviewReferenceScreen');
assert.equal(reference.composition_id, 'quote_preview_reference_screen');
assert(reference.primary_component_ids.includes('quote_preview_value_table'));
assert(reference.secondary_component_ids.includes('quote_preview_evidence_panel'));
assert(reference.allowed_actions.includes('copy_preview_reference_summary'));
assert(reference.blocked_actions.includes('write_quote'));

const human = adapter.getScreenCompositionById('quote_preview_human_review_screen');
assert.equal(human.composition_kind, adapter.COMPOSITION_KINDS.HUMAN_REVIEW_SCREEN_COMPOSITION);
assert(human.primary_component_ids.includes('quote_preview_human_review_card'));
assert(human.required_badges.includes('requiere_revision_humana'));

const blocked = adapter.getScreenCompositionsByStateId('quote_truth_blocked');
assert.equal(blocked.length, 1);
assert.equal(blocked[0].composition_id, 'quote_preview_blocked_screen');

assert(adapter.getScreenCompositionsByLayoutMode(adapter.LAYOUT_MODES.MOBILE_SINGLE_COLUMN).length >= 5);
assert(adapter.getScreenCompositionsByLayoutMode(adapter.LAYOUT_MODES.DESKTOP_TWO_COLUMN).length >= 4);

const missing = adapter.getScreenCompositionById('missing_screen');
assert.equal(missing.readModelStatus, 'error');
assert.equal(missing.render_allowed, false);
assert.equal(missing.quote_truth_allowed, false);
assert.equal(missing.write_allowed, false);
assert(missing.safe_errors.includes(adapter.SAFE_ERROR_CODES.SCREEN_COMPOSITION_NOT_MAPPED));
assert.equal(adapter.validateScreenCompositionShape(missing).ok, true);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

for (const composition of catalog.screen_compositions) {
  for (const [key, value] of Object.entries(composition.safety_flags || {})) {
    assert.equal(value, false, `${composition.composition_id}.${key} must be false`);
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

console.log('PASS quote preview safe screen composition registry adapter 088B');
NODE

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "088B WRITE DOCS / EVIDENCE"
cat > "$ARCH_DOC_B" <<EOF
# Forge Quote Preview Safe Screen Composition Implementation 088B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Purpose

088B implements a local/static/read-only safe screen composition registry.

The registry defines screen composition contracts for Quote Preview. It does not render screens, render components, mutate UI, create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, or execute real effects.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Registry Status

\`screen_compositions_mapped_no_render_no_effects\`

## Screen Compositions

- \`QuotePreviewEmptyScreen\`
- \`QuotePreviewIntakeScreen\`
- \`QuotePreviewBlockedScreen\`
- \`QuotePreviewReferenceScreen\`
- \`QuotePreviewHumanReviewScreen\`

Every composition preserves:

- \`render_allowed=false\`
- \`ui_mutation_allowed=false\`
- \`quote_truth_allowed=false\`
- \`execution_allowed=false\`
- \`write_allowed=false\`

## Final Decision

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$EVIDENCE_DOC_B" <<EOF
# Forge Quote Preview Safe Screen Composition Implementation 088B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Evidence Summary

088B implements a local/static/read-only safe screen composition registry.

## Discovery Evidence

\`\`\`json
$(cat "$DISCOVERY_DIGEST_JSON")
\`\`\`

## Test Evidence

The focused test validates:

- adapter identity and schema;
- registry shape;
- five screen compositions exist;
- every composition blocks screen rendering, component rendering, UI mutation, quote truth, execution, and writes;
- reference screen includes value table and evidence panel;
- human review screen includes human review card;
- all compositions are mobile-safe by contract;
- all safety flags remain false.

## Final

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$CERT_DOC_B" <<EOF
# Forge Quote Preview Safe Screen Composition Implementation Certificate 088B

PHASE=$PHASE_B

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

088B certifies that Forge now has a local/static/read-only safe screen composition registry.

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
    "adapterId": "forge.quote_preview.safe_screen_composition.registry.adapter.v1",
    "schemaVersion": "forge.quote_preview.safe_screen_composition.registry.v1",
    "registryType": "local_static_read_only_safe_screen_composition_registry",
    "overallScreenCompositionStatus": "screen_compositions_mapped_no_render_no_effects",
    "screenRenderingIntroduced": false,
    "componentRenderingIntroduced": false,
    "uiMutationIntroduced": false,
    "quoteTruthCreationIntroduced": false,
    "providerRuntimeIntroduced": false,
    "backendConnectionIntroduced": false,
    "quoteWriteIntroduced": false
  },
  "discoveryEvidence": $(cat "$DISCOVERY_DIGEST_JSON"),
  "screenCompositions": {
    "count": 5,
    "allRenderingBlocked": true,
    "allUiMutationBlocked": true,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "referenceScreenHasValueTable": true,
    "humanReviewScreenHasHumanReviewCard": true
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
## 088B Quote Preview Safe Screen Composition Implementation

088B implements a local/static/read-only safe screen composition registry.

Locked decision:
\`$LOCKED_B\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

Registry status:

- \`screen_compositions_mapped_no_render_no_effects\`

Screen compositions:

- \`QuotePreviewEmptyScreen\`
- \`QuotePreviewIntakeScreen\`
- \`QuotePreviewBlockedScreen\`
- \`QuotePreviewReferenceScreen\`
- \`QuotePreviewHumanReviewScreen\`

Every composition preserves:

- \`render_allowed=false\`
- \`ui_mutation_allowed=false\`
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

stage "088B VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_B"
run rg -n "$PHASE_B|$DECISION_B|$LOCKED_B|$PHASE_C|screen_compositions_mapped_no_render_no_effects|QuotePreviewReferenceScreen|render_allowed=false|write_allowed=false" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "feat: implement quote preview safe screen composition registry" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ADAPTER" "$TEST" "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 088C QA
# -------------------------------------------------------------------
stage "088C SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const screens = require("./platform/adapters/quote-preview/quote-preview-safe-screen-composition-registry-adapter-088b.js");

const catalog = screens.getQuotePreviewSafeScreenCompositionRegistryCatalog();
assert.equal(catalog.overall_screen_composition_status, "screen_compositions_mapped_no_render_no_effects");
assert.equal(screens.validateScreenCompositionRegistryCatalog(catalog).ok, true);
assert.equal(catalog.screen_compositions.length, 5);
assert.equal(screens.getNonRenderingScreenCompositions().length, 5);
assert.equal(screens.getNonWritableScreenCompositions().length, 5);
assert.equal(screens.getQuoteTruthBlockedScreenCompositions().length, 5);

for (const composition of catalog.screen_compositions) {
  assert.equal(composition.render_allowed, false);
  assert.equal(composition.ui_mutation_allowed, false);
  assert.equal(composition.quote_truth_allowed, false);
  assert.equal(composition.execution_allowed, false);
  assert.equal(composition.write_allowed, false);
  assert.equal(screens.validateScreenCompositionShape(composition).ok, true);
}

assert.equal(screens.getScreenCompositionByName("QuotePreviewReferenceScreen").primary_component_ids.includes("quote_preview_value_table"), true);
assert.equal(screens.getScreenCompositionByName("QuotePreviewReferenceScreen").secondary_component_ids.includes("quote_preview_evidence_panel"), true);
assert.equal(screens.getScreenCompositionByName("QuotePreviewHumanReviewScreen").primary_component_ids.includes("quote_preview_human_review_card"), true);
assert.equal(screens.getScreenCompositionsByStateId("quote_truth_blocked").length, 1);
assert.equal(screens.getScreenCompositionsByLayoutMode(screens.LAYOUT_MODES.MOBILE_SINGLE_COLUMN).length, 5);

for (const [key, value] of Object.entries(screens.DEFAULT_SAFETY_FLAGS || {})) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

console.log(JSON.stringify({
  status: "PASS",
  catalogValidated: true,
  screenCompositionCount: catalog.screen_compositions.length,
  nonRenderingCompositionCount: screens.getNonRenderingScreenCompositions().length,
  nonWritableCompositionCount: screens.getNonWritableScreenCompositions().length,
  quoteTruthBlockedCompositionCount: screens.getQuoteTruthBlockedScreenCompositions().length,
  referenceScreenHasValueTable: true,
  humanReviewScreenHasHumanReviewCard: true,
  mobileCompositionCoverage: screens.getScreenCompositionsByLayoutMode(screens.LAYOUT_MODES.MOBILE_SINGLE_COLUMN).length,
  allSafetyFlagsFalse: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"

cat > "$ARCH_DOC_C" <<EOF
# Forge Quote Preview Safe Screen Composition QA Lock 088C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Purpose

088C QA locks the 088B safe screen composition registry.

## QA Validated

- registry shape validates;
- five screen compositions exist;
- every composition blocks screen rendering;
- every composition blocks UI mutation;
- every composition blocks quote truth;
- every composition blocks execution;
- every composition blocks writes;
- reference screen includes value table and evidence panel;
- human review screen includes human review card;
- mobile composition coverage exists;
- all safety flags remain false.

## Final Decision

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$EVIDENCE_DOC_C" <<EOF
# Forge Quote Preview Safe Screen Composition QA Lock 088C

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
# Forge Quote Preview Safe Screen Composition QA Lock Certificate 088C

PHASE=$PHASE_C

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

088C certifies that safe screen composition registry is QA locked.

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
    "screenCompositionCount": 5,
    "allRenderingBlocked": true,
    "allUiMutationBlocked": true,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "referenceScreenHasValueTable": true,
    "humanReviewScreenHasHumanReviewCard": true,
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
## 088C Quote Preview Safe Screen Composition QA Lock

088C QA locks the 088B safe screen composition registry.

Locked decision:
\`$LOCKED_C\`

QA validated:

- registry shape validates;
- five screen compositions exist;
- every composition blocks screen rendering;
- every composition blocks UI mutation;
- every composition blocks quote truth;
- every composition blocks execution;
- every composition blocks writes;
- reference screen includes value table and evidence panel;
- human review screen includes human review card;
- mobile composition coverage exists;
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

stage "088C VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_C"
run rg -n "$PHASE_C|$DECISION_C|$LOCKED_C|$PHASE_D|QA locks|five screen compositions|reference screen includes value table|human review screen" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe screen composition qa" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 088D DECISION
# -------------------------------------------------------------------
stage "088D DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const screens = require("./platform/adapters/quote-preview/quote-preview-safe-screen-composition-registry-adapter-088b.js");

const catalog = screens.getQuotePreviewSafeScreenCompositionRegistryCatalog();
assert.equal(catalog.overall_screen_composition_status, "screen_compositions_mapped_no_render_no_effects");
assert.equal(screens.validateScreenCompositionRegistryCatalog(catalog).ok, true);
assert.equal(catalog.screen_compositions.length, 5);
assert.equal(screens.getNonRenderingScreenCompositions().length, 5);
assert.equal(screens.getNonWritableScreenCompositions().length, 5);
assert.equal(screens.getQuoteTruthBlockedScreenCompositions().length, 5);

for (const composition of catalog.screen_compositions) {
  assert.equal(composition.render_allowed, false);
  assert.equal(composition.ui_mutation_allowed, false);
  assert.equal(composition.quote_truth_allowed, false);
  assert.equal(composition.execution_allowed, false);
  assert.equal(composition.write_allowed, false);
}

console.log(JSON.stringify({
  status: "PASS",
  locked_as: "local_static_read_only_reference_registry",
  overall_screen_composition_status: catalog.overall_screen_composition_status,
  screen_composition_count: catalog.screen_compositions.length,
  non_rendering_composition_count: screens.getNonRenderingScreenCompositions().length,
  non_writable_composition_count: screens.getNonWritableScreenCompositions().length,
  quote_truth_blocked_composition_count: screens.getQuoteTruthBlockedScreenCompositions().length,
  next_scope: "089A_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE",
  all_safety_flags_false: true
}, null, 2));
NODE

cat "$DECISION_QA_JSON"

cat > "$ARCH_DOC_D" <<EOF
# Forge Quote Preview Safe Screen Composition Decision Lock 088D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Purpose

088D decision-locks the 088B/088C safe screen composition registry as a local/static/read-only reference registry.

## Locked Meaning

The registry is approved only as:

- local/static;
- read-only;
- safe screen composition reference model;
- no screen rendering;
- no component rendering;
- no UI mutation;
- no quote truth;
- no execution;
- no writes.

## Confirmed

- five screen compositions exist;
- every composition blocks screen rendering;
- every composition blocks UI mutation;
- every composition blocks quote truth;
- every composition blocks execution;
- every composition blocks writes;
- reference screen includes value table and evidence panel;
- human review screen includes human review card.

## Next Architectural Unlock

089A may scope safe visual layout spec for Quote Preview.

089A must not execute tests, read PDFs, run OCR, run parsers, run calculators, call Banxico/providers, connect backend, write quotes, mutate UI, render components/screens, or create real effects.

## Final Decision

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$EVIDENCE_DOC_D" <<EOF
# Forge Quote Preview Safe Screen Composition Decision Lock 088D

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
# Forge Quote Preview Safe Screen Composition Decision Lock Certificate 088D

PHASE=$PHASE_D

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

088D certifies that safe screen composition registry is locked as local/static/read-only reference registry.

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
    "screenCompositionCount": 5,
    "allRenderingBlocked": true,
    "allUiMutationBlocked": true,
    "allQuoteTruthBlocked": true,
    "allExecutionBlocked": true,
    "allWritesBlocked": true,
    "referenceScreenHasValueTable": true,
    "humanReviewScreenHasHumanReviewCard": true,
    "allSafetyFlagsFalse": true
  },
  "nextScope": {
    "phase": "$NEXT_AFTER_D",
    "purpose": "quote_preview_safe_visual_layout_spec_scope",
    "executionAllowed": false,
    "uiMutationAllowed": false,
    "screenRenderingAllowed": false
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
## 088D Quote Preview Safe Screen Composition Decision Lock

088D decision-locks the 088B/088C safe screen composition registry as a local/static/read-only reference registry.

Locked decision:
\`$LOCKED_D\`

Confirmed:

- five screen compositions exist;
- every composition blocks screen rendering;
- every composition blocks UI mutation;
- every composition blocks quote truth;
- every composition blocks execution;
- every composition blocks writes;
- reference screen includes value table and evidence panel;
- human review screen includes human review card.

Next:

- \`$NEXT_AFTER_D\` may scope safe visual layout spec.
- No screen rendering, component rendering, UI mutation, or execution is authorized.

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
<!-- FORGE:$PHASE_D:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_D" "$TREE_BLOCK_D"
done
trim_tree_files

stage "088D VALIDATION / COMMIT"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_D"
run rg -n "$PHASE_D|$DECISION_D|$LOCKED_D|$NEXT_AFTER_D|Safe Screen Composition|decision-locks|safe visual layout spec|No screen rendering" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe screen composition decision" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -16

SUMMARY=$(cat <<EOF
PASS_088ABCD_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_FAST_TRACK_COMMIT_PUSH_COMPLETE
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
