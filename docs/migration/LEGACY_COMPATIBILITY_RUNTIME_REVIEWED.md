# Forge Original Compatibility Runtime — Reviewed

## Review outcome

The first compatibility prototype was rejected because filename and regular-expression heuristics cannot enforce read-only execution.

The reviewed runtime therefore does not execute shell or Node.js entrypoints from Forge OS original.

## Restored surfaces

The runtime provides:

- an immutable catalog of legacy entrypoints;
- exact Git-blob provenance;
- syntax inspection without execution;
- a dashboard;
- sandboxed static previews served only from a Git archive;
- localhost-only preview binding;
- restrictive Content Security Policy;
- no directory listing;
- no untracked or modified working-tree bytes.

## Commands

```bash
forge-original-reviewed doctor
forge-original-reviewed list
forge-original-reviewed describe ENTRY_ID
forge-original-reviewed serve ENTRY_ID 8765
```

`forge-original-reviewed run` always fails closed. A shell or Node entrypoint requires a specific governed adapter before execution.

Compatibility access does not grant native V2 parity.
