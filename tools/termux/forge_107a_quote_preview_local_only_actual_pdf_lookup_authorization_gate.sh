#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-authorization-gate-107a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-authorization-gate-validation-107a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-authorization-gate-audit-107a.json" >/dev/null
grep -q 'LOCAL_ONLY_ACTUAL_PDF_LOOKUP_AUTHORIZATION_GATE_LOCKED_WITH_OPERATOR_CONFIRMATION_NO_EXECUTION_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-authorization-gate-107a.json"
grep -q '107B_QUOTE_PREVIEW_LOCAL_ONLY_ACTUAL_PDF_LOOKUP_EXECUTION_GATE' "docs/evidence/forge-quote-preview-local-only-actual-pdf-lookup-authorization-gate-107a.json"
echo "PASS_107A_PRESERVED_SCRIPT_VALIDATION"
