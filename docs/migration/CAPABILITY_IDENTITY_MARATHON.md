# Capability Identity Marathon

## Purpose

This marathon reviews multi-member capability groups using committed legacy evidence.

It runs a bounded subset of associated legacy tests, records evidence hashes, produces parity-scenario seeds and assigns one identity disposition:

- `LOCKED_IDENTITY`
- `HUMAN_REVIEW_REQUIRED`
- `SPLIT_REQUIRED`
- `MERGE_REJECTED`

## Safety

Identity lock is not functional parity.

The marathon does not:

- modify Forge OS original;
- rewrite product, policy or compensation rules;
- execute associated test code for business, financial, truth-critical, security, external-boundary or user-entrypoint groups;
- auto-lock those groups;
- retire any legacy capability;
- grant parity credit.

## Autonomous lock requirements

A group may be identity-locked automatically only when:

1. its domain is resolved;
2. it is not high risk;
3. its merge evidence meets the strict threshold;
4. it has sufficient merge edges;
5. every associated legacy test is selected, runs independently and passes;
6. the proposed group is infrastructure-only, not oversized and not cross-domain;
7. the test runs occur in a disposable pinned worktree with a sanitized environment.

All other groups are preserved for human review or splitting.
