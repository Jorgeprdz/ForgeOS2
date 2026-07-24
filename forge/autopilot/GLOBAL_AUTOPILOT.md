# Forge OS V2 Global Autopilot

The global autopilot is a **campaign orchestrator** above the existing per-module functional autopilot.

It does not generate domain logic by itself. It repeatedly recomputes the real functional audit and executes only work that has an explicit governed action.

## Commands

```bash
tools/forge-global-autopilot doctor
tools/forge-global-autopilot status
tools/forge-global-autopilot plan
tools/forge-global-autopilot run
tools/forge-global-autopilot resume
```

Optional controls:

```bash
tools/forge-global-autopilot run \
  --areas runtime,integrations,productE2E \
  --max-modules 5 \
  --max-minutes 120
```

Use `--dry-run` to calculate the next executable action without changing the repository.

Protected branches require `--allow-protected-branch`.

## Campaign behavior

Before every action, the global autopilot:

1. Requires a clean worktree, attached branch, and configured `origin`.
2. Acquires an exclusive campaign lock.
3. Runs the functional autopilot audit.
4. Resolves unfinished dependencies before their consumers.
5. Checks that the selected module has a real implementation command, functional test command, path allowlist, consumer test, and evidence configuration where required.
6. Executes one governed action.
7. Verifies that the branch did not change, the worktree is clean, HEAD advanced, and the module now has functional PASS.
8. Writes a resumable campaign journal.
9. Repeats until complete, blocked, or a configured limit is reached.

Every successful module remains an independent commit and push.

## Runnable action types

### `RUN_MODULE_AUTOPILOT`

Invokes:

```bash
tools/forge-autopilot run MODULE_ID
```

The existing module autopilot owns implementation, focused tests, full suite, doctor, validation, functional evidence, route audit, exact staging, commit, push, and push rollback.

### `REFRESH_SCAFFOLD_RECEIPT`

Allowed only when:

- the module belongs to the scaffold area;
- negative and module-specific tests already satisfy the functional rules;
- the only blockers are missing or stale mechanical receipts.

The global autopilot then executes the complete per-module test and validation cycle and commits only that module's receipt paths.

## Hard blockers

The campaign stops without inventing work when it finds:

- a required area with no declared module;
- a missing implementation or functional test command;
- a runtime module with no consumer test path;
- integration or E2E evidence configuration that is incomplete;
- an unresolved or cyclic dependency;
- a non-receipt scaffold implementation problem;
- a failed architecture check;
- a dirty worktree;
- a concurrent campaign;
- any failed command, test, validation, route audit, commit, or push.

`GLOBAL_RESULT=BLOCKED` exits with code `2`.

`GLOBAL_RESULT=LIMIT_REACHED` exits with code `3`.

## Resumability

Campaign state is written under:

```text
.forge21/autopilot/global/
```

This directory is already covered by the ignored `.forge21/autopilot/` runtime state.

A blocked campaign may be continued with:

```bash
tools/forge-global-autopilot resume
```

Resume never hides or discards a dirty worktree. Interrupted uncommitted changes must be inspected before a campaign can continue.
