#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-regression-static-validation-result-097e.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-regression-static-validation-audit-097e.json" >/dev/null
echo "PASS_097E_PRESERVED_SCRIPT_VALIDATION"
