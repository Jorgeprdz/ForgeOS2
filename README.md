# Forge OS 2

Forge OS 2 is the consolidated foundation for Forge OS: a Decision Intelligence System, Career Intelligence System and Sales Operating System for financial advisors, managers and commercial organizations.

Forge is not a generic CRM, chatbot, dashboard bundle or note system. Its core operating standard is actionable intelligence:

> Do this now. With this client. For this reason.

## Repository Status

This repository is currently a clean Forge OS 2 foundation after the full repository consolidation wave. The active codebase is intentionally small and governance-heavy:

- `platform/` contains active platform, core decision, truth and adapter modules.
- `shared/` contains active shared constants and design tokens.
- `supabase/` contains Supabase migrations and edge-function source.
- `governance/` contains active constitution, governance registries, axioms, Build Tree, ROBOCOP gates and governance tests.
- `adr/` contains active architecture decision records and archived ADR provenance.
- `docs/` contains architecture notes, migration history, reports and evidence.
- `tools/` contains repository validation utilities.

The inherited root web shell and root-level runtime clusters were removed because their entrypoints referenced missing consumers and duplicated or bypassed the consolidated architecture.

## Canonical Authority

Active constitutional authority:

- `governance/constitution/CONSTITUTION_UNIFIED.md`
- `governance/constitution/FORGE_CONSTITUTION_MAP.md`
- `governance/axioms/INDEX_V2.md`
- `governance/FORGE_GOVERNANCE_REGISTRY.md`
- `governance/architecture/FORGE_MASTER_BUILD_TREE.md`
- `governance/validation/FORGE_ROBOCOP_DIRECTIVES.md`
- `adr/`

Historical constitutional provenance remains preserved:

- `docs/migration/constitutional-history/FORGE_CONSTITUTION_V3.md`
- `docs/migration/governance-history/`

## Structure

```text
.
├── AGENTS.md
├── README.md
├── adr/
├── docs/
│   ├── architecture/
│   ├── evidence/
│   ├── forge-guidelines/
│   ├── migration/
│   └── reports/
├── governance/
│   ├── architecture/
│   ├── axioms/
│   ├── constitution/
│   ├── constitutional/
│   ├── scaffolds/
│   ├── specifications/
│   ├── tests/
│   └── validation/
├── package.json
├── package-lock.json
├── platform/
├── shared/
├── supabase/
└── tools/
```

## Install

```sh
npm ci
```

## Validate

```sh
npm test
npm run lint
npm run typecheck --if-present
npm run build --if-present
git diff --check
```

`npm test` runs the active platform core smoke tests, the governance source ownership validation, and a quote read-model adapter import check.

`npm run lint` validates local relative references across repository files. Historical example references inside migration documentation are ignored by design.

## Run

There is no active root web application entrypoint in this consolidated foundation. Removed web files referenced missing assets and a missing `app.js`, so they were treated as inherited runtime debris rather than production entrypoints.

Current executable surfaces are validation and module-level Node checks. Future app/runtime work should be added under the appropriate `platform/`, `shared/`, `supabase/` or documented domain boundary, with governance gate approval first.

## Documentation

- Full cleanup report: `docs/migration/FULL_REPOSITORY_CLEANUP_REPORT.md`
- Build tree: `governance/architecture/FORGE_MASTER_BUILD_TREE.md`
- Migration history: `docs/migration/`
- Validation and domain reports: `docs/reports/`
- Governance history: `docs/migration/governance-history/`
