#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-template-dry-run-107h.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-template-dry-run-validation-107h.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-template-dry-run-audit-107h.json" >/dev/null
grep -q 'MANUAL_VALUE_CAPTURE_TEMPLATE_DRY_RUN_COMPLETE_WITH_NULL_VALUES_NO_TRUTH_NO_UI' "docs/evidence/forge-quote-preview-manual-value-capture-template-dry-run-107h.json"
grep -q '107I_QUOTE_PREVIEW_MANUAL_VALUE_CAPTURE_AUTHORIZATION_GATE' "docs/evidence/forge-quote-preview-manual-value-capture-template-dry-run-107h.json"
echo "PASS_107H_PRESERVED_SCRIPT_VALIDATION"
