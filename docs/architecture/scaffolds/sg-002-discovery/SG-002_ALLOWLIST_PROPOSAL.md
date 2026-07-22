# SG-002 Allowlist Proposal

`STATUS=DRAFT`

`AUTHORIZATION=NOT AUTHORIZED`

`RATIFICATION=NOT RATIFIED`

`IMPLEMENTATION_AUTHORITY=NO IMPLEMENTATION AUTHORITY`

## Proposed Writable Roots

- `docs/architecture/scaffolds/instances/domains/`
- `docs/architecture/scaffolds/instances/source-truth/`
- `docs/architecture/scaffolds/instances/boundaries/`
- `docs/architecture/scaffolds/sg-002/`

## Proposed Exact Existing Files

- `docs/architecture/source-truth/SCAFFOLD_SOURCE_OF_TRUTH_INDEX.md`
- `governance/scaffolds/INDEX.md`
- `governance/scaffolds/SCAFFOLD_INVENTORY.md`
- SG-002 registration block inside `governance/architecture/FORGE_MASTER_BUILD_TREE.md`

## Ratification Requirement

The final gate must replace directory-level candidate permission with an exact filename manifest. Any filename absent from that manifest is read-only.

## Proposed Prohibited Surfaces

Everything not explicitly listed, including Constitution, ADRs, governance policies/locks, historical repository and all non-Markdown files.
