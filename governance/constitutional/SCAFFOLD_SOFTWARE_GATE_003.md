# Scaffold Software Gate 003

Gate ID: `SG-003`

Name: `Forge OS 2.1 Scaffold Software Installation`

Version: `1.0.0`

Effective date: `2026-07-23`

Status: `RATIFIED / APPROVED / ACTIVE FOR SG-003 ONLY`

## Constitutional Gate

- Applicable Constitution: `governance/constitution/CONSTITUTION_UNIFIED.md` v4.0, including Article 0 / Ley Zero and Articles II–X.
- Applicable ADRs: ADR-001–018 according to each affected domain and ADR-020 for the architecture baseline.
- Predecessor gates: SG-001 and SG-002 remain active for their exact documentary scopes.
- Excluded authority: historical/candidate governance, ADR-016A, historical ADR-0019 references, SKYNET, Russell and any non-ratified document.
- Build Tree Area: Constitutional Rewrite → Post-Rewrite Architecture → Scaffold Software 003.
- Discovery Status: `READY WITH CONDITIONS`.
- Implementation Readiness: `READY WITH CONDITIONS / SOFTWARE INSTALLATION ONLY`.
- Project Owner Approval: `APPROVED` for the exact modules, paths, restrictions and remote policy in this gate.
- Board Approval: `APPROVED`; Single Human Authority Board, Project Owner, quorum 1 of 1.
- Validation Expectation: every blocking validation in this gate must PASS.

## Purpose

Authorize installation of the Forge OS 2.1 scaffold software system in `Jorgeprdz/ForgeOS2`, limited to the exact modules, contracts, catalog assets, documentation, state, receipts and dedicated installation branch named by this gate.

This gate does not authorize any change to `Jorgeprdz/ForgeOS` or to the historical local Forge OS repository.

## Implementation Authorization

`IMPLEMENTATION_AUTHORIZED=true`

`IMPLEMENTATION_SCOPE=FORGE_OS_2_1_SCAFFOLD_SOFTWARE_INSTALLATION_ONLY`

`SOFTWARE_IMPLEMENTATION_AUTHORIZED=true`

The authorization covers installation and validation of the exact software surfaces listed below. It does not amend the Constitution, ADR meaning, domain ownership, Source of Truth ownership, business rules or SG-001/SG-002 documentary authority.

## Authorized Software Modules

Only these nine modules are authorized:

1. `MOD-SCAFFOLD-CONTRACTS`
2. `MOD-SCAFFOLD-REGISTRY`
3. `MOD-SCAFFOLD-PLANNER`
4. `MOD-SCAFFOLD-RENDERER`
5. `MOD-SCAFFOLD-VALIDATOR`
6. `MOD-SCAFFOLD-RECEIPTS`
7. `MOD-SCAFFOLD-APPLIER`
8. `MOD-SCAFFOLD-CLI`
9. `MOD-SCAFFOLD-CATALOG`

No additional scaffold module is authorized by SG-003.

## Exact Writable Surfaces

The installation stage may create or modify only these surfaces:

- `contracts/scaffolds/`
- `modules/scaffold-contracts/`
- `modules/scaffold-registry/`
- `modules/scaffold-planner/`
- `modules/scaffold-renderer/`
- `modules/scaffold-validator/`
- `modules/scaffold-receipts/`
- `modules/scaffold-applier/`
- `modules/scaffold-cli/`
- `modules/scaffold-catalog/`
- `forge/scaffolds/`
- `forge/modules.json`
- `docs/architecture/scaffolds-2.1/`
- `.forge21/state/MOD-SCAFFOLD-*.json`
- `.forge21/receipts/MOD-SCAFFOLD-*/`

Directory permission is not implied beyond these exact surfaces. Every other path remains read-only.

## Canonical Documentary Scaffold Set

The authorized catalog contains exactly these four canonical families:

1. Architecture Boundary.
2. Dependency and Relationship.
3. Domain Responsibility.
4. Source of Truth.

The current canonical Markdown documents under `docs/architecture/scaffolds/` remain authoritative documentary references and must not be modified by this installation.

The Dependency and Relationship family remains `REFERENCE_ONLY` for instantiation because SG-002 prohibits standalone Dependency/Relationship instances.

Source of Truth scaffolds may register only already-established owners. Unknown ownership remains `UNKNOWN / BLOCKED`.

## Runtime Boundaries

The installed runtime must preserve all of the following:

- Human approval is mandatory and must bind to the exact plan, report, repository snapshot, output paths, output hashes and byte counts.
- Apply is create-only.
- Runtime modification, overwrite, delete and rename are prohibited.
- Symlink traversal and path traversal are prohibited.
- Runtime Git operations are prohibited.
- Runtime network operations are prohibited.
- Runtime provider or AI calls are prohibited.
- Runtime deployment is prohibited.
- Automatic approval is prohibited.
- Unknown authority, owner, input, token or evidence state fails closed.
- The same normalized inputs and locks must produce byte-identical output.
- Final PASS receipts may be produced only after exact approved bytes are applied and independently verified.

