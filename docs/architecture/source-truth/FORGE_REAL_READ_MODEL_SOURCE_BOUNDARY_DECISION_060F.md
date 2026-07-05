# Forge Real Read Model Source Boundary Decision 060F

Status: DECIDED

Decision token:
DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

Next:
NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION

## Human Summary

Forge has a safe report/read-model dry-run adapter. The next question is what can count as a real read-model source.

060F decides that the first real source must be local, read-only, auditable, and reversible. No live provider connection is approved yet.

## Boundary Decision

Allowed first-source category:

`repo_local_read_model_source`

This means a source already present in the repository, or a local fixture generated from committed source-truth, may be used for the next candidate inventory.

Forbidden first-source categories:

| Category | Reason |
| --- | --- |
| Live provider API | Needs a separate provider boundary. |
| CRM source | Too close to write-capable workflows. |
| Calendar source | Needs a separate calendar boundary. |
| Message source | Too close to send workflows. |
| Browser persistence | Not needed for first source. |

## Source Requirements

A candidate source for 060G must be:

- read-only;
- local to the repo or generated from committed docs;
- deterministic;
- auditable by file path;
- compatible with preview-only output;
- free of external calls;
- unable to write CRM, calendar, messages, or source-truth records.

## 060G Handoff

060G should inventory local report/read-model candidates and select one source path for a dry-run adapter integration.

## Final Decision

DECISION=PASS_060F_REAL_READ_MODEL_SOURCE_BOUNDARY_DECISION

NEXT=060G_REAL_READ_MODEL_SOURCE_INVENTORY_AND_SELECTION
