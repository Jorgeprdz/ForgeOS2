# ADR-0024: Life Graph Boundary

## Status
CANDIDATE

## Context
The EFC manual's ANF section captures family, occupation, existing insurance, income, assets, protection needs, accumulation, education funding, retirement and health.

This evidence shows that the advisor does not only sell against a product gap.

The advisor advises against a life context.

## Decision
Life Graph is the canonical Forge term for the client context represented by ANF-style discovery.

ANF must not be reduced to a financial calculator.

Life Graph represents:

- family structure
- occupation and income context
- assets
- existing protection
- protection needs
- accumulation goals
- education goals
- retirement goals
- health context
- life trajectory

## Boundaries
Life Graph is not a product recommendation engine.

Life Graph is not a projection engine.

Life Graph is not a schema authorization by itself.

Life Graph preserves human context so other Forge domains can make evidence-bound judgments.

Financial calculations may consume Life Graph evidence, but they do not own the whole Life Graph.

## Consequences
Positive:

- Forge preserves the full human context behind financial need analysis.
- Need analysis can become evidence-bound without becoming purely numerical.
- Future discovery and recommendation engines can distinguish fact, need, gap, assumption and judgment.

Negative:

- Future implementation will need careful evidence and privacy boundaries.
- It may be tempting to over-model the client before the first useful advisor experience exists.

Neutral:

- This ADR candidate does not create schemas.
- This ADR candidate does not modify ANF, route modules or product calculations.
