# Legacy Evidence Policy

Forge OS original is not an implementation source for Forge OS 2.

Allowed:

- describe observed user flows;
- record inputs and outputs;
- identify capabilities;
- classify behavior as preserve, redesign, defer, reject or owner decision;
- store evidence summaries.

Prohibited:

- copy source code;
- copy folders;
- restore removed engines;
- restore dependencies;
- rebuild legacy root web shells;
- treat old architecture as authority.

If evidence is not present in the current repository, the stage must use `BLOCKED_REQUIRES_LEGACY_EVIDENCE`.

## Split Responsibilities

### Legacy Reintroduction Guard

Stage: `SG-018`.

Status: `READY`.

Responsibility: prevent restored legacy routes, copied original Forge code and removed runtime clusters from entering the rewrite.

This guard does not require legacy evidence. It runs from the beginning because its job is protection, not discovery.

### Legacy Functional Evidence Intake

Stage: `SG-020`.

Status: `BLOCKED_REQUIRES_LEGACY_EVIDENCE`.

Responsibility: classify owner-supplied original Forge behavior as product evidence.

This intake may record functional observations only. It cannot copy code, restore architecture, recreate modules or weaken the active legacy guard.
