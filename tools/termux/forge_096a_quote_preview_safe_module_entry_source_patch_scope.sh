#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-scope-audit-096a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-scope-096a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-discovery-096a.json" >/dev/null
echo "PASS_096A_PRESERVED_SCRIPT_VALIDATION"
