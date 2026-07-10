# 107Z15E8N Explicit PDF Flow Popup Invocation Implementation

Status: PASS

## Scope

`QUOTE_PREVIEW_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_V1`

## Implemented source files

- `platform/ui/quote-preview/quote-preview-pdf-flow-popup-invocation.js`
- `platform/ui/quote-preview/quote-preview-pdf-flow-popup-invocation.test.js`

No other runtime source file was changed.

## Export

`createQuotePreviewPdfFlowPopupInvocation`

## Flow

```text
completed nativeResult + context
→ invocation.present(...)
→ existing popup.open(preview)
→ user chooses Editar or Aceptar
```

The invocation creates one existing popup instance and exposes `present`, `close`, `dispose`, and `getState`.

## Behavior

- No UI exists before `present`.
- `present` requires `nativeResult` and `context`.
- It preserves those object references.
- It defaults optional ambiguity and source to empty frozen objects.
- It calls the existing pop-up once per successful presentation.
- Repeated presentation updates the same pop-up root.
- Presentation performs zero store writes and zero store reads.
- **Aceptar** persists through the existing stack.
- **Editar** performs zero persistence.

## Scope exclusions

- No PDF reading, extraction, or OCR.
- No automatic flow-owner discovery.
- No duplicate popup implementation.
- No page, route, dashboard, or generic host.
- No direct localStorage.
- No backend creation.
- No quote-truth promotion.

## Next gate

`107Z15E8O_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_CLOSURE_GATE`
