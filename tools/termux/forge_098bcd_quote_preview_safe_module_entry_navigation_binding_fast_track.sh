#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-plan-098b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-plan-qa-audit-098c.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-decision-audit-098d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-fast-track-audit-098bcd.json" >/dev/null
echo "PASS_098BCD_PRESERVED_SCRIPT_VALIDATION"
