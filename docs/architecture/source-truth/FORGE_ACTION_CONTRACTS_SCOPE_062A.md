# Forge Action Contracts Scope 062A

Status: SCOPED

Date: 2026-07-05

Phase:
`062A_ACTION_CONTRACTS_SCOPE`

Base locked state:
`PREMIUM_STATIC_COMMAND_PREVIEW_LOCKED`

Base decision:
`061I_PREMIUM_FINAL_DECISION_LOCK`

## Purpose

062A defines the action-contract layer required after the 9.0/10 premium static command preview lock.

This phase does not connect modules, execute actions, change the visual preview, or alter product behavior. It defines the contract names, preview-safe outcomes, required approval gates, blocked effects, and status vocabulary needed before implementation.

## Contract Principles

- Every visible action must map to a named contract.
- Every contract must produce a preview-safe result before any real effect is possible.
- Real effects remain blocked until a later approved implementation explicitly authorizes them.
- Human approval remains required for any future effect that would touch external systems or business records.
- Command-bar results must reference the same contracts as buttons and table actions.
- Read models must become the source for available actions, not ad hoc DOM text.

## Shared Status Vocabulary

- `idle`: no action is prepared.
- `preview_only`: the UI can show what would happen without performing it.
- `prepared`: a preview payload has been built.
- `needs_approval`: a future real effect would require explicit human approval.
- `blocked`: the action cannot proceed because a boundary, permission, or missing source prevents it.
- `failed`: the preview preparation failed safely.

## Scoped Contracts

### `command.quick_actions`

Visible triggers:

- `/quick actions`
- Command bar idle entry point

Preview-safe outcome:

- Shows available preview-safe actions from the current read model.
- Does not infer unavailable actions from free text.

Required future sources:

- Action registry read model.
- Current workspace context.
- User capability flags.

Blocked effects:

- No external write.
- No message delivery.
- No schedule creation.
- No provider execution.

Acceptance target:

- The command bar can list actions without executing them.
- Selecting an action prepares a safe preview or a blocked state.

### `report.prepare_preview`

Visible triggers:

- `Preparar preview`
- Command result for preparing the current workspace preview

Preview-safe outcome:

- Builds a human-readable preview summary.
- Identifies source rows, assumptions, and required approval.

Required future sources:

- Current dashboard read model.
- Opportunity/risk read model.
- Action registry read model.

Blocked effects:

- No system-of-record mutation.
- No external delivery.
- No calendar write.

Acceptance target:

- A prepared preview clearly states what would happen and what remains blocked.

### `opportunity.review`

Visible triggers:

- `Revisar`
- Row-level review action

Preview-safe outcome:

- Opens or prepares a local review panel for the selected opportunity.
- Shows risk, last contact, next action, and available safe follow-ups.

Required future sources:

- Opportunity row id.
- Client summary read model.
- Risk summary read model.

Blocked effects:

- No customer record update.
- No follow-up creation.
- No outbound communication.

Acceptance target:

- Review action is tied to a stable row identity and can fail safely if the row is missing.

### `client.follow_preview`

Visible triggers:

- `Follow`
- `/follow <client>`

Preview-safe outcome:

- Prepares a follow-up recommendation without creating it.
- Shows target client, reason, suggested timing, and approval requirement.

Required future sources:

- Client read model.
- Opportunity read model.
- Follow-up policy read model.

Blocked effects:

- No task creation.
- No calendar event.
- No message delivery.
- No CRM write.

Acceptance target:

- Follow preview returns `needs_approval` before any future real workflow could proceed.

### `quote.prepare_preview`

Visible triggers:

- `Cotizar`
- `/cotizar`
- Row-level quote action

Preview-safe outcome:

- Prepares a quote workspace preview for the selected client/opportunity.
- Shows missing inputs and approval gate.

Required future sources:

- Client read model.
- Product/quote assumptions read model.
- Opportunity row id.

Blocked effects:

- No quote issuance.
- No document generation outside preview evidence.
- No customer record update.

Acceptance target:

- Quote preview can be prepared or blocked with explicit missing-source reasons.

### `record.open_preview`

Visible triggers:

- `Abrir`
- Row-level open action

Preview-safe outcome:

- Opens or prepares a local static detail view for the selected record.

Required future sources:

- Stable record id.
- Record summary read model.
- Permission/capability flags.

Blocked effects:

- No external navigation to live provider systems.
- No mutation.

Acceptance target:

- Open action remains a preview-detail transition until real routing is scoped.

## Cross-Contract Requirements

- Each contract must expose action id, label, source module, source row id when applicable, preview payload, status, and approval requirement.
- Each blocked state must include a human-readable reason.
- Each prepared state must include enough evidence for review.
- Each contract must be usable from both a visible UI action and a command-bar result.
- Each contract must be testable without external systems.

## Explicit Non-Scope

062A does not authorize:

- Static preview UI mutation.
- CSS, JavaScript, or HTML mutation.
- CRM mutation.
- Calendar mutation.
- Message delivery.
- Authentication behavior.
- Provider/runtime activation.
- Browser persistence.
- Browser requests.
- Real engine execution.

## 062B Recommended Next Scope

062B should define the unified read model that supplies:

- dashboard metrics;
- opportunity rows;
- risk state;
- available action contracts;
- capability flags;
- blocked-state reasons;
- preview-safe command results.

## Final Decision

062A approves the action-contract scope needed before connecting Forge Alive to modules or implementing command-bar contract behavior.

DECISION=PASS_062A_ACTION_CONTRACTS_SCOPE

NEXT=062B_READ_MODEL_UNIFICATION_SCOPE
