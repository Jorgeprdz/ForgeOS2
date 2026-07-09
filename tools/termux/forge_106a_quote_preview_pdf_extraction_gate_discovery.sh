#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-pdf-extraction-gate-discovery-106a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-pdf-extraction-gate-discovery-validation-106a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-pdf-extraction-gate-discovery-audit-106a.json" >/dev/null
grep -q 'PDF_EXTRACTION_GATE_DEFINED_AS_DRY_RUN_ONLY_WITH_NO_PDF_READ_OR_PARSER_EXECUTION' "docs/evidence/forge-quote-preview-pdf-extraction-gate-discovery-106a.json"
grep -q '106B_QUOTE_PREVIEW_REAL_PDF_DRY_RUN_SCOPE' "docs/evidence/forge-quote-preview-pdf-extraction-gate-discovery-106a.json"
echo "PASS_106A_PRESERVED_SCRIPT_VALIDATION"
