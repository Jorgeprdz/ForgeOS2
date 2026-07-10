# Forge Quote Preview Confirmation Modal Fast Track Evidence 107P-107S

PHASES=107P,107Q,107R,107S
STATUS=PASS

## En humano

Forge now has the confirmation modal contract and runtime bridge.

The user does not transcribe PDF values.

The modal receives extracted values at runtime.

Sí fills UI.

No opens edit mode.

Raw extracted values are not committed.

Quote truth is still forbidden.

## Files

HTML_TARGET=docs/static-preview/forge-alive/index.html

JS_OUT=docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js

CSS_OUT=docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.css

## 107P

{
  "phase": "107P_QUOTE_PREVIEW_EXTRACTION_CONFIRMATION_MODAL_UI_GATE",
  "status": "PASS",
  "decision": "PASS_107P_QUOTE_PREVIEW_EXTRACTION_CONFIRMATION_MODAL_UI_GATE",
  "lockedDecision": "EXTRACTION_CONFIRMATION_MODAL_CONTRACT_LOCKED",
  "modalTitle": "¿Son correctos los datos?",
  "fields": [
    {
      "fieldKey": "client_name",
      "label": "Nombre"
    },
    {
      "fieldKey": "product_family",
      "label": "Familia",
      "allowedValues": [
        "Vida",
        "GMM"
      ]
    },
    {
      "fieldKey": "product_name",
      "label": "Producto"
    },
    {
      "fieldKey": "insured_name",
      "label": "Asegurado"
    },
    {
      "fieldKey": "sum_insured",
      "label": "Suma Asegurada"
    },
    {
      "fieldKey": "annual_premium",
      "label": "Prima Anual"
    },
    {
      "fieldKey": "planned_or_ave_premium",
      "label": "Prima AVE / Prima Planeada"
    },
    {
      "fieldKey": "coverage_period",
      "label": "Periodo Cobertura"
    }
  ],
  "yesAction": "auto_populate_quote_preview_ui_after_user_confirmation",
  "noAction": "open_edit_mode_in_quote_preview_ui",
  "manualTranscriptionByUserAllowed": false,
  "rawValuesCommittedToRepo": false,
  "quoteTruthAllowed": false,
  "next": "107Q_QUOTE_PREVIEW_CONFIRMATION_MODAL_RUNTIME_BRIDGE"
}

## 107Q

{
  "phase": "107Q_QUOTE_PREVIEW_CONFIRMATION_MODAL_RUNTIME_BRIDGE",
  "status": "PASS",
  "decision": "PASS_107Q_QUOTE_PREVIEW_CONFIRMATION_MODAL_RUNTIME_BRIDGE",
  "htmlTarget": "docs/static-preview/forge-alive/index.html",
  "jsOut": "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.js",
  "cssOut": "docs/static-preview/forge-alive/assets/forge-quote-preview-confirmation-modal-107q.css",
  "runtimeApi": "window.ForgeQuotePreviewConfirmationModal.open(payload)",
  "eventApi": "forge:quote-preview:extraction-ready",
  "rawValuesHardcoded": false,
  "quoteTruthAllowed": false,
  "next": "107R_QUOTE_PREVIEW_CONFIRMATION_ACTIONS_YES_NO"
}

## 107R

{
  "phase": "107R_QUOTE_PREVIEW_CONFIRMATION_ACTIONS_YES_NO",
  "status": "PASS",
  "yesAction": "auto_populate_quote_preview_ui_after_user_confirmation",
  "noAction": "open_edit_mode_in_quote_preview_ui",
  "yesActionImplemented": true,
  "noActionImplemented": true,
  "quoteTruthAllowed": false,
  "errors": [],
  "next": "107S_QUOTE_PREVIEW_CONFIRMATION_MODAL_FAST_TRACK_VALIDATION"
}

## 107S

{
  "phase": "107S_QUOTE_PREVIEW_CONFIRMATION_MODAL_FAST_TRACK_VALIDATION",
  "status": "PASS",
  "decision": "PASS_107S_QUOTE_PREVIEW_CONFIRMATION_MODAL_FAST_TRACK_VALIDATION",
  "phasesCompleted": [
    "107P",
    "107Q",
    "107R",
    "107S"
  ],
  "modalContractPresent": true,
  "runtimeBridgePresent": true,
  "yesNoActionsPresent": true,
  "rawValuesHardcoded": false,
  "quoteTruthAllowed": false,
  "backendConnectionUsed": false,
  "presentationGenerated": false,
  "next": "107T_QUOTE_PREVIEW_CONFIRMATION_MODAL_LOCAL_RUNTIME_PAYLOAD_TEST",
  "errors": []
}
