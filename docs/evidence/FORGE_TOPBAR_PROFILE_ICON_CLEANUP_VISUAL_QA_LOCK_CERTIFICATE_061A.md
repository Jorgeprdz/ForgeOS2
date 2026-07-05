# Forge Topbar Profile Icon Cleanup Visual QA Lock Certificate 061A

Certificate Status: LOCKED / PASS

Date: 2026-07-05

## Certified Outcome

Forge Alive topbar profile cleanup is visually QA-locked for the public `060z` preview.

Certified visible behavior:

- top-right topbar shows only the J profile anchor
- redundant topbar profile-adjacent icons are visually absent
- J opens the profile menu
- menu shows `Cambiar tema`, `Opciones`, and the logout action
- sidebar profile footer is hidden
- command bar remains visible with `/quick actions`
- static preview boundary is preserved

## Certified Screenshots

- `docs/evidence/forge-topbar-profile-cleanup-061a-closed-1366x768.png`
- `docs/evidence/forge-topbar-profile-cleanup-061a-menu-open-1366x768.png`
- `docs/evidence/forge-topbar-profile-cleanup-061a-closed-1440x1000.png`
- `docs/evidence/forge-topbar-profile-cleanup-061a-menu-open-1440x1000.png`
- `docs/evidence/forge-topbar-profile-cleanup-061a-closed-1920x1080.png`
- `docs/evidence/forge-topbar-profile-cleanup-061a-menu-open-1920x1080.png`

## Copy Note

The menu renders the logout label as `Cerrar sesion` without accent. The logout action is visible and preview-safe; accent cleanup can be handled as copy polish in a later implementation phase.

## Decision

DECISION=PASS_061A_TOPBAR_PROFILE_ICON_CLEANUP_VISUAL_QA_LOCK

NEXT=061B_NEXT_FORGE_ALIVE_SCOPE
