# Unified Product Dashboard Hero Metric And Aligned Responsive Grid — R16B

## Decision

The reusable product-dashboard system now exposes a semantic hero metric, compact metadata, and deterministic responsive grid roles for READY-state dashboards. ORVI remains the visual authority and is not enrolled in the new unified-grid marker, preserving its established presentation.

Hero selection follows product truth. SeguBeca prefers an explicit canonical sum assured when present and otherwise promotes its canonical education target as `Meta educativa`. Imagina Ser and Vida Mujer promote an explicit canonical sum assured. The generic fallback creates no hero unless an explicit sum-assured concept exists; premiums, contributions, recommendations, and additional coverages are never promoted.

## Shared presentation contract

- `createDashboardHeroMetric` renders a labeled, accessible primary value with optional verified secondary equivalence and source-field metadata.
- `createCompactMetadataGrid` renders secondary facts as a semantic description list without nested-card overload.
- Dashboard sections declare reading order, layout role, and explicit desktop/tablet spans.
- `applyAlignedDashboardGrid` centers an incomplete singleton row while retaining the same width as a peer card.
- The unified grid uses 12 columns on desktop, 8 on tablet, and one column on mobile.
- DOM order remains reading order; CSS does not reorder semantic content.

## Product application

- SeguBeca uses its canonical education target as `Meta educativa` in the validated fixture because no explicit plan-level sum assured exists. Plan facts and protected persons use compact metadata.
- Imagina Ser uses its explicit canonical sum assured as hero and keeps the patrimonial objective under its true label.
- Vida Mujer and the structured generic renderer use an explicit canonical sum assured only. Vida Mujer retains its own section semantics.
- ORVI keeps its existing contracted-protection hero, view switcher, projected protection, guaranteed recovery, and six-row recovery contract.
- Generic fallback data without explicit sum assured remains a metadata summary and does not invent a primary amount.

## Boundaries

R16B changes READY-state presentation only. R16A EMPTY, LOADING, ERROR, and READY authority is unchanged. Product Intelligence, parsers, mappers, rate cache, financial calculations, product values, and ORVI R15 release evidence are unchanged. Cache-busting import versions were advanced only where required to deploy the presentation changes.

## Release markers

```text
STATUS=PASS_UNIFIED_PRODUCT_DASHBOARD_HERO_METRIC_AND_ALIGNED_RESPONSIVE_GRID
VISUAL_AUTHORITY=ORVI_ESTABLISHED_PRODUCT_DASHBOARD_SYSTEM
SHARED_HERO_METRIC=IMPLEMENTED
SHARED_COMPACT_METADATA=IMPLEMENTED
SHARED_ALIGNED_GRID=IMPLEMENTED
DESKTOP_GRID_COLUMNS=12
TABLET_GRID_COLUMNS=8
MOBILE_GRID_COLUMNS=1
SEGUIBECA_NESTED_FOUR_CARD_SUMMARY=REMOVED
SEGUIBECA_HERO_METRIC_SOURCE=CANONICAL_PRIMARY_AMOUNT
SEGUIBECA_DESKTOP_ALIGNMENT=PASS
ORVI_VISUAL_REGRESSION=PASS
IMAGINA_SER_HERO_AND_ALIGNMENT=PASS
VIDA_MUJER_HERO_AND_ALIGNMENT=PASS
GENERIC_FALLBACK_INVENTED_HERO=NO
SUM_ASSURED_LARGE_WHEN_CANONICAL=YES
SEMANTIC_RELABELING_WITHOUT_EVIDENCE=NO
R16A_EMPTY_STATE_REGRESSION=PASS
DIRECT_PDF_REGRESSION=PASS
JSON_REGRESSION=PASS
FINANCIAL_CALCULATIONS_CHANGED=NO
PRODUCT_INTELLIGENCE_CHANGED=NO
RATE_CACHE_CHANGED=NO
PARSER_CHANGED=NO
MAPPER_CHANGED=NO
PDF_COMMITTED=NO
SCREENSHOTS_COMMITTED=NO
CLIENT_CONTENT_COMMITTED=NO
NEXT=BOARD_SCOPE_SELECTION_AFTER_R16B
```
