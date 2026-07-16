# R16J2A GitHub Pages Presentation Bridge Hotfix

Date: 2026-07-16

## Root cause

```text
ROOT_CAUSE=PATH_OUTSIDE_PAGES_ARTIFACT+TRANSITIVE_IMPORT_404+DEPLOYMENT_ARTIFACT_INCOMPLETE
PAGES_PUBLISHING_SOURCE=.github/workflows/pages.yml generated _site from docs/
FAILED_MODULE=/static-preview/quote-preview-live/forge-accepted-quote-bridge.js
FAILED_MODULE_HTTP_STATUS=200
FAILED_MODULE_CONTENT_TYPE=application/javascript
FAILED_TRANSITIVE_DEPENDENCY=/advisor-os/presentation/browser/forge-sales-presentation-browser-context-adapter.js
FAILED_TRANSITIVE_HTTP_STATUS=404
FAILED_TRANSITIVE_CONTENT_TYPE=text/html
```

The public bridge was present and served as JavaScript, but its eight Advisor OS
imports addressed repository paths excluded by the Pages artifact builder.
Browser module evaluation therefore failed before the PDF extractor flow could
be prepared.

## Distribution correction

Canonical writable source remains:

`advisor-os/presentation/browser/`

The generator:

`scripts/build-advisor-presentation-pages-runtime.mjs`

creates the read-only Pages distribution:

`docs/static-preview/advisor-presentation-runtime/`

The Pages workflow executes the generator before assembling `_site`. The public
Accepted Quote bridge and its compatibility re-exports import only the generated
published boundary. No presentation business logic was moved back to Manager
OS and no second writable authority was introduced.

## Cache and diagnostics

Public presentation, quote loader and PDF extractor assets use:

`r16j2a-pages-runtime-hotfix-20260716-1`

Module scripts are loaded through dynamic `import()` so evaluation errors retain
the requested URL, error name, evaluation message, current page URL and runtime
version in `globalThis.__FORGE_QUOTE_RUNTIME_LOAD_ERROR__` and the console.

## Pre-correction production evidence

Evidence root:

`/storage/emulated/0/Download/R16J2A_PAGES_HOTFIX_EVIDENCE/`

- `R16J2A_PAGES_BRIDGE_TRANSITIVE_IMPORT_FAIL_BEFORE_1440x900.png`
- `R16J2A_BEFORE_NETWORK.json`

## Local Pages-boundary verification

A server rooted at `docs/` passed the complete synthetic real-PDF flow:

- Forge Alive Nueva Cotización route loaded.
- Accepted Quote bridge evaluated.
- All generated Advisor OS presentation modules loaded.
- A real PDF generated from the test-safe ORVI fixture was extracted by PDF.js.
- Quote review rendered and was accepted.
- Presentation CTA was visible.
- Advisor OS editor opened with the review context.
- 43 relevant module requests returned JavaScript successfully.
- Page errors, network failures and console errors were zero.

## Production acceptance

Final production results and remote commit are recorded after GitHub Pages
deployment verification.

## Authority gates

```text
PRESENTATION_EXECUTION_DOMAIN=ADVISOR_OS
PRESENTATION_CONTEXT_AUTHORITY=ADVISOR_OS
PRESENTATION_PROMPT_AUTHORITY=ADVISOR_OS
PRESENTATION_EDITOR_AUTHORITY=ADVISOR_OS
MANAGER_OS_PRESENTATION_WRITE_AUTHORITY=NO
DUPLICATE_WRITABLE_AUTHORITY=NO
```
