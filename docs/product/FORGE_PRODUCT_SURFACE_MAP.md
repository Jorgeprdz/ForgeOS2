# Forge Product Surface Map

Map ID: `FORGE_PRODUCT_SURFACE_MAP_001`

Status: `CANONICAL_PRODUCT_SURFACE_INVENTORY`

This map identifies visible or operator-facing Forge OS 2 product surfaces. Navigation entries are labels, not modules. Architecture responsibility is assigned through the module registry.

Processable source: `scaffolds/manifest/forge-product-surfaces.json`.

| Surface | Type | Navigation | Responsible module | Implementation |
|---|---|---|---|---|
| Advisor Workspace | WORKSPACE | Advisor | `MOD-ADVISOR-WORKSPACE` | NOT_IMPLEMENTED |
| Manager Workspace | WORKSPACE | Manager | `MOD-MANAGER-WORKSPACE` | NOT_IMPLEMENTED |
| Governance System | SYSTEM | Governance | `MOD-GOVERNANCE-GATE` | IMPLEMENTED |
| Termux Rewrite System | SYSTEM | System | `MOD-TERMUX-REWRITE-TOOLS` | IMPLEMENTED |
| Relationship Intelligence | DOMAIN | Relationships | `MOD-RELATIONSHIP-INTELLIGENCE` | NOT_IMPLEMENTED |
| Conversation Intelligence | DOMAIN | Conversations | `MOD-CONVERSATION-INTELLIGENCE` | PARTIALLY_IMPLEMENTED |
| Policy Operations | DOMAIN | Policies | `MOD-POLICY-OPERATIONS` | PARTIALLY_IMPLEMENTED |
| Product Catalog | SERVICE | Products | `MOD-PRODUCT-CATALOG` | PARTIALLY_IMPLEMENTED |
| Product Source Packs | SERVICE | Products | `MOD-PRODUCT-SOURCE-PACK` | NOT_IMPLEMENTED |
| Rule Packs | SERVICE | Rules | `MOD-RULE-PACK-CONTRACT` | NOT_IMPLEMENTED |
| Eligibility | SERVICE | Products | `MOD-ELIGIBILITY-CONTRACT` | NOT_IMPLEMENTED |
| Calculation | SERVICE | Calculations | `MOD-CALCULATION-CONTRACT` | NOT_IMPLEMENTED |
| Quote Preview | FEATURE | Quotes | `MOD-QUOTE-PREVIEW` | PARTIALLY_IMPLEMENTED |
| Mick Observable Behavior | SERVICE | Behavior | `MOD-MICK-BEHAVIOR` | NOT_IMPLEMENTED |
| Manager Coaching | DOMAIN | Coaching | `MOD-MANAGER-COACHING` | NOT_IMPLEMENTED |
| Advisor Experience | CROSS_CUTTING_CAPABILITY | Cross-cutting | `MOD-ADVISOR-EXPERIENCE` | NOT_IMPLEMENTED |
| Compensation And Economic Evidence | DOMAIN | Economics | `MOD-COMPENSATION-ECONOMIC` | NOT_IMPLEMENTED |
| Recruitment And Precontract | DOMAIN | Recruitment | `MOD-RECRUITMENT-PRECONTRACT` | NOT_IMPLEMENTED |
| Action Planning | SERVICE | System | `MOD-ACTION-PLANNING` | IMPLEMENTED |
| Read-only Adapters | SYSTEM | System | `MOD-READONLY-ADAPTERS` | PARTIALLY_IMPLEMENTED |
| Legacy Reintroduction Guard | SYSTEM | System | `MOD-LEGACY-REINTRODUCTION-GUARD` | IMPLEMENTED |

Total product surfaces: 21.
