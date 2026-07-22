# Termux Rewrite Launch Guide

The launch packet prepares owner-controlled execution. It does not execute functional Forge OS modules by default.

## Dry Run

```bash
bash tools/termux/rewrite/forge-rewrite-launch.sh
```

## Explicit Launch Check

```bash
bash tools/termux/rewrite/forge-rewrite-launch.sh --execute
```

Termux on Android shared storage may not expose executable bits. Run rewrite tools explicitly through `bash`.

The script refuses `main`, dirty worktrees, non-frozen architecture, missing contracts, semantic validator failures, rejected/deferred active execution, blocked first-wave modules and inactive legacy guard.
