# Forge Alive Static Command Layer Rule Scope 053I

## Phase

`053I_FORGE_ALIVE_STATIC_COMMAND_LAYER_RULE_SCOPE`

## Status

`SCOPED / DOCS_ONLY / NOT_IMPLEMENTED`

## Rule

Alfred / command bar is a persistent control layer.

Smart widgets, cards, carousels, opportunity panels, agenda panels, and contextual review surfaces may move, scroll, swipe, or animate. Alfred and the command bar must remain stable as the cockpit control layer.

## Purpose

Forge Alive should feel like a command cockpit, not a normal scrolling web page.

The assistant layer is the human command surface. Contextual intelligence appears behind it, below it, or inside bounded content regions, but should not visually displace the command layer.

## Required Layout Behavior

- Alfred / command bar remains visually persistent.
- Bottom navigation remains visually persistent.
- Smart widgets slide inside their own bounded zone.
- Dot indicators, cards, and contextual widgets may animate only inside the content layer.
- Content must not cover the command bar.
- Content must not push the command bar out of the cockpit.
- The user must always have a stable place to ask Alfred what to do next.

## Relationship To Smart Widgets

Smart widgets are contextual content, not the command layer.

The Smart Widget Stack may change based on time, priority, uncertainty, commission update, follow-up risk, agenda, or Genesis review packet context. Those changes must happen in the content layer, while Alfred remains stable.

## Article 0 Requirements

This rule supports Article 0 because it keeps the human command surface visible.

The UI should strengthen human judgment by preserving:

- a stable command point
- visible final human authority
- contextual reasoning
- evidence and uncertainty visibility
- no hidden total authority
- no dependency pattern where the moving content becomes the commander

## Hard Boundaries

053I does not implement UI.

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

## Future Implementation Guidance

Future Forge Alive UI implementation should use a layered model:

1. persistent shell layer
2. persistent command layer
3. bounded contextual content layer
4. bounded micro-interaction layer

Alfred / command bar belongs to the persistent command layer.

Smart Widget Stack belongs to the bounded contextual content layer.

## Final Decision

```text
SEMAFORO=PASS
DECISION=PASS_053I_STATIC_COMMAND_LAYER_RULE_SCOPE_COMMIT_PUSH_COMPLETE
NEXT=053J_STATIC_COMMAND_LAYER_OUTPUT_REVIEW_OR_IMPLEMENTATION_SCOPE
```
