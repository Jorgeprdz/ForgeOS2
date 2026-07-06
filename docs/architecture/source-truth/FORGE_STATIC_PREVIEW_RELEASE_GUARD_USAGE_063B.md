# Forge Static Preview Release Guard Usage 063B

Status:
IMPLEMENTED USAGE GUIDE.

Script:
`tools/termux/forge_static_preview_release_guard.sh`

## Purpose

The release guard is a reusable read-only verification tool for Forge static preview phases.

It catches common release blockers before a public PASS is declared:

- stale Pages assets;
- cache version mismatch;
- missing phase markers;
- syntax or diff issues;
- prohibited safety flags;
- missing local/public verification inputs;
- missing manual QA checklist for desktop/tablet/mobile.

The guard does not replace screenshot QA. Visual QA remains a separate phase.

## Required Environment

Set these variables before running:

```bash
PHASE="063C_STATIC_PREVIEW_RELEASE_GUARD_DRY_RUN_QA"
CACHE_VERSION="062f3c"
PUBLIC_URL="https://jorgeprdz.github.io/ForgeOS/static-preview/forge-alive/?v=062f3c"
LOCAL_URL="http://127.0.0.1:8080/docs/static-preview/forge-alive/?v=062f3c"
NEXT_PHASE="063D_NEXT_PHASE"
REQUIRED_MARKERS="MOBILE_COMMAND_CONTRACT_BINDING_REPAIR_062F3C QUICK_ACTIONS_PANEL_ACTIVE_STATE_REPAIR_062F1 ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING_062E"
REQUIRED_VIEWPORTS="1366x768,1024x768,390x844"
REQUIRED_COMMAND_TESTS="/quick actions,/cotizar GMM Lariza,Follow Juan,Revisar Lariza,Abrir Octavio"
AUTHORIZED_FILES="docs/evidence/,docs/architecture/source-truth/,FORGE_MASTER_BUILD_TREE.md,docs/roadmap/FORGE_ROADMAP_LOCK_001.md"
```

Marker parsing:

- `REQUIRED_MARKERS` accepts spaces, commas, newlines, or pipes as separators.
- Each marker is validated independently.
- Public marker validation checks the downloaded critical asset set as a whole.

Command-test parsing:

- `REQUIRED_COMMAND_TESTS` remains checklist text and supports comma or newline splitting.
- A pipe inside `REQUIRED_COMMAND_TESTS` may still be used as visual checklist text when the caller wants a single printed command checklist line.

Then run:

```bash
bash tools/termux/forge_static_preview_release_guard.sh
```

## Optional Overrides

The guard also supports:

- `INDEX_FILE`;
- `JS_CHECK_FILES`;
- `CRITICAL_ASSET_PATTERN`;
- `AUDIT_PATH`;
- `EVIDENCE_PATH`;
- `CERTIFICATE_PATH`;
- `CLOSURE_PATH`;
- `REPORT_PATH`.

## Result Semantics

- `PASS`: guard checks passed; visual QA is still required before a public visual PASS.
- `FAIL`: a hard blocker was found.
- `HOLD`: tracked file state is outside authorized scope.

The script does not commit or push.

## Expected Outputs

Default 063B outputs:

- `docs/evidence/forge-static-preview-release-guard-audit-063b.json`;
- `docs/evidence/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_063B.md`;
- `docs/evidence/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_CERTIFICATE_063B.md`;
- `docs/architecture/source-truth/FORGE_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION_CLOSURE_063B.md`;
- `docs/evidence/forge-static-preview-release-guard-report-063b.txt`.

## Manual QA Reminder

After a PASS, the next phase must still capture screenshots and validate actual behavior for required viewports and command tests.

NEXT=063C_STATIC_PREVIEW_RELEASE_GUARD_DRY_RUN_QA
