#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-scope-100a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-plan-100b.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-plan-qa-audit-100c.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-plan-decision-audit-100d.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-static-validation-result-100e.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-static-validation-qa-audit-100f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-static-validation-decision-audit-100g.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-safe-module-entry-navigation-binding-source-patch-regression-fast-track-audit-100abcdefg.json" >/dev/null
echo "PASS_100ABCDEFG_PRESERVED_SCRIPT_VALIDATION"
