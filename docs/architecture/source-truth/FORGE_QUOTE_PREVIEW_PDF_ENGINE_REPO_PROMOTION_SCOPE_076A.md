# Forge Quote Preview PDF Engine Repo Promotion Scope 076A

PHASE=076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE

STATUS=PASS

DECISION=PASS_076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPED

NEXT=076B_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_IMPLEMENTATION

## Purpose

076A scopes the repository promotion path for the Quote Preview PDF Engine after Product Intelligence binding has been decision-locked.

This phase does not promote runtime behavior. It defines the constraints for a future local/static/read-only repo promotion of quote preview PDF engine surfaces.

## Base Confirmed

075D is closed as:

- `PASS_075D_QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_DECISION_LOCK`
- `QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_INTEGRATION_LOCKED_AS_LOCAL_STATIC_READ_ONLY_REFERENCE_ADAPTER`
- `NEXT=076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE`

## Scope Decision

Quote Preview PDF Engine repo promotion may proceed only if the promoted surface:

- binds through Product Intelligence before quote-specific preview behavior;
- consumes the Quote Preview Product Intelligence binding;
- keeps Product Intelligence as upstream semantic authority;
- keeps Quote Preview PDF Engine as downstream consumer/reference;
- remains local/static/read-only during promotion;
- exposes evidence and freshness requirements;
- preserves safe empty and safe error behavior;
- does not duplicate Product Intelligence parsers or calculators;
- does not convert PDF preview into quote truth.

## Required Future 076B Shape

Future 076B may implement a local/static/read-only promotion adapter only.

The adapter must expose references equivalent to:

- `ADAPTER_ID`
- `SCHEMA_VERSION`
- `SAFE_ERROR_CODES`
- `DEFAULT_SAFETY_FLAGS`
- `REQUIRED_PROMOTION_FIELDS`
- `getQuotePreviewPdfEnginePromotionManifest()`
- `prepareQuotePreviewPdfEnginePromotionScope(request)`
- `buildQuotePreviewPdfEnginePromotionError(request)`
- `validateQuotePreviewPdfEnginePromotionShape(promotion)`

## Required Promotion Fields

- `quote_preview_pdf_promotion_id`
- `quote_preview_pdf_request_id`
- `product_intelligence_binding_ref`
- `product_intelligence_ref`
- `product_family`
- `source_document_ref`
- `source_evidence_refs`
- `parser_ref`
- `calculator_refs`
- `quote_preview_pdf_engine_ref`
- `evidence_requirements`
- `freshness_requirements`
- `preview_constraints`
- `blocked_effects`
- `safety_flags`
- `safe_error`

## Safe Errors

- `QUOTE_PREVIEW_PDF_ENGINE_PROMOTION_NOT_SCOPED`
- `QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_INTELLIGENCE_BINDING_REQUIRED`
- `QUOTE_PREVIEW_PDF_ENGINE_PRODUCT_FAMILY_NOT_MAPPED`
- `QUOTE_PREVIEW_PDF_ENGINE_PARSER_NOT_MAPPED`
- `QUOTE_PREVIEW_PDF_ENGINE_CALCULATOR_NOT_MAPPED`
- `QUOTE_PREVIEW_PDF_ENGINE_SOURCE_EVIDENCE_REQUIRED`
- `QUOTE_PREVIEW_PDF_ENGINE_FRESHNESS_REQUIRED`

## Non-Authorization

076A does not authorize:

- PDF read;
- parser execution;
- calculator execution;
- Banxico call;
- provider call;
- quote generation;
- quote write or send;
- CRM, policy, pipeline, task, calendar, or message writes;
- backend connection;
- real engine execution;
- invented product, premium, coverage, projection, or quote truth.

## Final Decision

DECISION=PASS_076A_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_SCOPED

NEXT=076B_QUOTE_PREVIEW_PDF_ENGINE_REPO_PROMOTION_IMPLEMENTATION
