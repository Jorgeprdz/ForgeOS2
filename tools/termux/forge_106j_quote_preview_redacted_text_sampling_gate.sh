#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-text-sampling-gate-106j.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-text-sampling-gate-validation-106j.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-text-sampling-gate-audit-106j.json" >/dev/null
grep -q 'REDACTED_TEXT_SAMPLING_GATE_LOCKED_WITH_NO_FIELD_EXTRACTION_NO_PARSER_NO_QUOTE_TRUTH' "docs/evidence/forge-quote-preview-redacted-text-sampling-gate-106j.json"
grep -q '106K_QUOTE_PREVIEW_REDACTED_TEXT_SAMPLING_DRY_RUN' "docs/evidence/forge-quote-preview-redacted-text-sampling-gate-106j.json"
echo "PASS_106J_PRESERVED_SCRIPT_VALIDATION"
