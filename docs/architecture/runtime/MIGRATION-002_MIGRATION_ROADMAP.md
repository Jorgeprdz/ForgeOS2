# MIGRATION-002 Migration Roadmap

Status: DISCOVERY COMPLETE

## Final Verdict

Remaining root runtime assets: 655

Largest cluster: Advisor OS (135 files)

Safest cluster: Product Intelligence / Rule Packs, provided they are moved as separate folders and imports are rewritten mechanically.

Highest-impact cluster: Advisor OS commercial intelligence.

Recommended MIGRATION-003 execution target: Advisor OS high-confidence commercial engines, limited to a reviewed sub-batch of 40-60 files with explicit import rewrite mapping.

## Roadmap

| Batch | Target | Estimated Files Moved | Risk | Readiness | Notes |
|---|---|---:|---|---|---|
| Batch A | Advisor OS high-confidence commercial engines | 70-95 | MEDIUM | READY_WITH_IMPORT_REWRITE | Largest safe functional cluster once imports are mechanically rewritten. |
| Batch B | Product Intelligence plus Rule Packs split | 85-115 | MEDIUM | READY_WITH_IMPORT_REWRITE | Separates product truth and rule interpretation from root. |
| Batch C | Platform and Shared infrastructure | 80-110 | MEDIUM_HIGH | READY_WITH_IMPORT_REWRITE | High architectural clarity, but import graph must be updated carefully. |
| Batch D | Policy Operations non-route modules | 80-110 | MEDIUM_HIGH | READY_WITH_IMPORT_REWRITE | Large root reduction; defer route-adjacent cartera/actividad shell files. |
| Deferred | Legacy, Compensation route-adjacent, Unknown | 100+ | HIGH | NEEDS_DISCOVERY | Requires ownership review or legacy extraction before movement. |

## Recommended MIGRATION-003 Scope

MIGRATION-003 should not attempt all 135 Advisor OS files at once.

Recommended execution scope:

- Select 40-60 high-confidence Advisor OS files.
- Exclude protected legacy route files.
- Exclude files with unresolved ownership or compensation/product ambiguity.
- Produce a pre-approved move map before executing.
- Use `git mv`.
- Rewrite imports only for moved files and their direct consumers.
- Validate runtime graph, repository harness, and diff whitespace.

## No-Touch For MIGRATION-003

- `app.js`
- `index.html`
- `dashboard.js`
- `comisiones.js`
- `referidos.js`
- `cartera.js`
- Legacy shell route registry
- Unknown ownership queue
- Compensation route-adjacent files

## Expected Impact

A controlled Advisor OS sub-batch would reduce root disorder materially while preserving the legacy shell boundary proven during RUNTIME and LEGACY work.

Projected root reduction for MIGRATION-003: 40-60 files.

Projected risk: MEDIUM, mostly from import rewrites rather than ownership uncertainty.

Projected architecture benefit: HIGH.
