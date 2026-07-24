# Capability Map Normalization

## Purpose

The legacy discovery report lists technical surfaces. A technical surface is not automatically a user-visible capability.

The capability-map normalizer groups calculators, orchestrators, tests, rule packs, schemas, adapters and related artifacts into candidate capability identities.

## Safety boundary

Normalization does not:

- modify Forge OS original;
- rewrite economic or product rules;
- grant parity;
- retire legacy behavior;
- choose a V2 implementation automatically.

Ambiguous groups remain in a human-review queue.

## Output classes

- `BUSINESS`: candidate user or operational capabilities.
- `INFRASTRUCTURE`: supporting technical capabilities.
- `UNCLASSIFIED`: candidates whose ownership or purpose remains unclear.

## Next gate

A candidate map becomes locked only after:

1. ambiguous merges are reviewed;
2. aliases and duplicates are resolved;
3. each business capability has an explicit user outcome;
4. high-risk capabilities identify source truth;
5. legacy regression scenarios are attached;
6. a V2 target or deliberate disposition is approved.

Until that gate passes:

`PARITY_VERIFIED_CAPABILITIES=0`
