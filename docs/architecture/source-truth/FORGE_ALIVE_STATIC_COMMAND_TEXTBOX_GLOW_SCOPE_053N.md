# Forge Alive Static Command Textbox Glow Scope 053N

`053N_FORGE_ALIVE_STATIC_COMMAND_TEXTBOX_GLOW_SCOPE`

## Decision

Forge Alive's persistent command layer is a command textbox, not a button rail, not a widget selector, and not a decorative card.

The final interaction surface is a text input / command box where the human directs Forge. The Smart Widget Stack remains contextual content. It may slide, scroll, or animate only inside its bounded content layer and must not displace the persistent command textbox.

## Product Rule

- Alfred / command bar is the persistent human command point.
- The command surface must read visually as a text box.
- The command surface may include compact affordances only when they support text entry or review.
- Smart widgets must move behind or below the command layer.
- Widget carousel movement must not move the command layer.
- The command layer must remain visually stable while contextual widgets change.

## Glow Rule

The command textbox should support an animated living glow inspired by Siri/Gemini style assistant presence, but adapted to Forge Alive.

Allowed glow properties:

- Forge palette only: deep navy base, electric blue/cyan energy, muted gold warmth, restrained white highlight.
- Subtle animated halo around the command textbox.
- Slow breathing/pulsing idle state.
- Slightly stronger focus/listening/review state.
- Premium dark glass compatibility.
- Reduced-motion fallback.

Forbidden glow properties:

- Purple-first generic AI gradient.
- Neon rainbow treatment.
- Heavy bloom that obscures text.
- Motion that competes with the Smart Widget Stack.
- Animation implying autonomous send/approval/runtime execution.

## Static Preview Boundary

In static preview, the textbox remains read-only or disabled unless a later explicit phase scopes safe input behavior.

The glow is visual only. It must not:

- approve
- send
- create tasks
- create calendar events
- write CRM
- call provider runtime
- call LLM runtime
- create truth

## Article 0 Requirements

The command textbox supports Article 0 by keeping the human command point visible and stable.

The UI must communicate:

- Forge supports human judgment.
- Forge does not become the final authority.
- The human remains in command.
- Contextual widgets inform; they do not decide.

## Implementation Gate

Next implementation may update the static preview only if it:

- renders a persistent command textbox layer
- keeps Smart Widget Stack movement bounded behind/below that layer
- adds Forge-compatible animated glow
- preserves reduced-motion accessibility
- preserves read-only/no-action boundaries
- keeps version badge visible
- keeps phone layout readable

## Next Phase

`053O_FORGE_ALIVE_STATIC_COMMAND_TEXTBOX_GLOW_IMPLEMENTATION`

## Final Decision

PASS_053N_STATIC_COMMAND_TEXTBOX_GLOW_SCOPE_READY
