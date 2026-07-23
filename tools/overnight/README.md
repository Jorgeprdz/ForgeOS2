# Forge Deterministic Overnight

This is a deterministic executor, not an AI agent.

It runs an ordered JSON queue. Each job declares:

- `commands`: exact implementation or generation commands.
- `verify`: job-specific acceptance checks.
- `repairs`: optional pre-authorized deterministic repair commands.
- `retry_limit`: repair attempts.
- `commit_message`: commit used only when the job produces changes.
- `depends_on`: prior jobs that must have passed.

Every changed job must also pass:

```bash
npm test
npm run lint
npm run scaffold:validate
```

Then the runner commits, pushes, verifies a clean worktree and advances.

## Safety

The runner:

- refuses `main`;
- refuses a dirty worktree;
- uses a lock directory;
- resets and cleans a failed job;
- excludes `.forge/overnight` runtime state from commits;
- never invents repairs;
- never commits failing code;
- resumes by `completed_jobs` in `.forge/overnight/state.json`.

## Queue example

```json
{
  "id": "contract-runtime-regeneration",
  "title": "Regenerate and validate contract runtime",
  "status": "READY",
  "depends_on": ["baseline-repository-health"],
  "commands": [
    "node tools/codegen/generate-contract-runtime.mjs"
  ],
  "verify": [
    "node tools/codegen/validate-contract-runtime.mjs",
    "git diff --check"
  ],
  "repairs": [],
  "retry_limit": 0,
  "commit_message": "feat(contracts): regenerate runtime contracts"
}
```

Only add a job when its implementation command already exists or when a complete
patch/generator has been prepared beforehand. An empty validation-only queue
will validate all night exactly once; it will not create product functionality.

## Run

```bash
cd "/mnt/sdcard/Forge OS v2" || return 1

{
  termux-wake-lock 2>/dev/null || true
  bash tools/overnight/forge-overnight-deterministic.sh
} 2>&1 | tee >(termux-clipboard-set)

printf '\nOVERNIGHT_EXIT_CODE=%s\n' "${PIPESTATUS[0]}"
```

## Useful controls

```bash
FORGE_OVERNIGHT_PUSH=0
FORGE_OVERNIGHT_MAX_JOBS=3
FORGE_OVERNIGHT_QUEUE=tools/overnight/queue.json
```
