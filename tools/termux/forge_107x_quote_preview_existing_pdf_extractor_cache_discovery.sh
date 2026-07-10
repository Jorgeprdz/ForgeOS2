#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-existing-pdf-extractor-cache-discovery-107x.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-existing-pdf-extractor-cache-discovery-validation-107x.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-existing-pdf-extractor-cache-discovery-audit-107x.json" >/dev/null
grep -q 'EXISTING_PDF_EXTRACTOR_AND_CACHE_DISCOVERY_REQUIRED_BEFORE_NEW_BRIDGE' "docs/evidence/forge-quote-preview-existing-pdf-extractor-cache-discovery-107x.json"
grep -q '107Y_QUOTE_PREVIEW_EXISTING_PDF_CACHE_CONTRACT_LOCK' "docs/evidence/forge-quote-preview-existing-pdf-extractor-cache-discovery-107x.json"
echo "PASS_107X_EXISTING_PDF_EXTRACTOR_CACHE_DISCOVERY_PRESERVED"
