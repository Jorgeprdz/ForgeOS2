# Forge Quote Preview PDF Extraction Gate Discovery 106A

PHASE=106A_QUOTE_PREVIEW_PDF_EXTRACTION_GATE_DISCOVERY
STATUS=PASS
DECISION=PASS_106A_QUOTE_PREVIEW_PDF_EXTRACTION_GATE_DISCOVERY
LOCKED_DECISION=PDF_EXTRACTION_GATE_DEFINED_AS_DRY_RUN_ONLY_WITH_NO_PDF_READ_OR_PARSER_EXECUTION
NEXT=106B_QUOTE_PREVIEW_REAL_PDF_DRY_RUN_SCOPE

## Purpose

106A defines the safe gate for future extraction from Solución Online PDF quotes.

This phase does not read PDFs, execute a parser, run OCR, calculate values, create quote truth, connect to a backend, write CRM, or generate presentations.

## Current State

The 105DR5 Nueva cotización page is visually confirmed.

Current page:

https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/nueva-cotizacion/?v=105dr5

Confirmed current UI:

- Select PDF is visible.
- Enviar PDF para extracción is visible and disabled.
- The checklist card is removed.
- The quote summary is visible.
- Imprimir resumen is visible.
- Generar presentación de ventas is visible and disabled.

## PDF Handling Policy

Raw PDF files from real quotes must not be committed to git.

A real PDF dry-run may happen only as a local or uploaded dry-run in a later phase.

Allowed evidence from a real PDF dry-run:

- redacted extraction report;
- field map without raw PDF payload;
- parser gaps;
- confidence report;
- human review checklist.

Forbidden evidence:

- raw PDF committed to git;
- unredacted personal data committed to git;
- unredacted quote screenshots committed to git;
- calculated values not present in the PDF;
- official quote truth claims.

## Extraction Contract

Forge may only extract values that are actually present in the PDF or later provided by an explicitly authorized engine.

Missing values must remain pending.

The quote summary mapping is:

- Plan, suma asegurada y prima
- Forma de pago, moneda y vigencia
- Total aportado
- Total recuperación
- Valores, beneficios o escenarios relevantes
- Faltantes antes de presentar

Client, product and family are autofill candidates, but they should not be duplicated inside the quote summary because they already live in the editable context section above.

## Gates That Remain Closed

- PDF submit
- PDF read
- OCR execution
- Parser execution
- Calculator execution
- Quote truth
- Official quote
- Backend connection
- CRM write
- Presentation generation
- Prompt generation
- Real effects

## Next

NEXT=106B_QUOTE_PREVIEW_REAL_PDF_DRY_RUN_SCOPE
