#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-class-repair-validation-104r2r.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-class-repair-manifest-104r2r.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-local-hash-navigation-nav-item-class-repair-audit-104r2r.json" >/dev/null
echo "PASS_104R2R_PRESERVED_SCRIPT_VALIDATION"
