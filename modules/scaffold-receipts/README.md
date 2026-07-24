# MOD-SCAFFOLD-RECEIPTS

Status: `WAVE 4 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Create and preserve hash-bound scaffold evidence.

## Wave 4 receipt type

Wave 4 creates a pre-apply receipt using the Wave 1 receipt contract.

Its status is intentionally:

```text
BLOCKED
```

because:

- human approval has not yet been bound;
- staged output has not yet been applied;
- final repository diff has not yet been reviewed.

## Evidence writing

Receipts are written once with `wx` semantics into a new isolated directory outside the repository. The written JSON is parsed, contract-validated, hash-verified, and compared canonically with the in-memory receipt.

## Final receipt

Wave 5 will own construction of the final PASS receipt after exact approved bytes are applied and independently verified.
