# MIGRATION-002 Cluster Analysis

Status: DISCOVERY COMPLETE

## Cluster Summary

| Cluster | Ownership | File Count | Confidence | Coupling | Movement Readiness | Migration Benefit |
|---|---|---:|---:|---|---|---|
| Advisor OS commercial intelligence | Advisor OS | 135 | 0.89 | MEDIUM | READY_WITH_IMPORT_REWRITE | Large advisor/client/prospecting root reduction with strong naming confidence. |
| Policy Operations workflow and evidence | Policy Operations | 133 | 0.86 | LOW | READY_WITH_IMPORT_REWRITE | Large operational/task/document/calendar surface can move after route-adjacent files are split. |
| Product Intelligence knowledge engines | Product Intelligence | 78 | 0.86 | MEDIUM | READY_WITH_IMPORT_REWRITE | Strong product/coverage/financial-product naming with limited shell dependence. |
| Platform infrastructure | Platform | 62 | 0.82 | MEDIUM | READY_WITH_IMPORT_REWRITE | Improves runtime ownership clarity but requires import rewrites for shared services. |
| Shared decision utilities | Shared | 61 | 0.74 | MEDIUM | READY_WITH_IMPORT_REWRITE | Cross-domain helpers can leave root after consumer mapping. |
| Rule Packs | Rule Packs | 46 | 0.90 | MEDIUM | READY_WITH_IMPORT_REWRITE | Separates rule interpretation from Forge Core. |
| Manager OS and recruitment intelligence | Manager OS | 38 | 0.88 | MEDIUM | READY_WITH_IMPORT_REWRITE | Natural manager/candidate/precontract grouping. |
| Compensation intelligence | Compensation | 16 | 0.87 | MEDIUM | NEEDS_DISCOVERY | High-value root reduction, but comisiones legacy coupling requires extra discovery. |
| Legacy CRM shell freeze zone | Legacy | 9 | 0.99 | HIGH | BLOCKED | Defines no-touch boundary rather than movement target. |
| Unknown review queue | Unknown | 77 | 0.35 | MEDIUM | NEEDS_DISCOVERY | Prevents weak ownership guesses from becoming folder debt. |

## Natural Migration Clusters

### Advisor OS Commercial Intelligence

File count: 135

Movement readiness: READY_WITH_IMPORT_REWRITE

This is the largest high-confidence functional cluster. It includes advisor, prospect, referral, client, relationship, NASH, conversation, sales, close, opportunity, and outreach surfaces. It should be split into smaller execution batches before movement.

### Policy Operations Workflow And Evidence

File count: 133

Movement readiness: READY_WITH_IMPORT_REWRITE

This cluster is large but route-adjacent. Non-route policy/task/document/calendar modules can move before legacy route modules. `cartera.js` and other protected route files must remain frozen until separately approved.

### Product Intelligence Knowledge Engines

File count: 78

Movement readiness: READY_WITH_IMPORT_REWRITE

This cluster has strong ownership signals around coverage, product, health, financial-product, fiscal, education, and Imagina Ser naming. It is a strong MIGRATION-003 candidate if import rewrites are kept mechanical.

### Platform Infrastructure

File count: 62

Movement readiness: READY_WITH_IMPORT_REWRITE

Platform movement improves architecture clarity, but it contains shared services, schema, command, repository, event, guard, and runtime surfaces. Move after import graph mapping, not as a blind batch.

### Shared Decision Utilities

File count: 61

Movement readiness: READY_WITH_IMPORT_REWRITE

Shared contains cross-domain utility, evidence, action, decision, context, scoring, and builder modules. It is suitable for gradual movement once consumers are identified.

### Rule Packs

File count: 46

Movement readiness: READY_WITH_IMPORT_REWRITE

Rule-pack movement supports the Forge Core / Rule Pack boundary. This should be separated from Product Intelligence and Compensation so rules do not become hidden core logic.

### Manager OS And Recruitment Intelligence

File count: 38

Movement readiness: READY_WITH_IMPORT_REWRITE

This cluster has strong candidate, recruitment, manager, team, precontract, training, development, coachability, and behavior signals. It is smaller than Advisor OS and may be a good controlled batch after MIGRATION-003.

### Compensation Intelligence

File count: 16

Movement readiness: NEEDS_DISCOVERY

Compensation is architecturally important but currently has legacy route adjacency through `comisiones.js` and related economic outputs. It should not be the first mass move.

### Legacy CRM Shell Freeze Zone

File count: 9

Movement readiness: BLOCKED

The legacy shell remains a compatibility surface. Do not invest in physical movement until shell replacement/extraction work defines stable entry points.

### Unknown Review Queue

File count: 77

Movement readiness: NEEDS_DISCOVERY

Unknown files should be reviewed before movement. The goal is to avoid encoding uncertain ownership into permanent folders.
