# Forge Alive Smart Widget Stack Static Preview Scope 053B

## Phase

`053B_FORGE_ALIVE_SMART_WIDGET_STACK_STATIC_PREVIEW_SCOPE`

## Status

`SCOPED / DOCS_ONLY / NOT_IMPLEMENTED`

## Purpose

053B scopes how the Forge Alive static preview should consume the Smart Widget Stack read model created in 052Z.

The preview must stop treating Genesis Beta Loop cards as permanent home-screen content. Genesis becomes one contextual widget family inside an intelligent stack.

## Source Truth

This scope consumes:

- `docs/architecture/source-truth/FORGE_ALIVE_SMART_WIDGET_STACK_SCOPE_052Y.md`
- `docs/architecture/source-truth/FORGE_ALIVE_SMART_WIDGET_STACK_READ_MODEL_CLOSURE_052Z.md`
- `manager-os/forge-alive/forge-alive-smart-widget-stack-read-model.js`
- `docs/10-design/FORGE_UI_LOCK_001_MI_DIA_ALFRED_COMMAND_COCKPIT.md`
- `docs/10-design/FORGE_HOME_SMART_WIDGETS_CONTEXTUAL_RULE_001.md`

## Static Preview Rule

The Forge Alive static preview should render the active Smart Widget Stack, not a fixed Genesis section.

Widgets are contextual and may include:

- morning agenda
- follow-up priority
- commission update
- 25-point review
- monthly goal gap
- Genesis review packet
- forgotten client
- opportunity rescue
- judgment prompt

## Product Behavior

The preview should demonstrate that the top widget changes by context:

- 8 AM with agenda available shows agenda first.
- 4 PM with review due shows 25-point review first.
- commission updates surface when available.
- high follow-up risk surfaces follow-up priority.
- high uncertainty or missing context surfaces judgment prompt.
- Genesis review packets appear only when that context exists.

## Visual Direction

The preview must keep the Forge Alive visual language:

- premium dark command-center
- deep navy / near-black background
- subtle glass cards
- thin luminous borders
- soft blue and gold accents
- compact operational layout
- Alfred-style assistant/review feel
- visible preview version badge

## Article 0 Requirements

The static preview must strengthen human judgment, not replace it.

It must preserve:

- HUMAN final authority
- read-only status
- visible reason why
- visible why this appears now
- visible evidence
- visible uncertainty
- visible missing context
- visible review questions
- no hidden total authority
- no permanent dependency pattern

## Hard Boundaries

053B does not implement UI.

Future implementation must not add:

- approval
- send
- delivery unlock
- provider runtime
- LLM runtime
- CRM write
- task write
- calendar write
- payout truth
- revenue truth
- compensation truth
- lifecycle truth
- HR truth
- ranking truth
- punishment truth
- personality truth

## Static Preview Implementation Target

Recommended next implementation phase:

`053C_FORGE_ALIVE_SMART_WIDGET_STACK_STATIC_PREVIEW_IMPLEMENTATION`

Expected implementation shape:

- Replace fixed Genesis card rendering in the static preview with a browser-safe smart widget sample data module.
- Render only the active contextual widget stack.
- Keep Genesis as one possible widget family.
- Add or update visible preview badge to the implementation phase version.
- Preserve all read-only, Article 0, and no-action boundaries.

## Final Decision

```text
SEMAFORO=PASS
DECISION=PASS_053B_SMART_WIDGET_STACK_STATIC_PREVIEW_SCOPE_COMMIT_PUSH_COMPLETE
NEXT=053C_FORGE_ALIVE_SMART_WIDGET_STACK_STATIC_PREVIEW_IMPLEMENTATION
```
