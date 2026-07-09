#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-summary-print-repair-105dr3.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-summary-print-repair-validation-105dr3.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-summary-print-repair-audit-105dr3.json" >/dev/null
grep -q 'href="./nueva-cotizacion/?v=105dr3"' "docs/static-preview/forge-alive/index.html"
grep -q 'Resumen de la cotización' "docs/static-preview/forge-alive/nueva-cotizacion/index.html"
grep -q 'Imprimir resumen' "docs/static-preview/forge-alive/nueva-cotizacion/index.html"
echo "PASS_105DR3_PRESERVED_SCRIPT_VALIDATION"
