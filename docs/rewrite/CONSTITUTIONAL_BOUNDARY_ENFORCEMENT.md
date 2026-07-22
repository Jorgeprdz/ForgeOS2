# Constitutional Boundary Enforcement

The active boundary registry is:

```text
scaffolds/manifest/constitutional-boundaries.json
```

Validators enforce that:

- every capability references known boundaries;
- every traceability entry references known boundaries;
- every stage references known boundaries;
- READY stages do not include rejected, deferred or owner-decision capabilities;
- prohibited paths are not generated;
- secrets and Codex environment paths are absent.

If a stage violates a boundary, the required result is `BLOCKED_CONSTITUTIONAL_VIOLATION`.
