# R13 Product Dashboard Template Discovery And Readiness Evidence

## Decision

`PASS_R13_PRODUCT_DASHBOARD_TEMPLATE_DISCOVERY_AND_BOARD_GATE`

R13 is registered as a planned Quote Preview / Product Intelligence UI module. Discovery is locked and implementation readiness is established with conditions. This evidence does not authorize implementation.

## Constitutional Gate

| Field | Result |
| --- | --- |
| Applicable Constitution | `FORGE_CONSTITUTION_V3.md`: Decision Clarity First, Advisor First, No Invented Data, Product Semantics, modular architecture, privacy |
| Applicable ADRs | ADR-003, ADR-004, ADR-005, ADR-007, ADR-008 |
| Build Tree area | Quote Preview / Product Intelligence UI |
| Discovery status | Discovery locked |
| Implementation readiness | Ready with conditions |
| Miranda approval | Approved |
| Board approval | Approved for discovery/readiness/registration only |
| Implementation approval | Not granted; separate R13A approval required |

## Read-only inventory

The current live composition is:

```text
docs/static-preview/forge-alive/nueva-cotizacion/index.html
  -> docs/static-preview/quote-preview-live/forge-benefit-summary-renderer.js
  -> docs/static-preview/quote-preview-live/forge-benefit-summary-layout.js
```

Observed ownership:

- `forge-benefit-summary-renderer.js` converts accepted benefit-summary rows into dashboard groups and creates cards, metric rows, endowment chips, recommended-benefit cards, secondary details, and missing-information output.
- `forge-benefit-summary-layout.js` installs the visual hierarchy, tokens, card grid, metric styling, chip styling, and desktop/tablet composition rules.
- `quote-benefit-summary-engine.js` remains upstream product/benefit-summary logic and is not a template ownership candidate.
- `forge-pdf-browser-parser.js` remains parser infrastructure and is outside R13 implementation scope.
- `index.html` is a consumer/entry surface and is prohibited unless a later gate explicitly authorizes a minimal module-loading change.

## Architecture conclusion

The current renderer mixes reusable presentation primitives with Vida Mujer-oriented grouping and labels. R13A must extract only the reusable presentation contract and preserve product semantics in product-specific configuration or adapters.

Vida Mujer is the approved visual reference. It is not the universal logic model.

Imagina Ser is the first planned template consumer. Its future narrative is expected to support:

- Resumen del plan;
- Lo que aportas;
- Lo que construyes;
- Lo que proteges;
- Escenario futuro;
- Beneficios recomendados;
- Otros detalles;
- clean `missing_information` output when evidence is absent.

These labels define planned presentation sections only. They do not establish product facts, values, calculations, suitability, or recommendations.

## Allowed future R13A boundary

- desktop renderer/layout only;
- reusable cards, chips, metric rows, color hierarchy, compact sections, recommended-benefit presentation, secondary details, and missing-information presentation;
- compatibility layer or configuration preserving the current Vida Mujer result;
- an Imagina Ser adapter/configuration consuming existing structured outputs;
- minimal source changes with no duplicated product logic.

## Prohibited future R13A surfaces

- mobile UI;
- financial parsers and PDF extraction behavior;
- schemas;
- routes;
- `app.js`;
- rule packs;
- product calculations or Product Truth ownership;
- client-specific or sensitive data;
- invented products, benefits, premiums, coverage, values, or forecasts;
- functional adapters before separate authorization;
- DOM overlay hacks.

## Candidate source surfaces for R13A review

| Surface | Candidate role | Current authorization |
| --- | --- | --- |
| `docs/static-preview/quote-preview-live/forge-benefit-summary-renderer.js` | compatibility consumer and source of reusable render primitives | Read-only |
| `docs/static-preview/quote-preview-live/forge-benefit-summary-layout.js` | compatibility consumer and source of reusable visual tokens/layout | Read-only |
| New quote-preview product-dashboard template module | reusable presentation owner | Not authorized |
| Future Vida Mujer configuration | preserves current product narrative | Not authorized |
| Future Imagina Ser configuration | first additional product consumer | Not authorized |

## R13A entry conditions

- a new Constitutional Gate names the exact source files;
- Board approves implementation and user-facing behavior;
- Miranda confirms disciplined scope and preservation of product quality;
- the implementation plan keeps Product Intelligence as semantic owner;
- mobile remains parked;
- the parser, schema, route, `app.js`, and rule-pack prohibitions remain explicit.

## R13A validation contract

- `node --check` for every changed JavaScript file;
- existing quote benefit-summary tests;
- existing PDF parser tests;
- Vida Mujer visual and logical non-regression;
- desktop visual QA;
- `git diff --check`;
- privacy check on added lines;
- exact-path staging only.

## Closure

R13 discovery/readiness/registration is complete. No UI, runtime, parser, route, schema, rule, adapter, or business-logic implementation occurred. The next separately governed module is `R13A_PRODUCT_DASHBOARD_TEMPLATE_IMPLEMENTATION`.
