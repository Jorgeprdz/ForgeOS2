#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-packet-dry-run-106x.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-packet-dry-run-validation-106x.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-packet-dry-run-audit-106x.json" >/dev/null
grep -q 'MANUAL_PDF_LOOKUP_PACKET_DRY_RUN_COMPLETE_AS_CHECKLIST_ONLY_NO_PDF_ACCESS_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-manual-pdf-lookup-packet-dry-run-106x.json"
grep -q '106Y_QUOTE_PREVIEW_ACTUAL_PDF_LOOKUP_AUTHORIZATION_GATE' "docs/evidence/forge-quote-preview-manual-pdf-lookup-packet-dry-run-106x.json"
echo "PASS_106X_PRESERVED_SCRIPT_VALIDATION"
