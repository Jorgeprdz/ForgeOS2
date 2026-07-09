#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-validation-099b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-implementation-manifest-099b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-qa-audit-099c.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-decision-audit-099d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-fast-track-audit-099bcd.json" >/dev/null
echo "PASS_099BCD_PRESERVED_SCRIPT_VALIDATION"
