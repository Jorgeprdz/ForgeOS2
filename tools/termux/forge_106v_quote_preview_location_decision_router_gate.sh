#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-location-decision-router-gate-106v.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-location-decision-router-gate-validation-106v.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-location-decision-router-gate-audit-106v.json" >/dev/null
grep -q 'LOCATION_DECISION_ROUTER_GATE_LOCKED_TO_MANUAL_PDF_LOOKUP_GATE_NO_VALUES_NO_TRUTH' "docs/evidence/forge-quote-preview-location-decision-router-gate-106v.json"
grep -q '106W_QUOTE_PREVIEW_MANUAL_PDF_LOOKUP_GATE' "docs/evidence/forge-quote-preview-location-decision-router-gate-106v.json"
echo "PASS_106V_PRESERVED_SCRIPT_VALIDATION"
