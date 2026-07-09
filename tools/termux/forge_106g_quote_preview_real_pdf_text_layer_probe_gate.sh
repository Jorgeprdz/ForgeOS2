#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-text-layer-probe-gate-106g.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-text-layer-probe-gate-validation-106g.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-real-pdf-text-layer-probe-gate-audit-106g.json" >/dev/null
grep -q 'TEXT_LAYER_PROBE_GATE_LOCKED_WITH_NO_CONTENT_READ_AND_NO_RAW_TEXT_COMMIT' "docs/evidence/forge-quote-preview-real-pdf-text-layer-probe-gate-106g.json"
grep -q '106H_QUOTE_PREVIEW_REAL_PDF_TEXT_LAYER_PROBE_DRY_RUN' "docs/evidence/forge-quote-preview-real-pdf-text-layer-probe-gate-106g.json"
echo "PASS_106G_PRESERVED_SCRIPT_VALIDATION"
