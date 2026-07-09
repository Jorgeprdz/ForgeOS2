#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-visible-link-ui-repair-validation-104r.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-visible-link-ui-repair-manifest-104r.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-visible-link-ui-repair-audit-104r.json" >/dev/null
echo "PASS_104R_PRESERVED_SCRIPT_VALIDATION"
