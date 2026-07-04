# Forge Desktop Workspace Composition Scope 058C

Status: SOURCE TRUTH SCOPE

Decision token:
DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

Next:
NEXT=058D_DESKTOP_SHELL_GRID_REPAIR

## Purpose

058C defines the desktop workspace composition contract for Forge Alive before any 058D implementation.

This is not a visual redesign. It is the source-truth scope for repairing the active desktop grid without improvising and without reopening the locked mobile line.

## Prerequisites

058C depends on:

- `DECISION=PASS_058A_DESKTOP_MOBILE_LAYER_SEPARATION`
- `DECISION=PASS_058B_DESKTOP_BASELINE_AUDIT`
- `FORGE_DESKTOP_COMMAND_WORKSPACE_BLUEPRINT_001`
- `FORGE_DESKTOP_DESIGN_SYSTEM_DRAFT_001`
- `FORGE_DESKTOP_COMMAND_WORKSPACE_SCOPE_056X`
- `FORGE_DESKTOP_SYSTEM_VISION_AND_LAYER_LOCK_056W`

## 058B Findings Adopted As Scope

058B established:

- desktop and mobile are separated correctly in visible captures;
- the active desktop surface is `.forge-desktop-workspace-056y`;
- the blocker is desktop composition, not mobile contamination;
- the right rail invades the main workspace at common desktop widths;
- the current 056Y CSS relies on repeated grid definitions, min-width constraints and heavy override usage;
- the command bar exists but does not yet dominate as the primary operating surface.

058C converts those findings into an implementation boundary for 058D.

## Product Intent

Desktop Forge Alive must feel like:

- professional Sales Operating System;
- Salesforce-grade workspace;
- Excel-grade productivity surface;
- financial operations system;
- command-first Alfred workspace.

Desktop Forge Alive must not feel like:

- mobile enlarged;
- iPad app;
- decorative dashboard;
- landing page;
- large widget board;
- static mock with data painted on top.

## Non-Negotiables

### Mobile remains protected

058D must not touch or regress the locked mobile line:

- 057D mobile pattern;
- 057E mobile repair;
- 057F mobile polish;
- 057G mobile top nav;
- 057J mobile widget grid;
- 057L mobile widget grid polish;
- 057M mobile widget dedup;
- 057N mobile widget grid night lock.

### Fewer clicks remains the product rule

Command and inline actions must reduce the path from intention to reviewed action.

Desktop density is allowed. Desktop friction is not.

### Data tables are primary

The table is the primary desktop operating surface. Cards and panels support the table; they do not replace it.

### Alfred is contextual, not obstructive

Alfred may guide, summarize, recommend and prepare previews. Alfred must not cover the working surface or force the user away from the table.

### Safety boundaries remain intact

The static preview may show safe local UI states only. It must not perform writes, sends, provider calls, source-truth mutation, calendar creation, audio runtime, live search, browser storage or network execution.

## Desktop Shell Scope

058D must repair the shell around these lanes:

1. left sidebar fixed lane;
2. command-first header lane;
3. central workspace lane;
4. KPI strip;
5. main opportunities table;
6. follow engine or secondary insight panel;
7. document workflow area;
8. optional right rail lane.

The shell must be lane-based, not overlay-based.

## Lane Ownership

### Left sidebar

The sidebar owns global navigation.

Expected contents:

- Inicio;
- Pipeline;
- Clientes;
- Cotizaciones;
- Polizas;
- Reportes;
- Alfred;
- Mas.

The sidebar may be compact, but it must never compress the table into an unusable width.

### Command-first header

The command header owns:

- greeting or page label;
- workspace title;
- command bar;
- quick destinations;
- environment or safe preview indicators.

The command bar must live above main data and stay visible above the fold.

### Central workspace

The central workspace owns:

- KPI strip;
- primary opportunities table;
- filters or compact controls;
- secondary workflow panels;
- document workflow table.

The central workspace must not be visually hidden behind Alfred or the rail.

### Right rail

The right rail owns contextual Alfred assistance:

- Haz esto ahora;
- Por que ahora;
- limites;
- comando recomendado;
- feedback.

The right rail is optional at narrower desktop widths and required only when there is enough room.

## Right Rail Rules

The right rail must:

- never overlay the main workspace;
- never sit on top of the main table;
- never hide lower document workflow content;
- have a bounded width;
- collapse or move below the main workspace at narrow desktop widths;
- become a true right lane only at sufficiently wide desktop widths;
- avoid absolute positioning for primary rail layout.

At narrow desktop, the preferred behavior is:

1. sidebar remains compact;
2. central workspace remains primary;
3. rail becomes below-main panel or collapsible summary;
4. no horizontal scroll is required at 1366.

## Command Bar Scope

The desktop command bar is the fastest path to work.

It must support these quick destinations:

- `/cotizar`
- `/subir poliza`
- `/follow Juan`
- `/buscar cliente`
- `/llamar Lariza`

It must support local static preview states:

- idle;
- typing;
- grouped suggestions;
- selected result;
- preview-ready state;
- approval-required label.

It must not execute real actions.

## Data Density Scope

Desktop may use:

- dense tables;
- compact rows;
- status chips;
- inline actions;
- sticky column headers where useful;
- filters and search controls;
- compact KPI summaries;
- professional charts.

Desktop must avoid:

- giant mobile-like widgets as default;
- card grids that replace tables;
- hero-dominant content;
- oversized KPI cards;
- huge ornamental charts;
- large empty demo gaps.

## Target Breakpoints

058D must explicitly account for:

- 1366x768 laptop;
- 1440x900 standard desktop;
- 1440x1000 standard desktop;
- 1536x864 desktop;
- 1920x1080 wide desktop.

The 1366x768 viewport is a first-class desktop target, not an afterthought.

## Forbidden For 058D

058D must not:

- touch mobile 057D-057N;
- implement a mobile enlarged layout;
- rely on horizontal scroll as the primary solution;
- use absolute overlay for the primary right rail;
- hide the command bar below the fold;
- turn desktop into a large card dashboard;
- continue stacking overrides without consolidating conflicting layout rules;
- introduce runtime, provider, storage, send, calendar or CRM behavior;
- invent source truth or financial values.

## Acceptance Criteria For 058D

058D passes only if screenshots prove:

- no right rail overlap at 1366x768;
- no right rail overlap at 1440x900 or 1440x1000;
- no right rail overlap at 1536x864;
- no right rail overlap at 1920x1080;
- command bar is visible above the fold;
- command bar reads as a primary operating surface;
- main table is readable and usable;
- KPI strip is compact and legible;
- document workflow area remains reachable;
- no mobile elements are visible in desktop captures;
- no horizontal scroll is required at 1366;
- desktop feels like a professional system, not a mock.

Required 058D screenshot evidence:

- 1366x768;
- 1440x1000;
- 1536x864;
- 1920x1080.

## Recommended Implementation Boundary For 058D

058D should target the active 056Y desktop workspace only.

Preferred files:

- `docs/static-preview/forge-alive/alfred-desktop-command-workspace-056y.css`
- `docs/static-preview/forge-alive/alfred-desktop-command-workspace-056y.js` only if local static interaction requires guard alignment.

Avoid:

- global `styles.css`;
- mobile CSS and JS;
- structural `index.html` changes unless the current desktop DOM cannot satisfy the lane contract.

If `index.html` must be touched later, the change must be justified by this composition contract.

## Final Decision

058C closes the scope and composition contract needed for 058D.

DECISION=PASS_058C_DESKTOP_WORKSPACE_COMPOSITION_SCOPE

NEXT=058D_DESKTOP_SHELL_GRID_REPAIR
