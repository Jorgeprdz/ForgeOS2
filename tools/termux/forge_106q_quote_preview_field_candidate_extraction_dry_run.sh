#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-field-candidate-extraction-dry-run-106q.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-field-candidate-extraction-dry-run-validation-106q.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-field-candidate-extraction-dry-run-audit-106q.json" >/dev/null
grep -q 'FIELD_CANDIDATE_EXTRACTION_DRY_RUN_COMPLETE_WITH_REDACTED_PLACEHOLDERS_ONLY_NO_REAL_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-field-candidate-extraction-dry-run-106q.json"
grep -q '106R_QUOTE_PREVIEW_CANDIDATE_REVIEW_PACKET_GATE' "docs/evidence/forge-quote-preview-field-candidate-extraction-dry-run-106q.json"
echo "PASS_106Q_PRESERVED_SCRIPT_VALIDATION"
