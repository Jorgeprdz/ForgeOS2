# REPO Migration Harness v1

Status: BUILD-001 IMPLEMENTED
Scope: Repository document migration safety reports

## Purpose

`scripts/repo-doc-migration-harness.js` converts repository migration governance into repeatable evidence.

The harness does not migrate files. It produces inventory, move maps, validation reports and reference rewrite plans for human approval under ADR-0020-style governance.

## Safety Contract

The harness never:

- Moves files.
- Deletes files.
- Overwrites files.
- Rewrites imports.
- Rewrites markdown references.
- Guesses constitutional ownership.

The harness only:

- Inventories.
- Plans.
- Validates.
- Reports.

## Protected Root Assets

The following root assets are hardcoded as protected:

- `AGENTS.md`
- `FORGE_CONSTITUTION_V3.md`
- `FORGE_MASTER_BUILD_TREE.md`
- `app.js`
- `index.html`
- `manifest.json`
- `service-worker.js`
- `sw-cache-config.js`

Any move involving these files must be rejected by the harness plan.

## Commands

### Inventory

```sh
node scripts/repo-doc-migration-harness.js inventory
```

Output:

- `migration-inventory.json`

Detects:

- tracked files
- untracked files
- root files
- root docs
- protected assets
- code files
- destination candidates

### Plan

```sh
node scripts/repo-doc-migration-harness.js plan --batch 1
```

Output:

- `ROOT_DOCS_MIGRATION_BATCH_1_MOVE_MAP.md`

Classifications:

- `MOVE`
- `SKIP_PROTECTED`
- `SKIP_TEST_DOC`
- `BLOCKED_UNTRACKED`
- `SKIP_DEST_EXISTS`
- `REVIEW_REQUIRED`

### Validate

```sh
node scripts/repo-doc-migration-harness.js validate
```

Output:

- `migration-validation-report.md`

Checks:

- destination collisions
- protected root violations
- runtime files in move list
- duplicate destinations
- broken ownership rules / review-required files

### Rewrite Plan

```sh
node scripts/repo-doc-migration-harness.js rewrite-plan
```

Output:

- `reference-rewrite-plan.md`

Reports:

- markdown links
- relative paths
- filename references
- suggested destinations for known move candidates

No references are rewritten.

## Current Limitations

- Destination assignment is rule-based by filename and folder policy; it is a migration candidate, not constitutional ownership proof.
- Markdown link parsing is intentionally simple and does not validate every anchor.
- Plain filename references are reported for review, not automatically rewritten.
- The harness does not run `git mv`.
- The harness does not compare duplicate destination file contents.
- The harness does not validate browser/PWA runtime behavior.

## Recommended BUILD-002 Scope

BUILD-002 should add:

- Broken markdown link resolver.
- Duplicate destination content comparison.
- Protected-root regression test.
- JSON schema for `migration-inventory.json`.
- Optional `--output-dir` support.
- Dry-run diff summary for a future human-approved execution command.
