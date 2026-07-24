# MOD-SCAFFOLD-PLANNER

Status: `WAVE 2 REVIEW PACKAGE / NOT INSTALLED`

## Responsibility

Produce deterministic, immutable, structurally valid `DRY_RUN` scaffold execution plans.

## Required inputs

- exact registry object;
- exact scaffold reference;
- validated input envelope;
- ratified authority snapshot;
- source commit/ref;
- canonical registry hash;
- destination inventory;
- explicit run ID, plan ID, and creation time.

The planner never reads the clock, filesystem, Git, network, environment variables, or provider state by itself.

## Boundary

`expectedSha256` remains `null` in Wave 2 because output bytes do not exist until Wave 3 rendering. Therefore Wave 2 plans are reviewable and structurally valid, but not yet applicable.
