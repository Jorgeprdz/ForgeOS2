#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-regression-scope-audit-097a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-regression-scope-097a.json" >/dev/null
echo "PASS_097A_PRESERVED_SCRIPT_VALIDATION"
