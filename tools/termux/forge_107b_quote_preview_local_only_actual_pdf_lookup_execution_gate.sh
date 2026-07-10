#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-execution-gate-107b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-execution-gate-validation-107b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-execution-gate-audit-107b.json" >/dev/null
grep -q 'LOCAL_ONLY_ACTUAL_PDF_LOOKUP_EXECUTION_GATE_LOCKED_NO_EXECUTION_YET_NO_RAW_TEXT_COMMIT_NO_TRUTH' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-execution-gate-107b.json"
grep -q '107C_QUOTE_PREVIEW_LOCAL_ONLY_ACTUAL_PDF_LOOKUP_DRY_RUN' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-execution-gate-107b.json"
echo "PASS_107B_PRESERVED_SCRIPT_VALIDATION"
