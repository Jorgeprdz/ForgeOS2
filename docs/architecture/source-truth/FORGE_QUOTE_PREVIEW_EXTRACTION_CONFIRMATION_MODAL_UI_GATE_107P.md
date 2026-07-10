# Forge Quote Preview Extraction Confirmation Modal UI Gate 107P

PHASE=107P_QUOTE_PREVIEW_EXTRACTION_CONFIRMATION_MODAL_UI_GATE
STATUS=PASS

## En humano

107P locks the popup contract.

The user sees extracted data and only answers:

- Sí
- No

The user does not transcribe the PDF.

## Modal

Title:

`¿Son correctos los datos?`

Fields:

- Nombre
- Familia: Vida / GMM
- Producto
- Asegurado
- Suma Asegurada
- Prima Anual
- Prima AVE / Prima Planeada
- Periodo Cobertura

## Actions

Sí: auto-fill UI after confirmation.

No: open editable UI.

## Safety

RAW_VALUES_COMMITTED_TO_REPO=false

QUOTE_TRUTH_ALLOWED=false

NEXT=107Q_QUOTE_PREVIEW_CONFIRMATION_MODAL_RUNTIME_BRIDGE
