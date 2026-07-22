# Forge Rewrite Scaffolds

This directory contains the governed scaffold system for the future Forge OS 2 rewrite.

It defines product capabilities, constitutional boundaries, traceability, stage manifests, JSON contracts, templates and validators. It does not implement Forge OS 2.

Canonical sources:

- `docs/product/FORGE_PRODUCT_SPEC.md`
- `docs/product/FORGE_REQUIREMENTS_TRACEABILITY_MATRIX.md`
- `scaffolds/manifest/rewrite-manifest.json`
- `scaffolds/manifest/rewrite-stages.json`
- `scaffolds/manifest/rewrite-artifact-graph.json`
- `scaffolds/manifest/canonical-rewrite-sequence.json`

Rewrite order is artifact-driven. Stages declare `produces` and `consumes`; the canonical order is generated from that DAG. Numeric `SG-*` IDs are governance labels, not execution order.

Validate from the repository root:

```sh
npm run scaffold:validate
```

Canonical Termux rewrite orchestrator:

```sh
bash tools/termux/rewrite/forge-rewrite-launch.sh validate
bash tools/termux/rewrite/forge-rewrite-launch.sh graph
bash tools/termux/rewrite/forge-rewrite-launch.sh waves
bash tools/termux/rewrite/forge-rewrite-launch.sh next
bash tools/termux/rewrite/forge-rewrite-launch.sh explain
bash tools/termux/rewrite/forge-rewrite-launch.sh pending
bash tools/termux/rewrite/forge-rewrite-launch.sh blocked
bash tools/termux/rewrite/forge-rewrite-launch.sh completed
bash tools/termux/rewrite/forge-rewrite-launch.sh status
bash tools/termux/rewrite/forge-rewrite-launch.sh resume
bash tools/termux/rewrite/forge-rewrite-launch.sh restart
bash tools/termux/rewrite/forge-rewrite-launch.sh dry-run
```

`run` is intentionally omitted from the quick-start list because it applies the next valid stage and must be invoked only during an approved rewrite execution:

```sh
bash tools/termux/rewrite/forge-rewrite-launch.sh run
```
