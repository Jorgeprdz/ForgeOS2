# MIGRATION-007C NASH BOUNDARY NO-GO

Status: CLOSED AS NO-GO

## Context

MIGRATION-007A and MIGRATION-007B successfully moved Manager OS-owned low-risk files and Candidate / Recruitment Intelligence into the `manager-os/` physical domain.

MIGRATION-007C evaluated whether NASH-derived manager/team intelligence should also move into:

```text
manager-os/nash-derived/
```

The answer is no.

The evaluated files are manager-facing, but their signal source, naming, acceptance coverage and orchestration remain NASH-owned. Physical movement into Manager OS would blur the boundary between a manager consumer and the NASH-derived signal producer.

Current runtime state remains:

| Runtime Signal | Current State |
| --- | ---: |
| Runtime verdict | `EXECUTABLE_WITH_WARNINGS` |
| Boot blockers | 0 |
| Circular imports | 0 |
| Missing targets | 6 |
| Missing exports | 2 |

## Files Evaluated

Target files:

- `nash-coaching-insight-engine.js`
- `nash-manager-alert-engine.js`
- `nash-team-intelligence-engine.js`
- `nash-coaching-insight-master-test.js`
- `nash-manager-alert-master-test.js`
- `nash-team-intelligence-master-test.js`

Boundary files:

- `nash-master-intelligence-engine.js`
- `nash-master-acceptance-test.js`

## Decision

NO-GO for moving these files to:

```text
manager-os/nash-derived/
```

MIGRATION-007C is closed as a boundary discovery, not an execution batch.

## Rationale

Manager-facing output does not imply Manager OS ownership.

The evaluated files produce manager and team signals, but those signals are derived from NASH conversation, learning, advisor performance and master intelligence context. They are not Manager OS source-of-truth engines.

NASH-derived signals belong to NASH or shared intelligence.

The files identify themselves with NASH runtime names:

- `NASH_COACHING_INSIGHT_BRIDGE`
- `NASH_MANAGER_ALERT_ENGINE`
- `NASH_TEAM_INTELLIGENCE_ENGINE`

The NASH master engine imports them directly, and the NASH master acceptance test treats them as part of the NASH foundation.

Manager OS should consume these outputs through a bridge or contract.

Manager OS may use the resulting signal, but it should not physically own the NASH-derived engines that create the signal. A bridge contract keeps signal production and signal consumption distinct.

Physical ownership crossing would be unsafe.

If NASH master imports files under `manager-os/`, the repository would encode a cross-boundary dependency where NASH depends on Manager OS to produce NASH signals. That creates confusing ownership and increases the risk of future architectural cycles.

## Ownership Classification

| File | Classification | Ownership |
| --- | --- | --- |
| `nash-coaching-insight-engine.js` | NASH_DERIVED | NASH / shared intelligence |
| `nash-manager-alert-engine.js` | NASH_DERIVED | NASH / shared intelligence |
| `nash-team-intelligence-engine.js` | NASH_DERIVED | NASH / shared intelligence |
| `nash-coaching-insight-master-test.js` | NASH_DERIVED | NASH test coverage |
| `nash-manager-alert-master-test.js` | NASH_DERIVED | NASH test coverage |
| `nash-team-intelligence-master-test.js` | NASH_DERIVED | NASH test coverage |
| `nash-master-intelligence-engine.js` | NASH_CORE / NO_MOVE | NASH core orchestrator |
| `nash-master-acceptance-test.js` | NASH_CORE / NO_MOVE | NASH acceptance coverage |
| Manager OS future consumer | MANAGER_CONSUMER | Consumes bridge outputs, does not own engines |

## Boundary Rule

Manager OS may consume NASH-derived manager/team signals, but must not own NASH-derived engines.

Operationally:

- NASH owns signal derivation from conversation intelligence and advisor performance context.
- Manager OS owns manager-facing interpretation, coaching workflow and development actions after receiving an approved signal.
- Shared intelligence may host the bridge contract if NASH and Manager OS both consume the same signal shape.
- Manager OS must not import or relocate NASH-derived engines as if manager-facing output were proof of Manager OS ownership.

## Future Recommended Path

Define a NASH-to-Manager Signal Contract before any physical movement.

The contract should specify:

- Signal names.
- Input evidence.
- Output shape.
- Confidence level.
- Staleness / freshness.
- Human-review boundary.
- What Manager OS may do with the signal.
- What Manager OS must not infer from the signal.

Possible future physical destinations:

```text
shared-intelligence/nash/
```

or:

```text
nash/derived/
```

Do not choose either destination as part of MIGRATION-007. NASH structure should be reviewed as its own migration.

## Impact On MIGRATION-007

| Migration | Final State |
| --- | --- |
| MIGRATION-007A | CLOSED |
| MIGRATION-007B | CLOSED |
| MIGRATION-007C | CLOSED AS NO-GO |

Manager OS migration should continue only with Manager-owned files.

NASH-derived manager/team intelligence is excluded from Manager OS physical migration until a NASH-to-Manager Signal Contract exists and NASH physical structure is reviewed independently.

## Final Verdict

MIGRATION-007C should not execute as a file movement.

This boundary improves Forge architecture by preventing a manager-facing signal from being mistaken for Manager OS ownership.
