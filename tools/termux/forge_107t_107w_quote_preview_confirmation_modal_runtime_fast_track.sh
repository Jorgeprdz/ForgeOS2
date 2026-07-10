#!/usr/bin/env bash
set -euo pipefail
cd "${REPO:-/storage/emulated/0/Forge OS}"
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-modal-local-runtime-payload-test-107t.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-modal-open-behavior-validation-107u.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-confirmation-modal-yes-no-behavior-validation-107v.json" >/dev/null
python3 -m json.tool "docs/evidence/forge-quote-preview-pdf-extraction-to-confirmation-modal-handoff-lock-107w.json" >/dev/null
grep -q 'ForgeQuotePreviewConfirmationModal' "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js"
grep -q 'forge:quote-preview:extraction-ready' "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js"
echo "PASS_107T_107W_RUNTIME_CONFIRMATION_FAST_TRACK_PRESERVED"
