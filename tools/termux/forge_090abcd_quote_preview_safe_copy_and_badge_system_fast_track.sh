#!/usr/bin/env bash
set -euo pipefail

CHAIN="090ABCD_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_FAST_TRACK"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/090abcd-safe-copy-and-badge-system-fast-track-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_090abcd_quote_preview_safe_copy_and_badge_system_fast_track.sh"

PHASE_A="090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE"
DECISION_A="PASS_090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE"
LOCKED_A="QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPED"

PHASE_B="090B_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_IMPLEMENTATION"
DECISION_B="PASS_090B_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_IMPLEMENTATION"
LOCKED_B="QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_LOCAL_STATIC_READ_ONLY_IMPLEMENTED"

PHASE_C="090C_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCK"
DECISION_C="PASS_090C_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCK"
LOCKED_C="QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCKED"

PHASE_D="090D_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_DECISION_LOCK"
DECISION_D="PASS_090D_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_DECISION_LOCK"
LOCKED_D="QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
NEXT_AFTER_D="091A_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPE"

BOUNDARY="copy/badge registry only; no UI mutation; no component rendering; no screen rendering; no CSS injection; no DOM writes; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no quote truth creation; no quote issuance; no quote send; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator"

VISUAL_ADAPTER="platform/adapters/quote-preview/quote-preview-safe-visual-layout-spec-registry-adapter-089b.js"
VISUAL_TEST="tests/quote-preview-safe-visual-layout-spec-registry-adapter-089b-test.js"

ADAPTER="platform/adapters/quote-preview/quote-preview-safe-copy-badge-system-registry-adapter-090b.js"
TEST="tests/quote-preview-safe-copy-badge-system-registry-adapter-090b-test.js"

ARCH_DOC_A="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE_090A.md"
EVIDENCE_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE_090A.md"
CERT_DOC_A="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE_CERTIFICATE_090A.md"
AUDIT_JSON_A="docs/evidence/forge-quote-preview-safe-copy-and-badge-system-scope-audit-090a.json"

ARCH_DOC_B="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_IMPLEMENTATION_090B.md"
EVIDENCE_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_IMPLEMENTATION_090B.md"
CERT_DOC_B="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_IMPLEMENTATION_CERTIFICATE_090B.md"
AUDIT_JSON_B="docs/evidence/forge-quote-preview-safe-copy-and-badge-system-implementation-audit-090b.json"

ARCH_DOC_C="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCK_090C.md"
EVIDENCE_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCK_090C.md"
CERT_DOC_C="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_QA_LOCK_CERTIFICATE_090C.md"
AUDIT_JSON_C="docs/evidence/forge-quote-preview-safe-copy-and-badge-system-qa-audit-090c.json"

ARCH_DOC_D="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_DECISION_LOCK_090D.md"
EVIDENCE_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_DECISION_LOCK_090D.md"
CERT_DOC_D="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_DECISION_LOCK_CERTIFICATE_090D.md"
AUDIT_JSON_D="docs/evidence/forge-quote-preview-safe-copy-and-badge-system-decision-audit-090d.json"

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${CHAIN}" | tee -a "$REPORT"; echo "REPORT=$REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

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
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|renderAllowed\s*:\s*true|screenRenderAllowed\s*:\s*true|componentRenderAllowed\s*:\s*true|uiMutationAllowed\s*:\s*true|cssInjectionAllowed\s*:\s*true|domWriteAllowed\s*:\s*true|writeAllowed\s*:\s*true|quoteTruthAllowed\s*:\s*true|providerRuntimeAllowed\s*:\s*true|backendConnectionAllowed\s*:\s*true|officialQuoteAllowed\s*:\s*true|sendAllowed\s*:\s*true|crmWriteAllowed\s*:\s*true|calendarCreateAllowed\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/write/ui/render/css/copy marker"
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
echo "ROBOCOP_GATE=Article 0; 089R reconciled visual layout with templates; copy and badge system only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -18
run git diff --name-status
run git diff --cached --name-status
run git reset

stage "STAGE 2 CONFIRM BASE 089R"
if git log --oneline -300 | grep -Eq "089R|reconcile quote preview visual layout spec with design templates|QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES"; then
  pass "089R reconciliation base found in git log"
elif [ -f "docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json" ]; then
  pass "089R audit fallback found"
else
  fail "089R base not found. Run 089R repair first."
fi

REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$VISUAL_ADAPTER"
  "$VISUAL_TEST"
  "docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json"
)
for f in "${REQUIRED_FILES[@]}"; do [ -f "$f" ] || fail "Missing required file: $f"; pass "$f"; done

run python3 -m json.tool docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json
if ! rg -n '"next"\s*:\s*"090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE"|QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES' docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json >/dev/null; then
  fail "089R audit does not confirm NEXT 090A / reconciliation lock"
fi
pass "089R audit confirms NEXT 090A"

stage "STAGE 3 BACKUP"
mkdir -p "$BACKUP_DIR"
for f in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$VISUAL_ADAPTER" "$VISUAL_TEST"; do
  cp "$f" "$BACKUP_DIR/$(echo "$f" | tr '/ ' '__')"
done
pass "$BACKUP_DIR"

stage "STAGE 4 BASE VALIDATION"
run node --check "$VISUAL_ADAPTER"
run node --check "$VISUAL_TEST"
run node "$VISUAL_TEST"

mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
run bash -n "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 090A SCOPE
# -------------------------------------------------------------------
stage "090A BUILD SCOPE"
COPY_SCOPE_JSON="$(mktemp)"
node <<'NODE' > "$COPY_SCOPE_JSON"
const visual = require('./platform/adapters/quote-preview/quote-preview-safe-visual-layout-spec-registry-adapter-089b.js');
const visualCatalog = visual.getQuotePreviewSafeVisualLayoutSpecRegistryCatalog();

const badgeScope = [
  { badge_id: 'preview', label: 'Preview', tone: 'cyan', meaning: 'Reference preview only.' },
  { badge_id: 'read_only', label: 'Solo lectura', tone: 'blue', meaning: 'No writes are allowed.' },
  { badge_id: 'human_review_required', label: 'Revisión humana', tone: 'gold', meaning: 'Human review is required before any real action.' },
  { badge_id: 'not_official_quote', label: 'No cotización oficial', tone: 'gold', meaning: 'This is not an official quote.' },
  { badge_id: 'no_send', label: 'Sin envío', tone: 'neutral', meaning: 'No message send is allowed.' },
  { badge_id: 'no_crm', label: 'Sin CRM', tone: 'neutral', meaning: 'No CRM write is allowed.' },
  { badge_id: 'no_calendar', label: 'Sin calendario', tone: 'neutral', meaning: 'No calendar creation is allowed.' },
  { badge_id: 'source_not_bound', label: 'Fuente no vinculada', tone: 'warning', meaning: 'Source trace is not bound.' },
  { badge_id: 'hash_not_verified', label: 'Hash no verificado', tone: 'warning', meaning: 'File hash is not verified.' },
  { badge_id: 'quote_truth_blocked', label: 'Quote truth bloqueado', tone: 'danger', meaning: 'Quote truth cannot be created here.' }
];

