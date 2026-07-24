# MOD-SCAFFOLD-CLI

Status: `WAVE 5 REVIEW PACKAGE / NOT INSTALLED`

## Commands

- `snapshot`
- `approval-create`
- `approval-verify`
- `apply`
- `receipt-verify`

## Human approval

`approval-create` requires:

```text
--confirm APPROVE_EXACT_PLAN
```

The CLI never treats command invocation alone as approval.

## Side-effect boundary

The `apply` command may create only the approved scaffold output files in the target repository and two evidence files under the explicitly supplied evidence directory outside the repository.

It does not invoke Git, a network, an AI provider, a deployment tool, or a shell command.
