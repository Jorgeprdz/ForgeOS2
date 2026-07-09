# Forge Quote Preview Real PDF Local Dry Run Prep 106F

PHASE=106F_QUOTE_PREVIEW_REAL_PDF_LOCAL_DRY_RUN_PREP
STATUS=PASS
DECISION=PASS_106F_QUOTE_PREVIEW_REAL_PDF_LOCAL_DRY_RUN_PREP
LOCKED_DECISION=REAL_PDF_LOCAL_REFERENCE_PREPARED_OUTSIDE_REPO_WITH_NO_CONTENT_READ
NEXT=106G_QUOTE_PREVIEW_REAL_PDF_TEXT_LAYER_PROBE_GATE

## Purpose

106F prepares a real PDF local reference for a later dry-run.

This phase validates that the PDF reference stays outside the repo and creates a local-only manifest outside the repo.

This phase does not read PDF content, extract text, execute OCR, execute a parser, calculate values, populate the UI, create quote truth, or generate a sales presentation.

## Redacted Local Reference

The actual local PDF path is not committed.

The local manifest path is not committed.

Committed evidence uses only redacted markers:

- [LOCAL_PDF_PATH_REDACTED_OUTSIDE_REPO]
- [LOCAL_MANIFEST_PATH_OUTSIDE_REPO_REDACTED]

## Confirmed

- Real PDF reference prepared.
- Raw PDF was not copied to the repo.
- Raw PDF was not committed.
- Raw PDF path was not committed.
- PDF content was not read.
- PDF text was not extracted.
- OCR was not executed.
- Parser was not executed.
- Calculator was not executed.
- Quote truth was not created.
- Source UI was not changed.

## Next

NEXT=106G_QUOTE_PREVIEW_REAL_PDF_TEXT_LAYER_PROBE_GATE
