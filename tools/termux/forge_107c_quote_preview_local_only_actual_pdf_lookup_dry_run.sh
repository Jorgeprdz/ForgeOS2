#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-dry-run-107c.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-dry-run-validation-107c.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-dry-run-audit-107c.json" >/dev/null
grep -q 'LOCAL_ONLY_ACTUAL_PDF_LOOKUP_DRY_RUN_COMPLETE_WITH_REDACTED_RESULTS_ONLY_NO_RAW_TEXT_NO_TRUTH' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-dry-run-107c.json"
grep -q '107D_QUOTE_PREVIEW_LOCAL_ONLY_LOOKUP_RESULT_REVIEW_GATE' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-dry-run-107c.json"
echo "PASS_107C_PRESERVED_SCRIPT_VALIDATION"