const copyScope = [
  { copy_id: 'preview_disclaimer_primary', text: 'Este preview es solo una referencia operativa. No es una cotización oficial.', usage: 'status_and_reference_cards' },
  { copy_id: 'human_review_required', text: 'Requiere revisión humana antes de cualquier acción real.', usage: 'human_review_card' },
  { copy_id: 'no_effects_boundary', text: 'Sin envío, sin CRM, sin calendario y sin cambios reales.', usage: 'action_bar_boundary' },
  { copy_id: 'blocked_quote_truth', text: 'La verdad de cotización está bloqueada hasta que una fuente autorizada la confirme.', usage: 'blocked_screen' },
  { copy_id: 'source_trace_missing', text: 'Falta vincular la fuente antes de confiar en este preview.', usage: 'warning_stack' },
  { copy_id: 'safe_prepare_preview_cta', text: 'Preparar preview', usage: 'primary_cta' },
  { copy_id: 'safe_request_review_cta', text: 'Solicitar revisión humana', usage: 'human_review_cta' }
];

const scope = {
  status: 'PASS',
  phase: '090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE',
  scope_type: 'safe_copy_and_badge_system_scope_only',
  visual_layout_status_before_090a: visualCatalog.overall_visual_layout_spec_status,
  visual_reconciliation_source_refs_bound: Boolean(visualCatalog.design_template_source_refs && visualCatalog.desktop_template_source_refs && visualCatalog.mobile_template_source_refs),
  badge_scope_count: badgeScope.length,
  copy_scope_count: copyScope.length,
  badge_scope: badgeScope,
  copy_scope: copyScope,
  required_090b_output: {
    adapter_type: 'local_static_read_only_safe_copy_badge_system_registry',
    must_not_render_screen: true,
    must_not_mutate_ui: true,
    must_not_inject_css: true,
    must_not_create_quote_truth: true,
    must_not_imply_official_quote: true,
    must_not_imply_send: true,
    must_not_imply_crm_write: true,
    must_not_imply_calendar_create: true
  },
  next_decision_after_090d: 'quote_preview_safe_ui_implementation_scope',
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

if (scope.visual_layout_status_before_090a !== 'visual_layout_specs_mapped_no_render_no_effects') throw new Error('090A requires 089R/089D visual layout status');
if (scope.visual_reconciliation_source_refs_bound !== true) throw new Error('090A requires 089R template source refs');
console.log(JSON.stringify(scope, null, 2));
NODE

cat "$COPY_SCOPE_JSON"

stage "090A WRITE DOCS / EVIDENCE"
mkdir -p "$(dirname "$ARCH_DOC_A")" "$(dirname "$EVIDENCE_DOC_A")"

cat > "$ARCH_DOC_A" <<EOF
# Forge Quote Preview Safe Copy and Badge System Scope 090A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Purpose

090A scopes the safe copy and badge system for Quote Preview.

This phase follows 089R, where the visual layout spec was reconciled with canonical Forge desktop/mobile design templates.

## Important Boundary

090A does not render screens, render components, mutate UI, inject CSS, write DOM, create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or execute real tests.

090A only scopes copy and badges that make the preview boundary visible.

## Required Badges

- Preview
- Solo lectura
- Revisión humana
- No cotización oficial
- Sin envío
- Sin CRM
- Sin calendario
- Fuente no vinculada
- Hash no verificado
- Quote truth bloqueado

## Required Copy Rules

- Never imply official quote.
- Never imply send.
- Never imply CRM write.
- Never imply calendar creation.
- Always preserve preview/read-only/human-review boundary where risk exists.

## Final Decision

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$EVIDENCE_DOC_A" <<EOF
# Forge Quote Preview Safe Copy and Badge System Scope Evidence 090A

PHASE=$PHASE_A

STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

## Copy and Badge Scope

\`\`\`json
$(cat "$COPY_SCOPE_JSON")
\`\`\`

## Final

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
EOF

cat > "$CERT_DOC_A" <<EOF
# Forge Quote Preview Safe Copy and Badge System Scope Certificate 090A

PHASE=$PHASE_A

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B

090A certifies that safe copy and badges have been scoped.

$DECISION_A
EOF

cat > "$AUDIT_JSON_A" <<EOF
{
  "phase": "$PHASE_A",
  "status": "PASS",
  "decision": "$DECISION_A",
  "lockedDecision": "$LOCKED_A",
  "base": {
    "phase": "089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES"
  },
  "next": "$PHASE_B",
  "scopeType": "safe_copy_and_badge_system_scope_only",
  "copyBadgeScope": $(cat "$COPY_SCOPE_JSON"),
  "notAuthorized": {
    "screenRendering": false,
    "componentRendering": false,
    "uiMutation": false,
    "cssInjection": false,
    "domWrite": false,
    "quoteTruthCreation": false,
    "officialQuoteClaim": false,
    "sendClaim": false,
    "crmWriteClaim": false,
    "calendarCreateClaim": false
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
## 090A Quote Preview Safe Copy and Badge System Scope

090A scopes the safe copy and badge system for Quote Preview.

Locked decision:
\`$LOCKED_A\`

Required badges:

- Preview
- Solo lectura
- Revisión humana
- No cotización oficial
- Sin envío
- Sin CRM
- Sin calendario
- Fuente no vinculada
- Hash no verificado
- Quote truth bloqueado

Required copy rules:

- never imply official quote;
- never imply send;
- never imply CRM write;
- never imply calendar creation;
- always preserve preview/read-only/human-review boundary.

DECISION=$DECISION_A

LOCKED_DECISION=$LOCKED_A

NEXT=$PHASE_B
<!-- FORGE:$PHASE_A:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_A" "$TREE_BLOCK_A"
done
trim_tree_files

run python3 -m json.tool "$AUDIT_JSON_A"
run rg -n "$PHASE_A|$DECISION_A|$LOCKED_A|$PHASE_B|No cotización oficial|Sin envío|Sin CRM|Sin calendario|never imply official quote" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A"

commit_allowed_subset \
  "docs: scope quote preview safe copy and badge system" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_A" "$EVIDENCE_DOC_A" "$CERT_DOC_A" "$AUDIT_JSON_A" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 090B IMPLEMENTATION
# -------------------------------------------------------------------
stage "090B IMPLEMENT ADAPTER"
mkdir -p "$(dirname "$ADAPTER")" "$(dirname "$TEST")"

cat > "$ADAPTER" <<'NODE'
'use strict';

const visual = require('./quote-preview-safe-visual-layout-spec-registry-adapter-089b.js');

const ADAPTER_ID = 'forge.quote_preview.safe_copy_badge_system.registry.adapter.v1';
const SCHEMA_VERSION = 'forge.quote_preview.safe_copy_badge_system.registry.v1';
const DOMAIN_ID = 'quote_preview_safe_copy_badge_system';
const MODE = 'read_only';
const ROUTE_CLASS = 'preview_safe';

const BADGE_TONES = Object.freeze({
  CYAN: 'cyan',
  BLUE: 'blue',
  GOLD: 'gold',
  NEUTRAL: 'neutral',
  WARNING: 'warning',
  DANGER: 'danger',
});

const SAFE_ERROR_CODES = Object.freeze({
  COPY_BADGE_NOT_MAPPED: 'QUOTE_PREVIEW_COPY_BADGE_NOT_MAPPED',
  OFFICIAL_QUOTE_LANGUAGE_NOT_ALLOWED: 'QUOTE_PREVIEW_OFFICIAL_QUOTE_LANGUAGE_NOT_ALLOWED',
  SEND_LANGUAGE_NOT_ALLOWED: 'QUOTE_PREVIEW_SEND_LANGUAGE_NOT_ALLOWED',
  CRM_WRITE_LANGUAGE_NOT_ALLOWED: 'QUOTE_PREVIEW_CRM_WRITE_LANGUAGE_NOT_ALLOWED',
  CALENDAR_CREATE_LANGUAGE_NOT_ALLOWED: 'QUOTE_PREVIEW_CALENDAR_CREATE_LANGUAGE_NOT_ALLOWED',
  QUOTE_TRUTH_LANGUAGE_BLOCKED: 'QUOTE_PREVIEW_QUOTE_TRUTH_LANGUAGE_BLOCKED',
  EFFECT_LANGUAGE_BLOCKED: 'QUOTE_PREVIEW_EFFECT_LANGUAGE_BLOCKED',
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

const FORBIDDEN_COPY_PATTERNS = Object.freeze([
  /\bcotizaci[oó]n oficial lista\b/i,
  /\benviar ahora\b/i,
  /\bguardar en crm\b/i,
  /\bcrear evento\b/i,
  /\bagendar autom[aá]ticamente\b/i,
  /\bemitir cotizaci[oó]n\b/i,
  /\bcotizaci[oó]n verificada\b/i,
  /\bprecio confirmado\b/i,
]);

const REQUIRED_BADGE_FIELDS = Object.freeze([
  'badge_id',
  'label',
  'tone',
  'meaning',
  'required_when',
  'official_quote_allowed',
  'send_allowed',
  'crm_write_allowed',
  'calendar_create_allowed',
  'quote_truth_allowed',
  'write_allowed',
  'safety_flags',
]);

const REQUIRED_COPY_FIELDS = Object.freeze([
  'copy_id',
  'text',
  'usage',
  'required_badge_ids',
  'official_quote_allowed',
  'send_allowed',
  'crm_write_allowed',
  'calendar_create_allowed',
  'quote_truth_allowed',
  'write_allowed',
  'safe_errors',
  'safety_flags',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function freezeBadge(badge) {
  return Object.freeze({
    ...badge,
    required_when: Object.freeze([...(badge.required_when || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(badge.safety_flags || {}) }),
  });
}

function freezeCopy(copy) {
  return Object.freeze({
    ...copy,
    required_badge_ids: Object.freeze([...(copy.required_badge_ids || [])]),
    safe_errors: Object.freeze([...(copy.safe_errors || [])]),
    safety_flags: Object.freeze({ ...DEFAULT_SAFETY_FLAGS, ...(copy.safety_flags || {}) }),
  });
}

function buildBadge({ badgeId, label, tone, meaning, requiredWhen }) {
  return freezeBadge({
    badge_id: badgeId,
    label,
    tone,
    meaning,
    required_when: requiredWhen,
    official_quote_allowed: false,
    send_allowed: false,
    crm_write_allowed: false,
    calendar_create_allowed: false,
    quote_truth_allowed: false,
    write_allowed: false,
    safety_flags: DEFAULT_SAFETY_FLAGS,
  });
}

function buildCopy({ copyId, text, usage, requiredBadgeIds }) {
  return freezeCopy({
    copy_id: copyId,
    text,
    usage,
    required_badge_ids: requiredBadgeIds,
    official_quote_allowed: false,
    send_allowed: false,
    crm_write_allowed: false,
    calendar_create_allowed: false,
    quote_truth_allowed: false,
    write_allowed: false,
    safe_errors: [
      SAFE_ERROR_CODES.OFFICIAL_QUOTE_LANGUAGE_NOT_ALLOWED,
      SAFE_ERROR_CODES.SEND_LANGUAGE_NOT_ALLOWED,
      SAFE_ERROR_CODES.CRM_WRITE_LANGUAGE_NOT_ALLOWED,
      SAFE_ERROR_CODES.CALENDAR_CREATE_LANGUAGE_NOT_ALLOWED,
      SAFE_ERROR_CODES.QUOTE_TRUTH_LANGUAGE_BLOCKED,
      SAFE_ERROR_CODES.EFFECT_LANGUAGE_BLOCKED,
    ],
    safety_flags: DEFAULT_SAFETY_FLAGS,
  });
}

const BADGES = Object.freeze([
  buildBadge({ badgeId: 'preview', label: 'Preview', tone: BADGE_TONES.CYAN, meaning: 'Reference preview only.', requiredWhen: ['all_quote_preview_surfaces'] }),
  buildBadge({ badgeId: 'read_only', label: 'Solo lectura', tone: BADGE_TONES.BLUE, meaning: 'No writes are allowed.', requiredWhen: ['all_quote_preview_surfaces'] }),
  buildBadge({ badgeId: 'human_review_required', label: 'Revisión humana', tone: BADGE_TONES.GOLD, meaning: 'Human review required before any real action.', requiredWhen: ['ready_for_human_review', 'quote_truth_blocked'] }),
  buildBadge({ badgeId: 'not_official_quote', label: 'No cotización oficial', tone: BADGE_TONES.GOLD, meaning: 'Not an official quote.', requiredWhen: ['all_quote_preview_surfaces'] }),
  buildBadge({ badgeId: 'no_send', label: 'Sin envío', tone: BADGE_TONES.NEUTRAL, meaning: 'No message sending is allowed.', requiredWhen: ['action_bar', 'command_bar'] }),
  buildBadge({ badgeId: 'no_crm', label: 'Sin CRM', tone: BADGE_TONES.NEUTRAL, meaning: 'No CRM write is allowed.', requiredWhen: ['action_bar', 'command_bar'] }),
  buildBadge({ badgeId: 'no_calendar', label: 'Sin calendario', tone: BADGE_TONES.NEUTRAL, meaning: 'No calendar event creation is allowed.', requiredWhen: ['action_bar', 'command_bar'] }),
  buildBadge({ badgeId: 'source_not_bound', label: 'Fuente no vinculada', tone: BADGE_TONES.WARNING, meaning: 'Source trace is not bound.', requiredWhen: ['source_trace_not_bound'] }),
  buildBadge({ badgeId: 'hash_not_verified', label: 'Hash no verificado', tone: BADGE_TONES.WARNING, meaning: 'File hash is not verified.', requiredWhen: ['file_hash_not_verified'] }),
  buildBadge({ badgeId: 'quote_truth_blocked', label: 'Quote truth bloqueado', tone: BADGE_TONES.DANGER, meaning: 'Quote truth cannot be created here.', requiredWhen: ['quote_truth_blocked'] }),
]);

const COPY_BLOCKS = Object.freeze([
  buildCopy({
    copyId: 'preview_disclaimer_primary',
    text: 'Este preview es solo una referencia operativa. No es una cotización oficial.',
    usage: 'status_and_reference_cards',
    requiredBadgeIds: ['preview', 'read_only', 'not_official_quote'],
  }),
  buildCopy({
    copyId: 'human_review_required',
    text: 'Requiere revisión humana antes de cualquier acción real.',
    usage: 'human_review_card',
    requiredBadgeIds: ['preview', 'human_review_required', 'not_official_quote'],
  }),
  buildCopy({
    copyId: 'no_effects_boundary',
    text: 'Sin envío, sin CRM, sin calendario y sin cambios reales.',
    usage: 'action_bar_boundary',
    requiredBadgeIds: ['preview', 'read_only', 'no_send', 'no_crm', 'no_calendar'],
  }),
  buildCopy({
    copyId: 'blocked_quote_truth',
    text: 'La verdad de cotización está bloqueada hasta que una fuente autorizada la confirme.',
    usage: 'blocked_screen',
    requiredBadgeIds: ['preview', 'not_official_quote', 'quote_truth_blocked', 'human_review_required'],
  }),
  buildCopy({
    copyId: 'source_trace_missing',
    text: 'Falta vincular la fuente antes de confiar en este preview.',
    usage: 'warning_stack',
    requiredBadgeIds: ['preview', 'source_not_bound', 'not_official_quote'],
  }),
  buildCopy({
    copyId: 'safe_prepare_preview_cta',
    text: 'Preparar preview',
    usage: 'primary_cta',
    requiredBadgeIds: ['preview', 'read_only'],
  }),
  buildCopy({
    copyId: 'safe_request_review_cta',
    text: 'Solicitar revisión humana',
    usage: 'human_review_cta',
    requiredBadgeIds: ['preview', 'human_review_required'],
  }),
]);

function getSourceRefs() {
  const visualCatalog = visual.getQuotePreviewSafeVisualLayoutSpecRegistryCatalog();
  return {
    safe_visual_layout_spec: {
      adapter_id: visualCatalog.adapter_id,
      schemaVersion: visualCatalog.schemaVersion,
      overall_visual_layout_spec_status: visualCatalog.overall_visual_layout_spec_status,
      visual_layout_spec_count: visualCatalog.visual_layout_specs.length,
      template_reconciled: Boolean(visualCatalog.design_template_source_refs && visualCatalog.desktop_template_source_refs && visualCatalog.mobile_template_source_refs),
    },
  };
}

function getQuotePreviewSafeCopyBadgeSystemRegistryCatalog() {
  return {
    adapter_id: ADAPTER_ID,
    schemaVersion: SCHEMA_VERSION,
    domainId: DOMAIN_ID,
    mode: MODE,
    routeClass: ROUTE_CLASS,
    registry_type: 'local_static_read_only_safe_copy_badge_system_registry',
    overall_copy_badge_status: 'copy_badges_mapped_no_effect_language_no_truth',
    official_quote_allowed_in_registry: false,
    send_allowed_in_registry: false,
    crm_write_allowed_in_registry: false,
    calendar_create_allowed_in_registry: false,
    quote_truth_allowed_in_registry: false,
    execution_allowed_in_registry: false,
    write_allowed_in_registry: false,
    ui_mutation_allowed_in_registry: false,
    css_injection_allowed_in_registry: false,
    dom_write_allowed_in_registry: false,
    required_badge_fields: [...REQUIRED_BADGE_FIELDS],
    required_copy_fields: [...REQUIRED_COPY_FIELDS],
    forbidden_copy_patterns: FORBIDDEN_COPY_PATTERNS.map((pattern) => pattern.toString()),
    safe_errors: Object.values(SAFE_ERROR_CODES),
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    source_refs: getSourceRefs(),
    badges: clone(BADGES),
    copy_blocks: clone(COPY_BLOCKS),
  };
}

function getBadgeById(badgeId) {
  const match = BADGES.find((badge) => badge.badge_id === badgeId);
  return match ? clone(match) : {
    readModelStatus: 'error',
    badge_id: badgeId || null,
    label: null,
    tone: BADGE_TONES.DANGER,
    meaning: 'Badge not mapped. Treat as unsafe.',
    required_when: [],
    official_quote_allowed: false,
    send_allowed: false,
    crm_write_allowed: false,
    calendar_create_allowed: false,
    quote_truth_allowed: false,
    write_allowed: false,
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code: SAFE_ERROR_CODES.COPY_BADGE_NOT_MAPPED,
      message: 'Badge is not mapped. Official quote, send, CRM, calendar, truth, and writes remain blocked.',
    },
  };
}

function getCopyBlockById(copyId) {
  const match = COPY_BLOCKS.find((copy) => copy.copy_id === copyId);
  return match ? clone(match) : {
    readModelStatus: 'error',
    copy_id: copyId || null,
    text: null,
    usage: null,
    required_badge_ids: ['preview', 'read_only', 'not_official_quote'],
    official_quote_allowed: false,
    send_allowed: false,
    crm_write_allowed: false,
    calendar_create_allowed: false,
    quote_truth_allowed: false,
    write_allowed: false,
    safe_errors: [SAFE_ERROR_CODES.COPY_BADGE_NOT_MAPPED, SAFE_ERROR_CODES.EFFECT_LANGUAGE_BLOCKED],
    safety_flags: clone(DEFAULT_SAFETY_FLAGS),
    safe_error: {
      code: SAFE_ERROR_CODES.COPY_BADGE_NOT_MAPPED,
      message: 'Copy block is not mapped. Effect language and quote truth remain blocked.',
    },
  };
}

function getCopyBlocksByUsage(usage) {
  return clone(COPY_BLOCKS.filter((copy) => copy.usage === usage));
}

function hasForbiddenCopyLanguage(text) {
  return FORBIDDEN_COPY_PATTERNS.some((pattern) => pattern.test(String(text || '')));
}

function validateBadgeShape(badge) {
  const errors = [];
  if (!badge || typeof badge !== 'object') return { ok: false, valid: false, errors: ['badge_object_required'] };

  for (const field of REQUIRED_BADGE_FIELDS) if (!(field in badge)) errors.push(`missing_${field}`);
  for (const flagName of ['official_quote_allowed', 'send_allowed', 'crm_write_allowed', 'calendar_create_allowed', 'quote_truth_allowed', 'write_allowed']) {
    if (badge[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }
  for (const [key, value] of Object.entries(badge.safety_flags || {})) if (value !== false) errors.push(`safety_flag_not_false_${key}`);

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

function validateCopyBlockShape(copy) {
  const errors = [];
  if (!copy || typeof copy !== 'object') return { ok: false, valid: false, errors: ['copy_object_required'] };

  for (const field of REQUIRED_COPY_FIELDS) if (!(field in copy)) errors.push(`missing_${field}`);
  for (const flagName of ['official_quote_allowed', 'send_allowed', 'crm_write_allowed', 'calendar_create_allowed', 'quote_truth_allowed', 'write_allowed']) {
    if (copy[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  if (hasForbiddenCopyLanguage(copy.text)) errors.push('forbidden_copy_language_detected');
  if (!Array.isArray(copy.required_badge_ids) || !copy.required_badge_ids.includes('preview')) errors.push('preview_badge_required');
  if (!copy.required_badge_ids.includes('not_official_quote') && copy.usage !== 'primary_cta' && copy.usage !== 'human_review_cta' && copy.usage !== 'action_bar_boundary') {
    errors.push('not_official_quote_badge_required_for_non_cta_copy');
  }

  for (const [key, value] of Object.entries(copy.safety_flags || {})) if (value !== false) errors.push(`safety_flag_not_false_${key}`);

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

function validateCopyBadgeSystemRegistryCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object') return { ok: false, valid: false, errors: ['catalog_object_required'] };

  if (catalog.schemaVersion !== SCHEMA_VERSION) errors.push('invalid_schemaVersion');
  if (catalog.domainId !== DOMAIN_ID) errors.push('invalid_domainId');
  if (catalog.mode !== MODE) errors.push('invalid_mode');
  if (catalog.routeClass !== ROUTE_CLASS) errors.push('invalid_routeClass');
  if (catalog.overall_copy_badge_status !== 'copy_badges_mapped_no_effect_language_no_truth') errors.push('overall_copy_badge_status_must_remain_no_effects');

  for (const flagName of [
    'official_quote_allowed_in_registry',
    'send_allowed_in_registry',
    'crm_write_allowed_in_registry',
    'calendar_create_allowed_in_registry',
    'quote_truth_allowed_in_registry',
    'execution_allowed_in_registry',
    'write_allowed_in_registry',
    'ui_mutation_allowed_in_registry',
    'css_injection_allowed_in_registry',
    'dom_write_allowed_in_registry',
  ]) {
    if (catalog[flagName] !== false) errors.push(`${flagName}_must_be_false`);
  }

  const badges = Array.isArray(catalog.badges) ? catalog.badges : [];
  const copyBlocks = Array.isArray(catalog.copy_blocks) ? catalog.copy_blocks : [];
  if (badges.length !== 10) errors.push('ten_badges_required');
  if (copyBlocks.length !== 7) errors.push('seven_copy_blocks_required');

  const badgeIds = new Set(badges.map((badge) => badge.badge_id));
  for (const requiredBadge of ['preview', 'read_only', 'human_review_required', 'not_official_quote', 'no_send', 'no_crm', 'no_calendar']) {
    if (!badgeIds.has(requiredBadge)) errors.push(`missing_required_badge_${requiredBadge}`);
  }

  for (const badge of badges) {
    const result = validateBadgeShape(badge);
    if (!result.ok) errors.push(...result.errors.map((error) => `${badge.badge_id || 'unknown'}:${error}`));
  }

  for (const copy of copyBlocks) {
    const result = validateCopyBlockShape(copy);
    if (!result.ok) errors.push(...result.errors.map((error) => `${copy.copy_id || 'unknown'}:${error}`));
    for (const badgeId of copy.required_badge_ids || []) {
      if (!badgeIds.has(badgeId)) errors.push(`${copy.copy_id}:unknown_badge_${badgeId}`);
    }
  }

  for (const [key, value] of Object.entries(catalog.safety_flags || {})) {
    if (value !== false) errors.push(`catalog_safety_flag_not_false_${key}`);
  }

  return { ok: errors.length === 0, valid: errors.length === 0, errors };
}

module.exports = {
  ADAPTER_ID,
  SCHEMA_VERSION,
  DOMAIN_ID,
  MODE,
  ROUTE_CLASS,
  BADGE_TONES,
  SAFE_ERROR_CODES,
  DEFAULT_SAFETY_FLAGS,
  FORBIDDEN_COPY_PATTERNS,
  REQUIRED_BADGE_FIELDS,
  REQUIRED_COPY_FIELDS,
  BADGES,
  COPY_BLOCKS,
  getQuotePreviewSafeCopyBadgeSystemRegistryCatalog,
  getBadgeById,
  getCopyBlockById,
  getCopyBlocksByUsage,
  hasForbiddenCopyLanguage,
  validateBadgeShape,
  validateCopyBlockShape,
  validateCopyBadgeSystemRegistryCatalog,
};
NODE

cat > "$TEST" <<'NODE'
'use strict';

const assert = require('node:assert/strict');
const adapter = require('../platform/adapters/quote-preview/quote-preview-safe-copy-badge-system-registry-adapter-090b.js');

assert.equal(adapter.ADAPTER_ID, 'forge.quote_preview.safe_copy_badge_system.registry.adapter.v1');
assert.equal(adapter.SCHEMA_VERSION, 'forge.quote_preview.safe_copy_badge_system.registry.v1');
assert.equal(adapter.MODE, 'read_only');
assert.equal(adapter.ROUTE_CLASS, 'preview_safe');

const catalog = adapter.getQuotePreviewSafeCopyBadgeSystemRegistryCatalog();
assert.equal(catalog.registry_type, 'local_static_read_only_safe_copy_badge_system_registry');
assert.equal(catalog.overall_copy_badge_status, 'copy_badges_mapped_no_effect_language_no_truth');
assert.equal(catalog.badges.length, 10);
assert.equal(catalog.copy_blocks.length, 7);
assert.equal(adapter.validateCopyBadgeSystemRegistryCatalog(catalog).ok, true);

for (const flag of [
  'official_quote_allowed_in_registry',
  'send_allowed_in_registry',
  'crm_write_allowed_in_registry',
  'calendar_create_allowed_in_registry',
  'quote_truth_allowed_in_registry',
  'execution_allowed_in_registry',
  'write_allowed_in_registry',
  'ui_mutation_allowed_in_registry',
  'css_injection_allowed_in_registry',
  'dom_write_allowed_in_registry',
]) {
  assert.equal(catalog[flag], false, `${flag} must be false`);
}

for (const badge of catalog.badges) {
  for (const field of adapter.REQUIRED_BADGE_FIELDS) assert(field in badge, `${badge.badge_id} missing ${field}`);
  assert.equal(badge.official_quote_allowed, false);
  assert.equal(badge.send_allowed, false);
  assert.equal(badge.crm_write_allowed, false);
  assert.equal(badge.calendar_create_allowed, false);
  assert.equal(badge.quote_truth_allowed, false);
  assert.equal(badge.write_allowed, false);
  assert.equal(adapter.validateBadgeShape(badge).ok, true);
}

for (const copy of catalog.copy_blocks) {
  for (const field of adapter.REQUIRED_COPY_FIELDS) assert(field in copy, `${copy.copy_id} missing ${field}`);
  assert.equal(copy.official_quote_allowed, false);
  assert.equal(copy.send_allowed, false);
  assert.equal(copy.crm_write_allowed, false);
  assert.equal(copy.calendar_create_allowed, false);
  assert.equal(copy.quote_truth_allowed, false);
  assert.equal(copy.write_allowed, false);
  assert.equal(adapter.hasForbiddenCopyLanguage(copy.text), false);
  assert(copy.required_badge_ids.includes('preview'));
  assert.equal(adapter.validateCopyBlockShape(copy).ok, true);
}

assert.equal(adapter.getBadgeById('preview').label, 'Preview');
assert.equal(adapter.getBadgeById('read_only').label, 'Solo lectura');
assert.equal(adapter.getBadgeById('human_review_required').label, 'Revisión humana');
assert.equal(adapter.getBadgeById('not_official_quote').label, 'No cotización oficial');
assert.equal(adapter.getBadgeById('no_send').label, 'Sin envío');
assert.equal(adapter.getBadgeById('no_crm').label, 'Sin CRM');
assert.equal(adapter.getBadgeById('no_calendar').label, 'Sin calendario');

assert.equal(adapter.getCopyBlockById('preview_disclaimer_primary').text.includes('No es una cotización oficial'), true);
assert.equal(adapter.getCopyBlockById('no_effects_boundary').text.includes('Sin envío'), true);
assert.equal(adapter.getCopyBlockById('no_effects_boundary').text.includes('sin CRM'), true);
assert.equal(adapter.getCopyBlockById('no_effects_boundary').text.includes('sin calendario'), true);
assert.equal(adapter.getCopyBlocksByUsage('primary_cta').length, 1);
assert.equal(adapter.getCopyBlockById('safe_prepare_preview_cta').text, 'Preparar preview');

assert.equal(adapter.hasForbiddenCopyLanguage('Enviar ahora'), true);
assert.equal(adapter.hasForbiddenCopyLanguage('Guardar en CRM'), true);
assert.equal(adapter.hasForbiddenCopyLanguage('Cotización verificada'), true);
assert.equal(adapter.hasForbiddenCopyLanguage('Preparar preview'), false);

const missingBadge = adapter.getBadgeById('missing_badge');
assert.equal(missingBadge.readModelStatus, 'error');
assert.equal(missingBadge.official_quote_allowed, false);

const missingCopy = adapter.getCopyBlockById('missing_copy');
assert.equal(missingCopy.readModelStatus, 'error');
assert.equal(missingCopy.quote_truth_allowed, false);

for (const [key, value] of Object.entries(adapter.DEFAULT_SAFETY_FLAGS)) {
  assert.equal(value, false, `DEFAULT_SAFETY_FLAGS.${key} must be false`);
}

const combined = JSON.stringify({ catalog, flags: adapter.DEFAULT_SAFETY_FLAGS });
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

console.log('PASS quote preview safe copy badge system registry adapter 090B');
NODE

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "090B WRITE DOCS / EVIDENCE"
cat > "$ARCH_DOC_B" <<EOF
# Forge Quote Preview Safe Copy and Badge System Implementation 090B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Purpose

090B implements a local/static/read-only safe copy and badge system registry.

The registry defines safe labels and copy blocks for Quote Preview. It does not render UI, mutate UI, inject CSS, write DOM, create quote truth, claim official quote status, imply send, imply CRM write, imply calendar creation, or execute real effects.

## Implemented Files

- \`$ADAPTER\`
- \`$TEST\`

## Registry Status

\`copy_badges_mapped_no_effect_language_no_truth\`

## Required Badges Implemented

- Preview
- Solo lectura
- Revisión humana
- No cotización oficial
- Sin envío
- Sin CRM
- Sin calendario
- Fuente no vinculada
- Hash no verificado
- Quote truth bloqueado

## Final Decision

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$EVIDENCE_DOC_B" <<EOF
# Forge Quote Preview Safe Copy and Badge System Implementation Evidence 090B

PHASE=$PHASE_B

STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

## Evidence Summary

090B implements a local/static/read-only safe copy and badge system registry.

## Test Evidence

The focused test validates:

- ten safe badges;
- seven safe copy blocks;
- no official quote language;
- no send language;
- no CRM write language;
- no calendar creation language;
- no quote truth language;
- all registry flags remain false.

## Final

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
EOF

cat > "$CERT_DOC_B" <<EOF
# Forge Quote Preview Safe Copy and Badge System Implementation Certificate 090B

PHASE=$PHASE_B

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C

090B certifies that Forge now has a local/static/read-only safe copy and badge system registry.

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
    "adapterId": "forge.quote_preview.safe_copy_badge_system.registry.adapter.v1",
    "schemaVersion": "forge.quote_preview.safe_copy_badge_system.registry.v1",
    "registryType": "local_static_read_only_safe_copy_badge_system_registry",
    "overallCopyBadgeStatus": "copy_badges_mapped_no_effect_language_no_truth",
    "badges": 10,
    "copyBlocks": 7,
    "officialQuoteLanguageIntroduced": false,
    "sendLanguageIntroduced": false,
    "crmWriteLanguageIntroduced": false,
    "calendarCreateLanguageIntroduced": false,
    "quoteTruthLanguageIntroduced": false
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
## 090B Quote Preview Safe Copy and Badge System Implementation

090B implements a local/static/read-only safe copy and badge system registry.

Locked decision:
\`$LOCKED_B\`

Implemented:

- \`$ADAPTER\`
- \`$TEST\`

Registry status:

- \`copy_badges_mapped_no_effect_language_no_truth\`

Required badges implemented:

- Preview
- Solo lectura
- Revisión humana
- No cotización oficial
- Sin envío
- Sin CRM
- Sin calendario
- Fuente no vinculada
- Hash no verificado
- Quote truth bloqueado

DECISION=$DECISION_B

LOCKED_DECISION=$LOCKED_B

NEXT=$PHASE_C
<!-- FORGE:$PHASE_B:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_B" "$TREE_BLOCK_B"
done
trim_tree_files

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_B"
run rg -n "$PHASE_B|$DECISION_B|$LOCKED_B|$PHASE_C|copy_badges_mapped_no_effect_language_no_truth|No cotización oficial|Sin envío|Sin CRM|Sin calendario" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "feat: implement quote preview safe copy and badge system registry" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ADAPTER" "$TEST" "$ARCH_DOC_B" "$EVIDENCE_DOC_B" "$CERT_DOC_B" "$AUDIT_JSON_B" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 090C QA
# -------------------------------------------------------------------
stage "090C SEMANTIC QA"
SEMANTIC_QA_JSON="$(mktemp)"
node <<'NODE' > "$SEMANTIC_QA_JSON"
const assert = require("node:assert/strict");
const copy = require("./platform/adapters/quote-preview/quote-preview-safe-copy-badge-system-registry-adapter-090b.js");

const catalog = copy.getQuotePreviewSafeCopyBadgeSystemRegistryCatalog();
assert.equal(catalog.overall_copy_badge_status, "copy_badges_mapped_no_effect_language_no_truth");
assert.equal(copy.validateCopyBadgeSystemRegistryCatalog(catalog).ok, true);
assert.equal(catalog.badges.length, 10);
assert.equal(catalog.copy_blocks.length, 7);

assert.equal(copy.getBadgeById("preview").label, "Preview");
assert.equal(copy.getBadgeById("read_only").label, "Solo lectura");
assert.equal(copy.getBadgeById("human_review_required").label, "Revisión humana");
assert.equal(copy.getBadgeById("not_official_quote").label, "No cotización oficial");
assert.equal(copy.getBadgeById("no_send").label, "Sin envío");
assert.equal(copy.getBadgeById("no_crm").label, "Sin CRM");
assert.equal(copy.getBadgeById("no_calendar").label, "Sin calendario");

for (const badge of catalog.badges) {
  assert.equal(badge.official_quote_allowed, false);
  assert.equal(badge.send_allowed, false);
  assert.equal(badge.crm_write_allowed, false);
  assert.equal(badge.calendar_create_allowed, false);
  assert.equal(badge.quote_truth_allowed, false);
  assert.equal(badge.write_allowed, false);
}

for (const block of catalog.copy_blocks) {
  assert.equal(block.official_quote_allowed, false);
  assert.equal(block.send_allowed, false);
  assert.equal(block.crm_write_allowed, false);
  assert.equal(block.calendar_create_allowed, false);
  assert.equal(block.quote_truth_allowed, false);
  assert.equal(block.write_allowed, false);
  assert.equal(copy.hasForbiddenCopyLanguage(block.text), false);
}

assert.equal(copy.hasForbiddenCopyLanguage("Enviar ahora"), true);
assert.equal(copy.hasForbiddenCopyLanguage("Guardar en CRM"), true);
assert.equal(copy.hasForbiddenCopyLanguage("Cotización verificada"), true);
assert.equal(copy.hasForbiddenCopyLanguage("Preparar preview"), false);

console.log(JSON.stringify({
  status: "PASS",
  catalogValidated: true,
  badgeCount: catalog.badges.length,
  copyBlockCount: catalog.copy_blocks.length,
  previewBadgePresent: true,
  readOnlyBadgePresent: true,
  humanReviewBadgePresent: true,
  notOfficialQuoteBadgePresent: true,
  noSendBadgePresent: true,
  noCrmBadgePresent: true,
  noCalendarBadgePresent: true,
  forbiddenCopyLanguageBlocked: true,
  allEffectsBlocked: true,
  allSafetyFlagsFalse: true
}, null, 2));
NODE

cat "$SEMANTIC_QA_JSON"

cat > "$ARCH_DOC_C" <<EOF
# Forge Quote Preview Safe Copy and Badge System QA Lock 090C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Purpose

090C QA locks the 090B safe copy and badge system registry.

## QA Validated

- ten safe badges exist;
- seven safe copy blocks exist;
- Preview badge exists;
- Solo lectura badge exists;
- Revisión humana badge exists;
- No cotización oficial badge exists;
- Sin envío / Sin CRM / Sin calendario badges exist;
- forbidden official quote/send/CRM/calendar language is blocked;
- copy blocks do not imply quote truth or real effects;
- all safety flags remain false.

## Final Decision

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$EVIDENCE_DOC_C" <<EOF
# Forge Quote Preview Safe Copy and Badge System QA Lock Evidence 090C

PHASE=$PHASE_C

STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

## Semantic QA

\`\`\`json
$(cat "$SEMANTIC_QA_JSON")
\`\`\`

## Final

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D
EOF

cat > "$CERT_DOC_C" <<EOF
# Forge Quote Preview Safe Copy and Badge System QA Lock Certificate 090C

PHASE=$PHASE_C

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_C

LOCKED_DECISION=$LOCKED_C

NEXT=$PHASE_D

090C certifies that safe copy and badge system registry is QA locked.

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
  "qaValidated": {
    "badgeCount": 10,
    "copyBlockCount": 7,
    "requiredBadgesPresent": true,
    "forbiddenCopyLanguageBlocked": true,
    "allEffectsBlocked": true,
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
## 090C Quote Preview Safe Copy and Badge System QA Lock

090C QA locks the 090B safe copy and badge system registry.

Locked decision:
\`$LOCKED_C\`

QA validated:

- ten safe badges exist;
- seven safe copy blocks exist;
- Preview / Solo lectura / Revisión humana badges exist;
- No cotización oficial / Sin envío / Sin CRM / Sin calendario badges exist;
- forbidden official quote/send/CRM/calendar language is blocked;
- copy blocks do not imply quote truth or real effects;
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

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_C"
run rg -n "$PHASE_C|$DECISION_C|$LOCKED_C|$PHASE_D|QA locks|ten safe badges|forbidden official quote" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe copy and badge system qa" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_C" "$EVIDENCE_DOC_C" "$CERT_DOC_C" "$AUDIT_JSON_C" "$SCRIPT_IN_REPO"

# -------------------------------------------------------------------
# 090D DECISION
# -------------------------------------------------------------------
stage "090D DECISION ASSERTIONS"
DECISION_QA_JSON="$(mktemp)"
node <<'NODE' > "$DECISION_QA_JSON"
const assert = require("node:assert/strict");
const copy = require("./platform/adapters/quote-preview/quote-preview-safe-copy-badge-system-registry-adapter-090b.js");

const catalog = copy.getQuotePreviewSafeCopyBadgeSystemRegistryCatalog();
assert.equal(catalog.overall_copy_badge_status, "copy_badges_mapped_no_effect_language_no_truth");
assert.equal(copy.validateCopyBadgeSystemRegistryCatalog(catalog).ok, true);
assert.equal(catalog.badges.length, 10);
assert.equal(catalog.copy_blocks.length, 7);

for (const badge of catalog.badges) {
  assert.equal(badge.official_quote_allowed, false);
  assert.equal(badge.send_allowed, false);
  assert.equal(badge.crm_write_allowed, false);
  assert.equal(badge.calendar_create_allowed, false);
  assert.equal(badge.quote_truth_allowed, false);
  assert.equal(badge.write_allowed, false);
}

for (const block of catalog.copy_blocks) {
  assert.equal(block.official_quote_allowed, false);
  assert.equal(block.send_allowed, false);
  assert.equal(block.crm_write_allowed, false);
  assert.equal(block.calendar_create_allowed, false);
  assert.equal(block.quote_truth_allowed, false);
  assert.equal(block.write_allowed, false);
}

console.log(JSON.stringify({
  status: "PASS",
  locked_as: "local_static_read_only_reference_registry",
  overall_copy_badge_status: catalog.overall_copy_badge_status,
  badge_count: catalog.badges.length,
  copy_block_count: catalog.copy_blocks.length,
  next_scope: "091A_QUOTE_PREVIEW_SAFE_UI_IMPLEMENTATION_SCOPE",
  no_official_quote_claims: true,
  no_send_claims: true,
  no_crm_claims: true,
  no_calendar_claims: true,
  no_quote_truth_claims: true,
  all_safety_flags_false: true
}, null, 2));
NODE

cat "$DECISION_QA_JSON"

cat > "$ARCH_DOC_D" <<EOF
# Forge Quote Preview Safe Copy and Badge System Decision Lock 090D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Purpose

090D decision-locks the 090B/090C safe copy and badge system registry as a local/static/read-only reference registry.

## Locked Meaning

The registry is approved only as:

- local/static;
- read-only;
- safe copy and badge reference model;
- no official quote claim;
- no send claim;
- no CRM write claim;
- no calendar creation claim;
- no quote truth;
- no execution;
- no writes.

## Confirmed

- ten safe badges exist;
- seven safe copy blocks exist;
- required safety badges exist;
- forbidden effect language is blocked;
- copy blocks preserve preview/read-only/human-review boundary.

## Next Architectural Unlock

091A may scope safe UI implementation for Quote Preview.

091A must stay gated: no backend, no quote truth, no provider call, no parser/calculator/Banxico execution, no CRM/policy/pipeline/quote writes, no send, and no calendar creation.

## Final Decision

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$EVIDENCE_DOC_D" <<EOF
# Forge Quote Preview Safe Copy and Badge System Decision Lock Evidence 090D

PHASE=$PHASE_D

STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

## Decision Assertions

\`\`\`json
$(cat "$DECISION_QA_JSON")
\`\`\`

## Final

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
EOF

cat > "$CERT_DOC_D" <<EOF
# Forge Quote Preview Safe Copy and Badge System Decision Lock Certificate 090D

PHASE=$PHASE_D

CERTIFICATE_STATUS=PASS

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D

090D certifies that safe copy and badge system registry is locked as local/static/read-only reference registry.

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
  "confirmed": {
    "badgeCount": 10,
    "copyBlockCount": 7,
    "requiredSafetyBadgesPresent": true,
    "forbiddenEffectLanguageBlocked": true,
    "copyBlocksPreservePreviewBoundary": true,
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

TREE_BLOCK_D="$(mktemp)"
cat > "$TREE_BLOCK_D" <<EOF
<!-- FORGE:$PHASE_D:START -->
## 090D Quote Preview Safe Copy and Badge System Decision Lock

090D decision-locks the 090B/090C safe copy and badge system registry as a local/static/read-only reference registry.

Locked decision:
\`$LOCKED_D\`

Confirmed:

- ten safe badges exist;
- seven safe copy blocks exist;
- required safety badges exist;
- forbidden effect language is blocked;
- copy blocks preserve preview/read-only/human-review boundary.

Next:

- \`$NEXT_AFTER_D\` may scope safe UI implementation.
- No backend, quote truth, provider call, parser/calculator/Banxico execution, CRM/policy/pipeline/quote writes, send, or calendar creation are authorized.

DECISION=$DECISION_D

LOCKED_DECISION=$LOCKED_D

NEXT=$NEXT_AFTER_D
<!-- FORGE:$PHASE_D:END -->
EOF

for tree in FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md; do
  replace_or_append_block "$tree" "$PHASE_D" "$TREE_BLOCK_D"
done
trim_tree_files

run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON_D"
run rg -n "$PHASE_D|$DECISION_D|$LOCKED_D|$NEXT_AFTER_D|Decision Lock|safe UI implementation|forbidden effect language" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D"
run git diff --check
safety_scan FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$ADAPTER" "$TEST"

commit_allowed_subset \
  "docs: lock quote preview safe copy and badge system decision" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC_D" "$EVIDENCE_DOC_D" "$CERT_DOC_D" "$AUDIT_JSON_D" "$SCRIPT_IN_REPO"

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -16

SUMMARY=$(cat <<EOF
PASS_090ABCD_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_FAST_TRACK_COMMIT_PUSH_COMPLETE
PASS_A=$DECISION_A
LOCKED_A=$LOCKED_A
PASS_B=$DECISION_B
LOCKED_B=$LOCKED_B
PASS_C=$DECISION_C
LOCKED_C=$LOCKED_C
PASS_D=$DECISION_D
LOCKED_D=$LOCKED_D
NEXT=$NEXT_AFTER_D
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
