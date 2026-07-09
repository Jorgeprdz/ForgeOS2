#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-scope-audit-098a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-scope-098a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-discovery-098a.json" >/dev/null
echo "PASS_098A_PRESERVED_SCRIPT_VALIDATION"
