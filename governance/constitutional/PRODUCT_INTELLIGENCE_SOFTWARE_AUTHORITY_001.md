# Product Intelligence Software Authority 001

Authority ID: `PI-SA-001`

Status: `PROJECT OWNER APPROVED / ACTIVE FOR PRODUCT INTELLIGENCE RUNTIME ONLY`

Effective date: `2026-07-24`

Owner confirmation token: `APPROVE_PI_EVIDENCE_RESOLUTION_V1`

## Purpose

Authorize one bounded Forge OS 2 runtime surface for deterministic Product Truth and Product Evidence resolution.

This authority closes the mismatch between the already validated `MOD-PRODUCT-INTELLIGENCE` runtime and its prior documentary-only status.

## Constitutional basis

- `governance/constitution/CONSTITUTION_UNIFIED.md`
- Article 0 / Ley Zero
- ADR-001 through ADR-005 as applicable
- ADR-020 architecture and implementation-inference boundary
- Project Owner explicit instruction to continue materializing the Forge OS 2 rewrite through executable, validated increments

## Exact authorized module

- `MOD-PRODUCT-INTELLIGENCE`

## Exact authorized software surface

- `modules/product-intelligence/`

## Supporting writable surfaces

- `forge/modules.json`
- `governance/FORGE_GOVERNANCE_REGISTRY.md`
- `docs/architecture/scaffolds/instances/domains/PRODUCT_INTELLIGENCE_DOMAIN_RESPONSIBILITY.md`
- `governance/constitutional/PRODUCT_INTELLIGENCE_SOFTWARE_AUTHORITY_001.md`
- `.forge21/state/MOD-PRODUCT-INTELLIGENCE.json`
- `.forge21/receipts/MOD-PRODUCT-INTELLIGENCE/`

## Authorized behavior

The runtime may:

- create deterministic Product Truth contracts;
- create deterministic Product Evidence records;
- resolve evidence through the closed hierarchy established by ADR-005;
- preserve version, carrier, effective-period and source context;
- expose unknown, stale, partial and conflicted states;
- preserve contradictions without silently discarding them.

## Boundaries

The runtime may not:

- invent products or product facts;
- create benefits, coverages, exclusions, riders, eligibility, premiums or comparisons without evidence;
- own Policy Truth;
- determine suitability or recommendation;
- own compensation, execution or UI;
- perform provider, AI, network, Git, merge or deployment operations;
- let OCR, brochures, human confirmation or inference defeat applicable official evidence;
- rewrite historical Product Truth;
- remove accountable human responsibility.

`AI_MAY_CREATE_PRODUCT_FACTS=false`

`UNKNOWN_REMAINS_UNKNOWN=true`

`HUMAN_DECISION_REQUIRED=true`

## Relationship to SG-003

`PI-SA-001` is separate from SG-003.

It does not amend or expand SG-003's exact nine-module scaffold-software allowlist. It authorizes only `MOD-PRODUCT-INTELLIGENCE` under the exact paths and boundaries declared here.

## Delivery policy

Implementation may be committed and pushed only after focused tests, the complete test suite, Forge Doctor, module validation and changed-path audit all pass.

Merge and deployment are not authorized by this document.
