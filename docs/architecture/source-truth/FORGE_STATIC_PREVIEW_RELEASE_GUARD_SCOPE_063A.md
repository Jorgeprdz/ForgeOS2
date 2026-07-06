# Forge Static Preview Release Guard Scope 063A

Phase:
`063A_STATIC_PREVIEW_RELEASE_GUARD_SCOPE`

Status:
SCOPED / NOT IMPLEMENTED.

Mode:
Docs/scope only.

## Context

Forge Alive is locked at:

- `PREMIUM_STATIC_COMMAND_PREVIEW_LOCKED`;
- `ACTION_CONTRACT_READ_MODEL_PREVIEW_LOCKED`;
- rating `9.1 / 10`;
- static preview ceiling before real module connection `9.1 / 10`.

The previous release sequence exposed three release risks:

- local static serving can pass while GitHub Pages still serves stale assets;
- desktop/tablet can pass while mobile is disconnected;
- implementation, local QA, and public Pages QA must remain separate decisions.

## Objective

Define the future mandatory release guard for static preview phases.

The future script path is:
`tools/termux/forge_static_preview_release_guard.sh`

063A does not implement the operational script. It defines the contract that 063B must implement.

## Required Inputs

The future guard must accept variables or arguments:

- `PHASE`;
- `CACHE_VERSION`;
- `PUBLIC_URL`;
- `LOCAL_URL`;
- `REQUIRED_MARKERS`;
- `REQUIRED_VIEWPORTS`;
- `REQUIRED_COMMAND_TESTS`;
- `AUTHORIZED_FILES`;
- `NEXT_PHASE`.

## Mandatory Guards

The guard must fail closed unless all required checks pass:

1. Tracked-file git state is clean or limited to authorized files.
2. Cache bust is unique for the phase.
3. `index.html` references CSS/JS with the same cache version.
4. Required JS/CSS files contain the current phase `FORGEOS` marker.
5. JavaScript syntax checks pass.
6. `git diff --check` passes.
7. Safety scan has no prohibited tokens.
8. Local static server QA passes before Pages QA.
9. Public Pages QA passes after deploy.
10. Public HTML serves the current cache version.
11. Public JS/CSS contain required markers.
12. Minimum desktop/tablet/mobile screenshots are captured.
13. Command contracts are validated when applicable.
14. No real effects are enabled.
15. CRM/calendar/send/auth/provider/storage/browser request/real engine effects remain disabled.

## Required Outputs

The future guard must produce:

- audit JSON;
- evidence markdown;
- certificate markdown;
- closure markdown;
- report autocopy text;
- explicit `PASS` or `FAIL` token.

## Fail-Closed Rules

The future guard must not stage, commit, or push if any guard fails.

On failure it must report:

- failing guard name;
- observed evidence;
- expected evidence;
- whether the failure is local source, local visual QA, public Pages deploy sync, public asset mismatch, or behavior regression.

## Public Deploy Sync Classification

If Pages is stale, the guard must classify the failure as one of:

- CDN delay;
- GitHub Pages source config;
- path mismatch;
- missing asset;
- deploy workflow issue.

If local is correct and the only issue is stale cache/deploy, a later implementation may support a cache-bust-only or deploy-nudge path, but that path must still produce a new public QA pass before declaring success.

## Minimum Viewports

The default required viewport set must include:

- desktop `1366x768`;
- tablet landscape `1024x768`;
- mobile `390x844`.

Additional phase-specific viewports may be required by `REQUIRED_VIEWPORTS`.

## Command Contract Tests

When `REQUIRED_COMMAND_TESTS` is present, the guard must validate:

- command input becomes active;
- result panel is visible and legible;
- expected action id is produced;
- payload exposes source/status/blockers/policy;
- no-effect policy is visible;
- real effects remain disabled.

## Scope Boundary

063A is documentation/scope only.

No UI, CSS, JS, HTML, CRM, calendar, send, auth, runtime/storage, provider execution, browser request behavior, or real engine behavior is changed.

DECISION=PASS_063A_STATIC_PREVIEW_RELEASE_GUARD_SCOPE

NEXT=063B_STATIC_PREVIEW_RELEASE_GUARD_IMPLEMENTATION
