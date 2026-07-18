# Supabase Project Authority Inventory

Date: 2026-07-17

Approved production project ref: `rmlxigxysujsuwzgoimv`

Approved production project URL: `https://rmlxigxysujsuwzgoimv.supabase.co`

Stale project ref: `rgcolnioakzrdtsxwscp`

## Executable repository occurrences

### Edge Function deployment workflow

`FILE=.github/workflows/deploy-supabase.yml`

`LINE=17_AT_DISCOVERY`

`CURRENT_REF=rgcolnioakzrdtsxwscp_AT_DISCOVERY`

`INTENDED_AUTHORITY=rmlxigxysujsuwzgoimv`

`RUNTIME_EFFECT=TARGET_FOR_SEMANTIC_EXTRACT_DEPLOYMENT_AND_SMOKE_TEST`

`REPAIR_REQUIRED=YES_APPLIED_LOCALLY_NOT_COMMITTED`

### Semantic Extract acceptance fallback

`FILE=semantic-extract-acceptance-test.js`

`LINE=11_AT_DISCOVERY`

`CURRENT_REF=rgcolnioakzrdtsxwscp_AT_DISCOVERY`

`INTENDED_AUTHORITY=rmlxigxysujsuwzgoimv`

`RUNTIME_EFFECT=DEFAULT_REMOTE_ACCEPTANCE_ENDPOINT_WHEN_SUPABASE_URL_IS_ABSENT`

`REPAIR_REQUIRED=YES_APPLIED_LOCALLY_NOT_COMMITTED`

## Repository authority findings

- `.github/workflows/pages.yml` consumes a URL supplied by repository configuration and did not contain a literal project ref at discovery.
- No `supabase/config.toml` exists. No repository-local CLI link file or package script supplies another project ref.
- Historical evidence under `docs/evidence/` was excluded from repair by instruction.
- The HEAD `Supabase Preview` check links to project `rgcolnioakzrdtsxwscp`; this is external integration state, not repository text.
- The official Supabase GitHub Integration procedure configures repository, production branch, working directory, and production deployment in Supabase Studio. The public Management API documentation inspected during reconciliation does not expose an endpoint for reassigning that connection.

## External integration gate

Observed HEAD check:

`CHECK_NAME=Supabase Preview`

`CHECK_APP=Supabase`

`CHECK_PROJECT_REF=rgcolnioakzrdtsxwscp`

Required external configuration:

`REPOSITORY=Jorgeprdz/ForgeOS`

`PRODUCTION_BRANCH=main`

`WORKING_DIRECTORY=.`

`PROJECT_REF=rmlxigxysujsuwzgoimv`

`DEPLOY_TO_PRODUCTION=VERIFY_EXPLICITLY`

## Current decision

The two repository-local executable references are reconciled in the working tree. Project identity and the GitHub integration cannot be declared reconciled because this host has no Supabase access-token session, GitHub does not reveal repository secret values, and the external check still proves the stale project connection.

`SUPABASE_GITHUB_INTEGRATION_VERIFIED=YES_FRESH_CHECK_609ffb748025db51585a2e6faa845bb60507d164`

`PROJECT_REF_VERIFIED=YES_RMLXIGXYSUJSUWZGOIMV`

`COMMIT_AUTHORIZED=CONDITIONAL_ON_REMAINING_PREDEPLOYMENT_GATES`
