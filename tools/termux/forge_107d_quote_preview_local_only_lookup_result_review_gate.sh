#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-lookup-result-review-gate-107d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-lookup-result-review-gate-validation-107d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-lookup-result-review-gate-audit-107d.json" >/dev/null
grep -q 'LOCAL_ONLY_LOOKUP_RESULT_REVIEW_GATE_LOCKED_FOR_REDACTED_RESULT_REVIEW_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-local-only-lookup-result-review-gate-107d.json"
grep -q '107E_QUOTE_PREVIEW_REDACTED_LOOKUP_RESULT_MAPPING_GATE' "docs/evidence/forge-quote-preview-local-only-lookup-result-review-gate-107d.json"
echo "PASS_107D_PRESERVED_SCRIPT_VALIDATION"
