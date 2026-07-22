# SG-024 - Human Authority And Approval Contracts

Canonical order: 3.

Layer: `HUMAN_AUTHORITY_AND_APPROVAL_CONTRACTS`.

Status: `READY`.

Depends on: `SG-001`, `SG-002`.

Produces:

- `HumanAuthorityContract`
- `ApprovalContract`
- `AllowedActionContract`
- `HumanReviewBoundary`

Materializes:

- `docs/architecture/contracts/sg-024/human-authority.contract.json`
- `docs/architecture/contracts/sg-024/approval.contract.json`
- `docs/architecture/contracts/sg-024/allowed-action.contract.json`
- `docs/architecture/contracts/sg-024/human-review-boundary.contract.json`

This stage establishes human authority, explicit approval, allowed-action,
and exact-artifact review boundaries before any downstream lifecycle,
NASH, manager, advisor, or action-planning consumer.

It must be selected and executed through the artifact-DAG rewrite
orchestrator rather than by numeric SG order.
