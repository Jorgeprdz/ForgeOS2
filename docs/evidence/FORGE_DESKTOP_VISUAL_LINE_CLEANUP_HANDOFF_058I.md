# Forge Desktop Visual Line Cleanup Handoff 058I

Status: IMPLEMENTED

Decision token:
DECISION=PASS_058I_DESKTOP_VISUAL_LINE_CLEANUP

Review URL:
https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=058i

## Scope

058I reduces the visible design-guide / wireframe effect on the Forge Alive desktop
static preview after 058G.

This is a visual-only static preview cleanup.

No runtime logic, CRM action, calendar action, send action, storage mutation, schema,
business rule or source-truth behavior was changed.

## Backup

Local backup created before edits:

`.forge-backups/20260704-233429-pages-visual-line-cleanup-058i/`

Backed up files:

- `docs/static-preview/forge-alive/index.html`
- `docs/static-preview/forge-alive/desktop/forge-desktop-visual-polish-alfred-mark-058g.css`
- `docs/static-preview/forge-alive/desktop/forge-desktop-command-workspace-upgrade-058e.css`

## Files Changed

- `docs/static-preview/forge-alive/index.html`
- `docs/static-preview/forge-alive/desktop/forge-desktop-visual-line-cleanup-058i.css`
- `docs/evidence/FORGE_DESKTOP_VISUAL_LINE_CLEANUP_HANDOFF_058I.md`

## Evidence Screenshots

- `docs/evidence/forge-desktop-visual-line-cleanup-058i-1366x768.png`
- `docs/evidence/forge-desktop-visual-line-cleanup-058i-1440x1000.png`
- `docs/evidence/forge-desktop-visual-line-cleanup-058i-1920x1080.png`

## What Changed

- Added a final desktop-only 058I CSS layer.
- Reduced command workspace border opacity.
- Reduced internal panel shadows that looked like design guides.
- Softened KPI, table, rail and opportunity borders.
- Kept Alfred mark, command bar hierarchy, decision strip and KPI indicators intact.
- Kept desktop/mobile layer separation intact.

## Local Visual QA

Local QA URL:

http://127.0.0.1:4174/docs/static-preview/forge-alive/?v=058i

Captured and reviewed:

- 1366x768: PASS
- 1440x1000: PASS
- 1920x1080: PASS

Result:

Desktop no longer reads as a wireframe/design-guide surface. The workspace keeps
professional separation between command bar, decision strip, KPI cards, table and rail
without excessive visible construction lines.

## Remaining Risk

- Public GitHub Pages may cache CSS briefly; use `?v=058i` for review.
- This cleanup intentionally preserves subtle panel boundaries, so the desktop remains
operational and scannable rather than flat.

## Final Decision

DECISION=PASS_058I_DESKTOP_VISUAL_LINE_CLEANUP

NEXT=059A_UI_ACTION_CONTRACT_SCOPE
