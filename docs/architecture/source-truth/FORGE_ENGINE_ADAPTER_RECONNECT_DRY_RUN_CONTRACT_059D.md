# Forge Engine Adapter Reconnect Dry Run Contract 059D

Status: SCOPED

Decision token:
DECISION=PASS_059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT

Next:
NEXT=059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

## Purpose

059D defines the dry-run contract required before any Forge UI action packet can be routed toward an engine adapter.

This phase does not implement engine execution. It defines validation, refusal, audit trace, and preview-only output rules.

## Boundary

Allowed:

- define dry-run input contract;
- define validation rules;
- define refusal reasons;
- define preview-only output shape;
- define audit trace requirements;
- define no-write and no-send defaults;
- define implementation acceptance criteria for 059E.

Forbidden:

- engine execution;
- provider calls;
- message sending;
- CRM mutation;
- calendar creation;
- browser storage mutation;
- live external data reads;
- compensation or production truth creation.

## Dry-Run Contract

Every dry-run adapter must accept a 059B action packet and return one of two outcomes:

1. `DRY_RUN_ACCEPTED`
2. `DRY_RUN_REFUSED`

No third outcome is allowed in 059D.

## Required Input Fields

| Field | Requirement |
| --- | --- |
| `packetVersion` | Must exist and start with `059B.` |
| `packetId` | Must exist. |
| `actionId` | Must be allowlisted. |
| `sourceSurface` | Must be a known UI surface. |
| `sourcePlatform` | Must be `desktop`, `mobile`, or `tablet`. |
| `sourceModule` | Must be known. |
| `previewMode` | Must be `true`. |
| `requiresHumanApproval` | Must be `true`. |
| `safeIntent` | Must be non-empty. |

## Refusal Reasons

| Reason | Meaning |
| --- | --- |
| `UNKNOWN_ACTION_ID` | Action id is not allowlisted. |
| `MISSING_REQUIRED_FIELD` | Packet is incomplete. |
| `PREVIEW_MODE_REQUIRED` | Packet is not preview-only. |
| `HUMAN_APPROVAL_REQUIRED` | Human approval flag is missing or false. |
| `UNSUPPORTED_SURFACE` | Source surface is unknown. |
| `ADAPTER_NOT_MAPPED` | No dry-run adapter candidate exists. |
| `WRITE_INTENT_BLOCKED` | Packet appears to request write/send behavior. |

## Output Requirements

Every dry-run output must include:

- `dryRunStatus`;
- `actionId`;
- `packetId`;
- `adapterCandidate`;
- `previewMode: true`;
- `requiresHumanApproval: true`;
- `executionAllowed: false`;
- `writesAllowed: false`;
- `sendAllowed: false`;
- `calendarAllowed: false`;
- `crmAllowed: false`;
- `auditTrace`;
- `previewPayload` or `refusal`.

## Final Decision

DECISION=PASS_059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT

NEXT=059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION
