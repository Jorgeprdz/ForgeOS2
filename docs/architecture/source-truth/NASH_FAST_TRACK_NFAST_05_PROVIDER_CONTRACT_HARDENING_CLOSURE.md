# NASH Fast Track NFAST-05 Provider Contract Hardening Closure

Status: IMPLEMENTED_AND_COMMITTED_FOR_BRIEF_ONLY_PROVIDER_CONTRACT

NFAST-05 hardens the NASH remote draft provider path so AI providers may receive only a validated NFAST-04 Deterministic Conversation Brief.

Implemented:

- Versioned provider request contract: `NFAST-05.1`.
- Request shape limited to `requestVersion`, `providerId`, `conversationBrief` and safe `requestMetadata`.
- Legacy `prospectMessageContext`, raw Pipeline, raw universal context, raw notes, transcripts, product objects and quote objects are rejected.
- Optional AI provider boundary records brief-only enforcement.
- Remote draft provider client sends only brief requests to `nash-draft-provider`.
- Supabase Edge Function request validation rejects non-brief requests before provider invocation.
- Gemini provider is constrained to language rendering from allowlisted brief fields.
- Gemini output is validated before `SUCCESS`.
- Failure path returns deterministic provider envelopes with redacted errors and no send, approval, persistence or external-action claims.

Boundary preserved:

- No Productive Pipeline UI wiring.
- No WhatsApp behavior change.
- No automatic send, approval, Timeline event, task, appointment or Pipeline mutation.
- No schema, RLS or migration change.
- No Quote, Product Intelligence or Sales Presenter runtime change.
- No legacy root NASH engine import or execution.

Deployment:

NFAST-05 authorizes deployment of `supabase/functions/nash-draft-provider` only after acceptance criteria pass. Deployment result is recorded in the task final response because it depends on local CLI/environment availability.

Next stage:

`NFAST-06` is not authorized by this closure.

Readiness:

`NFAST_06_READINESS_STATUS=READY_FOR_SEPARATE_STAGE_AUTHORIZATION`
`NFAST_06_AUTHORIZED=NO`
`NFAST_06_MIRANDA_APPROVAL=REQUIRED`
`NFAST_06_BOARD_APPROVAL=NOT_REQUIRED_IF_SAFETY_POLICY_AUTHORITY_REMAINS_UNCHANGED`
