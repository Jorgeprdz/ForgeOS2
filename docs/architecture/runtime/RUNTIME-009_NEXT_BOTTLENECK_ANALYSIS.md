# RUNTIME-009 Next Bottleneck Analysis

## 1. Primary Architectural Obstacle

The single largest architectural obstacle preventing runtime modularization is:

**Legacy Route Coupling**

## 2. Evidence Chain

1. **Static Entry Point**: `app.js` (the app shell) maintains 18 static imports for both Platform infrastructure and Domain routes.
2. **Path Fragility**: Because these are static root-relative imports (`./comisiones.js`), any attempt to move a route file to a subdirectory (e.g., `modules/compensation/comisiones.js`) requires a simultaneous edit to `app.js`.
3. **Verification Gap**: In the current flat structure, the module graph is "shallow." Moving to a nested structure without first adopting dynamic imports or a central registry makes the system fragile during transition.
4. **Boot Surface Area**: The app shell "knows" about every domain route at compile time. This forces the entire domain layer into the critical boot path, even though only one route is active at a time.

## 3. Impact

Until **Legacy Route Coupling** is resolved via dynamic imports (lazy loading), any file movement creates a high-risk synchronized update requirement across the app shell and its consumers. This coupling prevents the "Advisor OS" and "Manager OS" from truly operating as independent, swappable domains.

## 4. Mitigation Strategy

The next strategic phase should focus on **Lazy Loading Transition**. By moving route imports behind a dynamic `import()` boundary in `app.js`, we decouple the app shell's existence from the physical location of the route files, enabling safe, incremental migration to a modular directory structure.
