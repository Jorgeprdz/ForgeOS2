# Scaffold Architecture

The scaffold system is layered by authority:

1. Constitution and governance.
2. Product specification.
3. Capability manifest.
4. Constitutional boundary manifest.
5. Requirements traceability.
6. Rewrite stage manifest.
7. Scaffold registry and templates.
8. Validators.
9. Termux scripts.

Root structure:

- `docs/product/` contains human-readable product definition and traceability.
- `scaffolds/manifest/` contains processable manifests.
- `scaffolds/contracts/` contains JSON Schema contracts.
- `scaffolds/templates/` contains deterministic templates that do not implement product behavior.
- `scaffolds/validation/` contains dependency-free Node validators.
- `tools/termux/rewrite/` contains Android/Termux-safe execution scripts.

Generated stubs must fail with `FORGE_SCAFFOLD_NOT_IMPLEMENTED` until a future approved implementation stage replaces them.
