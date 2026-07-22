# Forge Rewrite Scaffolds

This directory contains the governed scaffold system for the future Forge OS 2 rewrite.

It defines product capabilities, constitutional boundaries, traceability, stage manifests, JSON contracts, templates and validators. It does not implement Forge OS 2.

Canonical sources:

- `docs/product/FORGE_PRODUCT_SPEC.md`
- `docs/product/FORGE_REQUIREMENTS_TRACEABILITY_MATRIX.md`
- `scaffolds/manifest/rewrite-manifest.json`
- `scaffolds/manifest/rewrite-stages.json`

Future Termux execution starts with:

```sh
bash tools/termux/rewrite/forge-rewrite-bootstrap.sh
```
