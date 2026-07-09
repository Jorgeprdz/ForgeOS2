#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-size-repair-validation-104r3.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-size-repair-manifest-104r3.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-size-repair-audit-104r3.json" >/dev/null
echo "PASS_104R3_PRESERVED_SCRIPT_VALIDATION"
