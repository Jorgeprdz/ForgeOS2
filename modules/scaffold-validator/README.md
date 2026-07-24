# MOD-SCAFFOLD-VALIDATOR

Status: `WAVE 4 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Validate one exact rendered and staged scaffold bundle before any repository apply operation.

## Outputs

A pre-apply validation report with:

- exact source and plan identity;
- render digest;
- staging tree hash;
- PASS/FAIL/DEFERRED validation records;
- explicit errors;
- canonical report SHA-256.

## Upstream evidence

The module requires upstream PASS records for validations that cannot be independently reconstructed from the rendered bundle, currently:

- `SCV-001`
- `SCV-006`

It does not invent their evidence.

## Side-effect snapshot

The validator accepts a supplied side-effect snapshot and requires unchanged repository hashes and false flags for repository writes, Git operations, network operations, and provider operations.

This snapshot remains evidence supplied by the execution wrapper. Wave 5 must implement the authoritative repository snapshot collector.
