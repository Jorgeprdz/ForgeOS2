# R14G SeguBeca Browser Module Cache Bust

## Decision

`PASS_R14G_SEGUBECA_BROWSER_MODULE_CACHE_BUST`

## Root cause

The page-level URL used a changing query string, but the JavaScript module URLs remained stable.

R14F changed only the benefit-summary renderer. A browser could therefore load the current HTML and accepted-quote modules while reusing an older cached renderer. That produced the exact pre-R14F generic placeholders even though the repository and Node tests contained the repair.

## Repair

- Added a release token to the quote-preview module entrypoints in the Nueva Cotización page.
- Added the same token to the accepted bridge imports for:
  - accepted quote adapter
  - benefit summary renderer
- The bridge now executes the intended R14F renderer module rather than a cached URL.

Release token:

`r14g_segubeca_renderer_20260712_1`

## Boundaries

- No parser changes.
- No financial calculation changes.
- No product dashboard mapping changes.
- No CSS redesign.
- No PDF, Excel, client data, or screenshots committed.
- No mobile, schemas, routes, `app.js`, or rule packs.

## Validation

- Module syntax checks.
- Existing SeguBeca calculation, parser, adapter, renderer, Imagina Ser, and PDF smoke tests.
- Exact allowlist and privacy checks.
