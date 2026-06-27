# ADR-0023: Advisor OS Operating Loop

## Status
CANDIDATE

## Context
The recovered Escuela Fundamental de Carrera Manual del Participante validates Advisor OS as an operating system, not a CRM.

The EFC manual defines an advisor sales cycle:

1. Ciclo de Ventas
2. Prospeccion
3. Acercamiento
4. Diseno y Presentacion de la Solucion
5. Llenado de la Solicitud, Entrega de la Poliza y Referidos
6. Planeacion y Seguimiento

The manual is operational evidence that advisor work is a repeatable loop of action, judgment and follow-up.

## Decision
Advisor OS owns the advisor operating loop:

- prospect
- contact
- discover
- present
- close
- deliver
- refer
- plan
- follow up

Advisor OS should not be defined as a dashboard collection.

Advisor OS should help the advisor understand:

```text
Do this now.
With this person.
For this reason.
Say this.
Follow up on this date.
```

## Boundaries
Advisor OS owns individual commercial execution.

Manager OS owns development, coaching and collective human growth.

Rule packs own carrier-specific rules.

Product Intelligence owns product truth.

Policy Operations owns policy lifecycle facts.

NASH may provide conversation intelligence, but Advisor OS owns the advisor execution context that consumes it.

## Consequences
Positive:

- Forge can prioritize an actionable advisor loop over more structural cleanup.
- Existing live routes can be used as the first operating surface.
- The dashboard can evolve into a minimal Decision Cockpit without replacing the app shell.

Negative:

- Some legacy route surfaces may remain imperfect while the first live loop is validated.
- Product definition becomes the immediate bottleneck instead of architecture.

Neutral:

- This ADR candidate does not move route modules.
- This ADR candidate does not authorize runtime implementation.
