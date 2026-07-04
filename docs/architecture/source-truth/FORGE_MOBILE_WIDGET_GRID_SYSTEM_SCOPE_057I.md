# Forge Mobile Widget Grid System Scope 057I

Status: SCOPED
Phase: 057I_MOBILE_WIDGET_GRID_SYSTEM_SCOPE
Previous baseline: 057H_MOBILE_VISUAL_BASELINE_LOCK
Next: 057J_MOBILE_WIDGET_GRID_SYSTEM_IMPLEMENTATION

## Decision

057H locked the mobile visual baseline only. It did not close the final
mobile system. The next mobile layer is the widget grid system.

057I defines the mobile widget grid before implementation so Forge can add
more screens, modules, charts, and widget types without redesigning the
home screen every time.

DECISION=FORGE_MOBILE_WIDGET_GRID_SYSTEM_SCOPED_057I

## Non Negotiables

- Mobile first remains the product baseline.
- Fewer clicks remains non negotiable.
- Navigation stays simple.
- The command bar remains priority for fast actions and destinations.
- Alfred remains a concierge, not a decorative badge.
- The navy, gold, and cyan Forge palette stays locked.
- The 057H visual baseline is preserved.
- Desktop is not touched in this phase.
- This phase is docs/source-truth only.

## Product Goal

The mobile home becomes a premium widget surface:

- fast to scan;
- action-first;
- modular;
- reorderable later;
- able to show charts and operational cards;
- consistent across future modules.

The system should feel like a premium mobile OS, not a dense admin page.

## Widget Grid Sizes

| Size | Use | Mobile Meaning |
| --- | --- | --- |
| 2x2 | Small KPI or status | One quick number or binary status |
| 4x2 | Wide operational card | Chart strip, next action, mini list |
| 4x4 | Hero/primary widget | Smart Widget carousel, graph, plan block |

## Initial Widget Families

| Family | Examples | Priority |
| --- | --- | --- |
| Alfred action | Next best action, why now, command suggestion | Highest |
| Sales pulse | Opportunities, follow-up risk, pipeline movement | High |
| Production | Production expected, gap, monthly target | High |
| Commissions | Commission trend, projected commission, paid vs pending | High |
| Activity | Calls, messages, meetings, follow-ups, 25 points | High |
| Document workflow | Quotes, policies, pending uploads, review queue | Medium |
| Safety/context | Preview only, human decision, source reminders | Supportive |

## Required Chart Widgets

057I requires space for charts, not static text only.

Initial chart candidates:

- commissions trend;
- monthly production;
- activity points / 25 points;
- follow-up velocity;
- pipeline stage movement;
- quote to policy conversion.

Charts must be compact, readable, and optional. They must never push the
next best action below the first useful viewport.

## Layout Rules

1. Top of home remains: secure badge, greeting, context navigation, Alfred
   hero/action.
2. The first widget after Plan de hoy should be operational and compact.
3. The first viewport should answer:
   - what is happening;
   - who needs attention;
   - what is the next action.
4. Widgets may overlap bottom nav/orb only if scroll can reveal the content.
5. Large cards must justify their height with action or chart value.
6. Tables are not allowed in mobile home. Use cards, strips, charts, or lists.

## Dynamic Height Rule

Smart Widgets and 4x4 widgets may change height by content, following the
approved Samsung Health-style pattern.

Rules:

- height transitions must be smooth;
- dots stay inside the widget frame;
- the active card controls widget height;
- inactive cards must not create blank space;
- text must not be clipped;
- chart cards may be taller than text cards.

## Edit And Reorder Future

The home grid should eventually support:

- add/remove widgets;
- reorder widgets;
- pin an important widget;
- collapse a widget;
- choose compact/expanded mode.

This phase scopes the pattern only. It does not implement editing.

## Safety Boundary

All widgets in static preview remain preview-only.

No widget may:

- write CRM;
- create calendar events;
- send messages;
- upload files;
- create truth;
- perform runtime action.

Widgets may describe intended actions and preview safe next steps.

## Acceptance Criteria For 057J

057J implementation should pass only when:

- 2x2, 4x2, and 4x4 examples exist in mobile;
- at least one chart-style widget exists;
- Smart Widget carousel still works;
- bottom nav and orb remain usable;
- top nav remains centered;
- desktop remains guarded;
- no static preview safety boundary is weakened.

## Next

057J_MOBILE_WIDGET_GRID_SYSTEM_IMPLEMENTATION
