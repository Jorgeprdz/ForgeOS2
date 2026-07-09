#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-human-visual-confirmation-105f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-human-visual-confirmation-validation-105f.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-human-visual-confirmation-audit-105f.json" >/dev/null
test -s "docs/evidence/forge-new-quote-page-upload-send-summary-visual-qa-105e-desktop.png"
test -s "docs/evidence/forge-new-quote-page-upload-send-summary-visual-qa-105e-tablet.png"
test -s "docs/evidence/forge-new-quote-page-upload-send-summary-visual-qa-105e-mobile.png"
echo "PASS_105F_PRESERVED_SCRIPT_VALIDATION"
