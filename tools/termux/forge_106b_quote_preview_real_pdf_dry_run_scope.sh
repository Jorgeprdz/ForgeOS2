#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-dry-run-scope-106b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-dry-run-scope-validation-106b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-dry-run-scope-audit-106b.json" >/dev/null
grep -q 'REAL_PDF_DRY_RUN_SCOPE_LOCKED_WITH_REDACTION_AND_NO_RAW_PDF_COMMIT' "docs/evidence/forge-quote-preview-real-pdf-dry-run-scope-106b.json"
grep -q '106C_QUOTE_PREVIEW_EXTRACTION_SCHEMA_LOCK' "docs/evidence/forge-quote-preview-real-pdf-dry-run-scope-106b.json"
echo "PASS_106B_PRESERVED_SCRIPT_VALIDATION"
