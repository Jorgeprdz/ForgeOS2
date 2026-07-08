# Forge Quote Preview PDF Engine Deterministic Input Source Trace Scope 084A

PHASE=084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE

STATUS=PASS

DECISION=PASS_084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPED

NEXT=084B_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION

## Purpose

084A scopes deterministic input source trace for the Quote Preview PDF Engine path.

This phase follows 083D, where parser ownership was locked as local/static/read-only reference registry.

084A addresses the blocking gate:

`deterministic_input_source_trace_ready`

## Important Boundary

084A does not calculate projections.

084A does not call Banxico.

084A does not read PDFs, run parsers, run OCR, run calculators, run providers, connect backend, or execute tests.

084A only scopes the input source-trace registry required before deterministic projection inputs can be trusted. In other words: no more “the UDI grows because vibes.” Humanity staggers toward civilization.

## Scoped Deterministic Inputs

- `current_udi_value`
- `udi_growth_assumption`
- `projection_horizon`
- `projection_formula`

## Required 084B Shape

084B must implement a local/static/read-only deterministic input source trace registry.

Required fields:

- `input_trace_id`
- `input_key`
- `input_kind`
- `product_family`
- `source_candidate_refs`
- `required_source_trace`
- `source_trace_status`
- `verification_status`
- `execution_allowed`
- `blocked_misuse`
- `safe_errors`
- `safety_flags`

## Required 084B Decisions

084B must preserve:

- `source_trace_status=not_bound`
- `verification_status=not_verified`
- `execution_allowed=false`
- no calculator execution;
- no Banxico/provider call;
- no duplicate calculator creation;
- no projection truth without source trace.

## Final Decision

DECISION=PASS_084A_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_SCOPED

NEXT=084B_QUOTE_PREVIEW_PDF_ENGINE_DETERMINISTIC_INPUT_SOURCE_TRACE_IMPLEMENTATION
