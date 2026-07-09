#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-static-ui-source-patch-regression-static-validation-decision-audit-094g.json" >/dev/null
echo "PASS_094G_PRESERVED_SCRIPT_VALIDATION"
