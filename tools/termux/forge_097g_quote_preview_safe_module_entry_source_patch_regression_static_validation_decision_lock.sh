#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-source-patch-regression-static-validation-decision-audit-097g.json" >/dev/null
echo "PASS_097G_PRESERVED_SCRIPT_VALIDATION"
