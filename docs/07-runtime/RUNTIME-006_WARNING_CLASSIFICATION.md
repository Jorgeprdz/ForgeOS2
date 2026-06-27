# RUNTIME-006 Warning Classification

Report ID: RUNTIME-006
Status: Architecture Discovery / No Execution
Date: 2026-06-11

## 1. Current Runtime Warning Inventory

Command executed:

```sh
node scripts/runtime-module-graph-audit.js
```

Current state:

| Metric | Count |
| --- | ---: |
| JS files scanned | 671 |
| Imports found | 195 |
| Static imports | 194 |
| Dynamic imports | 1 |
| Missing targets | 4 |
| Missing exports | 2 |
| Circular imports | 1 |
| Boot blockers | 0 |
| Executability verdict | EXECUTABLE_WITH_WARNINGS |

Remaining warnings count: **7**

Composition:

- Missing targets: 4
- Missing exports: 2
- Circular imports: 1

Remaining boot risk: **0**

## 2. Complete Warning List

| # | Type | Source | Target / Export | Audit Classification | RUNTIME-006 Classification | Runtime Impact | Owner |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Missing target | `adaptive-question-engine.js` | `./adaptive-question-bank` -> `adaptive-question-bank.js` | DOMAIN_BLOCKER | DOMAIN_BLOCKER | Adaptive question module fails if imported. Not boot-loaded by `app.js` today. | Advisor OS / Shared Intelligence |
| 2 | Missing target | `cartera-view.js` | `../utils/cartera-utils.js` | ROUTE_BLOCKER | ROUTE_BLOCKER | Cartera view fails if this module path is loaded. `cartera-utils.js` exists at root, so this is likely path drift. | Policy Operations / Platform UI |
| 3 | Missing target | `smnyl-bonos-engine.js` | `./smnyl-concursos-config.js` | DOMAIN_BLOCKER | DOMAIN_BLOCKER | SMNYL bonus engine cannot instantiate without contest config. | Rule Packs / Compensation |
| 4 | Missing target | `smnyl-training-allowance-engine.js` | `./smnyl-concursos-config.js` | DOMAIN_BLOCKER | DOMAIN_BLOCKER | Training allowance engine cannot instantiate without contest config. | Rule Packs / Compensation |
| 5 | Missing export | `cartera-import-engine.js` | `carteraService` from `cartera-service.js` | ROUTE_BLOCKER | ROUTE_BLOCKER | Import engine cannot instantiate because expected service export is missing. | Policy Operations |
| 6 | Missing export | `smnyl-produccion-engine.js` | `calcularPrimaPoliza` from `smnyl-prima-engine.js` | DOMAIN_BLOCKER | DOMAIN_BLOCKER | Production engine cannot calculate monthly/YTD production through current contract. | Rule Packs / Compensation |
| 7 | Circular import | `app.js -> comisiones.js -> app.js` | `getSupabase` compatibility export | APP_SHELL_CYCLE | TECHNICAL_DEBT / MIGRATION_BLOCKER | Current boot is not blocked, but app shell and compensation remain coupled. | Platform + Compensation |

## 3. getSupabase Boundary Audit

Observable evidence:

- `app.js` creates `window.supabaseClient` during `AuthService.init()`.
- `app.js` comments state that `window.supabaseClient` exists only for legacy module compatibility and has a TODO to remove it when modules are migrated.
- `app.js` exports `getSupabase()` as a compatibility function.
- `comisiones.js` is the only static importer of `getSupabase` from `app.js`.
- `offline-sync.js` and `realtime-engine.js` use `window.supabaseClient` directly.

Boundary classification:

```txt
TEMPORARY_BOUNDARY
```

Secondary classification:

```txt
LEGACY_BOUNDARY
```

Reason:

`app.js` currently owns Supabase client creation because it owns boot/auth initialization. That is valid for first boot, but exporting a service accessor from `app.js` to route/domain modules reverses the intended dependency direction. Platform should own the Supabase client boundary through an auth/session/data service, not through the app shell entry module.

This is not a current boot blocker, but it blocks clean runtime modularization.

## 4. Remaining Missing Targets

| Missing Target | Evidence | Exists Elsewhere? | Purpose | Impact | Ownership | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| `adaptive-question-bank.js` | `adaptive-question-engine.js` imports `ADAPTIVE_QUESTION_BANK` from `./adaptive-question-bank`. | No physical match found by filename search. | Question bank data for adaptive question generation. | Domain feature unavailable if imported. | Advisor OS / Shared Intelligence | DOMAIN_BLOCKER |
| `../utils/cartera-utils.js` | `cartera-view.js` imports `formatCurrency` and `escapeHTML` from this path. | `cartera-utils.js` exists at root, but not under `utils/`. | Formatting/sanitizing helpers for Cartera UI. | Route view may fail at module load. | Policy Operations / Platform UI | ROUTE_BLOCKER |
| `smnyl-concursos-config.js` for bonuses | `smnyl-bonos-engine.js` imports `ConcursosConfig`. | No physical config file found. | Rule Pack contest configuration. | Bonus engine cannot load. | Rule Packs / Compensation | DOMAIN_BLOCKER |
| `smnyl-concursos-config.js` for training allowance | `smnyl-training-allowance-engine.js` imports `ConcursosConfig`. | No physical config file found. | Rule Pack contest configuration. | Training allowance engine cannot load. | Rule Packs / Compensation | DOMAIN_BLOCKER |

