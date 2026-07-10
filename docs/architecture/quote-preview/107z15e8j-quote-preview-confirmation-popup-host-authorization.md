# 107Z15E8J Quote Preview Confirmation Popup Host Authorization

Status: PASS

## Decision

`AUTHORIZE_DEDICATED_QUOTE_PREVIEW_CONFIRMATION_POPUP_HOST`

## Scope

- Scope ID: `QUOTE_PREVIEW_CONFIRMATION_POPUP_HOST_V1`
- Host type: `POPUP_MODAL_ONLY`
- Popup only: **true**
- Further discovery: **closed**

This scope creates one confirmation pop-up. It does not create a page, route, dashboard, shell, or generic UI host.

## Authorized source files

- `platform/ui/quote-preview/quote-preview-confirmation-popup-host.js`
- `platform/ui/quote-preview/quote-preview-confirmation-popup-host.test.js`

No other runtime source file may be changed.

## Authorized export

`createQuotePreviewConfirmationPopup`

Signature:

`function createQuotePreviewConfirmationPopup(options = {})`

## Popup contents

- Dialog semantics.
- One title.
- Exactly eight Quote Preview fields.
- Exactly two action buttons:
  - **Editar**
  - **Aceptar**

## Field order

1. `name`
2. `family`
3. `product`
4. `insured`
5. `sumAssured`
6. `annualPremium`
7. `plannedOrAvePremium`
8. `coveragePeriod`

## Behavior

1. create popup elements only through injected documentLike
2. append one popup root to injected mountTarget only when open(preview) is called
3. store exactly one pending preview while the popup is open
4. render the eight canonical fields in the approved order
5. create exactly two action buttons: Editar and Aceptar
6. bind those two created buttons through bindQuotePreviewConfirmationUiSurface
7. Aceptar delegates to the completed confirmed-persistence stack
8. Aceptar closes the popup only after successful persistence
9. Editar performs zero persistence, invokes onEditRequested, and closes the popup
10. close clears pending preview and removes popup-owned listeners and nodes
11. dispose is idempotent and permanently disables reopening

## Important action rules

- **Aceptar** persists through the completed stack and closes only after success.
- **Aceptar failure** keeps the pop-up open and reports the error.
- **Editar** never persists, sends the pending preview back for correction, and closes.
- Closing clears the pending preview.
- Dispose is permanent and idempotent.

## Prohibited scope

- any runtime source file other than the two allowed files
- the existing UI surface binding
- the existing UI wiring
- the confirmed persistence adapter
- the persistence coordinator
- the persistence contract
- the persistence store
- utils.js
- manager-os/provider-runtime/provider-runtime-boundary-contract.js
- full page, route, screen, dashboard, shell, or application host
- generic UI host or reusable modal framework
- automatic target discovery
- document.querySelector or document.getElementById
- global window or global document lookup
- direct localStorage access
- store or backend creation
- new extraction engine
- generic cross-domain bridge
- hardcoded quote values
- persistence on Editar
- promotion of PDF extraction to official quote truth

## Next gate

`107Z15E8K_QUOTE_PREVIEW_CONFIRMATION_POPUP_HOST_SCOPED_IMPLEMENTATION_GATE`
