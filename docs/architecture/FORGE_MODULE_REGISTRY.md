# Forge Module Registry

Registry ID: `FORGE_MODULE_REGISTRY_001`

Status: `CANONICAL_REWRITE_MODULE_INVENTORY`

This registry covers required Forge OS 2 modules from the union of Constitution, governance, ADRs, Product Spec, Build Tree, architecture blueprints, current manifests and current implementation evidence.

Processable source: `scaffolds/manifest/forge-module-registry.json`.

Important distinction:

- `definition_status` says whether a module is part of the canonical product model.
- `implementation_status` says whether usable implementation exists in the current repository.
- `disposition` says what the rewrite should do with the module.

Summary:

- Total modules: 37.
- Implemented: 5.
- Partially implemented: 8.
- Build new: 20.
- Deferred: 2.
- Rejected: 2.

Canonical Build Tree modules remain mandatory even when current source code is absent. Absence of source is recorded as `implementation_status = NOT_IMPLEMENTED`, not as removal from the rewrite.
