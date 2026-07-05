# Forge Premium Final Polish Scope 061D

Status: SCOPED

Date: 2026-07-05

Phase:
`061D_PREMIUM_FINAL_POLISH_SCOPE`

Base public preview URL:
`https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=061b`

Base validated commit:
`f55d1c5 docs: lock profile menu copy and spacing visual qa`

## Purpose

061D defines the final high-impact polish scope required to move the Forge Alive desktop public preview from strong QA-pass quality to a 9/10 premium command workspace.

This phase is scope and decision only. It does not mutate the static preview, styles, scripts, markup, runtime adapters, or product behavior.

## Source Evidence

- `docs/evidence/forge-profile-menu-copy-spacing-061c-closed-1366x768.png`
- `docs/evidence/forge-profile-menu-copy-spacing-061c-menu-open-1366x768.png`
- `docs/evidence/forge-profile-menu-copy-spacing-061c-closed-1440x1000.png`
- `docs/evidence/forge-profile-menu-copy-spacing-061c-menu-open-1440x1000.png`
- `docs/evidence/forge-profile-menu-copy-spacing-061c-closed-1920x1080.png`
- `docs/evidence/forge-profile-menu-copy-spacing-061c-menu-open-1920x1080.png`
- `docs/evidence/forge-profile-menu-copy-spacing-visual-qa-audit-061c.json`

## Current Visual Rating

After 061C, Forge Alive desktop preview is rated:

`8.6 / 10`

Assessment:

Forge Alive now reads as a coherent desktop command workspace. The topbar is clean, the profile menu copy and spacing are resolved, the sidebar identity duplication is removed, and the command bar remains visible and scoped. The remaining gap to 9/10 is not a broken-state problem. It is final product polish: hierarchy, rhythm, overlay confidence, and preview-label quieting.

## 061E Candidate Scope

### 1. Command/Risk/KPI Vertical Rhythm

Problem:

At 1366 and 1440 widths, the command bar, primary risk card, and KPI row still feel like separate stacked blocks instead of one composed command surface.

061E should tighten spacing and relative scale so the command area, decision highlight, and metrics read as one intentional above-fold workspace.

Acceptance target:

- Command bar remains visible above fold.
- Risk card remains prominent but not oversized.
- KPI row feels connected to the decision surface.
- No content becomes cramped at 1366 width.

### 2. Primary Decision Card Hierarchy

Problem:

The primary card is useful but still carries slightly more preview/demo weight than product-final weight. The title, status copy, CTA area, and supporting text can be tuned so the card feels like a decisive system recommendation rather than a large informational panel.

061E should refine text scale, button weight, inner spacing, and supporting copy prominence.

Acceptance target:

- The primary decision remains the first business signal.
- Secondary copy is quieter.
- CTA controls are clear without dominating the workspace.
- The card feels premium, compact, and operational.

### 3. Command Bar Product-Final State

Problem:

`/quick actions` is clean, but the command bar can still read as placeholder-like. The surface should feel like a real command entry point even when idle.

061E should preserve the current interaction contract and refine the visual affordance only.

Acceptance target:

- Idle command bar feels editable and intentional.
- No focus rectangle appears.
- No floating results panel appears while empty and unfocused.
- Results remain contextual and overlay-based only after relevant input or focus state.
- Static suggestions do not overlap the active panel.

### 4. Profile Menu Overlay Confidence

Problem:

061C fixed copy and spacing, but at 1366 and 1440 widths the open menu still covers part of the top workspace. The current behavior is acceptable; final polish should make it feel more deliberately anchored.

061E should improve menu overlay confidence through safe positioning, shadow/backdrop strength, spacing, or width treatment without changing account-menu content.

Acceptance target:

- The menu opens from the J avatar and remains visually attached to it.
- The menu does not feel pasted over the command/risk area.
- Menu labels remain: `Jorge Fernandez`, `Asesor financiero`, `Cambiar tema`, `Opciones`, `Cerrar sesión`, `Vista estática segura`.
- Menu actions remain static-preview safe.

### 5. Right Rail and Wide Desktop Balance

Problem:

At 1920 width, the right rail is useful and visually stable. Final polish should ensure the rail, menu, and main workspace feel equally intentional instead of independently layered.

061E should verify visual spacing between the profile menu, right rail, and main command surface.

Acceptance target:

- Right rail does not crowd the profile menu.
- Main workspace does not appear detached from the rail.
- Wide desktop keeps density without becoming visually noisy.

### 6. Table and Action Density

Problem:

The opportunity table is professional, but some right-edge action labels and buttons can feel tight at smaller desktop widths.

061E should inspect button widths, column rhythm, and label wrapping around table actions.

Acceptance target:

- No awkward label splits.
- Action buttons stay compact and legible.
- Table remains scan-friendly at 1366, 1440, and 1920 widths.

### 7. Preview Safety Copy Quieting

Problem:

Safety language is necessary, but visible preview wording should feel integrated into the product system rather than like debug or demo scaffolding.

061E should keep the static-preview safety boundary but reduce any overly loud preview-signaling surfaces that make the UI feel unfinished.

Acceptance target:

- Safety state remains visible where needed.
- No debug-looking white cards or raw preview labels appear.
- The interface reads as a product preview, not a construction layer.

### 8. Desktop Overlay Guard for Tablet and Mobile

Problem:

The current work is desktop-first. 061E must not regress tablet landscape or mobile layers while polishing desktop overlays.

061E should constrain desktop-only overlay changes to the desktop breakpoint and run visual checks for mobile/tablet guardrails after implementation.

Acceptance target:

- Desktop polish does not activate mobile-only navigation regressions.
- Desktop overlays do not leak into mobile widget layouts.
- Tablet landscape remains coherent.

## Explicit Non-Scope

061D does not authorize:

- Static preview visual mutation.
- CSS, JavaScript, or HTML mutation.
- Provider/runtime activation.
- Browser persistence usage.
- Browser network request usage.
- CRM writes.
- Calendar creation.
- Message sending.
- Real engine execution.
- Authentication changes.
- Product logic changes.

## 061E Evidence Requirements

061E should include, at minimum:

- Closed desktop screenshots at 1366, 1440, and 1920 widths.
- Profile-menu-open screenshots at 1366, 1440, and 1920 widths.
- Command-bar active or typed-state screenshots at 1366 and 1440 widths.
- Tablet landscape guard screenshot.
- Mobile guard screenshot.
- Validation evidence confirming the static-preview safety boundary remains intact.

## Final Decision

061D approves the scope for a narrow 061E premium final polish implementation.

DECISION=PASS_061D_PREMIUM_FINAL_POLISH_SCOPE

NEXT=061E_PREMIUM_FINAL_POLISH_IMPLEMENTATION
