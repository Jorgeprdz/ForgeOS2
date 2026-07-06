# Forge Static Preview Release Guard Marker Parsing Repair Closure 063B1

Phase:
`063B1_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR`

Status: PASS / CLOSED.

## Closure

063B1 repairs the marker parsing defect found during the 063C dry-run.

The release guard now treats `REQUIRED_MARKERS` as a marker list when separated by spaces, commas, newlines, or pipes.

The repair is scoped to release-guard tooling. It does not mutate Forge Alive preview UI behavior or enable real effects.

## Preserved Boundary

- no Forge Alive UI mutation;
- no CSS/JS/HTML preview behavior mutation;
- no CRM, calendar, send, auth, provider, or real engine execution;
- no failed 063C raw evidence promoted as PASS.

## Decision

`PASS_063B1_STATIC_PREVIEW_RELEASE_GUARD_MARKER_PARSING_REPAIR`

## Next

`063C_STATIC_PREVIEW_RELEASE_GUARD_DRY_RUN_QA_RETRY`
