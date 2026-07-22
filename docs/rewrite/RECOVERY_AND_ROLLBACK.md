# Recovery And Rollback

Local runtime state is stored under:

```text
.forge/rewrite/
```

Transient state is ignored by Git. Versionable evidence belongs under:

```text
scaffolds/reports/
```

Resume:

```sh
bash tools/termux/rewrite/forge-rewrite-resume.sh
```

Rollback:

```sh
bash tools/termux/rewrite/forge-rewrite-rollback.sh SG-001
```

Rollback removes only uncommitted evidence/state for the requested stage. It does not run `git reset`, does not rewrite history and does not touch previous commits.
