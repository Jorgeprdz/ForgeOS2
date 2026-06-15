# ADR-0026: Relationship Graph As Primary Commercial Asset

## Status
CANDIDATE

## Context
The EFC manual identifies referrals as the most effective method of prospecting and teaches the prompt pattern:

```text
Who do you know who...?
```

This validates the architectural importance of relationship context.

The advisor's primary commercial asset is not the product.

It is the relationship graph.

## Decision
Forge shall treat Relationship Graph as a primary commercial asset.

Advisor OS executes relationship actions.

Shared Intelligence preserves the relationship graph.

Referral Intelligence should connect advisor execution with shared relationship context.

## Boundaries
Advisor OS owns the action:

- ask for referral
- contact referred person
- follow up
- preserve conversation context
- advance the commercial loop

Shared Intelligence owns the graph:

- relationship identity
- relationship context
- referral links
- engagement history
- relationship health
- opportunity evidence

Product Intelligence does not own relationship truth.

NASH may help explain what to say, but it does not own the graph.

## Consequences
Positive:

- Forge can reason from relationship evidence instead of only pipeline records.
- Referral execution can become contextual and action-oriented.
- Shared graph ownership prevents duplicated relationship truth across domains.

Negative:

- Relationship data requires strong evidence, consent and non-manipulation boundaries.
- Future graph implementation must avoid inventing relationship strength or opportunity.

Neutral:

- This ADR candidate does not implement a graph.
- This ADR candidate does not move referral route files.