## Installation Branch

The dedicated installation branch is:

`feature/scaffold-system-2.1`

SG-003 authorizes installation commits and pushes only on this branch. It does not authorize direct scaffold-software commits to `main`.

## Required Blocking Validations

Before each installation-stage commit and push, every applicable validation must PASS:

1. Repository identity validation for `Jorgeprdz/ForgeOS2`.
2. Original ForgeOS non-modification validation.
3. SG-003 presence, status and token validation from `origin/main`.
4. Baseline ancestry validation from commit `71198a8a0c4cbff51b189f95966d6e97a0b89d3b`.
5. Clean working-tree validation before installation.
6. Package SHA-256 inventory validation.
7. Complete consolidated test-suite validation.
8. Canonical catalog validation.
9. Constitution and Article 0 / Ley Zero non-regression validation.
10. SG-001 and SG-002 non-regression validation.
11. Exact module allowlist validation.
12. Exact writable-surface validation.
13. Runtime create-only boundary validation.
14. Runtime no-Git validation.
15. Runtime no-network/no-provider validation.
16. Runtime no-deploy validation.
17. Forge Doctor validation.
18. Module manifest and required-export validation.
19. Module state validation.
20. Module receipt validation.
21. Exact staged diff validation.
22. Commit-scope validation.
23. Push-target validation for `feature/scaffold-system-2.1` only.
24. Merge and deployment non-execution validation.

Missing, ambiguous or failed evidence blocks the affected stage. It does not authorize inference, partial promotion or best-effort continuation.

## Remote Policy

IF all validations applicable to a stage PASS, THEN one stage-scoped commit and push to `feature/scaffold-system-2.1` are authorized.

ELSE STOP immediately, preserve diagnostics, and perform no commit or push for that stage.

Pre-existing or unrelated working-tree files must not be staged.

Push does not authorize merge, release, deployment or later software work.

## Explicitly Prohibited

SG-003 does not authorize:

- any modification to `Jorgeprdz/ForgeOS`;
- any modification to the historical local Forge OS repository;
- automatic merge or manual merge under this gate;
- deployment or release;
- runtime modification, overwrite, deletion or rename;
- runtime Git, network, AI or provider operations;
- changes to Constitution files, ADR meaning or active ownership;
- changes outside the exact writable surfaces;
- restoration of removed legacy runtime or rewrite machinery;
- standalone Dependency/Relationship instances;
- Source of Truth ownership invention.

## Project Owner Ratification Record

The Project Owner ratified SG-003 on `2026-07-23` with the following authorization:

- the nine modules declared in Wave 6;
- the exact proposed paths;
- installation in a dedicated branch of `Jorgeprdz/ForgeOS2`;
- complete validation;
- stage commits and pushes only when every required validation passes.

The Project Owner explicitly withheld authorization for:

- touching `Jorgeprdz/ForgeOS`;
- automatic merge;
- deployment;
- runtime modification, overwrite, rename or deletion;
- runtime Git, network or provider operations.

## Phase Boundary

`NEXT_STAGE=Forge OS 2.1 Scaffold Software Installation`

The next stage is limited to preflight and the exact dedicated-branch installation described in this gate.

Merge, deployment and post-install expansion require separate explicit authority.

## Final Declaration

`GATE_ID=SG-003`

`STATUS=APPROVED`

`IMPLEMENTATION_READINESS=READY_WITH_CONDITIONS`

`IMPLEMENTATION_AUTHORIZED=true`

`IMPLEMENTATION_SCOPE=FORGE_OS_2_1_SCAFFOLD_SOFTWARE_INSTALLATION_ONLY`

`ALLOWLIST=EXACT_MODULES_AND_PATHS_IN_THIS_GATE`

`RUNTIME_APPLY_POLICY=CREATE_ONLY`

`RUNTIME_GIT_OPERATIONS=false`

`RUNTIME_NETWORK_OPERATIONS=false`

`RUNTIME_PROVIDER_OPERATIONS=false`

`MERGE_AUTHORIZED=false`

`DEPLOY_AUTHORIZED=false`

`REMOTE_POLICY=STAGE_COMMIT_AND_PUSH_ONLY_AFTER_ALL_PASS`

`INSTALLATION_BRANCH=feature/scaffold-system-2.1`

`PROJECT_OWNER_APPROVAL=APPROVED`

`NEXT_STAGE=Forge OS 2.1 Scaffold Software Installation`

`SOFTWARE_IMPLEMENTATION_AUTHORIZED=true`
