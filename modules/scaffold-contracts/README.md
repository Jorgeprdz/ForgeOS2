# MOD-SCAFFOLD-CONTRACTS

Status: `WAVE 1 PACKAGE COMPLETE / REPOSITORY INSTALLATION BLOCKED`

## Responsibility

Own structural and semantic validation for Forge OS 2.1 scaffold definition, plan, lock, and receipt contracts.

## Boundaries

This module does not:

- discover registry entries;
- resolve governance files from disk;
- render templates;
- write outputs;
- commit or push;
- approve plans;
- ratify gates.

## Fail-closed behavior

Every validator returns:

```js
{ pass: boolean, errors: string[] }
```

Every assertion function throws `ContractValidationError` when validation fails. Error entries are deterministic `CODE:PATH` strings suitable for receipts and tests.

## Software gate rule

Software scaffold definitions may remain `BLOCKED` before SG-003 ratification. An `AUTHORIZED` software definition fails unless the caller explicitly supplies:

```js
{ softwareGateRatified: true }
```

That option is only a contract input; future integration must derive it from a verified active governance snapshot, never from an environment variable or casual caller claim.
