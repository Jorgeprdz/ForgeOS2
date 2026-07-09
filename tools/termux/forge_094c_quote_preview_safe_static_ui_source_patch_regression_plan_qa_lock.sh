#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-static-ui-source-patch-regression-plan-qa-audit-094c.json" >/dev/null
echo "PASS_094C_PRESERVED_SCRIPT_VALIDATION"
