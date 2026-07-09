# Forge Quote Preview Real PDF Dry Run Scope 106B

PHASE=106B_QUOTE_PREVIEW_REAL_PDF_DRY_RUN_SCOPE
STATUS=PASS
DECISION=PASS_106B_QUOTE_PREVIEW_REAL_PDF_DRY_RUN_SCOPE
LOCKED_DECISION=REAL_PDF_DRY_RUN_SCOPE_LOCKED_WITH_REDACTION_AND_NO_RAW_PDF_COMMIT
NEXT=106C_QUOTE_PREVIEW_EXTRACTION_SCHEMA_LOCK

## Purpose

106B scopes how Forge may test with a real Solución Online PDF in a future dry-run.

This phase does not read the PDF, execute a parser, run OCR, calculate values, submit the PDF, create quote truth, generate a sales presentation, or change the UI.

## Local Dry-Run Directory

Real PDF dry-run files must stay outside the repo.

Local dry-run directory:

/storage/emulated/0/Forge Gemini/pdf-dry-run-local

The raw PDF must not be committed to git.

## Allowed Real PDF Handling

A real PDF may be referenced later only in these safe contexts:

- local Android storage outside repo;
- uploaded file in the chat for assistant-side dry-run;
- temporary local path under the Forge Gemini dry-run folder.

## Forbidden

Do not commit:

- raw PDF;
- raw PDF text;
- unredacted client name;
- unredacted personal identifiers;
- unredacted quote number;
- unredacted financial values tied to a named person;
- screenshots of the raw PDF;
- official quote declarations.

## Target Fields For First Dry-Run

Autofill context:

- client name;
- product family;
- advisor context if present;
- sales intent if present.

Quote summary:

- plan, sum insured and premium;
- payment form, currency and validity;
- total aportado;
- total recuperación;
- values, benefits or scenarios relevant to the plan;
- missing items before presentation.

Presentation context:

- quote highlights;
- client context notes;
- human review notes.

## Human Review Rules

- Extracted candidates are not truth.
- Every extracted candidate requires human review.
- Missing values remain pending.
- Conflicts must be marked ambiguous.
- Financial values must carry a redacted source-location hint.

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
- Prompt generation
- Presentation generation
- Real effects

## Next

NEXT=106C_QUOTE_PREVIEW_EXTRACTION_SCHEMA_LOCK
