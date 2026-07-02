# Forge Alive Smart Widget Stack Scope 052Y

## Status

SCOPED / NOT IMPLEMENTED

## Phase / Mode

Phase: `052Y_FORGE_ALIVE_SMART_WIDGET_STACK_SCOPE`

Mode: docs-only scope, validate, commit/push if pass.

This phase creates source-truth scope only. It does not implement UI, frontend components, runtime behavior, engines, schemas, approvals, delivery, send, CRM/task/calendar writes, or truth mutation.

## Purpose

Forge Alive Smart Widget Stack defines how Mi Dia / Mi Día, Alfred, and the command cockpit should decide which read-only widget cards should appear on the Forge Alive home surface.

The Smart Widget Stack is the product-system layer that decides what matters now. It does not create the underlying truth, execute actions, approve communication, unlock delivery, or send messages.

The core product decision is:

```text
Genesis Beta Loop cards are not permanent static cards.
They are one possible widget family inside a contextual smart widget stack.
```

Forge Alive should not always show the same cards. It should present contextually relevant widgets based on time, priority, risk, opportunity, advisor/manager context, new signals, review needs, and Article 0 judgment-development value.

## Design Source Roots

This scope consolidates existing design and governance sources. It does not invent a new visual language.

### UI Lock / Command Cockpit Visual Language

Source: `docs/10-design/FORGE_UI_LOCK_001_MI_DIA_ALFRED_COMMAND_COCKPIT.md`

Status in source: `LOCKED`

The source locks the Mi Día / Alfred Command Cockpit as the approved visual and experiential direction for the advisor home screen. It establishes:

- premium mobile-first interface
- iOS / One UI inspired polish
- dark elegant glassmorphism
- soft blur
- rounded layered cards
- subtle glowing accents
- calm but powerful hierarchy
- high contrast readable typography
- executive, modern, emotional direction
- action-oriented, not analytics-heavy behavior
- Alfred as the operational voice of Forge
- command cockpit / command bar identity

### Smart Widgets Contextual Rule

Source: `docs/10-design/FORGE_HOME_SMART_WIDGETS_CONTEXTUAL_RULE_001.md`

Status in source: `LOCK CANDIDATE`

This file is referenced as an existing design input and candidate source. This 052Y scope does not ratify it as a lock. It contributes the contextual widget-stack concept:

- Forge Home / Mi Día must not behave as a static dashboard.
- Alfred chooses what matters now.
- Mi Día should show the right widget at the right moment, not every widget at once.
- Widgets may be primary, stacked preview, collapsed, expanded, hidden, blocked by missing evidence, or hidden by scope.
- Widget behavior may be inspired by iOS Smart Stack and Samsung One UI widget stacks.

### Article 0

Source: `docs/architecture/source-truth/ARTICLE_0_RATIFICATION_001.md`

Status in source: `ARTICLE_0_RATIFIED / RATIFIED / ACTIVE`

Article 0 governs the Smart Widget Stack:

```text
Forge exists to strengthen human judgment, not replace it.
```

Article 0 Gate:

```text
Does this strengthen human judgment, or does it create dependency?
```

### UI Read Model Boundary

Source: `docs/architecture/source-truth/UI_READ_MODEL_SCOPE_038A.md`

The Smart Widget Stack must consume read-only presentation model candidates. UI read model candidate is not UI rendering truth and must not create delivery truth, message truth, tasks, calendar events, CRM mutations, automatic follow-up, or execution.

### UI Rendering Boundary

Source: `docs/architecture/source-truth/UI_RENDERING_BOUNDARY_SCOPE_042A.md`

The Smart Widget Stack must remain inside read-only rendering constraints. Forge Alive view is not dashboard truth. UI rendering candidate is not user interface execution. Rendering must not mutate state, execute actions, create truth, create tasks/calendar, calculate metrics, or modify CRM.

### Forge Alive Shell

Source: `docs/architecture/source-truth/FORGE_ALIVE_SHELL_SCOPE_043A.md`

The Smart Widget Stack belongs inside the Forge Alive Shell concept: arranging already-safe render model candidates into a human-facing structure with status, reason why, warnings, limitations, source trace, blocked surfaces, and next review action.

### Genesis Beta Loop UI Rendering Scope

Source: `docs/architecture/source-truth/FORGE_ALIVE_GENESIS_BETA_LOOP_UI_RENDERING_SCOPE_052M.md`

Genesis Beta Loop cards are an allowed review-card surface only when their read model is safe. They must show human final authority, review-only state, not-approved state, not-sendable state, delivery locked state, evidence visibility, uncertainty visibility, and Article 0 reminders.

### Forge Alive MVP Readiness

