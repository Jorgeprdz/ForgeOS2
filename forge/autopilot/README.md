# Forge OS V2 Functional Autopilot

This tool separates **mechanical validation** from **real functional completion**.
A `.forge21/receipts/<MODULE_ID>/latest.json` receipt proves that declared files and exports were valid at validation time. It does not prove that a domain decision, external integration, or user flow works.

## Binary completion criteria

### Area 1 — Constitution, ADR, and base architecture

A1-01. `governance/FORGE_GOVERNANCE_REGISTRY.md` declares `RATIFIED / ACTIVE`.
A1-02. The registered unified Constitution exists.
A1-03. `adr/` contains at least one decision file.
A1-04. The registered Master Build Tree exists.
A1-05. Every authority path registered in the Governance Registry resolves.
A1-06. `forge/modules.json` has unique module IDs, a resolvable acyclic dependency graph, and every module governance input exists.

### Area 2 — Scaffold and validation engine

For each scaffold module:

A2-01. Manifest record, entrypoint, tests, and governance inputs exist.
A2-02. Dependencies resolve and are acyclic.
A2-03. Focused tests execute the module operation, not only object shape.
A2-04. The latest receipt is PASS and its hashes still match every required file.
A2-05. At least one negative path is asserted.
A2-06. Module-specific behavior is exercised:

- `MOD-SCAFFOLD-CONTRACTS`: unsafe path rejection and canonical hashing/validation.
- `MOD-SCAFFOLD-REGISTRY`: exact version references and unknown/duplicate rejection.
- `MOD-SCAFFOLD-PLANNER`: deterministic plans and collision/path rejection.
- `MOD-SCAFFOLD-RENDERER`: token rendering, staging, normalization, and hash mismatch handling.
- `MOD-SCAFFOLD-VALIDATOR`: tampered, missing, or extra bundle failure.
- `MOD-SCAFFOLD-RECEIPTS`: receipt hashing, tamper detection, and evidence writing.
- `MOD-SCAFFOLD-APPLIER`: real temporary filesystem apply, create-only collision behavior, verification, and rollback/partial failure protection.
- `MOD-SCAFFOLD-CLI`: real process invocation, non-zero failure behavior, and strict command boundary.
- `MOD-SCAFFOLD-CATALOG`: actual catalog load, family/version validation, and missing asset failure.

A2-07. Full suite passes.
A2-08. `forge doctor` passes.
A2-09. Module validation passes and refreshes the receipt.

### Area 3 — Real domain runtime

A runtime module is complete only when all are YES:

A3-01. A non-trivial input flow executes through the public entrypoint.
A3-02. The assertion verifies a business/domain outcome, not only schema, immutability, deterministic hashing, or export presence.
A3-03. A negative domain case is induced and its specific failure is asserted.
A3-04. The critical path contains no mocks/stubs/fakes.
A3-05. A real consumer test imports or invokes the module and uses its decision/output.
A3-06. The focused functional command passes.
A3-07. Every evidence artifact hash matches the current working tree.
A3-08. The evidence source commit is an ancestor of current HEAD.

Known module-specific requirements:

- `MOD-CARRIER-SCOPE`: a consumer must use the scope to allow or reject carrier applicability across non-trivial carrier, market, product-line, or jurisdiction cases. Canonicalization alone is insufficient.
- `MOD-PRODUCT-INTELLIGENCE`: a flow must use multiple sources, effective-time/evidence state, conflict or stale handling, produce Product Truth, and feed a consumer decision such as quote eligibility or recommendation. Envelope shape/actionability tests alone are insufficient.

### Area 4 — Integrations, data, and adapters

A4-01. A concrete adapter touches an external-real instance or a faithful contract fixture.
A4-02. The success path returns real external semantics, not an always-success mock.
A4-03. At least one real external failure class is asserted: timeout, authentication, rate limit, malformed payload, unavailable service, or partial failure.
A4-04. External data is mapped into a canonical domain contract.
A4-05. Idempotency, retry, or duplicate behavior is asserted where the operation can repeat.
A4-06. Secrets are not committed or leaked in logs/evidence.
A4-07. A consumer crosses the adapter boundary.
A4-08. Evidence identifies `external-real` or `faithful-contract-fixture` and hashes current artifacts.

### Area 5 — Usable product end to end

A5-01. The scenario starts at a real user entrypoint.
A5-02. It contains at least three user actions.
A5-03. It crosses domain runtime and at least one adapter/data boundary.
A5-04. `manualSteps` is an empty array; hidden manual completion is forbidden.
A5-05. A visible/persisted result is verified by readback.
A5-06. A recoverable failure flow is verified.
A5-07. Human approval is exercised when governance requires it.
A5-08. The run has a trace/correlation identity and is repeatable from a clean environment.
A5-09. Scenario, command, artifacts, hashes, and result are recorded in functional evidence.

## False-green rules

The audit marks a module as `falseGreen` when its mechanical receipt says PASS but the area checklist is not fully satisfied.

Automatic suspicion signals include:

- critical tests contain `mock`, `stub`, `sinon`, `nock`, `jest.fn`, fake implementations, or always-success fixtures;
- no `assert.throws`, `assert.rejects`, error/status/failure assertion, or equivalent negative path appears;
- test input is too small to count as a non-trivial flow;
- domain tests never assert an outcome signal;
- runtime modules have no consumer test path;
- external modules have no real/faithful environment evidence;
- E2E evidence has fewer than three actions or any hidden manual step;
- receipt/evidence hashes are stale;
- evidence source commit is not an ancestor of current HEAD.

Heuristics may deny completion or mark suspicion. They never grant functional completion for areas 3–5 without reproducible evidence.

## Commands

```bash
tools/forge-autopilot criteria
tools/forge-autopilot audit
tools/forge-autopilot recommend
tools/forge-autopilot run [MODULE_ID]
```

`run` executes:

snapshot → explicit implementation hook → route audit → focused tests → full suite → forge doctor → module validation → functional test/evidence → route audit → exact stage → staged diff check → push dry-run → commit → push.

Any failure before commit stops immediately. A failed real push automatically resets the local branch to its pre-commit HEAD and unstages the changes.

## Implementation actions

Configure `forge/autopilot/module-actions.json` for a runnable module. The implementation and functional test commands must be real executable commands. Null commands intentionally fail closed.

For runtime modules, `consumerTestPaths` is mandatory. For integration and E2E modules, add an `evidence` object with the exact required checks, artifact paths, environment, and scenario. The tool verifies the resulting evidence and hashes before staging.
