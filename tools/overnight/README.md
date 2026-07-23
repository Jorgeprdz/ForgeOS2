# Forge Deterministic Overnight

Forge Overnight is a fail-closed executor for a versioned declarative queue. It
is not an AI agent: it executes only the commands, verifications and repairs
written in the queue.

## Guarantees and limits

- Every child receives an isolated, closed stdin.
- Commands, verifications, repairs and global gates have explicit timeouts.
- A non-allowed exit, timeout, signal, skipped expected step, unsafe path or
  Git divergence stops the run.
- State, checkpoints, per-job logs, the run log and reports live under
  `.forge/overnight/` and are atomically replaced.
- The runner refuses `main`, detached HEAD, non-Git directories, dirty starts,
  an incorrect upstream and active locks.
- Rollback restores only exact changed paths which are inside the job allowlist.
  It removes only allowlisted files created by that job; it never runs global
  `git reset --hard` or `git clean`.
- A successful changed job runs `git diff --check`, its verifications and every
  global gate before staging only the observed allowlisted paths.
- `PASS_NO_CHANGES` creates no commit. A failed push preserves the local commit,
  records `PASS_COMMIT_PUSH_FAILED` and stops.
- The tool cannot decide what code to write, interpret failures or invent a
  repair. A repair must be completely preauthorized in `queue.json`.

The runner requires Bash, Git, Node.js, npm and GNU `timeout`. It has no npm
dependency and does not require `jq`. Missing dependencies stop with exit 69
and an installation hint. Platform detection is capability-based:

- Termux uses wake lock/unlock if Termux:API is present and can copy the final
  summary when `FORGE_OVERNIGHT_COPY_SUMMARY=1`.
- Arch/ArchForge and other Linux environments never invoke Termux commands.
- Repository and queue paths are configurable; no Android path is embedded in
  the implementation.

## Queue format

Schema version 2 defines valid statuses as `READY` and `DISABLED`. Top-level
`global_gates` are mandatory. Every job contains:

```json
{
  "id": "deterministic-generator",
  "title": "Run a previously approved generator",
  "status": "DISABLED",
  "depends_on": ["baseline-repository-health"],
  "commands": [
    {
      "command": "node tools/example/generate.mjs",
      "timeout_seconds": 900,
      "allowed_exit_codes": [0]
    }
  ],
  "verify": [
    {
      "command": "node tools/example/validate.mjs",
      "timeout_seconds": 300
    }
  ],
  "repairs": [
    {
      "command": "node tools/example/repair-known-case.mjs",
      "when_exit_codes": [2],
      "attempt_limit": 1,
      "timeout_seconds": 300,
      "allowed_changed_paths": ["generated/example/**"],
      "verify": ["node tools/example/validate.mjs"]
    }
  ],
  "retry_limit": 1,
  "timeout_seconds": 900,
  "commit_message": "chore(example): regenerate approved artifacts",
  "push": false,
  "allowed_changed_paths": ["generated/example/**"],
  "forbidden_changed_paths": ["governance/**", "app.js"]
}
```

Paths are repository-relative. Absolute paths, `..`, `.git`, `.forge`, empty
segments and option-like paths are rejected. `/**` means the named directory
and its descendants. A changed job must allow every path and must not match any
forbidden path.

To add a job, place it after all dependencies, keep it `DISABLED` until its
exact command contract has been reviewed, give it the smallest path allowlist,
declare deterministic verification and repair only, validate the queue, then
run the temporary-repository suite.

## Commands

Validate syntax and queue:

```bash
cd "/mnt/sdcard/Forge OS v2"
bash -n tools/overnight/forge-overnight-deterministic.sh
node --check tools/overnight/runner.mjs
node tools/overnight/validate-queue.mjs tools/overnight/queue.json
```

Run the full isolated test suite:

```bash
cd "/mnt/sdcard/Forge OS v2"
bash tools/overnight/tests/overnight-runner-test.sh
```

Dry-run validates and prints the materialized plan without creating runtime
state or running Git/implementation commands:

```bash
cd "/mnt/sdcard/Forge OS v2"
bash tools/overnight/forge-overnight-deterministic.sh \
  --repo "/mnt/sdcard/Forge OS v2" \
  --queue "tools/overnight/queue.json" \
  --dry-run \
  --no-push
```

A real validation night on a clean, non-main branch:

```bash
cd "/mnt/sdcard/Forge OS v2"
bash tools/overnight/forge-overnight-deterministic.sh \
  --repo "/mnt/sdcard/Forge OS v2" \
  --queue "tools/overnight/queue.json" \
  --no-push
```

Enable push only when both the queue job and the invocation authorize it:

```bash
bash tools/overnight/forge-overnight-deterministic.sh \
  --repo "/mnt/sdcard/Forge OS v2" \
  --queue "tools/overnight/queue.json" \
  --push
```

## Operation and recovery

Options:

- `--repo PATH`
- `--queue PATH`
- `--max-jobs N`
- `--push` / `--no-push`
- `--dry-run`
- `--resume`
- `--restart`
- `--job ID`
- `--from ID`
- `--stop-after ID`
- `--log-level debug|info|warn|error`

Equivalent environment defaults are
`FORGE_OVERNIGHT_ROOT`, `FORGE_OVERNIGHT_QUEUE`,
`FORGE_OVERNIGHT_MAX_JOBS`, `FORGE_OVERNIGHT_PUSH` and
`FORGE_OVERNIGHT_LOG_LEVEL`. Arguments take precedence.

After an interruption, inspect first:

```bash
node tools/overnight/inspect-state.mjs "/mnt/sdcard/Forge OS v2"
```

Resume only if the queue, job definitions, branch and expected HEAD have not
changed:

```bash
bash tools/overnight/forge-overnight-deterministic.sh \
  --repo "/mnt/sdcard/Forge OS v2" \
  --queue "tools/overnight/queue.json" \
  --resume \
  --no-push
```

Use `--restart` only to archive prior state and begin a new run. Completed jobs
are not rerun by `--resume`. Stop safely with `Ctrl-C` or `TERM`; state remains
interrupted, logs/checkpoints remain, the owned lock is released, and Termux
wake lock is released.

For `PASS_COMMIT_PUSH_FAILED`, do not restart or roll back the local commit.
Correct credentials/network/remote state, verify the recorded SHA and branch,
then run:

```bash
cd "/mnt/sdcard/Forge OS v2"
git status --short --branch
git push origin "$(git branch --show-current)"
```

Run logs are in `.forge/overnight/logs/<run-id>/`; JSON reports and human
summaries are in `.forge/overnight/reports/`; per-job checkpoints are in
`.forge/overnight/checkpoints/`. `state.json` is the current machine-readable
state. Each step log records start, end, command, exit code, timeout/signal and
duration. Never infer PASS from the summary alone when a required step is not
present in the log.
