# R14I SeguBeca Desktop Responsive Layout Repair Evidence

## Governance And Scope

- Module: `R14I_SEGUBECA_DESKTOP_RESPONSIVE_LAYOUT_REPAIR`
- Constitution: `FORGE_CONSTITUTION_V3.md`
- ADRs: ADR-003, ADR-004, ADR-005, ADR-007, ADR-008
- Board approval: approved
- Miranda approval: approved
- Build Tree area: Quote Preview / Product Intelligence UI / SeguBeca desktop responsive layout
- Scope: layout handoff, SeguBeca-scoped desktop wrapping, focused browser test, evidence, and registration only
- Prohibited: parsers, calculations, financial values, product modality, mobile, schemas, routes, `app.js`, rule packs, ORVI, Vida Mujer, Imagina Ser, cache busting, and client artifacts

## Baseline Reproduction

The R14H accepted flow was exercised in Chromium 138 using only `Contratante Prueba`
and `Menor Prueba`. The modal was accepted and the DOM was measured after a one-second
stabilization wait. Functional state passed: the structured SeguBeca dashboard remained
present with its product sections and accepted values. Visual state failed.

| Viewport | Content grid | Quote summary | Dashboard | Dashboard / summary | Narrowest main card |
| --- | ---: | ---: | ---: | ---: | ---: |
| 768×1024 | 697.2px | 697.2px | 435.8px | 62.5% | 209.9px |
| 1024×768 | 940.9px | 940.9px | 601.1px | 63.9% | 292.5px |
| 1366×768 | 1118px | 669.6px | 399.2px | 59.6% | 119.7px |
| 1536×864 | 1118px | 669.6px | 399.2px | 59.6% | 119.7px |

At 1366 and 1536 px, computed layout was:

- `.fq-grid-105dr`: `grid-template-columns: 669.562px 430.422px`;
- dashboard host row: `grid-template-columns: 180px 399.188px`;
- `.fq-benefit-dashboard-107z15p2[data-forge-product-type="segubeca"]`:
  `width: 399.188px`, twelve computed tracks of about `14.92px`, `grid-auto-flow: dense`;
- main cards: as narrow as `119.719px`, `min-width: 0`, `overflow-x: hidden`;
- SeguBeca labels: `overflow-wrap: anywhere`, `word-break: normal`;
- examples: “Aportación anual” computed at `0px`, “Plazo de aportación” at `6.9px`,
  and “Suma asegurada” at `16.7px`;
- document overflow: `0px`, confirming compression rather than a scrollbar failure;
- `body[data-forge-benefit-layout-expanded]`: absent.

## Exact Cause

`renderImaginaSerBenefitSummary` calls `normalizeBenefitLayout107z15p2R9E()` after
mounting its dashboard. `renderSegubecaBenefitSummary` mounts the equivalent dashboard
but omits that handoff. The existing normalization would expand the quote summary,
collapse `.fq-grid-105dr` to one usable column, make the dashboard row single-column,
and hide its obsolete generic label. Because it is not called, `width: 100%` applies
only to a 399px value cell.

The compression is then amplified by this product-scoped selector in
`forge-benefit-summary-layout.js`:

```css
.fq-benefit-dashboard-107z15p2[data-forge-product-type="segubeca"]
  .fq-benefit-label-107z15p2,
.fq-benefit-dashboard-107z15p2[data-forge-product-type="segubeca"]
  .fq-benefit-value-107z15p2
```

Its `overflow-wrap: anywhere !important` permits character-level wrapping inside the
collapsed tracks.

## Menor Text Investigation

Repository search found no `hijoo` literal. The adapter does not concatenate relation
and child labels: `participantValue` selects one evidence-backed field (`name`, `label`,
`role`, or `value`), and the template renders it once. The sanitized accepted fixture
produced `Menor Prueba` once and no `hijoo`. R14I therefore makes no unsupported
relationship correction. A future correction requires a sanitized reproducible packet
showing presentation-owned duplication rather than source evidence.

## Repair And Validation

The minimum repair:

1. calls `normalizeBenefitLayout107z15p2R9E()` immediately after the SeguBeca
   dashboard is mounted, matching the established Imagina Ser handoff without changing
   product data or rendering semantics;
2. changes the SeguBeca label/value rule from `overflow-wrap: anywhere` to
   `overflow-wrap: break-word`, while preserving `word-break: normal` and explicitly
   retaining `white-space: normal`;
3. changes only the SeguBeca contribution primary-metric grid from a rigid three-column
   layout to `repeat(auto-fit, minmax(min(140px, 100%), 1fr))` so metrics use two
   columns where space permits and one where it does not.

Post-repair Chromium measurements after the same accepted-flow stabilization:

| Viewport | Content grid | Quote summary | Dashboard | Dashboard / summary | Narrowest main card |
| --- | ---: | ---: | ---: | ---: | ---: |
| 768×1024 | 697.2px | 697.2px | 630.8px | 90.5% | 307.4px |
| 1024×768 | 940.9px | 940.9px | 865.6px | 92.0% | 424.8px |
| 1366×768 | 1118px | 1118px | 1039.6px | 93.0% | 333.2px |
| 1536×864 | 1118px | 1118px | 1039.6px | 93.0% | 333.2px |

At 1366/1536 px, the expanded content grid is now a single `1118px` track, the
dashboard row is a single `1039.62px` track, and the twelve dashboard tracks are about
`68.30px` each. Label computed styles are now `overflow-wrap: break-word`,
`word-break: normal`, and `white-space: normal`. No measured long text node was under
35px, no main card was under 240px, no primary metric was under 120px, and document
overflow remained `0px`.

Visual inspection of an ephemeral Chromium capture confirmed all rendered sections
were legible, values were not clipped, the contribution metrics used full readable
rows, card hierarchy remained unchanged, and no card overlap or artificial right rail
remained. The capture contained only sanitized fixture identities and was not added to
the repository.

The focused test `tests/segubeca-desktop-responsive-layout-test.mjs` failed against the
baseline at 768px with `dashboard must use quote-summary width` and passed after the
repair at all four required viewports. It checks host-width ratios, main-card and
primary-metric minimum widths, word wrapping, vertical text, document/card overflow,
sibling overlaps, product type, generic placeholders, object coercion, and stabilized
acceptance status.

## Regression And Privacy Result

PASS:

- JavaScript syntax checks for both changed runtime modules and the new test;
- SeguBeca product dashboard adapter;
- SeguBeca Solucionline parser regression (read-only validation only);
- SeguBeca accepted quote integration;
- SeguBeca renderer handoff guard;
- reusable product dashboard template;
- Imagina Ser dashboard regression;
- quote benefit-summary engine;
- PDF browser parser smoke regression (read-only validation only);
- R14H accepted-render real-browser integration;
- R14I responsive Chromium validation at 768×1024, 1024×768, 1366×768, and
  1536×864;
- `git diff --check` and exact allowlist review;
- required secret/name/hash and email-pattern privacy scans.

The existing `MODULE_TYPELESS_PACKAGE_JSON` warnings were informational and were not
addressed, as required. No parser, calculation, product value, other product behavior,
mobile surface, `index.html`, or cache-bust token changed.

DECISION=`PASS_R14I_SEGUBECA_DESKTOP_RESPONSIVE_LAYOUT_REPAIR`
