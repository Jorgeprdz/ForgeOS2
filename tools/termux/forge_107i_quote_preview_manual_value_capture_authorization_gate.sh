#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-authorization-gate-107i.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-authorization-gate-validation-107i.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-manual-value-capture-authorization-gate-audit-107i.json" >/dev/null
grep -q 'MANUAL_VALUE_CAPTURE_AUTHORIZATION_GATE_LOCKED_WITH_OPERATOR_CONFIRMATION_NO_VALUES_NO_TRUTH_NO_UI' "docs/evidence/forge-quote-preview-manual-value-capture-authorization-gate-107i.json"
grep -q '107J_QUOTE_PREVIEW_MANUAL_VALUE_CAPTURE_EXECUTION_GATE' "docs/evidence/forge-quote-preview-manual-value-capture-authorization-gate-107i.json"
echo "PASS_107I_PRESERVED_SCRIPT_VALIDATION"
