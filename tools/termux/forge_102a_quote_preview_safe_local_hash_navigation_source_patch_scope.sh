#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-source-patch-discovery-102a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-source-patch-scope-102a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-source-patch-scope-audit-102a.json" >/dev/null
echo "PASS_102A_PRESERVED_SCRIPT_VALIDATION"
