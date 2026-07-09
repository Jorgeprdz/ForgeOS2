#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-gate-106w.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-gate-validation-106w.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-pdf-lookup-gate-audit-106w.json" >/dev/null
grep -q 'MANUAL_PDF_LOOKUP_GATE_LOCKED_AS_PREP_ONLY_NO_PDF_ACCESS_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-manual-pdf-lookup-gate-106w.json"
grep -q '106X_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_PACKET_DRY_RUN' "docs/evidence/forge-quote-preview-manual-pdf-lookup-gate-106w.json"
echo "PASS_106W_PRESERVED_SCRIPT_VALIDATION"