## 5. Remaining Missing Exports

| Missing Export | Evidence | Target Module Exists? | Observable Target Exports | Severity | Impact |
| --- | --- | --- | --- | --- | --- |
| `carteraService` from `cartera-service.js` | `cartera-import-engine.js` imports named `carteraService`. | Yes | `class CarteraService` is present, but no observed named export in scanned contract. | HIGH | Mass import flow cannot use the expected service contract if module is loaded. |
| `calcularPrimaPoliza` from `smnyl-prima-engine.js` | `smnyl-produccion-engine.js` imports named `calcularPrimaPoliza`. | Yes | `obtenerProducto`, `calcularPrimaAnualizada`, `calcularPrimaMeta`, `calcularPrimaPago`, `calcularConteo`. | MEDIUM | Production engine expects a bundled policy premium calculation that can likely be composed from existing exports, but contract is absent. |

Additional observation:

`cartera-service.js` appears to end mid-implementation around `inserted.push(`. `node --check cartera-service.js` did not fail in the current environment, but the file shape requires dedicated review before any repair is attempted. RUNTIME-006 does not modify it.

## 6. Circular Import Severity

Cycle:

```txt
app.js -> comisiones.js -> app.js
```

Cause:

`app.js` statically imports `comisiones.js`, and `comisiones.js` imports `getSupabase` from `app.js`.

Assessment:

| Question | Answer |
| --- | --- |
| Is execution currently safe? | Likely safe enough for module instantiation after RUNTIME-005 because the missing `callGemini` export is resolved and the audit reports zero boot blockers. |
| Does it create initialization risk? | Yes. `comisiones.js` depends on an app shell export while the app shell imports the route module. This can become fragile if `getSupabase` gains stateful initialization side effects. |
| Does it block future modularization? | Yes. It prevents clean separation of Platform boot from Compensation route logic. |
| Does it block runtime migration? | Yes for app shell/domain separation. No for current boot. |

Severity:

```txt
TECHNICAL_DEBT
```

Migration impact:

```txt
MIGRATION_BLOCKER
```

It is not classified as `CRITICAL` because current boot blockers are zero.

## 7. Warning Governance Taxonomy

| Level | Name | Definition |
| ---: | --- | --- |
| 0 | Resolved | Previously detected warning is no longer present. |
| 1 | Cosmetic | Does not affect runtime, ownership, migration, or validation. |
| 2 | Technical Debt | Executable today but structurally wrong or brittle. |
| 3 | Migration Blocker | Does not block current boot but blocks safe movement/refactor. |
| 4 | Runtime Risk | Can break a route/domain feature when loaded. |
| 5 | Boot Risk | Can break app shell startup or ES module instantiation during boot. |

## 8. Warning Level Assignment

| Warning | Level | Rationale |
| --- | ---: | --- |
| `utils.js` missing `overlay-manager.js` | 0 | Resolved by RUNTIME-005. |
| `prospeccion.js` missing `callGemini` from `app.js` | 0 | Resolved by RUNTIME-005. |
| `comisiones.js` missing `callGemini` from `app.js` | 0 | Resolved by RUNTIME-005. |
| `app.js -> comisiones.js -> app.js` via `getSupabase` | 3 | Current boot survives, but shell/domain boundary blocks modular migration. |
| `adaptive-question-engine.js` missing question bank | 4 | Domain module can fail when loaded. |
| `cartera-view.js` missing `../utils/cartera-utils.js` | 4 | Route view can fail when loaded. |
| `smnyl-bonos-engine.js` missing contest config | 4 | Domain engine can fail when loaded. |
| `smnyl-training-allowance-engine.js` missing contest config | 4 | Domain engine can fail when loaded. |
| `cartera-import-engine.js` missing `carteraService` export | 4 | Import feature can fail when loaded. |
| `smnyl-produccion-engine.js` missing `calcularPrimaPoliza` export | 4 | Production engine can fail when loaded. |

## 9. Final Verdict

Remaining runtime warnings are not harmless. They are not current boot risks, but they are real architecture and runtime risks for route/domain execution.

Current status:

```txt
EXECUTABLE_WITH_WARNINGS
```

Migration readiness:

```txt
NOT READY FOR RUNTIME MOVEMENT
```

Reason:

Forge can now boot past the known app shell blockers, but route/domain contracts remain unresolved. Moving runtime files before classifying and repairing these contracts would increase blast radius.

