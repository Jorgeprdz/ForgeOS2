#!/usr/bin/env bash
set -euo pipefail

PHASE="076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE"
DECISION="PASS_076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE"
LOCKED_DECISION="QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPED"
NEXT="076B_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_IMPLEMENTATION"
MODE="docs/scope only"
BOUNDARY="no UI mutation; no backend real; no CRM/policy/quote/pipeline writes; no task/calendar/message; no provider execution with effects; no auth/secrets/browser persistence; no real engine execution; no parser/calculator/Banxico/PDF execution; no invented product/premium/coverage/projection/quote truth"
REPO="${REPO:-/storage/emulated/0/Forge OS}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="/data/data/com.termux/files/home/${PHASE}_RESULT_${STAMP}.md"
BACKUP_DIR=".forge-backups/076a-quote-preview-pdf-engine-repo-promotion-scope-${STAMP}"
SCRIPT_IN_REPO="tools/termux/forge_076a_quote_preview_pdf_engine_repo_promotion_scope.sh"

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

mkdir -p "$(dirname "$REPORT")"
touch "$REPORT"
exec > >(tee -a "$REPORT") 2>&1

stage "STAGE 0 HEADER"
echo "PHASE=$PHASE"
echo "MODE=$MODE"
echo "BOUNDARY=$BOUNDARY"
echo "REPORT=$REPORT"
echo "ROBOCOP_GATE=Article 0; 075D decision closed; scope only"

cd "$REPO" || fail "No existe repo: $REPO"

stage "STAGE 1 CHECKPOINT"
run git status --short --branch
run git log --oneline -12
run git diff --name-status
run git diff --cached --name-status

stage "STAGE 2 CONFIRM BASE 075D"
if git log --oneline -40 | grep -Eq "075D|lock quote preview pdf product intelligence integration decision|QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION"; then
  pass "075D commit found in recent history"
elif [ -f "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json" ]; then
  pass "075D audit fallback found"
else
  fail "075D base not found"
fi

if [ -f "docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json" ]; then
  run python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json
  if ! rg -n '"status"\s*:\s*"PASS"|"lockedDecision"\s*:\s*"QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER"' docs/evidence/forge-quote-preview-pdf-engine-product-intelligence-integration-decision-audit-075d.json >/dev/null; then
    fail "075D audit exists but does not show PASS/decision lock"
  fi
  pass "075D audit PASS/decision lock confirmed"
else
  warn "075D audit file not found; relying on git log/tree markers"
fi

stage "STAGE 3 REQUIRED FILES"
REQUIRED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js"
  "tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js"
  "platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js"
  "platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || fail "Missing required file: $f"
  pass "$f"
done

stage "STAGE 4 BACKUP"
mkdir -p "$BACKUP_DIR"
cp FORGE_MASTER_BUILD_TREE.md "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md"
cp docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md"
cp docs/roadmap/FORGE_ROADMAP_LOCK_001.md "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md"

cat > "$BACKUP_DIR/rollback-076a.sh" <<ROLLBACK
#!/usr/bin/env bash
set -euo pipefail
cp "$BACKUP_DIR/FORGE_MASTER_BUILD_TREE.md" "FORGE_MASTER_BUILD_TREE.md"
cp "$BACKUP_DIR/FORGE_UNIFIED_BUILD_TREE_001.md" "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
cp "$BACKUP_DIR/FORGE_ROADMAP_LOCK_001.md" "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
rm -f docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_076A.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_076A.md
rm -f docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_CERTIFICATE_076A.md
rm -f docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-scope-audit-076a.json
rm -f "$SCRIPT_IN_REPO"
echo "rollback 076A complete"
ROLLBACK
chmod +x "$BACKUP_DIR/rollback-076a.sh"
pass "backup created"
pass "rollback created: $BACKUP_DIR/rollback-076a.sh"

stage "STAGE 5 REVALIDATE LOCKED BASE"
run node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js
run node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js

stage "STAGE 6 WRITE DOCS / EVIDENCE"

