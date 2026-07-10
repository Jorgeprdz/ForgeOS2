# 107Z15E8B1 Controlled Browser Entrypoint Discovery

Status: PASS

## Previous rejected target

`manager-os/provider-runtime/provider-runtime-boundary-contract.js`

## Decision

- Entrypoint decision: `BROWSER_AND_QUOTE_PREVIEW_SURFACES_FOUND_WITHOUT_CREDIBLE_CONNECTION`
- Final entrypoint: None
- Confidence: `DISCONNECTED`
- Source change authorized: **false**

## Structural method

This gate builds a graph from tracked production-source relative imports and HTML script references. It separates direct browser ownership from generic provider/runtime contracts.

A credible entrypoint requires:

- a browser or DOM boundary;
- Quote Preview semantics or close graph adjacency;
- confirmation or persistence adjacency;
- at least three independent structural evidence classes;
- a score of at least 95.

A single target is resolved only when it is unique or leads the second credible candidate by at least 25 points.

## Counts

- Production files: 972
- Graph nodes: 972
- Graph edges: 725
- Browser files: 50
- Quote Preview semantic files: 70
- Persistence files: 3
- Credible candidates: 0

## Top candidates

1. `utils.js` — score=183, credible=false, browserBoundary=37, confirmation=10, quoteDistance=null, persistenceDistance=null, directPersistence=0
2. `design-system-preview.html` — score=134, credible=false, browserBoundary=16, confirmation=0, quoteDistance=0, persistenceDistance=null, directPersistence=0
3. `comisiones.js` — score=128, credible=false, browserBoundary=46, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
4. `prospeccion.js` — score=124, credible=false, browserBoundary=73, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
5. `referidos.js` — score=124, credible=false, browserBoundary=47, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
6. `cartera-view.js` — score=122, credible=false, browserBoundary=30, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
7. `app.js` — score=97, credible=false, browserBoundary=7, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
8. `platform/commands/command-palette.js` — score=92, credible=false, browserBoundary=14, confirmation=5, quoteDistance=null, persistenceDistance=null, directPersistence=0
9. `actividad.js` — score=83, credible=false, browserBoundary=15, confirmation=0, quoteDistance=null, persistenceDistance=null, directPersistence=0
10. `manager-os/github-pages-static-preview/github-pages-static-preview-boundary-contract.js` — score=71, credible=false, browserBoundary=1, confirmation=0, quoteDistance=0, persistenceDistance=null, directPersistence=0

## Safety decision

This discovery gate does not authorize runtime source modification. Any resolved entrypoint must pass a separate patch-authorization gate.

## Next gate

`107Z15E8B2_BROWSER_TO_QUOTE_PREVIEW_BRIDGE_DISCOVERY_GATE`
