# RUNTIME-006 Runtime Governance Report

Report ID: RUNTIME-006
Status: Architecture Discovery / No Execution
Date: 2026-06-11

## 1. Governance Finding

RUNTIME-006 confirms that Forge has moved from boot-failure repair into runtime warning governance.

The remaining warnings are not aesthetic. They identify unresolved ownership and dependency contracts:

- Platform/Auth boundary leak through `getSupabase`.
- Policy Operations route/view path drift.
- Policy Operations service export contract drift.
- Rule Pack / Compensation missing contest config.
- Rule Pack / Compensation premium calculation contract drift.
- Advisor OS / Shared Intelligence missing question bank.

## 2. Boundary Governance

### getSupabase

Current role:

```txt
Temporary app-shell compatibility export
```

Constitutional owner:

```txt
Platform
```

Consuming domain:

```txt
Compensation / Comisiones route
```

Governance classification:

```txt
TEMPORARY_BOUNDARY
```

Required future rule:

Domain and route modules must not import infrastructure accessors from `app.js`. Platform services should expose auth/session/data clients through a dedicated boundary.

Recommended future boundary:

```txt
supabase/session/client service owned by Platform
```

No implementation is authorized in RUNTIME-006.

## 3. Warning Ownership Matrix

| Warning | Constitutional Owner | Execution Owner | Governance Action |
| --- | --- | --- | --- |
| `getSupabase` app-shell cycle | Platform | Runtime Governance | Plan service boundary extraction. |
| `cartera-view.js` missing `../utils/cartera-utils.js` | Policy Operations | Runtime Governance + Policy Operations | Determine correct utility location before rewrite. |
| `cartera-import-engine.js` missing `carteraService` | Policy Operations | Policy Operations | Audit service file completeness and export contract. |
| `adaptive-question-engine.js` missing question bank | Advisor OS / Shared Intelligence | Advisor Intelligence | Determine whether bank should exist, be archived, or be generated from another source. |
| `smnyl-concursos-config.js` missing for bonuses | Rule Packs / Compensation | Rule Pack Governance | Establish canonical SMNYL contest config source. |
| `smnyl-concursos-config.js` missing for training allowance | Rule Packs / Compensation | Rule Pack Governance | Same as above; shared config should not be duplicated. |
| `smnyl-produccion-engine.js` missing `calcularPrimaPoliza` | Rule Packs / Compensation | Compensation | Decide whether to add composed export or rewrite consumer to existing exports. |

## 4. Harmless vs Debt vs Blocker

| Category | Items | Verdict |
| --- | ---: | --- |
| Harmless | 0 | None of the current warnings are cosmetic only. |
| Technical debt | 1 | `getSupabase` app-shell cycle. |
| Migration blockers | 7 | All remaining warnings block safe runtime movement until resolved or formally quarantined. |
| Runtime risks | 6 | All missing target/export warnings can break route/domain execution if loaded. |
| Boot risks | 0 | No remaining warning is currently classified as boot risk. |

## 5. RUNTIME-007 Prioritization

### Priority 1: getSupabase Boundary

Reason:

- It is the only remaining app-shell circular import.
- It directly affects future app shell modularization.
- It determines where Platform service access should live.

Expected knowledge gain:

- Whether `app.js` can stop exporting runtime service accessors.
- Whether `offline-sync.js`, `realtime-engine.js`, and `comisiones.js` should share a Platform Supabase client boundary.

Recommended RUNTIME-007 scope:

```txt
GETSUPABASE PLATFORM BOUNDARY PLAN
```

### Priority 2: Cartera Route Contract

Reason:

- There are two Policy Operations warnings: missing utility path and missing `carteraService` export.
- `cartera-utils.js` exists at root, suggesting path drift.
- `cartera-service.js` requires deeper validation before repair.

Expected knowledge gain:

- Whether Cartera route modules are currently executable.
- Whether Policy Operations needs a local service/utility boundary before movement.

Recommended RUNTIME-007 or RUNTIME-008 scope:

```txt
CARTERA ROUTE CONTRACT VALIDATION
```

### Priority 3: SMNYL Rule Pack Contract

Reason:

- Two engines depend on missing `smnyl-concursos-config.js`.
- One production engine expects missing `calcularPrimaPoliza`.
- These are rule-pack/compensation contracts, not app shell contracts.

Expected knowledge gain:

- Whether SMNYL contest config was never implemented, renamed, or archived.
- Whether premium calculation should be exposed as a bundled function or composed by consumers.

Recommended follow-up scope:

```txt
SMNYL RULE PACK CONTRACT AUDIT
```

## 6. Final Governance Verdict

Current runtime state:

```txt
EXECUTABLE_WITH_WARNINGS
```

Runtime governance maturity:

```txt
FUNCTIONAL BUT NOT COMPLETE
```

Runtime migration readiness:

```txt
NO-GO
```

Reason:

The app shell no longer has known boot blockers, but Forge still has unresolved route/domain contracts. Migration should remain blocked until warnings are either repaired, quarantined, or explicitly accepted with ownership.

Recommended next phase:

```txt
RUNTIME-007 GETSUPABASE PLATFORM BOUNDARY PLAN
```

Confidence score:

```txt
0.87
```

