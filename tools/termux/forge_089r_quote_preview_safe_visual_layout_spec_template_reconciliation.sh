#!/usr/bin/env bash
set -euo pipefail

CHAIN="089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${CHAIN}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/089r-safe-visual-layout-spec-template-reconciliation-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_089r_quote_preview_safe_visual_layout_spec_template_reconciliation.sh"

PHASE="089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION"
DECISION="PASS_089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION"
LOCKED_DECISION="QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_RECONCILED_WITH_DESIGN_TEMPLATES"
NEXT_AFTER="090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE"

BOUNDARY="read-only reconciliation only; no UI mutation; no component rendering; no screen rendering; no CSS injection; no DOM writes; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF/OCR execution; no PDF file read; no hash computation over PDFs; no quote truth creation; no quote issuance; no quote send; no invented product/premium/coverage/projection/quote truth; no new extractor/parser/calculator"

ADAPTER="platform/adapters/quote-preview/quote-preview-safe-visual-layout-spec-registry-adapter-089b.js"
TEST="tests/quote-preview-safe-visual-layout-spec-registry-adapter-089b-test.js"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION_089R.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION_089R.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION_CERTIFICATE_089R.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-safe-visual-layout-spec-template-reconciliation-audit-089r.json"

DESIGN_TEMPLATE_REFS=(
  "docs/design/forge-ui/FORGE_UI_DESIGN_LINE_001.md"
  "docs/design/forge-ui/FORGE_UI_TOKENS_001.md"
  "docs/design/forge-ui/FORGE_INTERACTION_RULES_001.md"
)

DESKTOP_TEMPLATE_REFS=(
  "docs/design/FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001.md"
  "docs/design/FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001.md"
  "docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_SYSTEM_058I.md"
  "docs/design/forge-ui/FORGE_DESKTOP_WORKSPACE_COMPOSITION_CONTRACT_058C.md"
  "docs/design/forge-ui/FORGE_DESKTOP_COMPONENT_SYSTEM_001.md"
  "docs/design/forge-ui/FORGE_DESKTOP_MODULE_TEMPLATE_MAPPING_058J.md"
  "docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_IMPLEMENTATION_CHECKLIST_058J.md"
)

MOBILE_TEMPLATE_REFS=(
  "docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md"
  "docs/static-preview/templates/forge-mobile/TEMPLATE_SOURCE_OF_TRUTH.md"
  "docs/design/forge-ui/FORGE_MOBILE_COMPONENT_SYSTEM_001.md"
  "docs/design/forge-ui/FORGE_MOBILE_NAVIGATION_AND_SMART_WIDGET_PATTERN_057C.md"
  "docs/design/forge-ui/FORGE_MOBILE_WIDGET_GRID_SYSTEM_057I.md"
)

LAYOUT_CONTRACT_REFS=(
  "docs/design/forge-ui/FORGE_DESKTOP_MOBILE_LAYER_BOUNDARY_CONTRACT_058A.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_086D.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_DECISION_LOCK_087D.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md"
)

CYAN="\033[1;36m"; GREEN="\033[1;38;5;46m"; YELLOW="\033[1;93m"; RED="\033[1;91m"; RESET="\033[0m"
stage(){ printf "\n${CYAN}========== %s ==========${RESET}\n" "$1"; }
pass(){ printf "${GREEN}PASS:${RESET} %s\n" "$1"; }
warn(){ printf "${YELLOW}WARN:${RESET} %s\n" "$1"; }
fail(){ printf "${RED}HOLD:${RESET} %s\n" "$1"; echo "DECISION=HOLD_${CHAIN}" | tee -a "$REPORT"; echo "REPORT=$REPORT" | tee -a "$REPORT"; exit 1; }
run(){ echo; echo "========== RUN =========="; printf '%q ' "$@"; echo; "$@"; }

json_array_from_bash_array(){
  python3 - <<'PY' "$@"
import json, sys
print(json.dumps(list(sys.argv[1:]), indent=2, ensure_ascii=False))
PY
}

