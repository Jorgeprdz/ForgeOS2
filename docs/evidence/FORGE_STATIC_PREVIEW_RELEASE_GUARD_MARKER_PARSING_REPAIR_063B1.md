# Forge Static Preview Release Guard Marker Parsing Repair 063B1

Status: PASS / REPAIRED.

Phase:
`063B1_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR`

## Context

The 063C dry-run failed because `REQUIRED_MARKERS` with space-separated markers was interpreted as one combined marker.

The failed raw 063C evidence is not promoted as PASS and is not part of this lock.

## Repair

Updated:

- `tools/termux/forge_static_preview_release_guard.sh`
- `docs/architecture/source-truth/FORGE_STATIC_PREVIEW_RELEASE_GUARD_USAGE_063B.md`

The guard now parses `REQUIRED_MARKERS` with these separators:

- spaces;
- commas;
- newlines;
- pipes.

`REQUIRED_COMMAND_TESTS` keeps its existing checklist parsing behavior and is not split by pipe.

Public marker validation now checks each required marker across the downloaded critical asset set instead of requiring every marker in every individual asset.

## Validation

- space-separated markers: PASS, 3 markers parsed;
- comma-separated markers: PASS, 3 markers parsed;
- newline-separated markers: PASS, 3 markers parsed;
- basic 062f3c dry-run with space-separated markers: PASS;
- public HTML cache check: PASS;
- public critical asset check: PASS;
- public required marker check: PASS.

No Forge Alive UI, CSS, JS, HTML preview behavior, CRM, calendar, send, auth, provider, or real engine behavior was changed.

DECISION=PASS_063B1_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR

NEXT=063C_STATIC_PREVIEW_RELEASE_GUARD_DRY_RUN_QA_RETRY
