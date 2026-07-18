# 067G17A1 Recovered Offline Preparation Status

Recovery date: 2026-07-17

## Required recovery fields

`067G17A1_PREPARATION_FOUND=YES`

`067G17A1_FILES_FOUND=11`

`067G17A1_MIGRATION_FOUND=YES`

`067G17A1_PUBLIC_CONFIG_FOUND=YES`

`067G17A1_TESTS_FOUND=YES_3`

`067G17A1_RUNNER_FOUND=YES`

`067G17A1_REMOTE_ACCEPTANCE_FOUND=YES_INCOMPLETE_DRAFT`

`067G17A1_COMPLETENESS=PARTIAL_READY_FOR_LOCAL_COMPLETION`

`067G17A1_INCOMPLETE_ITEMS=PROJECT_AUTHORITY;PUBLIC_URL_SECRET_MAPPING;CANONICAL_CONFIG_AND_CACHE_BUSTING;RUNNER_PORTABILITY;MIGRATION_VALIDATION_AND_REVERSAL_PLAN;PROTECTED_TWO_ADVISOR_WORKFLOW;COMPLETE_REMOTE_ASSERTIONS;DEPLOYMENT_EVIDENCE`

`067G17A1_NEXT_REQUIRED_ACTION=RECONCILE_AND_VERIFY_APPROVED_SUPABASE_PROJECT_AUTHORITY`

## Recovery classification

`067G17A1_PREPARATION_FOUND=YES`

`067G17A1_PREPARATION_COMPLETENESS=PARTIAL_READY_FOR_LOCAL_COMPLETION`

The preserved main-worktree preparation contains a coherent public-config loader, an additive versioned migration, static security tests, a local runner, and a draft remote RLS script. It has not been staged, committed, pushed, or applied to any database. It is not yet deployment-ready because the external mapping, remote workflow, remote runner contract, and local-runner portability require completion.

## Files recovered

### Modified files

- `.github/workflows/pages.yml` — generates root `env.js` and maps demo mode, Supabase URL, and anon key into public runtime names. The recovered version reads `SUPABASE_URL` from a GitHub variable; current authority requires the repository secret instead.
- `docs/static-preview/forge-alive/index.html` — loads root `env.js` and the Forge Alive config loader before sample data and application bootstrap.
- `docs/static-preview/forge-alive/sample-data.js` — permits fixtures only when canonical runtime state explicitly enables demo mode.

### Created files

- `docs/static-preview/forge-alive/forge-alive-public-config-067g17a1.js` — allowlisted public-config authority for `SUPABASE_URL`, `SUPABASE_KEY`, and `DEMO_MODE`; blocks productive access when production configuration is incomplete.
- `supabase/migrations/20260717000100_067g17a1_prospect_opportunity_security_foundation.sql` — additive prospect/opportunity foundation, archive guards, grants, RLS, and active-record views.
- `tests/forge-067g17a1-public-config-test.mjs` — public allowlist, fail-closed, fixture, and secret-exclusion assertions.
- `tests/forge-067g17a1-migration-security-test.mjs` — static migration, RLS, ownership, archive, and no-delete assertions.
- `tests/forge-067g17a1-runner-integrity-test.mjs` — verifies that a failing child check cannot be reported as PASS.
- `tools/forge-067g17a1-local-runner.sh` — local security-test orchestrator and JSONL ledger.
- `scripts/forge-067g17a1-remote-two-advisor-rls.mjs` — draft remote acceptance script; it has not been executed.

## File classification

