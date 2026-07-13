# Forge Alive Quote Intake Empty State And Upload Control Responsive Repair — R16A

## Decision

`Nueva cotización` now has one explicit intake-state authority with four states: `EMPTY`, `LOADING`, `ERROR`, and `READY`. The existing page, selector, accepted-quote bridge, confirmation flow, and product dashboards remain the only runtime path.

`READY` is reached only after the accepted-quote contract validates a packet. A filename alone cannot reveal results. Returning to `EMPTY`, entering `LOADING`, or reporting `ERROR` removes the result region from layout and accessibility navigation and restores its initial markup so prior data cannot remain visible.

The selector prioritizes PDF with the short CTA `Seleccionar PDF`, identifies JSON as secondary support, and states that processing is local and unpublished. The control retains its input association, keyboard activation, visible focus, responsive width, and a minimum 44 px target.

## Ownership and boundaries

- Static route HTML owns page composition and R16A-scoped presentation.
- `forge-quote-intake-state.js` owns visibility and intake state transitions.
- `forge-accepted-quote-bridge.js` remains the accepted-packet validation and READY transition authority.
- The generated Quote Preview bundle and canonical platform UI are unchanged.
- ORVI R15 remains closed. Product Intelligence, parsers, mappers, rate cache, financial calculations, confirmation modal, and product dashboards are unchanged.

## Release markers

```text
STATUS=PASS_QUOTE_INTAKE_EMPTY_STATE_AND_UPLOAD_CONTROL_RESPONSIVE_REPAIR
EMPTY_STATE_VISIBLE_SURFACES=HEADER_AND_SINGLE_UPLOAD_SELECTOR
EMPTY_STATE_LOWER_CARDS_VISIBLE=NO
EMPTY_STATE_REVIEW_BUTTON_VISIBLE=NO
EMPTY_STATE_PRODUCT_INTELLIGENCE_VISIBLE=NO
EMPTY_STATE_READINESS_VISIBLE=NO
EMPTY_STATE_ACTIONS_VISIBLE=NO
LOADING_STATE_LOWER_CARDS_VISIBLE=NO
ERROR_STATE_LOWER_CARDS_VISIBLE=NO
READY_STATE_LOWER_CARDS_VISIBLE=YES
MOBILE_UPLOAD_CTA=SELECCIONAR_PDF
MOBILE_UPLOAD_OVERFLOW=NO
MOBILE_MIN_TOUCH_TARGET_PX=44
MOBILE_320_PASS=YES
MOBILE_360_PASS=YES
MOBILE_390_PASS=YES
DIRECT_PDF_REGRESSION=PASS
JSON_REGRESSION=PASS
VIDA_MUJER_REGRESSION=PASS
IMAGINA_SER_REGRESSION=PASS
SEGUBECA_REGRESSION=PASS
ORVI_REGRESSION=PASS
ORVI_R15_RELEASE_STATUS=UNCHANGED_CLOSED
FINANCIAL_CALCULATIONS_CHANGED=NO
PRODUCT_INTELLIGENCE_CHANGED=NO
RATE_CACHE_CHANGED=NO
PDF_COMMITTED=NO
SCREENSHOTS_COMMITTED=NO
CLIENT_CONTENT_COMMITTED=NO
NEXT=BOARD_SCOPE_SELECTION_AFTER_R16A
```
