# 107Z15E8M Explicit PDF Flow Popup Invocation Authorization

Status: PASS

## Decision

`AUTHORIZE_EXPLICIT_PDF_RESULT_TO_POPUP_OPEN_INVOCATION`

## Purpose

The confirmation pop-up is finished. This scope authorizes the small caller that receives an already-completed PDF extraction result and executes:

```js
popup.open({
  nativeResult,
  context,
  ambiguity,
  source,
});
```

It does not read the PDF, execute extraction, discover a host, create another pop-up, or persist before the user accepts.

## Scope ID

`QUOTE_PREVIEW_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_V1`

## Authorized source files

- `platform/ui/quote-preview/quote-preview-pdf-flow-popup-invocation.js`
- `platform/ui/quote-preview/quote-preview-pdf-flow-popup-invocation.test.js`

No other runtime source file may be changed.

## Authorized export

`createQuotePreviewPdfFlowPopupInvocation`

Signature:

`function createQuotePreviewPdfFlowPopupInvocation(options = {})`

## Authorized flow

1. create exactly one popup instance through createQuotePreviewConfirmationPopup
2. create no UI before present(input) is called
3. validate nativeResult and context without extracting or reading a PDF
4. build one preview envelope preserving nativeResult and context references
5. default ambiguity and source to empty objects when omitted
6. call popup.open(preview) exactly once per successful present call
7. allow repeated present calls to update the existing open popup through the popup lifecycle
8. delegate close and dispose directly to the existing popup
9. perform no persistence during present
10. allow persistence only when the existing popup receives Aceptar
11. allow zero persistence when the existing popup receives Editar

## Required tests

- reject invalid construction options through the existing popup contract
- create no UI before present
- reject missing nativeResult
- reject missing context
- present preserves nativeResult and context references
- present defaults ambiguity and source to empty objects
- present forwards explicit ambiguity and source
- present mounts exactly one popup root
- present renders the eight canonical fields through the existing popup
- repeated present updates pending preview without a second popup root
- Aceptar persists through the existing complete stack
- Editar performs zero store writes and zero store reads
- close delegates and clears the popup
- dispose is idempotent
- present after dispose is rejected
- no PDF read, extraction, OCR, file access, route, dashboard, selector discovery, localStorage, or backend creation is introduced

## Forbidden scope

- any runtime source file other than the two allowed files
- the completed popup host
- the UI surface binding, UI wiring, persistence adapter, coordinator, contract, or store
- any PDF extractor or OCR engine
- reading PDF files or filesystem paths
- automatic discovery of a PDF flow owner
- document.querySelector or document.getElementById
- global window or document lookup
- full page, route, dashboard, shell, or generic host
- direct localStorage access
- store or backend creation
- hardcoded quote values
- persistence during present
- persistence on Editar
- promotion of PDF extraction to official quote truth

## Next gate

`107Z15E8N_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_SCOPED_IMPLEMENTATION_GATE`
