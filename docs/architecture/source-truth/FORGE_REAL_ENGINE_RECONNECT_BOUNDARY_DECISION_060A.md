# Forge Real Engine Reconnect Boundary Decision 060A

Status: DECIDED

Decision token:
DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

Next:
NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION

## Human Summary

Forge is allowed to move from simulated motors toward real engine candidates, but only through a controlled inventory and selection stage.

060A does not connect any real engine. It decides the safety boundary for the next phase.

## Decision

The next move is not direct integration.

The next move is:

`060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION`

060B must inspect existing engines/adapters and choose the safest first reconnect target.

## Why

The UI now has:

- action contracts;
- static action packets;
- a dry-run adapter;
- evidence that accepted/refused preview outputs work.

That is enough to start evaluating real engine candidates, but not enough to execute real actions.

## Boundary For 060B

060B may:

- inventory existing engines;
- identify candidate adapters;
- compare risk by module;
- select one first reconnect target;
- define the next implementation boundary.

060B must not:

- connect providers;
- execute engines;
- send messages;
- write CRM;
- create calendar events;
- create production/compensation truth;
- mutate browser storage;
- fetch live external data.

## Candidate Selection Criteria

The first real engine candidate should be:

1. read-only or preview-only;
2. already documented in source truth;
3. compatible with human approval;
4. low blast radius;
5. auditable;
6. reversible;
7. useful to the current Forge UI.

## Recommended Candidate Order

| Priority | Candidate class | Reason |
| --- | --- | --- |
| 1 | Read-model / report preview engine | Lowest operational risk. |
| 2 | Client search/read adapter | Useful but must avoid hidden provider reads. |
| 3 | Follow-up draft adapter | Commercially useful, still no send. |
| 4 | Quote preview adapter | Useful but product assumptions require care. |
| 5 | Message draft adapter | Must remain draft-only and approval-gated. |
| 6 | CRM/calendar adapters | Higher risk; later only. |

## Final Decision

DECISION=PASS_060A_REAL_ENGINE_RECONNECT_BOUNDARY_DECISION

NEXT=060B_REAL_ENGINE_CANDIDATE_INVENTORY_AND_SELECTION
