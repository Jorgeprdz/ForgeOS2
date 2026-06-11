# RUNTIME-006 Runtime Health Score

Report ID: RUNTIME-006
Status: Architecture Discovery / No Execution
Date: 2026-06-11

## 1. Scoring Methodology

Runtime health is scored across five dimensions:

| Dimension | Weight | Meaning |
| --- | ---: | --- |
| Boot Health | 30 | Whether app shell startup is blocked by module graph failures. |
| Boundary Health | 20 | Whether app shell, platform services, and domain modules have clean dependency direction. |
| Dependency Health | 20 | Whether import targets and named exports are resolvable. |
| Migration Readiness | 20 | Whether files can be moved/refactored without unpredictable breakage. |
| Runtime Governance Maturity | 10 | Whether warnings are observable, classified, and governed. |

Overall score is weighted from 0 to 100.

## 2. Current Scores

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Boot Health | 95 | Boot blockers are 0 and verdict is `EXECUTABLE_WITH_WARNINGS`. Deducted 5 because one app-shell cycle remains. |
| Boundary Health | 60 | `getSupabase` remains exported from `app.js` as a temporary legacy boundary; route/domain code still consumes app shell. |
| Dependency Health | 68 | Missing targets reduced to 4 and missing exports to 2, but route/domain modules still contain unresolved contracts. |
| Migration Readiness | 52 | Runtime movement remains blocked by unresolved route/domain dependencies and one app-shell cycle. |
| Runtime Governance Maturity | 82 | The audit script exists, boot blockers were repaired, warnings are now classified; CI enforcement and owner registry are not complete. |

## 3. Weighted Overall Score

| Dimension | Weight | Score | Weighted Contribution |
| --- | ---: | ---: | ---: |
| Boot Health | 30 | 95 | 28.5 |
| Boundary Health | 20 | 60 | 12.0 |
| Dependency Health | 20 | 68 | 13.6 |
| Migration Readiness | 20 | 52 | 10.4 |
| Runtime Governance Maturity | 10 | 82 | 8.2 |

Overall Runtime Health Score:

```txt
72.7 / 100
```

Rounded:

```txt
73 / 100
```

## 4. Migration Readiness Score

Migration Readiness Score:

```txt
52 / 100
```

Interpretation:

- Forge is no longer in boot-failure state.
- Forge is still not ready for physical runtime migration.
- Safe migration requires route/domain warning resolution or explicit quarantine decisions.

## 5. Risk Summary

| Risk Area | Score Impact | Current Status |
| --- | ---: | --- |
| Boot blockers | Positive | Resolved. |
| App shell cycle | Negative | One remaining cycle via `getSupabase`. |
| Route blockers | Negative | `cartera-view.js` and `cartera-import-engine.js` need contract repair planning. |
| Domain blockers | Negative | Adaptive question and SMNYL rule-pack contracts unresolved. |
| Governance visibility | Positive | Tooling now detects and reports all current warnings. |

## 6. Score Verdict

Runtime health is materially improved after RUNTIME-005, but still below the threshold for migration.

Suggested thresholds:

| Action | Required Score |
| --- | ---: |
| Continue warning governance | 60+ |
| Execute targeted route/domain repair | 70+ |
| Begin runtime movement dry-run | 85+ |
| Execute physical runtime migration | 90+ |

Current recommendation:

```txt
CONTINUE TARGETED RUNTIME WARNING GOVERNANCE
```

