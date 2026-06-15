# FORGE ARCHITECTURE TREE V1

## 1. Executive Summary

Forge OS has transitioned from a monolithic architecture to a modular, ownership-driven structure. This document defines the canonical architecture as of the completion of the Foundation Cleanup phases.

*   **Ownership-Centric**: Forge is organized by domain ownership (Platform, Advisor, Manager, Policy, Product) rather than pure technology layers.
*   **Runtime-Clean Foundation**: The repository has achieved a zero-blocker state for module loading and execution.
*   **Legacy Compatibility**: CRMAddlife legacy shell logic is isolated but preserved to ensure zero-downtime migration.
*   **Logical vs. Physical**: While the logical architecture is now formalized, physical file locations in the root directory may still lag behind the target architecture for stability reasons.

### Current Runtime State
*   **Boot Blockers**: 0
*   **Circular Imports**: 0
*   **Missing Targets**: 0
*   **Missing Exports**: 0
*   **Forge Master Acceptance**: PASS 7/7

---

## 2. Architectural Principles

1.  **Behavior Before Files**: Decouple logic and establish contracts before physically moving files.
2.  **Adapters Over Replacement**: Use adapter layers (e.g., `comisiones-adapter.js`) to bridge Forge and Legacy code without breaking the UI.
3.  **Compatibility Before Purity**: Operational stability takes precedence over architectural "cleanliness."
4.  **Mandatory Cleanliness**: No commit may introduce a boot blocker or unresolved module export.
5.  **Discovery-First Intelligence**: Product and domain intelligence must be backed by evidence before implementation.
6.  **Deferred NASH Migration**: Strategic intelligence assets (NASH) are deferred until the foundational architecture is stabilized.

---

## 3. Canonical Repository Tree

### Primary Domains
| Path | Tier | Ownership / Purpose |
| :--- | :--- | :--- |
| `platform/` | `FORGE_NATIVE` | Enterprise infrastructure (Auth, Routing, Sync). |
| `legacy/crmaddlife/` | `CRMADDLIFE_LEGACY` | Isolated shell pieces from the original application. |
| `advisor-os/` | `FORGE_NATIVE` | Advisor-specific engines (Followup, Prospecting, Referrals). |
| `manager-os/` | `FORGE_NATIVE` | Management and coaching intelligence. |
| `policy-operations/` | `FORGE_NATIVE` | Policy ingestion, validation, and lifecycle. |
| `product-intelligence/` | `FORGE_NATIVE` | Quotes, coverage rules, and projections. |
| `rule-packs/smnyl/` | `MIXED` | Carrier-specific business rules (Commissions, Contests). |
| `src/` | `DEFERRED` | Internal intelligence modules awaiting migration. |
| `nash-memory/` | `DEFERRED` | Persistent conversation snapshots (Data, not Code). |

### Root Boundary Files
| File | Tier | Purpose |
| :--- | :--- | :--- |
| `app.js` | `COMPATIBILITY` | Orchestration facade connecting Platform and Legacy. |
| `index.html` | `CRMADDLIFE` | Original document shell and CSS host. |
| `service-worker.js` | `COMPATIBILITY` | PWA and Offline logic. |
| `comisiones.js` | `MIXED` | High-risk legacy commission engine (UI + Math). |

---

## 4. Platform Layer

The `platform/` directory contains the "Heart" of Forge OS, providing services that are agnostic of insurance business logic.

*   `platform/app/`: Bootstrap logic and shell lifecycle management.
*   `platform/auth/`: Supabase boundary and Google OAuth integration.
*   `platform/routing/`: Enterprise SPA router and route registry.
*   `platform/sync/`: Offline-first synchronization and operational queue.
*   `platform/commands/`: Global command palette and shortcut system.
*   `platform/notifications/`: Multi-channel notification orchestrator.

---

## 5. Legacy CRMAddlife Layer

Located in `legacy/crmaddlife/`, these files represent the "extracted" dependencies of the old shell, allowing `app.js` to remain clean while preserving features.

*   `chat-shell.js`: Legacy support chat client.
*   `ui-shell.js`: Login renders, fatal error states, and splash screens.
*   `ui-listeners.js`: Global UI event bindings (Theme toggle, sidebars).
*   `comisiones-adapter.js`: Translates new rule-pack data for the legacy commission view.

---

## 6. Rule Packs

The `rule-packs/` directory (specifically `rule-packs/smnyl/`) isolates carrier-specific math from the Forge core engines.

*   **Repaired Contracts**: Structural stubs (`db.js`, `concursos-config.js`) resolve all module dependencies.
*   **UI Separation**: Engines here calculate values (Bonuses, Contests) but do not own DOM elements.
*   **Maturity**: Currently functional for math; awaiting wiring to live UI components.

---

## 7. Special Zones

### app.js
The entry point. It no longer contains business logic; it acts as a router that hydrates the `ForgeAppShell` with either native or legacy views.

### index.html
The "Master Host." It remains the primary entry for scripts and global CSS. It is the final target for modernization.

### comisiones.js
The most complex mixed-tier file. It is currently being "shadowed" by the rule-pack engines but remains the production source of truth for the UI.

### NASH
The conversation intelligence layer. While logically part of `advisor-os/conversation/`, its files remain in root to avoid disrupting active research cycles.

---

## 8. Before vs After

| Phase | Before (Monolith) | After (Modular Forge) |
| :--- | :--- | :--- |
| **App Shell** | 9000+ line `app.js` | ~150 line `app.js` facade |
| **Auth/Router** | Hardcoded in root | Dedicated Platform modules |
| **Stability** | 5+ Missing module blockers | 0 Missing targets/exports |
| **Organization** | Everything in Root | Logical domain segmentation |

---

## 9. Migration Status

| Module | Status | Phase |
| :--- | :--- | :--- |
| **App Shell Extraction** | COMPLETED | APP-SHELL-001 |
| **SMNYL Rule-Pack Repair** | COMPLETED | SMNYL-CONTRACT-001 |
| **Foundation Cleanup** | COMPLETED | FOUNDATION-001 |
| **Runtime Stabilization** | COMPLETED | STABILIZE-001 |

---

## 10. Future Phases

*   **Physical Decoupling** [PLANNED]: Moving the remaining ~300 domain files from root to their assigned directories.
*   **NASH Migration** [DEFERRED]: Physical relocation of conversation intelligence.
*   **Comisiones Split** [HIGH-RISK]: Separating financial math from view logic in `comisiones.js`.
*   **HTML Modernization** [PLANNED]: Converting `index.html` to a clean SPA host.
