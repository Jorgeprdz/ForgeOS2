# Forge Universal AI Draft Provider Contract 067G17N13

Status: CONTRACT DEFINED.

## Purpose

This contract defines the universal interface every future AI Draft Provider must implement before it can be considered by Forge.

This stage defines the contract only.

No AI provider is implemented.
No external API is called.
No transport, authentication, prompt, provider credential, provider model integration or runtime execution is defined.

The deterministic draft adapter remains the default draft path.

## Provider Position

The provider boundary sits behind the existing draft provider selection boundary.

```text
ProspectMessageContext
-> Draft Provider Contract
-> DraftCandidate | NO_DRAFT | ERROR
-> deterministic fallback when required
-> Safety Validator
-> Exact Draft Human Approval
-> Manual WhatsApp Navigation
```

No provider may bypass any upstream or downstream gate.

## Input Contract

Every provider consumes exactly one input object:

```text
ProspectMessageContext
```

Providers must consume only fields exposed by ProspectMessageContext.

Providers must not request, infer, fetch or depend on excluded fields outside the ProspectMessageContext allowlist.

Providers must treat ProspectMessageContext as read-only.

## Output Contract

Every provider returns exactly one provider result envelope.

```text
{
  resultState,
  draftCandidate,
  metadata,
  error
}
```

### Result States

Allowed `resultState` values:

- `SUCCESS`
- `NO_DRAFT`
- `ERROR`

### SUCCESS

`SUCCESS` means the provider returned a DraftCandidate.

Required shape:

```text
{
  resultState: "SUCCESS",
  draftCandidate: DraftCandidate,
  metadata: ProviderDraftMetadata,
  error: null
}
```

### NO_DRAFT

`NO_DRAFT` means the provider declines to produce a DraftCandidate.

Forge must then use deterministic fallback.

Required shape:

```text
{
  resultState: "NO_DRAFT",
  draftCandidate: null,
  metadata: ProviderDraftMetadata,
  error: null
}
```

### ERROR

`ERROR` means the provider failed deterministically.

Forge must then use deterministic fallback unless the caller explicitly blocks fallback in a future approved stage.

Required shape:

```text
{
  resultState: "ERROR",
  draftCandidate: null,
  metadata: ProviderDraftMetadata,
  error: ProviderDraftError
}
```

## DraftCandidate Output

The provider may return a DraftCandidate only inside `SUCCESS`.

Minimum DraftCandidate requirements:

- text is candidate draft text only
- not approved communication
- not sendable
- does not send a message
- does not mutate Prospect
- does not mutate Pipeline state
- does not persist approval
- remains subject to Safety Validator
- remains subject to Exact Draft Human Approval

## Minimum Metadata

Every result state must include metadata.

Required metadata:

- `providerId`
- `modelId`
- `generationMode`
- `generatedAt`

Optional metadata:

- `durationMs`

`generatedAt` must be an explicit timestamp supplied by the provider boundary result.

`durationMs`, when present, must be a non-negative number.

## Error Contract

Every `ERROR` result must include deterministic error details.

Required error shape:

```text
{
  code,
  message,
  retryable
}
```

Requirements:

- `code` must be deterministic.
- `message` must be human-readable.
- `retryable` must be boolean.
- error objects must not include credentials, prompts, raw provider transport payloads or excluded ProspectMessageContext fields.

Allowed initial error codes:

- `PROVIDER_NOT_ENABLED`
- `PROVIDER_SELECTION_NOT_EXPLICIT`
- `PROSPECT_MESSAGE_CONTEXT_INVALID`
- `CONTEXT_ALLOWLIST_VIOLATION`
- `PRIVACY_POLICY_REQUIRED`
- `CTA_GOVERNANCE_REQUIRED`
- `SAFETY_VALIDATOR_REQUIRED`
- `HUMAN_APPROVAL_REQUIRED`
- `PROVIDER_RETURNED_INVALID_DRAFT_CANDIDATE`
- `PROVIDER_TIMEOUT`
- `PROVIDER_UNAVAILABLE`
- `UNKNOWN_PROVIDER_ERROR`

## Provider Requirements

Every provider must:

- consume only ProspectMessageContext
- respect the ProspectMessageContext allowlist
- never request excluded fields
- never bypass Privacy Policy
- never bypass CTA Governance
- never bypass Safety Validator
- never bypass Human Approval
- support deterministic fallback
- return deterministic error objects
- return `NO_DRAFT` when it cannot safely produce a DraftCandidate
- treat DraftCandidate as candidate language, not communication approval
- preserve manual human action before WhatsApp navigation

## Required Gate Preservation

The provider contract cannot approve send or delivery.

The provider contract cannot replace:

- Context Contract
- Privacy Policy
- CTA Governance
- Safety Validator
- Exact Draft Human Approval
- Manual WhatsApp Navigation

Provider output is always upstream of validation and human approval.

## Non-Goals

This contract does not define:

- prompts
- Gemini
- OpenAI
- Claude
- provider transport
- authentication
- credentials
- external service calls
- model selection policy
- provider implementation
- persistence
- UI behavior
- Pipeline behavior

## Compatibility With 067G17N12

067G17N12 remains unchanged:

- default provider is deterministic
- optional AI provider is not enabled
- provider selection must be explicit
- AI provider may return `NO_DRAFT`
- deterministic fallback is required
- safety pipeline is preserved

## Final Decision

UNIVERSAL_CONTRACT_DEFINED=YES
PROVIDER_AGNOSTIC=YES
EXTERNAL_PROVIDER_IMPLEMENTED=NO
BREAKING_CHANGES=NO
