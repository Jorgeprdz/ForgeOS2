# MOD-SCAFFOLD-APPLIER

Status: `WAVE 5 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Bind explicit human approval to an exact validated scaffold bundle, apply approved create-only bytes transactionally, verify the exact repository diff, and produce final PASS evidence.

## Apply boundary

Supported:

```text
CREATE
```

Blocked:

```text
MODIFY
DELETE
RENAME
OVERWRITE
SYMLINK TRAVERSAL
GIT
NETWORK
PROVIDER
DEPLOY
```

## Transaction model

1. Snapshot the complete repository tree excluding `.git`.
2. Verify approval against that exact snapshot.
3. Verify staged bytes.
4. Create and verify temporary files.
5. Atomically rename temporary files to approved destinations.
6. Verify final bytes.
7. Snapshot the repository again.
8. Require changed paths to equal the approved paths exactly.
9. Roll back created files and directories on any failure.

## Approval truth

The module never creates approval implicitly. `createApprovalRecord` requires the exact decision string `APPROVE_EXACT_PLAN` and the Project Owner identity.
