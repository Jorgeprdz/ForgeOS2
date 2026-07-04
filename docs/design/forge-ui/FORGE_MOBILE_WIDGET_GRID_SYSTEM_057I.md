# Forge Mobile Widget Grid System 057I

Status: DESIGN PATTERN SCOPED
Phase: 057I_MOBILE_WIDGET_GRID_SYSTEM_SCOPE

## Design Intent

Forge mobile needs a widget system that can grow without losing the premium
mobile line. The home screen should work like a commandable dashboard:
Alfred tells the user what matters, widgets prove it, and the command bar
turns it into action.

## Grid Model

Base mobile grid: 4 columns.

| Widget | Columns | Rows | Purpose |
| --- | ---: | ---: | --- |
| KPI mini | 2 | 2 | One number, one label, one signal |
| Wide strip | 4 | 2 | Compact chart, list preview, action strip |
| Feature card | 4 | 4 | Smart Widget, chart, action plan, module preview |

Rows are visual units, not strict pixels. The implementation may tune exact
height with CSS tokens.

## Recommended Initial Home Order

1. Secure badge.
2. Greeting.
3. Context top nav.
4. Alfred hero/action.
5. Plan de hoy.
6. Widget grid:
   - 4x4 next best action / Smart Widget;
   - 2x2 Meta mensual;
   - 2x2 Seguimiento;
   - 4x2 Oportunidades compactas;
   - 4x2 Comisiones or Actividad;
   - 4x4 chart when useful.
7. Recommendations or notes.

## Widget Anatomy

Every widget should have:

- label or eyebrow;
- primary value or headline;
- supporting context;
- status signal;
- optional action.

Charts should have:

- a primary value;
- a compact visual;
- a time or comparison label;
- no unnecessary axes on small mobile cards.

## Multi Size Examples

| Size | Example | Content |
| --- | --- | --- |
| 2x2 | Meta mensual | 64%, 6/10 familias |
| 2x2 | Seguimiento | 78%, activo |
| 4x2 | Comisiones | projected commission + sparkline |
| 4x2 | 25 puntos | points done / points remaining |
| 4x2 | Oportunidades | Lariza, Octavio, Maria compact |
| 4x4 | Seguimiento prioritario | why now + next action + score |
| 4x4 | Produccion | bar/spark chart + target/gap |

## Visual Rules

- Rounded cards stay soft and premium.
- Use navy depth as base.
- Gold is for priority/action.
- Cyan is for intelligence, motion, live signal.
- Dense data is allowed only when it remains scannable.
- Avoid default browser buttons.
- Avoid table layout on mobile.

## Chart Rules

Charts should feel like mobile widgets, not spreadsheet screenshots.

Use:

- sparklines;
- small bars;
- circular progress;
- segmented progress;
- compact trend strips.

Avoid:

- full axes in 2x2 widgets;
- legends that consume space;
- tiny labels;
- over-saturated color.

## Motion Rules

- Carousel dot moves like a liquid capsule.
- Widget height changes should animate.
- Reorder/edit mode later should use lift, blur, and snap.
- Touch down state should feel tactile but subtle.

## Interaction Rules

Tap behavior:

- 2x2: opens detail or filters current context.
- 4x2: opens module preview or focuses a list.
- 4x4: opens next action or expands detail.

Long press future:

- edit widget;
- pin;
- hide;
- resize when supported.

## Not In 057I

057I does not implement:

- editing widgets;
- drag and drop;
- real charts from production data;
- CRM/calendar/message/file actions;
- desktop widget grid.

DECISION=FORGE_MOBILE_WIDGET_GRID_SYSTEM_057I
