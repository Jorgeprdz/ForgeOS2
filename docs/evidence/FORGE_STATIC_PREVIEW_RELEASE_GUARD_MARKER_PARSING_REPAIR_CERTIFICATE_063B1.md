# Forge Static Preview Release Guard Marker Parsing Repair Certificate 063B1

Certificate:
`FORGE_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR_CERTIFICATE_063B1`

Status: PASS.

## Certified

The release guard marker parser supports:

- space-separated marker lists;
- comma-separated marker lists;
- newline-separated marker lists;
- pipe-separated marker lists.

The command-test checklist parser remains separate from marker parsing.

The 063C failure mode is repaired:

- `marker:<combined marker string>` no longer occurs for space-separated marker lists.
- `publicMarker:<combined marker string>` no longer occurs for space-separated marker lists.

## Evidence

Audit:
`docs/evidence/forge-static-preview-release-guard-marker-parsing-repair-audit-063b1.json`

Implementation:
`tools/termux/forge_static_preview_release_guard.sh`

Usage:
`docs/architecture/source-truth/FORGE_STATIC_PREVIEW_RELEASE_GUARD_USAGE_063B.md`

DECISION=PASS_063B1_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR

NEXT=063C_STATIC_PREVIEW_RELEASE_GUARD_DRY_RUN_QA_RETRY
