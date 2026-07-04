# Forge Engine Dry Run Packet Contract 059D

Status: CONTRACT SCOPED

Decision token:
DECISION=FORGE_ENGINE_DRY_RUN_PACKET_CONTRACT_059D

Next:
NEXT=059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION

## Accepted Output Shape

```json
{
  "dryRunStatus": "DRY_RUN_ACCEPTED",
  "actionId": "client.follow.preview",
  "packetId": "forge-static-action-0001",
  "adapterCandidate": "static.follow_up_draft",
  "previewMode": true,
  "requiresHumanApproval": true,
  "executionAllowed": false,
  "writesAllowed": false,
  "sendAllowed": false,
  "calendarAllowed": false,
  "crmAllowed": false,
  "auditTrace": {
    "source": "059B_STATIC_ACTION_PACKET_BRIDGE",
    "contract": "059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT",
    "decision": "accepted_preview_only"
  },
  "previewPayload": {
    "title": "Preparar follow",
    "body": "Vista previa generada para revision humana.",
    "safety": "Sin envio, sin CRM, sin calendario."
  }
}
```

## Refused Output Shape

```json
{
  "dryRunStatus": "DRY_RUN_REFUSED",
  "actionId": "unknown",
  "packetId": "missing",
  "adapterCandidate": "none",
  "previewMode": true,
  "requiresHumanApproval": true,
  "executionAllowed": false,
  "writesAllowed": false,
  "sendAllowed": false,
  "calendarAllowed": false,
  "crmAllowed": false,
  "auditTrace": {
    "source": "059B_STATIC_ACTION_PACKET_BRIDGE",
    "contract": "059D_ENGINE_ADAPTER_RECONNECT_DRY_RUN_CONTRACT",
    "decision": "refused"
  },
  "refusal": {
    "reason": "UNKNOWN_ACTION_ID",
    "message": "Action id is not allowlisted."
  }
}
```

## Adapter Candidate Keys

| UI action id | Adapter candidate |
| --- | --- |
| `quote.create.preview` | `static.quote_preview` |
| `policy.upload.preview` | `static.document_intake` |
| `client.follow.preview` | `static.follow_up_draft` |
| `client.call.preview` | `static.call_prep` |
| `client.message.preview` | `static.message_draft` |
| `client.search.preview` | `static.client_read` |
| `policy.open.preview` | `static.policy_read` |
| `report.open.preview` | `static.report_read` |
| `pipeline.review.preview` | `static.pipeline_review` |
| `day.review.preview` | `static.daily_review` |

## Final Decision

DECISION=FORGE_ENGINE_DRY_RUN_PACKET_CONTRACT_059D

NEXT=059E_STATIC_ENGINE_ADAPTER_DRY_RUN_IMPLEMENTATION
