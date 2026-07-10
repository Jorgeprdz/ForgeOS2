#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-lookup-result-mapping-dry-run-107f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-lookup-result-mapping-dry-run-validation-107f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-redacted-lookup-result-mapping-dry-run-audit-107f.json" >/dev/null
grep -q 'REDACTED_LOOKUP_RESULT_MAPPING_DRY_RUN_COMPLETE_WITH_FIELD_CANDIDATE_STATES_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-redacted-lookup-result-mapping-dry-run-107f.json"
grep -q '107G_QUOTE_PREVIEW_MANUAL_VALUE_CAPTURE_GATE' "docs/evidence/forge-quote-preview-redacted-lookup-result-mapping-dry-run-107f.json"
echo "PASS_107F_PRESERVED_SCRIPT_VALIDATION"
