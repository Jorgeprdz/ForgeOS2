#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-discovery-105a.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-discovery-safety-repair-validation-105ar.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-new-quote-page-discovery-safety-repair-105ar.json" >/dev/null
echo "PASS_105AR_PRESERVED_SCRIPT_VALIDATION"
