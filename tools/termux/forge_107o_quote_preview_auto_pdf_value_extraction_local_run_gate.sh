#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-auto-pdf-value-extraction-local-run-gate-107o.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-auto-pdf-value-extraction-local-run-gate-validation-107o.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-auto-pdf-value-extraction-local-run-gate-audit-107o.json" >/dev/null
grep -q 'AUTO_PDF_VALUE_EXTRACTION_LOCAL_RUN_COMPLETE_VALUES_LOCAL_ONLY_REDACTED_RECEIPT_COMMITTED_NO_TRUTH_NO_UI' "docs/evidence/forge-quote-preview-auto-pdf-value-extraction-local-run-gate-107o.json"
grep -q '107P_QUOTE_PREVIEW_EXTRACTION_CONFIRMATION_MODAL_UI_GATE' "docs/evidence/forge-quote-preview-auto-pdf-value-extraction-local-run-gate-107o.json"
echo "PASS_107O_PRESERVED_SCRIPT_VALIDATION"
