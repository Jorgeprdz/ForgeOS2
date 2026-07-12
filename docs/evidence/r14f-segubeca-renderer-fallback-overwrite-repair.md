# R14F SeguBeca Renderer Fallback Overwrite Repair

## Decision

`PASS_R14F_SEGUBECA_RENDERER_FALLBACK_OVERWRITE_REPAIR`

## Root cause

The real calculation path preserved the SeguBeca packet and its structured `benefitSummary`.

The renderer successfully had enough evidence to build the SeguBeca product dashboard, but `renderVisibleDynamicBenefitSummary()` returned the generic flattened rows array. When that array was empty, `renderAcceptedQuote()` called `writeRuntimeGrid()` and overwrote the already-rendered product dashboard with the generic value `Dependiente del plan`.

The same outer callback also overwrote the product-specific missing-information state with the generic retirement-oriented pending fields.

## Repair

- Added a pure guard that detects a structured SeguBeca dashboard payload.
- Preserved the SeguBeca dashboard after rendering.
- Prevented the outer generic runtime grid from replacing:
  - `Valores, beneficios o escenarios relevantes`
  - `Faltantes antes de presentar`
- Left the generic fallback unchanged for other products.

## Boundaries

- No parser changes.
- No financial-value changes.
- No accepted-adapter changes.
- No CSS or layout changes.
- No PDF, Excel, client data, or screenshots committed.
- No mobile, schemas, routes, `app.js`, or rule packs.

## Validation

- Focused SeguBeca renderer guard test.
- SeguBeca accepted runtime integration.
- SeguBeca parser.
- SeguBeca dashboard adapter.
- Product dashboard template.
- Imagina Ser adapter.
- Quote benefit summary.
- PDF browser parser smoke.
- Parser ownership when present.
