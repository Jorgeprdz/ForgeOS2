#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-local-dry-run-prep-106f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-local-dry-run-prep-validation-106f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-local-dry-run-prep-audit-106f.json" >/dev/null
grep -q 'REAL_PDF_LOCAL_REFERENCE_PREPARED_OUTSIDE_REPO_WITH_NO_CONTENT_READ' "docs/evidence/forge-quote-preview-real-pdf-local-dry-run-prep-106f.json"
grep -q '106G_QUOTE_PREVIEW_REAL_PDF_TEXT_LAYER_PROBE_GATE' "docs/evidence/forge-quote-preview-real-pdf-local-dry-run-prep-106f.json"
echo "PASS_106F_PRESERVED_SCRIPT_VALIDATION"
