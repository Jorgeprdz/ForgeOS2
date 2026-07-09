#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-upload-send-summary-repair-105dr5.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-upload-send-summary-repair-validation-105dr5.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-upload-send-summary-repair-audit-105dr5.json" >/dev/null
grep -q 'href="./nueva-cotizacion/?v=105dr5"' "docs/static-preview/forge-alive/index.html"
grep -q 'Seleccionar PDF' "docs/static-preview/forge-alive/nueva-cotizacion/index.html"
grep -q 'Enviar PDF para extracción' "docs/static-preview/forge-alive/nueva-cotizacion/index.html"
grep -q 'Resumen de la cotización' "docs/static-preview/forge-alive/nueva-cotizacion/index.html"
echo "PASS_105DR5_PRESERVED_SCRIPT_VALIDATION"
