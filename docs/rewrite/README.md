# Forge OS 2 Rewrite Scaffolding

This directory documents the constitution-first scaffold system for the future Forge OS 2 rewrite from Android/Termux.

Codex created the definition and machinery only:

- product specification;
- capability inventory;
- requirements traceability;
- constitutional boundary manifest;
- stage manifest;
- dependency graph;
- build order;
- rewrite execution plan;
- JSON contracts;
- deterministic templates;
- validators;
- Termux execution scripts.

The functional rewrite is not implemented here. Future implementation must be executed stage by stage from Termux under owner control.

Dependency-driven artifacts:

- `docs/architecture/FORGE_DEPENDENCY_GRAPH.md`
- `docs/architecture/FORGE_BUILD_ORDER.md`
- `docs/architecture/FORGE_MODULE_DEPENDENCIES.md`
- `docs/rewrite/TERMUX_BUILD_STRATEGY.md`
- `scaffolds/manifest/dependency-graph.json`
- `scaffolds/manifest/build-order.json`
- `scaffolds/manifest/module-dependencies.json`
- `scaffolds/manifest/rewrite-execution-plan.json`

Start with:

```sh
"./tools/termux/rewrite/forge-rewrite-bootstrap.sh"
```
