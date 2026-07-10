#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-extraction-confirmation-modal-ui-gate-107p.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-modal-runtime-bridge-107q.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-actions-yes-no-107r.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-modal-fast-track-validation-107s.json" >/dev/null
grep -q 'ForgeQuotePreviewConfirmationModal' "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js"
grep -q '¿Son correctos los datos?' "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js"
echo "PASS_107P_107S_CONFIRMATION_MODAL_FAST_TRACK_PRESERVED"
