# Forge AI Draft Provider Hosting Decision 067G17D3

Status: ARCHITECTURE DECISION.

## Decision

Forge should host future AI Draft Providers in a dedicated Supabase Edge Function:

```text
supabase/functions/nash-draft-provider
```

This function must be separate from `semantic-extract`.

No provider is implemented by this decision.
No provider is enabled by this decision.
No UI, Pipeline, Context Adapter, Draft Adapter, Safety Validator or Human Approval behavior changes are authorized by this decision.

## Evidence Used

D1 found:

- `supabase/functions/semantic-extract/index.ts` exists as the only current Supabase Edge Function.
- Gemini exists through `semantic-extract` and `GEMINI_API_KEY`.
- OpenAI exists through `forge-ai-connector.js`.
- Provider runtime and connector boundaries exist in Manager OS.
- `nash/optional-ai-draft-provider-boundary.js` exists and keeps the deterministic provider as default.

D2 found:

- `semantic-extract` receives `{ note: string }`.
- `semantic-extract` returns candidate semantic evidence and `semantic_frame`.
- `semantic-extract` is not a DraftCandidate generator.
- `semantic-extract` is not a general AI gateway.
- `semantic-extract` should remain separate from NASH draft generation.

## Options

### Option A: Reuse semantic-extract

Responsibility separation:
FAIL. `semantic-extract` is scoped to semantic event extraction from advisor notes. Its code extracts `commitment_established` and `conversation_occurred` candidates, evidence spans, due dates and semantic frames.

Security:
MIXED. It already uses `GEMINI_API_KEY` server-side and sanitizes candidate fields, but its prompt and output contract are for evidence extraction, not DraftCandidate generation.

Provider independence:
FAIL. It is currently Gemini-specific.

Maintainability:
FAIL. Adding draft generation would mix evidence extraction with prospect-facing language generation.

Scalability:
LOW. Shared endpoint responsibilities would create branching contracts and confusing ownership.

Compatibility with N13:
FAIL. N13 requires `ProspectMessageContext -> DraftCandidate | NO_DRAFT | ERROR`; `semantic-extract` uses `{ note } -> candidates/semantic_frame`.

Implementation complexity:
LOW initially, HIGH long-term due to contract contamination.

Decision:
REJECT.

### Option B: Dedicated nash-draft-provider Edge Function

Responsibility separation:
PASS. A dedicated function can own only the N13 AI Draft Provider contract.

Security:
PASS. Provider secrets remain server-side in Supabase Edge Function environment variables. The frontend never receives provider credentials.

Provider independence:
PASS. The function can host provider-specific adapters behind the universal provider contract while preserving provider-agnostic input/output.

Maintainability:
PASS. Semantic extraction remains evidence extraction. Draft generation remains NASH draft provider work.

Scalability:
PASS. Future providers can be added behind the dedicated function without changing `semantic-extract`.

Compatibility with N13:
PASS. The function can implement exactly `ProspectMessageContext -> DraftCandidate | NO_DRAFT | ERROR`.

Implementation complexity:
MEDIUM. Requires a new Edge Function and future provider adapters, but avoids cross-domain complexity.

Decision:
SELECT.

### Option C: General AI Gateway

Responsibility separation:
FAIL. A general gateway would mix draft generation with unrelated AI jobs.

Security:
MIXED. Centralized secret management is possible, but broad input/output scope increases leakage and bypass risk.

Provider independence:
PASS in theory, but requires a broader provider registry and routing policy that Forge does not yet have.

Maintainability:
FAIL for this stage. It would introduce platform-wide AI routing before the NASH draft provider has a production contract.

Scalability:
PASS long-term, but premature now.

Compatibility with N13:
MIXED. It could route N13, but would need additional scoping to prevent generic prompt/transport behavior.

Implementation complexity:
HIGH. Requires gateway policy, routing, auth, provider registry, observability and abuse boundaries.

Decision:
DEFER.

## Recommended Architecture

```text
Frontend / UI
  -> explicit provider selection request
  -> NASH optional provider boundary
  -> supabase/functions/nash-draft-provider
  -> provider-specific implementation behind N13 contract
  -> DraftCandidate | NO_DRAFT | ERROR
  -> deterministic fallback when required
  -> Safety Validator
  -> Exact Draft Human Approval
  -> Manual WhatsApp Navigation
```

## Hosting Location

Target hosting location:

```text
supabase/functions/nash-draft-provider
```

Rationale:

- Existing repository already contains Supabase Edge Function infrastructure.
- Existing `semantic-extract` proves server-side Gemini secret loading is possible.
- A dedicated function preserves responsibility separation.

## Provider Selection Location

Provider selection remains outside provider implementation and should continue to be represented by:

```text
nash/optional-ai-draft-provider-boundary.js
```

Provider selection must remain explicit.

Default provider remains:

```text
DETERMINISTIC
```

## Secret Location

Provider secrets belong only in Supabase Edge Function environment variables.

Examples of future names may include provider-specific keys, but this decision does not define provider names, auth, transport or credentials.

Frontend public config must not contain provider secrets.

## Deterministic Fallback Location

Deterministic fallback remains in the NASH draft flow outside the AI provider.

The Edge Function may return:

```text
NO_DRAFT
ERROR
```

The caller must then use deterministic fallback according to the optional provider boundary.

## Backend Responsibilities

The dedicated Edge Function is responsible for:

- accepting only ProspectMessageContext
- enforcing the universal provider contract from N13
- keeping provider secrets server-side
- returning `SUCCESS`, `NO_DRAFT` or `ERROR`
- returning deterministic error objects
- never sending messages
- never approving drafts
- never persisting approval
- never mutating Prospect or Pipeline state

## Frontend Responsibilities

The frontend remains responsible for:

- showing editable DraftCandidate output
- preserving manual editing
- running Safety Validator before WhatsApp navigation
- requiring Exact Draft Human Approval
- keeping WhatsApp navigation as a manual human click

The frontend must not receive provider credentials.

## Safety Validator Interaction

All provider output remains upstream of Safety Validator.

No provider response can mark a draft safe for WhatsApp navigation.

Safety Validator remains mandatory after draft output and before exact draft approval.

## Human Approval Interaction

Human Approval remains mandatory after Safety Validator.

Approval must bind the exact current edited draft text.

Any edit after approval invalidates approval.

No provider can approve or imply approval.

## Final Decision

RECOMMENDED_ARCHITECTURE=DEDICATED_NASH_DRAFT_PROVIDER_EDGE_FUNCTION
HOSTING_LOCATION=supabase/functions/nash-draft-provider
SECRET_LOCATION=SUPABASE_EDGE_FUNCTION_ENVIRONMENT
PROVIDER_SELECTION=nash/optional-ai-draft-provider-boundary.js
FALLBACK_LOCATION=NASH_DETERMINISTIC_DRAFT_FLOW
BREAKING_CHANGES=NO