ARCH_DOC="docs/architecture/source-truth/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_076A.md"
EVIDENCE_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_076A.md"
CERT_DOC="docs/evidence/FORGE_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_CERTIFICATE_076A.md"
AUDIT_JSON="docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-scope-audit-076a.json"

cat > "$ARCH_DOC" <<EOF
# Forge Quote Preview PDF Engine Repo Promotion Scope 076A

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Purpose

076A scopes the repository promotion path for the Quote Preview PDF Engine after Product Intelligence binding has been decision-locked.

This phase does not promote runtime behavior. It defines the constraints for a future local/static/read-only repo promotion of quote preview PDF engine surfaces.

## Base Confirmed

075D is closed as:

- \`PASS_075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK\`
- \`QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER\`
- \`NEXT=076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE\`

## Scope Decision

Quote Preview PDF Engine repo promotion may proceed only if the promoted surface:

- binds through Product Intelligence before quote-specific preview behavior;
- consumes the Quote Preview Product Intelligence binding;
- keeps Product Intelligence as upstream semantic authority;
- keeps Quote Preview PDF Engine as downstream consumer/reference;
- remains local/static/read-only during promotion;
- exposes evidence and freshness requirements;
- preserves safe empty and safe error behavior;
- does not duplicate Product Intelligence parsers or calculators;
- does not convert PDF preview into quote truth.

## Required Future 076B Shape

Future 076B may implement a local/static/read-only promotion adapter only.

The adapter must expose references equivalent to:

- \`ADAPTER_ID\`
- \`SCHEMA_VERSION\`
- \`SAFE_ERROR_CODES\`
- \`DEFAULT_SAFETY_FLAGS\`
- \`REQUIRED_PROMOTION_FIELDS\`
- \`getQuotePreviewPdfEnginePromotionManifest()\`
- \`prepareQuotePreviewPdfEnginePromotionScope(request)\`
- \`buildQuotePreviewPdfEnginePromotionError(request)\`
- \`validateQuotePreviewPdfEnginePromotionShape(promotion)\`

## Required Promotion Fields

- \`quote_preview_pdf_promotion_id\`
- \`quote_preview_pdf_request_id\`
- \`product_intelligence_binding_ref\`
- \`product_intelligence_ref\`
- \`product_family\`
- \`source_document_ref\`
- \`source_evidence_refs\`
- \`parser_ref\`
- \`calculator_refs\`
- \`quote_preview_pdf_engine_ref\`
- \`evidence_requirements\`
- \`freshness_requirements\`
- \`preview_constraints\`
- \`blocked_effects\`
- \`safety_flags\`
- \`safe_error\`

## Safe Errors

- \`QUOTE_PREVIEW_PDF_ENGINE_PROMOTION_NOT_SCOPED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_BINDING_REQUIRED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_FAMILY_NOT_MAPPED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_PARSER_NOT_MAPPED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_CALCULATOR_NOT_MAPPED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_SOURCE_EVIDENCE_REQUIRED\`
- \`QUOTE_PREVIEW_PDF_ENGINE_FRESHNESS_REQUIRED\`

## Non-Authorization

076A does not authorize:

- PDF read;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- quote generation;
- quote write or send;
- CRM, policy, pipeline, task, calendar, or message writes;
- backend connection;
- real engine execution;
- invented product, premium, coverage, projection, or quote truth.

## Final Decision

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT
EOF

cat > "$EVIDENCE_DOC" <<EOF
# Forge Quote Preview PDF Engine Repo Promotion Scope 076A

PHASE=$PHASE

STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Evidence Summary

076A scopes repo promotion for Quote Preview PDF Engine after the Product Intelligence integration decision lock.

The scope confirms that future promotion must remain Product Intelligence-bound and preview-safe.

## Confirmed Base

075D locked the integration as a local/static/read-only reference adapter.

Validated base assets:

- \`platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js\`
- \`tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js\`
- \`platform/adapters/quote-preview/quote-preview-product-intelligence-binding-adapter-074b.js\`
- \`platform/adapters/product-intelligence/product-intelligence-read-model-adapter-073d.js\`

## Scope Evidence

Future repo promotion must:

- bind through Product Intelligence;
- remain read-only;
- operate by references only;
- preserve evidence and freshness requirements;
- preserve safe errors;
- block all real effects;
- avoid PDF/parser/calculator/Banxico execution;
- avoid quote truth creation.

## Commands

- \`node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js\`
- \`node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js\`
- \`node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js\`
- \`python3 -m json.tool docs/evidence/forge-quote-preview-pdf-engine-repo-promotion-scope-audit-076a.json\`
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
# Forge Quote Preview PDF Engine Repo Promotion Scope Certificate 076A

PHASE=$PHASE

CERTIFICATE_STATUS=PASS

DECISION=$DECISION

LOCKED_DECISION=$LOCKED_DECISION

NEXT=$NEXT

## Certificate

076A certifies that Quote Preview PDF Engine repo promotion is scoped only as a future Product Intelligence-bound local/static/read-only promotion.

Certified statements:

- Product Intelligence remains upstream semantic authority.
- Quote Preview Product Intelligence binding is required.
- Quote Preview PDF Engine remains downstream consumer/reference.
- Future promotion must be evidence/freshness-aware.
- Future promotion must preserve safe errors and blocked effects.
- Future promotion must not duplicate Product Intelligence parsers or calculators.
- Future promotion must not create quote truth.

## No-Effect Boundary

This certificate authorizes no PDF reads, parser execution, calculator execution, Banxico calls, quote generation, quote writes, provider calls, backend connection, or real effects.

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
    "phase": "075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK",
    "confirmed": true,
    "lockedDecision": "QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER"
  },
  "next": "$NEXT",
  "mode": "docs_scope_only",
  "scope": {
    "repoPromotionAllowedOnlyAsFutureLocalStaticReadOnlyAdapter": true,
    "productIntelligenceBindingRequired": true,
    "productIntelligenceUpstreamSemanticAuthority": true,
    "quotePreviewPdfEngineDownstreamConsumerReferenceOnly": true,
    "evidenceFreshnessRequired": true,
    "safeErrorsRequired": true,
    "blockedEffectsRequired": true,
    "quoteTruthCreationAllowed": false
  },
  "requiredFutureFields": [
    "quote_preview_pdf_promotion_id",
    "quote_preview_pdf_request_id",
    "product_intelligence_binding_ref",
    "product_intelligence_ref",
    "product_family",
    "source_document_ref",
    "source_evidence_refs",
    "parser_ref",
    "calculator_refs",
    "quote_preview_pdf_engine_ref",
    "evidence_requirements",
    "freshness_requirements",
    "preview_constraints",
    "blocked_effects",
    "safety_flags",
    "safe_error"
  ],
  "safeErrors": [
    "QUOTE_PREVIEW_PDF_ENGINE_PROMOTION_NOT_SCOPED",
    "QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_BINDING_REQUIRED",
    "QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_FAMILY_NOT_MAPPED",
    "QUOTE_PREVIEW_PDF_ENGINE_PARSER_NOT_MAPPED",
    "QUOTE_PREVIEW_PDF_ENGINE_CALCULATOR_NOT_MAPPED",
    "QUOTE_PREVIEW_PDF_ENGINE_SOURCE_EVIDENCE_REQUIRED",
    "QUOTE_PREVIEW_PDF_ENGINE_FRESHNESS_REQUIRED"
  ],
  "notAuthorized": {
    "pdfRead": false,
    "parserExecution": false,
    "calculatorExecution": false,
    "banxicoCall": false,
    "providerCall": false,
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
    "backendConnection": false
  },
  "validations": {
    "nodeCheckAdapter075b": "PASS",
    "nodeCheckTest075b": "PASS",
    "nodeTest075b": "PASS",
    "jsonTool": "PASS",
    "markerScan": "PASS",
    "gitDiffCheck": "PASS",
    "scopedSafetyScan": "PASS",
    "stagedDiffCheck": "PASS"
  }
}
EOF

pass "docs/evidence written"

stage "STAGE 7 UPDATE BUILD TREE / ROADMAP"

TREE_BLOCK=$(cat <<EOF

<!-- FORGE:$PHASE:START -->
## 076A Quote Preview PDF Engine Repo Promotion Scope

076A scopes Quote Preview PDF Engine repo promotion after Product Intelligence integration was decision-locked.

Locked decision:
\`$LOCKED_DECISION\`

Scope confirmed:

- future repo promotion must bind through Product Intelligence;
- Product Intelligence remains upstream semantic authority;
- Quote Preview Product Intelligence binding is required;
- Quote Preview PDF Engine remains downstream consumer/reference only;
- future 076B may implement only a local/static/read-only promotion adapter;
- evidence, freshness, safe errors, blocked effects, and safety flags are required;
- no PDF read, parser execution, calculator execution, Banxico call, provider call, quote write, backend connection, or real engine execution is authorized.

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

stage "STAGE 8 SAVE SCRIPT IN REPO"
mkdir -p "$(dirname "$SCRIPT_IN_REPO")"
cp "$0" "$SCRIPT_IN_REPO"
chmod +x "$SCRIPT_IN_REPO"
pass "$SCRIPT_IN_REPO"

stage "STAGE 9 VALIDATION"
run bash -n "$SCRIPT_IN_REPO"
run node --check platform/adapters/quote-preview/quote-preview-pdf-product-intelligence-integration-adapter-075b.js
run node --check tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run node tests/quote-preview-pdf-product-intelligence-integration-adapter-075b-test.js
run python3 -m json.tool "$AUDIT_JSON"

run rg -n "$PHASE|$DECISION|$LOCKED_DECISION|$NEXT|QUOTE_PREVIEW_PDF_ENGINE_PROMOTION_NOT_SCOPED|QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_BINDING_REQUIRED" \
  FORGE_MASTER_BUILD_TREE.md \
  docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md \
  docs/roadmap/FORGE_ROADMAP_LOCK_001.md \
  "$ARCH_DOC" "$EVIDENCE_DOC" "$CERT_DOC" "$AUDIT_JSON"

run git diff --check

stage "STAGE 10 SAFETY SCAN"
SCOPED_FILES=(
  "FORGE_MASTER_BUILD_TREE.md"
  "docs/architecture/source-truth/FORGE_UNIFIED_BUILD_TREE_001.md"
  "docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
  "$ARCH_DOC"
  "$EVIDENCE_DOC"
  "$CERT_DOC"
  "$AUDIT_JSON"
)

if rg -n 'localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.mediaDevices|SpeechRecognition|providerRuntimeEnabled:\s*true|networkCallsAllowed:\s*true|browserStorageEnabled:\s*true|mayCreateTruth:\s*true|maySendMessage:\s*true|mayWriteCrm:\s*true|mayCreateCalendarEvent:\s*true' "${SCOPED_FILES[@]}"; then
  fail "safety scan found prohibited runtime/browser/network marker"
fi

if rg -n '"?(crmWrite|pipelineWrite|policyWrite|quoteWrite|taskCreate|calendarCreate|messageSend|authReal|providerRuntime|secretAccess|browserPersistence|realEngineExecution|realEffectsAllowed|realEffectsEnabled|backendConnection)"?\s*[:=]\s*true\b' "${SCOPED_FILES[@]}"; then
  fail "real-effect flag true found"
fi

pass "safety scan clean"

stage "STAGE 11 STAGE AUTHORIZED FILES"
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

stage "STAGE 12 COMMIT PUSH"
run git commit -m "docs: scope quote preview pdf engine repo promotion"
run git push origin HEAD:main

stage "STAGE 13 FINAL CHECKPOINT"
run git status --short --branch
run git log --oneline -10

SUMMARY=$(cat <<EOF
PASS_076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE_COMMIT_PUSH_COMPLETE
DECISION=$DECISION
LOCKED_DECISION=$LOCKED_DECISION
NEXT=$NEXT
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
