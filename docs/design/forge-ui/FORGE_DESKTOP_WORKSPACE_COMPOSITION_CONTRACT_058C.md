# Forge Desktop Workspace Composition Contract 058C

Status: DESIGN CONTRACT

Decision token:
DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

Next:
NEXT=058D_DESKTOP_SHELL_GRID_REPAIR

## Design Goal

Forge desktop is a command-first operating workspace for commercial work.

It should feel like a professional system where the advisor can:

- find the next action;
- inspect the table;
- understand the reason;
- open a safe preview;
- move to quotes, policies, follow-up or client context with minimal clicks.

## Composition Model

The desktop shell uses stable lanes:

```text
┌─────────────┬────────────────────────────────────────────┬──────────────────┐
│ Sidebar     │ Command-first header                       │ Right rail       │
│ fixed lane  ├────────────────────────────────────────────┤ optional lane    │
│             │ KPI strip                                  │                  │
│             ├────────────────────────────────────────────┤                  │
│             │ Main opportunities table                   │ Alfred context   │
│             ├──────────────────────┬─────────────────────┤                  │
│             │ Follow engine        │ Document workflow   │                  │
└─────────────┴──────────────────────┴─────────────────────┴──────────────────┘
```

At narrower desktop widths, the right rail must stop being a third column and become a below-main panel or collapsed contextual summary.

## Layout Tokens

These are composition targets, not final visual polish values.

- Sidebar width: 184px to 224px.
- Main content minimum useful width at laptop: 900px.
- Right rail width when active: 280px to 320px.
- Shell gap: 14px to 20px.
- Header height: content-driven, compact.
- KPI strip height: 72px to 104px.
- Table row height: 48px to 60px.
- Main card radius: 16px to 22px for dense system panels.
- Command bar radius: 16px to 24px or pill when visually appropriate.

## Breakpoint Contract

### 1366x768 laptop

Primary goal: no horizontal scroll and no rail overlap.

Required behavior:

- sidebar compact;
- command bar visible above fold;
- KPI strip compact;
- main table owns the width;
- right rail is collapsed, below-main or represented as a compact contextual panel;
- document workflow remains reachable through vertical scroll.

### 1440x900 and 1440x1000 standard desktop

Primary goal: stable daily-use desktop composition.

Required behavior:

- sidebar remains fixed lane;
- command bar and quick destinations stay above main data;
- table remains readable;
- right rail may appear only if it does not reduce main table below useful width;
- follow engine and document workflow may use a two-panel lower row.

### 1536x864 desktop

Primary goal: introduce more context without crowding.

Required behavior:

- right rail can appear as a bounded lane if main table remains readable;
- KPI strip stays compact;
- follow engine and document workflow stay balanced;
- no overlay panels.

### 1920x1080 wide desktop

Primary goal: full professional workstation.

Required behavior:

- sidebar, main workspace and right rail can all be visible;
- rail width remains bounded and does not grow excessively;
- main workspace receives additional useful width;
- tables may show more columns instead of inflating cards.

## Right Rail Contract

The rail is Alfred context, not a floating ad unit.

Allowed:

- true grid lane at wide desktop;
- below-main panel at laptop widths;
- compact summary card when space is constrained;
- sticky position inside its own lane.

Forbidden:

- absolute overlay as primary layout;
- covering main table cells;
- covering KPI cards;
- covering document workflow;
- forcing horizontal scroll at 1366;
- growing wider than the bounded rail target.

## Command Bar Contract

The command bar is the top-level action surface.

It must live above the main table and support:

- `/cotizar`
- `/subir poliza`
- `/follow Juan`
- `/buscar cliente`
- `/llamar Lariza`

Required design qualities:

- visually primary but not hero-sized;
- keyboard-friendly;
- fast to scan;
- clear placeholder;
- grouped local suggestions when active;
- safe preview language for risky actions;
- no real execution.

The command bar should reduce navigation, not duplicate the sidebar.

## KPI Strip Contract

The KPI strip supports decision context. It does not own the page.

Required behavior:

- compact;
- legible;
- above or adjacent to the main data;
- visible without pushing the table too far down;
- strong enough to scan but smaller than the command surface and table.

Initial KPIs:

- Probabilidad meta mensual;
- Produccion esperada;
- Gap;
- Riesgo de seguimiento.

## Main Table Contract

The opportunities table is the primary desktop surface.

Minimum columns:

- Cliente;
- Producto;
- Etapa;
- Probabilidad;
- Ultimo contacto;
- Siguiente accion;
- Acciones.

Required qualities:

- readable at 1366x768;
- row actions visible or predictably reachable;
- status chips compact;
- no card conversion at desktop;
- no rail overlap;
- no mobile-style single-column presentation.

## Follow Engine / Secondary Panel Contract

The follow engine supports the main table.

It should answer:

- who needs attention;
- why now;
- what action is next;
- what limit applies.

It may sit:

- beside document workflow in the lower row;
- below the table;
- near the rail context when wide enough.

It must not become the primary surface over the table.

## Document Workflow Contract

The document workflow area should behave like an operational table or dense panel.

Minimum fields:

- Documento;
- Cliente;
- Tipo;
- Estado;
- Ultima actualizacion;
- Responsable or next owner;
- Accion.

It must remain reachable on laptop without being hidden behind rail overlays.

## Visual Density Rules

Desktop should be dense but calm.

Use:

- compact panels;
- dense tables;
- small status chips;
- toolbars;
- inline actions;
- subtle glass only where it improves hierarchy;
- charts only when they carry operational meaning.

Avoid:

- oversized mobile widgets;
- giant cards as the default structure;
- hero-first composition;
- decorative glow as layout compensation;
- spacing that makes the user scroll before seeing work.

## Layer Boundary Rules

Desktop design must respect the 058A boundary:

- desktop applies at `min-width: 901px`;
- mobile applies at `max-width: 767px` and `max-width: 900px` landscape;
- desktop roots hidden outside desktop;
- mobile roots hidden outside mobile;
- shared files cannot own viewport-specific layout.

## 058D Visual QA Checklist

Before 058D can pass, screenshots must prove:

- 1366x768: no horizontal scroll, no rail overlap, command visible;
- 1440x1000: stable standard desktop composition;
- 1536x864: rail behavior is intentional and non-overlapping;
- 1920x1080: wide desktop uses extra width for data, not oversized cards;
- no bottom nav or mobile widget grid visible;
- table remains the main work surface;
- command bar is above fold and visually primary;
- KPI strip is compact and readable.

## Decision

This contract authorizes 058D to repair the desktop shell grid only inside the approved desktop boundary.

DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

NEXT=058D_DESKTOP_SHELL_GRID_REPAIR