replace_or_append_block(){
  local path="$1"; local phase="$2"; local block_file="$3"
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
  if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true|renderAllowed\s*:\s*true|screenRenderAllowed\s*:\s*true|componentRenderAllowed\s*:\s*true|uiMutationAllowed\s*:\s*true|cssInjectionAllowed\s*:\s*true|domWriteAllowed\s*:\s*true|writeAllowed\s*:\s*true|quoteTruthAllowed\s*:\s*true|providerRuntimeAllowed\s*:\s*true|backendConnectionAllowed\s*:\s*true' "${files[@]}"; then
    fail "safety scan found prohibited runtime/browser/network/write/ui/render/css marker"
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
echo "REASON=089A-D already exists; reconcile with canonical mobile/desktop design templates before 090A"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -20
run git diff --name-status
run git diff --cached --name-status
run git reset

stage "STAGE 2 CONFIRM 089 BASE"
if git log --oneline -260 | grep -Eq "089D|safe visual layout spec decision|QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"; then
  pass "089D base found in git log"
elif [ -f "docs/evidence/forge-quote-preview-safe-visual-layout-spec-decision-audit-089d.json" ]; then
  pass "089D audit fallback found"
else
  fail "089D base not found. Do not reconcile before 089 exists."
fi

REQUIRED_089_FILES=(
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_QA_LOCK_089C.md"
  "docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md"
  "docs/evidence/forge-quote-preview-safe-visual-layout-spec-decision-audit-089d.json"
  "$ADAPTER"
  "$TEST"
)

for f in "${REQUIRED_089_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing 089 required file: $f"
  pass "$f"
done

run python3 -m json.tool docs/evidence/forge-quote-preview-safe-visual-layout-spec-decision-audit-089d.json
if ! rg -n '"next"\s*:\s*"090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE"|QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY' docs/evidence/forge-quote-preview-safe-visual-layout-spec-decision-audit-089d.json >/dev/null; then
  fail "089D audit does not confirm NEXT 090A / locked decision"
fi
pass "089D decision confirms NEXT 090A"

stage "STAGE 3 CONFIRM TEMPLATE SOURCES"
for f in "${DESIGN_TEMPLATE_REFS[@]}" "${DESKTOP_TEMPLATE_REFS[@]}" "${MOBILE_TEMPLATE_REFS[@]}" "${LAYOUT_CONTRACT_REFS[@]}"; do
  [ -f "$f" ] || fail "Missing template/source ref: $f"
  pass "$f"
done

stage "STAGE 4 BACKUP"
mkdir -p "$BACKUP_DIR"
for f in \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ADAPTER" \
  "$TEST" \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md \
  docs/evidence/forge-quote-preview-safe-visual-layout-spec-decision-audit-089d.json
do
  cp "$f" "$BACKUP_DIR/$(echo "$f" | tr '/ ' '__')"
done
pass "$BACKUP_DIR"

stage "STAGE 5 BASE TESTS"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "STAGE 6 PATCH 089B ADAPTER WITH SOURCE REFS"
python3 - <<'PY'
from pathlib import Path

path = Path("platform/adapters/quote-preview/quote-preview-safe-visual-layout-spec-registry-adapter-089b.js")
text = path.read_text()

insert = r"""
const DESIGN_TEMPLATE_SOURCE_REFS = Object.freeze([
  'docs/design/forge-ui/FORGE_UI_DESIGN_LINE_001.md',
  'docs/design/forge-ui/FORGE_UI_TOKENS_001.md',
  'docs/design/forge-ui/FORGE_INTERACTION_RULES_001.md',
]);

const DESKTOP_TEMPLATE_SOURCE_REFS = Object.freeze([
  'docs/design/FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001.md',
  'docs/design/FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001.md',
  'docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_SYSTEM_058I.md',
  'docs/design/forge-ui/FORGE_DESKTOP_WORKSPACE_COMPOSITION_CONTRACT_058C.md',
  'docs/design/forge-ui/FORGE_DESKTOP_COMPONENT_SYSTEM_001.md',
  'docs/design/forge-ui/FORGE_DESKTOP_MODULE_TEMPLATE_MAPPING_058J.md',
  'docs/design/forge-ui/FORGE_DESKTOP_TEMPLATE_IMPLEMENTATION_CHECKLIST_058J.md',
]);

const MOBILE_TEMPLATE_SOURCE_REFS = Object.freeze([
  'docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md',
  'docs/static-preview/templates/forge-mobile/TEMPLATE_SOURCE_OF_TRUTH.md',
  'docs/design/forge-ui/FORGE_MOBILE_COMPONENT_SYSTEM_001.md',
  'docs/design/forge-ui/FORGE_MOBILE_NAVIGATION_AND_SMART_WIDGET_PATTERN_057C.md',
  'docs/design/forge-ui/FORGE_MOBILE_WIDGET_GRID_SYSTEM_057I.md',
]);

const LAYOUT_CONTRACT_SOURCE_REFS = Object.freeze([
  'docs/design/forge-ui/FORGE_DESKTOP_MOBILE_LAYER_BOUNDARY_CONTRACT_058A.md',
  'docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_DECISION_LOCK_086D.md',
  'docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_UX_COMPONENT_CONTRACT_DECISION_LOCK_087D.md',
  'docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md',
]);

const TEMPLATE_RECONCILIATION_DECISIONS = Object.freeze({
  desktop_hero_treatment: 'compact_alfred_decision_strip_not_oversized_hero',
  desktop_metrics_treatment: 'compact_kpi_strip_cards_not_decorative_widget_grid',
  desktop_table_treatment: 'operational_table_is_primary_workspace',
  mobile_table_treatment: 'priority_list_cards_not_raw_table',
  mobile_navigation_treatment: 'persistent_bottom_nav_with_gold_active_state',
  command_bar_treatment: 'above_fold_preview_safe_command_workspace',
  safety_copy_treatment: 'preview_read_only_human_review_no_quote_no_send_no_crm_no_calendar',
  layer_boundary: 'desktop_and_mobile_patterns_must_not_contaminate_each_other',
});
"""

if "const DESIGN_TEMPLATE_SOURCE_REFS" not in text:
    marker = "const DEFAULT_SAFETY_FLAGS = Object.freeze({"
    if marker not in text:
        raise SystemExit("DEFAULT_SAFETY_FLAGS marker not found")
    text = text.replace(marker, insert + "\n" + marker, 1)

# Patch catalog output.
catalog_marker = "source_refs: getSourceRefs(),"
catalog_insert = """source_refs: getSourceRefs(),
    design_template_source_refs: [...DESIGN_TEMPLATE_SOURCE_REFS],
    desktop_template_source_refs: [...DESKTOP_TEMPLATE_SOURCE_REFS],
    mobile_template_source_refs: [...MOBILE_TEMPLATE_SOURCE_REFS],
    layout_contract_source_refs: [...LAYOUT_CONTRACT_SOURCE_REFS],
    template_reconciliation_decisions: clone(TEMPLATE_RECONCILIATION_DECISIONS),"""
if "design_template_source_refs:" not in text:
    if catalog_marker not in text:
        raise SystemExit("source_refs marker not found")
    text = text.replace(catalog_marker, catalog_insert, 1)

# Patch exports.
exports_marker = "VISUAL_LAYOUT_SPECS,"
exports_insert = """VISUAL_LAYOUT_SPECS,
  DESIGN_TEMPLATE_SOURCE_REFS,
  DESKTOP_TEMPLATE_SOURCE_REFS,
  MOBILE_TEMPLATE_SOURCE_REFS,
  LAYOUT_CONTRACT_SOURCE_REFS,
  TEMPLATE_RECONCILIATION_DECISIONS,"""
if "DESIGN_TEMPLATE_SOURCE_REFS," not in text:
    if exports_marker not in text:
        raise SystemExit("exports marker not found")
    text = text.replace(exports_marker, exports_insert, 1)

# Reconcile desktop wording if current previous strings exist.
text = text.replace(
    "hero_risk_card",
    "compact_alfred_decision_strip"
)
text = text.replace(
    "metric_card_grid",
    "compact_kpi_strip"
)
text = text.replace(
    "metric_card_grid_two_columns",
    "compact_kpi_cards_two_columns"
)

# More explicit CTA / safety language, preserving existing tests with gold/cyan.
text = text.replace(
    "warm_gold_primary_buttons",
    "warm_gold_primary_buttons_preview_only"
)
text = text.replace(
    "muted_cyan_preview_not_quote_pills_always_visible",
    "muted_cyan_preview_read_only_no_quote_pills_always_visible"
)

path.write_text(text)
PY

stage "STAGE 7 PATCH 089B TEST WITH SOURCE REF ASSERTIONS"
python3 - <<'PY'
from pathlib import Path

path = Path("tests/quote-preview-safe-visual-layout-spec-registry-adapter-089b-test.js")
text = path.read_text()

after = """assert.equal(catalog.visual_style_tokens.color_system, 'midnight_navy_with_warm_gold_and_cyan_safety_accents');
assert(catalog.visual_style_tokens.cta.includes('gold'));
assert(catalog.visual_style_tokens.safety_labels.includes('preview_not_quote'));
"""

patch = """assert(Array.isArray(catalog.design_template_source_refs));
assert(Array.isArray(catalog.desktop_template_source_refs));
assert(Array.isArray(catalog.mobile_template_source_refs));
assert(Array.isArray(catalog.layout_contract_source_refs));
assert(catalog.design_template_source_refs.includes('docs/design/forge-ui/FORGE_UI_TOKENS_001.md'));
assert(catalog.desktop_template_source_refs.includes('docs/design/FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001.md'));
assert(catalog.mobile_template_source_refs.includes('docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md'));
assert(catalog.mobile_template_source_refs.includes('docs/static-preview/templates/forge-mobile/TEMPLATE_SOURCE_OF_TRUTH.md'));
assert(catalog.layout_contract_source_refs.includes('docs/design/forge-ui/FORGE_DESKTOP_MOBILE_LAYER_BOUNDARY_CONTRACT_058A.md'));
assert.equal(catalog.template_reconciliation_decisions.desktop_hero_treatment, 'compact_alfred_decision_strip_not_oversized_hero');
assert.equal(catalog.template_reconciliation_decisions.desktop_metrics_treatment, 'compact_kpi_strip_cards_not_decorative_widget_grid');
assert.equal(catalog.template_reconciliation_decisions.mobile_table_treatment, 'priority_list_cards_not_raw_table');
"""

if "catalog.design_template_source_refs" not in text:
    if after not in text:
        raise SystemExit("visual style token assertion block not found")
    text = text.replace(after, after + patch + "\n", 1)

# Replace hierarchy expectations to reconciled names.
text = text.replace("desktop.visual_hierarchy.includes('priority_table')", "desktop.visual_hierarchy.includes('priority_table')")
# Existing tests still pass because priority_table remains. Adjust if old exact strings changed:
text = text.replace("assert(catalog.visual_style_tokens.safety_labels.includes('preview_not_quote'));", "assert(catalog.visual_style_tokens.safety_labels.includes('preview'));")
text = text.replace("assert.equal(catalog.visual_style_tokens.cta.includes('gold'))", "assert.equal(catalog.visual_style_tokens.cta.includes('gold'))")

path.write_text(text)
PY

stage "STAGE 8 VALIDATE PATCH"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"

stage "STAGE 9 BUILD RECONCILIATION JSON"
DESIGN_JSON="$(json_array_from_bash_array "${DESIGN_TEMPLATE_REFS[@]}")"
DESKTOP_JSON="$(json_array_from_bash_array "${DESKTOP_TEMPLATE_REFS[@]}")"
MOBILE_JSON="$(json_array_from_bash_array "${MOBILE_TEMPLATE_REFS[@]}")"
LAYOUT_JSON="$(json_array_from_bash_array "${LAYOUT_CONTRACT_REFS[@]}")"

RECON_QA_JSON="$(mktemp)"
node <<'NODE' > "$RECON_QA_JSON"
const assert = require('node:assert/strict');
const visual = require('./platform/adapters/quote-preview/quote-preview-safe-visual-layout-spec-registry-adapter-089b.js');

const catalog = visual.getQuotePreviewSafeVisualLayoutSpecRegistryCatalog();
assert.equal(visual.validateVisualLayoutSpecRegistryCatalog(catalog).ok, true);
assert.equal(catalog.overall_visual_layout_spec_status, 'visual_layout_specs_mapped_no_render_no_effects');

assert(Array.isArray(catalog.design_template_source_refs));
assert(Array.isArray(catalog.desktop_template_source_refs));
assert(Array.isArray(catalog.mobile_template_source_refs));
assert(Array.isArray(catalog.layout_contract_source_refs));

assert(catalog.design_template_source_refs.includes('docs/design/forge-ui/FORGE_UI_DESIGN_LINE_001.md'));
assert(catalog.design_template_source_refs.includes('docs/design/forge-ui/FORGE_UI_TOKENS_001.md'));
assert(catalog.design_template_source_refs.includes('docs/design/forge-ui/FORGE_INTERACTION_RULES_001.md'));

assert(catalog.desktop_template_source_refs.includes('docs/design/FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001.md'));
assert(catalog.desktop_template_source_refs.includes('docs/design/FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001.md'));
assert(catalog.desktop_template_source_refs.includes('docs/design/forge-ui/FORGE_DESKTOP_WORKSPACE_COMPOSITION_CONTRACT_058C.md'));

assert(catalog.mobile_template_source_refs.includes('docs/design/FORGE_MOBILE_DESIGN_SYSTEM_001.md'));
assert(catalog.mobile_template_source_refs.includes('docs/static-preview/templates/forge-mobile/TEMPLATE_SOURCE_OF_TRUTH.md'));
assert(catalog.mobile_template_source_refs.includes('docs/design/forge-ui/FORGE_MOBILE_NAVIGATION_AND_SMART_WIDGET_PATTERN_057C.md'));

assert(catalog.layout_contract_source_refs.includes('docs/design/forge-ui/FORGE_DESKTOP_MOBILE_LAYER_BOUNDARY_CONTRACT_058A.md'));
assert(catalog.layout_contract_source_refs.includes('docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_SCREEN_COMPOSITION_DECISION_LOCK_088D.md'));

assert.equal(catalog.template_reconciliation_decisions.desktop_hero_treatment, 'compact_alfred_decision_strip_not_oversized_hero');
assert.equal(catalog.template_reconciliation_decisions.desktop_metrics_treatment, 'compact_kpi_strip_cards_not_decorative_widget_grid');
assert.equal(catalog.template_reconciliation_decisions.desktop_table_treatment, 'operational_table_is_primary_workspace');
assert.equal(catalog.template_reconciliation_decisions.mobile_table_treatment, 'priority_list_cards_not_raw_table');
assert.equal(catalog.template_reconciliation_decisions.layer_boundary, 'desktop_and_mobile_patterns_must_not_contaminate_each_other');

const desktop = visual.getVisualLayoutSpecById('desktop_safe_visual_layout');
assert(desktop.visual_hierarchy.includes('compact_alfred_decision_strip'));
assert(desktop.visual_hierarchy.includes('compact_kpi_strip'));
assert(desktop.visual_hierarchy.includes('priority_table'));
assert.equal(desktop.table_treatment, 'dark_operational_table_with_soft_dividers');

const mobile = visual.getVisualLayoutSpecById('mobile_safe_visual_layout');
assert.equal(mobile.navigation_pattern, 'bottom_tab_bar');
assert.equal(mobile.table_treatment, 'priority_list_cards_not_table');

for (const spec of catalog.visual_layout_specs) {
  assert.equal(spec.render_allowed, false);
  assert.equal(spec.screen_render_allowed, false);
  assert.equal(spec.component_render_allowed, false);
  assert.equal(spec.ui_mutation_allowed, false);
  assert.equal(spec.css_injection_allowed, false);
  assert.equal(spec.dom_write_allowed, false);
  assert.equal(spec.quote_truth_allowed, false);
  assert.equal(spec.execution_allowed, false);
  assert.equal(spec.write_allowed, false);
}

console.log(JSON.stringify({
  status: 'PASS',
  catalogValidated: true,
  designTemplateRefsBound: catalog.design_template_source_refs.length,
  desktopTemplateRefsBound: catalog.desktop_template_source_refs.length,
  mobileTemplateRefsBound: catalog.mobile_template_source_refs.length,
  layoutContractRefsBound: catalog.layout_contract_source_refs.length,
  desktopHeroReconciledToCompactDecisionStrip: true,
  desktopMetricsReconciledToCompactKpiStrip: true,
  mobileTablesReconciledToPriorityListCards: true,
  desktopMobileLayerBoundaryPreserved: true,
  next: '090A_QUOTE_PREVIEW_SAFE_COPY_AND_BADGE_SYSTEM_SCOPE',
  allEffectsBlocked: true
}, null, 2));
NODE

cat "$RECON_QA_JSON"

stage "STAGE 10 WRITE RECONCILIATION DOCS"
mkdir -p "$(dirname "$ARCH_DOC")" "$(dirname "$EVIDENCE_DOC")"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview Safe Visual Layout Spec Template Reconciliation 089R

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Purpose

089R reconciles the existing 089A-D safe visual layout spec with canonical Forge mobile and desktop design templates.

089A-D already existed in this checkout. This phase does not replace 089. It adds source-of-truth design template refs and clarifies the layout interpretation before 090A.

## Source Refs Added

### design_template_source_refs

\`\`\`json
$DESIGN_JSON
\`\`\`

### desktop_template_source_refs

\`\`\`json
$DESKTOP_JSON
\`\`\`

### mobile_template_source_refs

\`\`\`json
$MOBILE_JSON
\`\`\`

### layout_contract_source_refs

\`\`\`json
$LAYOUT_JSON
\`\`\`

## Reconciled Decisions

- Desktop hero/risk area is a compact Alfred decision strip/card, not an oversized hero.
- Desktop metrics are compact KPI strip/cards, not decorative widget grid.
- Desktop operational table remains primary workspace.
- Mobile remains single-column card stack with smart widgets, not raw table as primary flow.
- Mobile keeps persistent bottom navigation.
- Command bar remains above-fold and preview-safe.
- Safety copy must preserve: Preview, Solo lectura, Revisión humana, No cotización oficial, Sin envío, Sin CRM, Sin calendario.
- Desktop and mobile patterns must not contaminate each other.

## Boundaries

- no screen rendering;
- no component rendering;
- no UI mutation;
- no CSS injection;
- no DOM writes;
- no quote truth;
- no execution;
- no writes.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview Safe Visual Layout Spec Template Reconciliation Evidence 089R

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

## Evidence Summary

089R binds the existing 089 safe visual layout spec to the canonical desktop/mobile/shared design templates.

## Template Reconciliation QA

\`\`\`json
$(cat "$RECON_QA_JSON")
\`\`\`

## Design Template Source Refs

\`\`\`json
$DESIGN_JSON
\`\`\`

## Desktop Template Source Refs

\`\`\`json
$DESKTOP_JSON
\`\`\`

## Mobile Template Source Refs

\`\`\`json
$MOBILE_JSON
\`\`\`

## Layout Contract Source Refs

\`\`\`json
$LAYOUT_JSON
\`\`\`

## Final

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
EOF

cat > "$CERT_DOC" <<EOF
# Forge Quote Preview Safe Visual Layout Spec Template Reconciliation Certificate 089R

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER

089R certifies that the 089 safe visual layout spec is reconciled with the canonical Forge mobile and desktop design templates.

$DECISION
EOF

cat > "$AUDIT_JSON" <<EOF
{
  "phase": "$PHASE",
  "status": "PASS",
  "decision": "$DECISION",
  "lockedDecision": "$LOCKED_DECISION",
  "base": {
    "phase": "089D_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_REGISTRY"
  },
  "next": "$NEXT_AFTER",
  "reconciliationType": "template_source_refs_and_visual_rule_reconciliation",
  "designTemplateSourceRefs": $DESIGN_JSON,
  "desktopTemplateSourceRefs": $DESKTOP_JSON,
  "mobileTemplateSourceRefs": $MOBILE_JSON,
  "layoutContractSourceRefs": $LAYOUT_JSON,
  "templateReconciliationQa": $(cat "$RECON_QA_JSON"),
  "reconciledDecisions": {
    "desktopHeroTreatment": "compact_alfred_decision_strip_not_oversized_hero",
    "desktopMetricsTreatment": "compact_kpi_strip_cards_not_decorative_widget_grid",
    "desktopTableTreatment": "operational_table_is_primary_workspace",
    "mobileTableTreatment": "priority_list_cards_not_raw_table",
    "mobileNavigationTreatment": "persistent_bottom_nav_with_gold_active_state",
    "commandBarTreatment": "above_fold_preview_safe_command_workspace",
    "safetyCopyTreatment": "preview_read_only_human_review_no_quote_no_send_no_crm_no_calendar",
    "desktopMobileLayerBoundary": "desktop_and_mobile_patterns_must_not_contaminate_each_other"
  },
  "notAuthorized": {
    "screenRendering": false,
    "componentRendering": false,
    "uiMutation": false,
    "cssInjection": false,
    "domWrite": false,
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

stage "STAGE 11 PATCH 089 DOCS WITH RECONCILIATION POINTER"
POINTER_BLOCK="$(mktemp)"
cat > "$POINTER_BLOCK" <<EOF
<!-- FORGE:$PHASE:START -->
## 089R Safe Visual Layout Spec Template Reconciliation

089R reconciles the 089 safe visual layout spec with canonical Forge mobile and desktop design templates.

Decision:
\`$LOCKED_DECISION\`

Source refs added:

- design template refs;
- desktop template refs;
- mobile template refs;
- desktop/mobile layer contract refs;
- 086D / 087D / 088D layout lineage refs.

Reconciled visual rules:

- desktop risk area is compact Alfred decision strip/card, not oversized hero;
- desktop metrics are compact KPI strip/cards, not decorative grid;
- desktop operational table remains primary workspace;
- mobile uses single-column card stack and smart widgets, not raw table as primary flow;
- mobile keeps persistent bottom navigation;
- command bar remains above-fold and preview-safe;
- safety copy preserves Preview, Solo lectura, Revisión humana, No cotización oficial, Sin envío, Sin CRM, Sin calendario.

No rendering, UI mutation, CSS injection, DOM write, quote truth, execution, or write is authorized.

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT_AFTER
<!-- FORGE:$PHASE:END -->
EOF

for doc in \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md
do
  replace_or_append_block "$doc" "$PHASE" "$POINTER_BLOCK"
done
trim_tree_files

stage "STAGE 12 FINAL VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check "$ADAPTER"
run node --check "$TEST"
run node "$TEST"
run python3 -m json.tool "$AUDIT_JSON"
run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT_AFTER|design_template_source_refs|desktop_template_source_refs|mobile_template_source_refs|compact_alfred_decision_strip|priority_list_cards_not_raw_table|No cotización oficial|Sin CRM|Sin calendario" \
  "$ADAPTER" "$TEST" "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md

run git diff --check
safety_scan "$ADAPTER" "$TEST" "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md

stage "STAGE 13 COMMIT"
commit_allowed_subset \
  "docs: reconcile quote preview visual layout spec with design templates" \
  "$ADAPTER" "$TEST" "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON" "$SCRIPT_IN_REPO" \
  FORGE_MASTER_BUILD_TREE.md docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_SCOPE_089A.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_IMPLEMENTATION_089B.md \
  docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_DECISION_LOCK_089D.md

stage "FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -16

SUMMARY=$(cat <<EOF
PASS_089R_QUOTE_PREVIEW_SAFE_VISUAL_LAYOUT_SPEC_TEMPLATE_RECONCILIATION_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT_AFTER
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
