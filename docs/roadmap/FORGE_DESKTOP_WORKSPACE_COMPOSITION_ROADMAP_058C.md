# Forge Desktop Workspace Composition Roadmap 058C

Status: ROADMAP

Decision token:
DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

Next:
NEXT=058D_DESKTOP_SHELL_GRID_REPAIR

## Purpose

This roadmap sequences the desktop repair after 058B.

The goal is to move from a visually unstable 056Y desktop surface to a professional command workspace without reopening mobile and without adding another layer of unmanaged overrides.

## Current State

Closed:

- 058A desktop/mobile layer separation.
- 058B desktop baseline audit.

Known desktop blockers:

- right rail overlaps central workspace;
- shell grid is not stable across laptop and desktop widths;
- command bar is visible but not primary enough;
- table density is not yet Salesforce / Excel grade;
- 056Y CSS has too many repeated grid and min-width rules.

Protected:

- mobile 057D-057N;
- 058A layer boundary;
- no-send, no-truth, no-runtime and no-storage boundaries.

## Stage 058D: Desktop Shell Grid Repair

Objective:

Repair the active 056Y desktop shell so layout lanes are stable.

Scope:

- left sidebar lane;
- central workspace lane;
- optional right rail lane;
- no overlap;
- no horizontal scroll at 1366;
- command bar remains above fold;
- table remains readable.

Preferred files:

- `docs/static-preview/forge-alive/alfred-desktop-command-workspace-056y.css`

Conditional files:

- `docs/static-preview/forge-alive/alfred-desktop-command-workspace-056y.js` only for static local UI guard alignment;
- `docs/static-preview/forge-alive/index.html` only if current DOM cannot satisfy the lane contract.

Do not touch:

- mobile 057D-057N CSS or JS;
- global `styles.css` unless an existing global conflict is proven and documented.

Evidence required:

- GitHub Pages or local static screenshots at 1366x768, 1440x1000, 1536x864 and 1920x1080;
- validation that no mobile elements appear on desktop;
- validation that no horizontal scroll is required at 1366.

Exit token:

`DECISION=PASS_058D_DESKTOP_SHELL_GRID_REPAIR`

## Stage 058E: Desktop Command Workspace Upgrade

Objective:

Make the command bar the primary desktop action surface.

Scope:

- command bar hierarchy;
- quick destinations;
- grouped local suggestions;
- preview-ready state;
- approval-required labels;
- keyboard focus and visible active state.

Required commands:

- `/cotizar`
- `/subir poliza`
- `/follow Juan`
- `/buscar cliente`
- `/llamar Lariza`

Boundary:

Static preview only. No real execution.

Exit token:

`DECISION=PASS_058E_DESKTOP_COMMAND_WORKSPACE_UPGRADE`

## Stage 058F: Desktop Table And KPI Density

Objective:

Make the main workspace feel like an operating system, not a card dashboard.

Scope:

- opportunities table;
- document workflow table;
- compact KPI strip;
- filters or toolbar;
- inline actions;
- status chips;
- row rhythm.

Acceptance:

- main table is the first meaningful work surface;
- KPI strip supports the work without becoming a hero;
- tables show more useful context at wider widths.

Exit token:

`DECISION=PASS_058F_DESKTOP_TABLE_AND_KPI_DENSITY`

## Stage 058G: Desktop Visual Polish

Objective:

Apply premium Forge styling only after layout stability.

Scope:

- glass depth;
- shadows;
- typography;
- icon polish;
- command glow;
- rail Alfred styling;
- sidebar refinement.

Rule:

No visual polish may compensate for a broken grid.

Exit token:

`DECISION=PASS_058G_DESKTOP_VISUAL_POLISH`

## Stage 058H: Desktop Static Preview QA Lock

Objective:

Lock a stable desktop visual baseline after shell, command, table and polish stages pass.

Evidence:

- desktop screenshots at required breakpoints;
- syntax checks;
- static safety scans;
- no mobile regression evidence;
- no runtime, send, storage or source-truth mutation.

Exit token:

`DECISION=PASS_058H_DESKTOP_STATIC_PREVIEW_QA_LOCK`

## Repair Philosophy

Do:

- repair composition before polish;
- consolidate conflicting desktop layout rules;
- keep the table primary;
- keep command above fold;
- keep Alfred contextual;
- preserve mobile.

Do not:

- add another unmanaged override layer;
- solve laptop by requiring horizontal scroll;
- hide the rail problem with clipping;
- turn desktop into a mobile widget board;
- re-open mobile to solve desktop.

## Decision

058C scopes the repair path. 058D should now implement the shell grid repair against this contract.

DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

NEXT=058D_DESKTOP_SHELL_GRID_REPAIR