| File | Classification | Finding |
| --- | --- | --- |
| `.github/workflows/pages.yml` | incomplete, security-sensitive | Public allowlist is sound, but `SUPABASE_URL` is read from an absent repository variable instead of the approved secret; artifact cache-busting and built-config validation are incomplete. |
| `docs/static-preview/forge-alive/index.html` | incomplete | Config order is correct, but the env URL is not deployment-versioned and the authority is Forge-Alive-specific rather than shared with root. |
| `docs/static-preview/forge-alive/sample-data.js` | complete for current scope | Fixtures require the explicit config authority to allow demo mode; productive persistence remains intentionally unauthorized. |
| `docs/static-preview/forge-alive/forge-alive-public-config-067g17a1.js` | incomplete, security-sensitive | Fail-closed allowlist behavior is valid; it still needs a single root/Forge Alive authority and publication-path validation. |
| `supabase/migrations/20260717000100_067g17a1_prospect_opportunity_security_foundation.sql` | incomplete, security-sensitive | Additive ownership/RLS/archive foundation is coherent and static checks pass; parser/diff/live-schema validation, explicit compensating recovery, and canonical deployment-path proof remain absent. |
| `tests/forge-067g17a1-public-config-test.mjs` | incomplete | Core fail-closed assertions pass but encode the incorrect variable mapping and do not validate the final artifact or shared root authority. |
| `tests/forge-067g17a1-migration-security-test.mjs` | incomplete | Strong static checks pass; deployment-path, project-ref, full policy inventory, and database execution checks remain absent. |
| `tests/forge-067g17a1-runner-integrity-test.mjs` | incomplete | Proves a generic non-zero child cannot become PASS; it does not yet cover BLOCKED dependencies, missing secrets, skipped remote checks, cleanup failures, service-role-only acceptance, or ref mismatch. |
| `tools/forge-067g17a1-local-runner.sh` | invalid on current host, repairable | Default `/tmp` evidence path is not writable in Android/Termux; status vocabulary lacks BLOCKED and the runner does not orchestrate all mandatory checks. |
| `scripts/forge-067g17a1-remote-two-advisor-rls.mjs` | incomplete, security-sensitive | Uses externally supplied access tokens instead of protected email/password authentication; covers one direction only and lacks anonymous, cross-archive, symmetric fixtures, and robust cleanup assertions. |
| `067G17A1_RECOVERED_PREPARATION_STATUS.md` | complete for classification | Recovery inventory and exact remaining gates are recorded without claiming remote execution. |

## Local validation recovered

- Public config static test: `PASS` (`node tests/forge-067g17a1-public-config-test.mjs`, exit 0).
- Migration security static test: `PASS` (`node tests/forge-067g17a1-migration-security-test.mjs`, exit 0).
- Runner integrity test: `PASS` (`node tests/forge-067g17a1-runner-integrity-test.mjs`, exit 0).
- Local runner: `FAIL` before test execution because its default evidence directory is `/tmp/forge-067g17a1-local-evidence`, which is not writable in the current Android/Termux environment. This is a portability defect to repair locally, not a failed security assertion.
- Remote acceptance: `NOT_RUN`.
- Migration execution: `NOT_RUN`.
- Database changes: `NONE`.

## Migration and RLS inventory

The migration extends `public.prospects` and creates:

- `public.opportunities`
- `public.prospect_contact_methods`
- `public.prospect_provenance`
- `public.opportunity_status_history`

It enables RLS on all five owned tables, revokes `anon`, grants only SELECT/INSERT/UPDATE to `authenticated`, and creates explicit advisor-owned SELECT, INSERT, UPDATE, and restrictive archive-metadata policies. Ownership is `advisor_id = auth.uid()`. Composite ownership foreign keys bind child rows to an advisor-owned parent. A trigger rejects ownership transfer, archive reversal or alteration, and invalid archive metadata. No DELETE grant or DELETE policy is created. Active views exclude archived prospects and opportunities.

Static syntax/structure status is PASS. Database parser validation, migration diff, deployment, table existence, and live RLS behavior remain NOT RUN.

## Public config status

The loader is fail-closed, allows only the approved three public names, and prevents silent production fixture fallback. Forge Alive loads the root config path before bootstrap. Remaining work:

- map repository secret `SUPABASE_URL`, not a repository variable;
- establish and test one root/Forge Alive non-drifting config authority;
- add cache-busting/deployment validation so an old or missing `env.js` cannot survive;
- validate the deployed root and Forge Alive URLs.

## Remote acceptance readiness

The recovered remote script is a draft only. It currently expects pre-created access tokens instead of authenticating with protected Advisor A/B email and password secrets. It creates only an Advisor A fixture, tests only one cross-advisor direction, lacks a complete anonymous-access assertion and reliable cleanup ledger, and is not connected to a protected manual GitHub Actions workflow. Therefore:

`067G17A1_REMOTE_TEST_READINESS=INCOMPLETE`

## Exact next action

Reverify external secret/variable names and project availability without revealing values; then complete the local Pages mapping, portable runner, protected two-advisor workflow, remote test assertions, migration validation/diff, and documented compensating recovery plan before considering a controlled deployment commit.
