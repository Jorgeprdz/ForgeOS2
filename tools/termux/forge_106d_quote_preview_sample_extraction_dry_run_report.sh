#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-sample-extraction-dry-run-report-106d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-sample-extraction-dry-run-report-validation-106d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-sample-extraction-dry-run-report-audit-106d.json" >/dev/null
grep -q 'SAMPLE_EXTRACTION_DRY_RUN_REPORT_LOCKED_WITH_REDACTED_CANDIDATES_ONLY' "docs/evidence/forge-quote-preview-sample-extraction-dry-run-report-106d.json"
grep -q '106E_QUOTE_PREVIEW_PARSER_ADAPTER_SCOPE' "docs/evidence/forge-quote-preview-sample-extraction-dry-run-report-106d.json"
echo "PASS_106D_PRESERVED_SCRIPT_VALIDATION"
