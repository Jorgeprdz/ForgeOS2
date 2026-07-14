# Sales Presentation Engine Ownership Registry — R16H1 / R16H3 Reconciliation

Status: **REGISTERED — 12 ENGINES, DOMAIN-SEPARATED WIRING**

This source-truth document records ownership for the twelve engines in the
Quote-to-Sales Presentation chain. It does not authorize invented facts,
unreviewed effects, sending, CRM writes, or PPTX output.

## Authority decisions

1. **Advisor Reason Why vs Client Recommendation Rationale**
   - Advisor Reason Why belongs exclusively to `manager-os`.
   - Its subject is the advisor's personal motivation.
   - Its consumer is the manager preparing human coaching.
   - It is forbidden as client-presentation input.
   - Client-facing solution fit uses
     `CLIENT_RECOMMENDATION_RATIONALE_BOUNDARY`.
   - Client rationale may carry only documented client objective, need,
     solution fit, timing, evidence, and a human-reviewed next step.
   - Advisor notes remain internal and are not client-visible facts.

2. **Canonical server composition vs browser projection**
   - `QUOTE_TO_SALES_PRESENTATION_CONTEXT_ADAPTER` owns canonical server-side
     composition.
   - `BROWSER_PRESENTATION_CONTEXT_ADAPTER` owns browser projection.
   - The server adapter must not be imported into the static browser preview.

3. **Review packet vs review session**
   - `PRESENTATION_REVIEW_PACKET_BUILDER` owns the immutable initial bundle.
   - `PRESENTATION_REVIEW_STATE_STORE` owns revisioned session state.
   - Only `title`, `purpose`, and `notes` are editable presentation copy.
   - Facts remain read-only.
   - Any content edit revokes approval and export authorization.

4. **Approval vs export**
   - `PRESENTATION_HUMAN_APPROVAL_GATE` owns the identified human decision
     bound to one exact revision.
   - `PRESENTATION_EXPORT_AUTHORIZATION_AND_PRINT_PDF_ADAPTER` owns downstream
     Print/PDF authorization and the printable view.
   - Approval does not export. Export cannot create approval.

5. **Bridge**
   - `ACCEPTED_QUOTE_BRIDGE` is the public browser orchestrator.
   - It owns no independent financial, product, prospect, narrative, approval,
     export, send, or CRM truth.

## Registered logical chain

```text
Client Recommendation Rationale Boundary
  -> Browser Presentation Context

Accepted Quote Review Snapshot
  -> Browser Presentation Context
  -> Dedicated Presentation Prompt
  -> Slide Plan
  -> Review Packet
  -> Review State
      -> Editable Dynamic UI
      -> Human Approval
          -> Print/PDF Export Authorization
```

`ACCEPTED_QUOTE_BRIDGE` orchestrates the browser lifecycle.

Advisor Reason Why remains outside this client-presentation chain inside
`manager-os`.

## Assembly plan

- Registered engines: **12**
- Existing logical edges: **10**
- Protected responsibility/domain decisions: **4**
- New runtime connections required beyond the client-rationale boundary:
  **none**
- Server adapter browser mount: **forbidden**
- Advisor Reason Why presentation input: **forbidden**
- Advisor notes client-visible: **no**
- Static HTML mutation: **forbidden**
- Fact editing: **forbidden**
- Human approval: **required**
- AI approval: **forbidden**
- Export: **Print/PDF only**
- PPTX export: **not implemented**
- Send: **disabled**
- CRM mutation: **forbidden**

## Next verification

`R16I_PRESENTATION_VISUAL_RUNTIME_ACCEPTANCE_AND_RELEASE_CLOSE`
