# Forge Quote Preview Safe UX State Model Scope 086A

PHASE=086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE

STATUS=PASS

DECISION=PASS_086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPED

NEXT=086B_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION

## Purpose

086A scopes the safe UX state model for Quote Preview.

This phase follows 085D, where Preview vs Quote Truth boundary was locked as local/static/read-only reference registry.

## Important Boundary

086A does not mutate UI.

086A does not create quote truth, issue quotes, send quotes, connect backend, write CRM/policy/pipeline/quote records, read PDFs, run parsers, run calculators, call Banxico, or execute real tests.

086A only scopes the state model that later UI components may consume.

## Scoped Safe UX States

- `empty`
- `pdf_candidate_detected`
- `file_hash_not_verified`
- `source_trace_not_bound`
- `parser_owner_decision_required`
- `deterministic_inputs_not_verified`
- `preview_reference_available`
- `quote_truth_blocked`
- `ready_for_human_review`

## Required 086B Shape

086B must implement a local/static/read-only safe UX state model registry.

Required fields:

- `state_id`
- `state_kind`
- `display_label`
- `description`
- `visible_allowed`
- `preview_reference_allowed`
- `quote_truth_allowed`
- `execution_allowed`
- `write_allowed`
- `allowed_actions`
- `blocked_actions`
- `required_badges`
- `safe_errors`
- `safety_flags`

## Required 086B Decisions

086B must preserve:

- preview labeling;
- quote truth blocked;
- quote write/send blocked;
- CRM/policy/pipeline writes blocked;
- provider/backend connection blocked;
- parser/calculator/Banxico execution blocked;
- no UI mutation.

## Final Decision

DECISION=PASS_086A_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPE

LOCKED_DECISION=QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_SCOPED

NEXT=086B_QUOTE_PREVIEW_SAFE_UX_STATE_MODEL_IMPLEMENTATION