Source: `docs/09-live-mvp/LIVE-001_FORGE_ALIVE_MVP_READINESS.md`

Forge Alive becomes alive when the user receives a judgment-ready actionable decision. The minimum living unit remains:

```text
Do this now.
With this person.
For this reason.
Say this.
Follow up on this date.
```

## Core Rule

Forge Alive should not always show the same cards.

It should present contextually relevant widgets.

Mi Dia / Mi Día is not a static dashboard. It is the advisor or manager command cockpit. Its job is to answer what matters now, why it matters, what evidence supports it, what is uncertain, and what the human should decide before acting.

Permanent fixed cards that ignore context violate this scope.

## Widget Examples

The Smart Widget Stack may scope future read-only widget families such as:

- Morning agenda widget.
- Follow-up priority widget.
- Commission update widget.
- 25-point review widget.
- Monthly goal / gap widget.
- Genesis Beta Loop review packet widget.
- Forgotten client widget.
- Opportunity rescue widget.
- Learning / judgment prompt widget.

These examples are not runtime approval. Each future widget family still needs a read-model contract, UI rendering boundary compliance, evidence rules, Article 0 alignment, and tests before implementation.

## Contextual Triggers

Example trigger rules:

- 8 AM -> agenda / day plan.
- 4 PM -> 25-point review / closing check.
- new commission update -> commission glance.
- high follow-up risk -> follow-up widget.
- monthly gap risk -> goal/gap widget.
- safe Genesis review packet available -> review packet widget.
- missing context / uncertainty high -> judgment prompt widget.

Triggers are prioritization inputs only. They are not execution authority.

## Priority Rules

Widgets should be ordered by:

- urgency
- business impact
- risk
- freshness
- confidence
- missing context
- Article 0 learning value
- human decision checkpoint need

The stack should prefer the widget that best helps the human decide what to inspect or do next without hiding uncertainty or turning Forge into the final authority.

## Article 0 Requirement

Every widget must strengthen human judgment, not replace it.

Each widget must expose at least one of:

- why this appears now
- evidence
- uncertainty
- missing context
- decision checkpoint
- what the human should learn

Any widget that gives answers without teaching reasoning, hides uncertainty, removes human responsibility, increases dependency, or implies Forge is the final authority must HOLD for Article 0 review.

## Allowed UI Behavior

Future Smart Widget Stack rendering may:

- render read-only widgets
- show badges
- show evidence, reasoning, and uncertainty
- show why now
- show review questions
- show locked approval/send/delivery states
- stack or rotate widgets
- collapse lower-priority detail behind non-critical expansion
- show missing context and unknown states explicitly

## Forbidden UI Behavior

Future Smart Widget Stack rendering must not include:

- hidden execution
- no send button
- no approval mutation
- task/calendar/CRM write
- provider/LLM runtime trigger
- delivery unlock
- payout/revenue/compensation/lifecycle/HR/ranking truth mutation
- "Forge decided" language
- permanent fixed cards that ignore context
- hidden uncertainty
- hidden missing evidence
- hidden blocked state
- widgets that look like final authority

## Genesis Beta Loop Role

Genesis Beta Loop cards become:

```text
GENESIS_REVIEW_PACKET_WIDGET_FAMILY
```

They appear only when relevant:

- safe-for-human-review packet exists
- human review is needed
- decision context is useful
- Article 0 learning value is present

They should not be permanently pinned to the home screen.

The Genesis review packet widget family remains:

- read-only
- not approved
- not sendable
- delivery locked
- evidence-visible
- uncertainty-visible
- human-final-authority aligned

## Future Implementation Gates

052Y does not implement the Smart Widget Stack.

Future phases must remain separately scoped:

- `052Z_SMART_WIDGET_STACK_READ_MODEL`
- future UI rendering implementation
- future visual QA
- Human Approval Flow remains separate
- Delivery remains separate
- Send Execution remains separate
- Audit / Persistence remains separate
- Truth promotion remains separate

## Boundaries Preserved

- No code.
- No UI implementation.
- No frontend components.
- No runtime.
- No engine changes.
- No schema changes.
- No approval mutation.
- No send.
- No CRM/task/calendar writes.
- No delivery unlock.
- No truth mutation.
- No Article 0 modification.
- No Skynet modification.
- No Constitution rewrite.
- No unrelated candidate doc ratification.
- Existing design locks and boundaries preserved.

## Final Scope Decision

```text
SEMAFORO=PASS
DECISION=PASS_052Y_SMART_WIDGET_STACK_SCOPE_COMMIT_PUSH_COMPLETE
NEXT=052Z_SMART_WIDGET_STACK_READ_MODEL
```
