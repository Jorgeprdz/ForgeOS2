# ADR-0022: Manager OS First-Class Domain

## Status
CANDIDATE

## Context
Legacy manager and advisor formats show that management in Forge is not simply supervision of sales output.

The recovered manager formats track capability development, habits, commitments, follow-up, coaching, reflection, trajectory and human capital allocation.

This validates Manager OS as a domain with its own responsibility boundary.

## Decision
Manager OS is a first-class Forge domain.

Manager OS is not an extension of Advisor OS.

Advisor OS optimizes individual execution.

Manager OS optimizes collective human growth.

Manager OS owns intelligence related to:

- coaching priorities
- advisor trajectory
- development commitments
- team health
- human capital allocation
- manager intervention timing
- growth pathing
- organizational risk caused by people, habits or capacity

## Boundaries
Manager OS may consume Advisor OS signals, but it does not become Advisor OS.

Advisor OS may expose advisor performance and activity evidence, but it does not own manager coaching judgment.

Manager OS should not duplicate Advisor OS calculations. It should interpret advisor evidence through a manager-development lens.

## Consequences
Positive:

- Forge can reason about managers as developers of people, not only sales supervisors.
- Coaching, commitments and human capital allocation receive clear architectural ownership.
- Manager-facing outputs can be governed separately from advisor-facing recommendations.

Negative:

- Manager OS requires its own evidence, confidence and authority boundaries.
- Future implementation must avoid turning Manager OS into a dashboard clone of Advisor OS.

Neutral:

- Existing Advisor OS routes and engines do not move because of this ADR candidate.
- Physical migration remains paused until a first living advisor experience exists.
