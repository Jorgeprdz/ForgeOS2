# MANAGER ADVISOR ACCESS MODEL 001

Status: ACCESS MODEL REQUIRED BEFORE MANAGER RLS
Date: 2026-06-18
Sprint Type: Discovery / Access Model Brief Only

---

## 1. Veredicto

ACCESS MODEL REQUIRED BEFORE MANAGER RLS.

Forge may not add Manager/Partner RLS access to advisor-owned data until an explicit invitation, consent, active membership and revocation model exists.

The current RLS foundation should remain focused on individual advisor ownership. Manager access is a separate security and product boundary.

---

## 2. Product Rule

Advisor owns the data.

A Manager/Partner does not automatically own, inherit or receive advisor data because they are a manager.

Manager access exists only through an explicit relationship accepted by the advisor. The manager should see progress, health, risk, coaching needs and next-action signals, not raw private client/prospect data by default.

The product promise is:

- Advisor controls access.
- Manager receives coaching visibility only after consent.
- Access can be revoked.
- Raw notes, raw prospects, policy/client data and private context stay closed unless a later explicit scope authorizes them.

---

## 3. Proposed Minimal Data Model

Suggested tables only. No SQL is authorized by this brief.

`profiles`

- `id`
- `user_id`
- `email`
- `display_name`
- `primary_role`
- `created_at`
- `updated_at`

Purpose: map Supabase auth users to Forge identity. A user may act as advisor, manager or both depending on memberships.

`teams` or `agencies`

- `id`
- `name`
- `owner_manager_id`
- `status`
- `created_at`
- `updated_at`

Purpose: represent the commercial unit or agency context. This does not grant advisor data access by itself.

`team_invitations`

- `id`
- `team_id`
- `manager_id`
- `invited_email`
- `invited_user_id`
- `role`
- `visibility_scope`
- `status`
- `created_at`
- `accepted_at`
- `declined_at`
- `expires_at`
- `revoked_at`

Purpose: record manager intent and advisor consent flow. Pending invitations grant no data access.

`team_memberships`

- `id`
- `team_id`
- `manager_id`
- `advisor_id`
- `role`
- `visibility_scope`
- `status`
- `accepted_at`
- `revoked_at`
- `left_at`
- `created_at`
- `updated_at`

Purpose: active authorization record. Manager access depends on an active membership with non-revoked status.

`advisor_metric_snapshots` or `advisor_dashboard_metrics`

- `id`
- `advisor_id`
- `period_start`
- `period_end`
- `metric_type`
- `metric_payload`
- `health_status`
- `risk_status`
- `coaching_need`
- `visibility_scope`
- `generated_at`
- `source_summary`

Purpose: provide manager-readable derived metrics without exposing raw client/prospect/private notes by default.

---

## 4. Access Lifecycle

1. Manager sends invite to advisor by email or known profile.
2. Invitation remains pending and grants no access.
3. Advisor accepts explicitly.
4. Active `team_memberships` row is created or activated.
5. Manager can read only metric rows allowed by `visibility_scope`.
6. Advisor can revoke or leave the relationship.
7. Manager or authorized team owner can revoke the invitation or membership.
8. Revoked, expired, declined or left memberships deny future access.
9. Historical access should be auditable, but current reads must respect current active status.

---

## 5. RLS Implications

Future policies should follow these conceptual rules:

- Advisor can select own advisor-owned rows.
- Advisor can select and manage own membership consent records.
- Manager can select advisor metric rows only when an active membership exists.
- Manager can select only scopes granted by the membership.
- Manager cannot select raw `alpha_events.raw_note` by default.
- Manager cannot select raw `prospects` by default.
- Manager cannot select raw policy/client/cartera data by default.
- Manager cannot update advisor-owned rows.
- Revoked membership must immediately deny future reads.
- Aggregated/derived metrics should be the first manager-facing access target.

Manager access should be implemented against derived metric tables first, not against raw advisor operational tables.

---

## 6. Visibility Scopes

Suggested scopes:

- `metrics_only`: aggregate health, progress and risk indicators.
- `coaching_summary`: interpreted coaching needs and recommended development focus.
- `pipeline_summary`: counts and stage summaries without raw prospect identity.
- `activity_summary`: activity volume, consistency and habit signals.
- `compensation_summary`: high-level authorized economic progress only when evidence and rule context exist.

Prohibited for beta:

- `raw_notes`
- `raw_client_data`
- raw prospects
- raw policies
- raw cartera
- raw telemetry/logs

If raw access is ever needed, it requires a separate consent scope, separate RLS review and separate privacy approval.

---

## 7. Beta Recommendation

Do not include manager access in `SUPABASE RLS BETA FOUNDATION 001`.

First lock individual advisor ownership:

- `crm_data.user_id = auth.uid()`
- Alpha tables use `advisor_id = auth.uid()`
- child tables preserve ownership via FK chains

Then run a separate invitation and membership sprint.

`SUPABASE RLS BETA FOUNDATION 001` may mention manager access only as future-deferred and must not implement manager dashboard access.

---

## 8. Impact On Next Sprint

Do not change the authorized scope of `SUPABASE RLS BETA FOUNDATION 001`.

Keep it focused on advisor-owned data and individual RLS.

Avoid naming or implementing future manager policies until `team_memberships` exists.

Do not implement Manager OS dashboard access yet.

Do not expand offline sync, raw data access or profile-sharing semantics during the RLS foundation sprint.

---

## 9. Risks

High:

- Manager overreach through role-based assumptions instead of advisor consent.
- Raw PII exposure through prospects, policy/client data or advisor notes.
- Confusing manager coaching visibility with manager ownership.
- Ex-manager retaining access after advisor leaves or revokes.

Medium:

- Advisor changes teams and old access remains active.
- Pending invitation accidentally grants data access.
- Aggregated metric leakage reveals sensitive pipeline or compensation context.
- Revocation is recorded but not enforced in RLS.

Low:

- Duplicate invitations create unclear relationship state.
- Multiple managers with different scopes create confusing product expectations.

---

## 10. Recommended Future Sprint

Sprint name:

MANAGER ADVISOR INVITATION ACCESS FOUNDATION 001

Scope:

- Tables: `profiles`, `teams` or `agencies`, `team_invitations`, `team_memberships`, `advisor_metric_snapshots` or `advisor_dashboard_metrics`.
- RLS policies: self-access, invitation ownership, active membership reads, revoked membership denial.
- Invitation lifecycle: pending, accepted, declined, expired, revoked.
- Revocation: advisor can revoke or leave; revoked access denies future manager reads.
- Tests: multi-user manager/advisor isolation, consent, revocation and raw data denial.
- No UI unless separately authorized.
- No raw notes/client/policy/cartera access.
- No broad Manager OS implementation.

---

## 11. Required Tests For Future Sprint

- Manager cannot see advisor data without membership.
- Manager can see allowed metrics after accepted membership.
- Pending invite grants no access.
- Revoked membership grants no access.
- Advisor can see own data.
- Advisor can revoke or leave membership.
- Manager cannot see raw notes by default.
- Manager cannot see raw client/prospect/policy data by default.
- Manager cannot update advisor-owned rows.
- Advisor changing team invalidates old access.
- Visibility scope limits metric access.
- Aggregated metric rows do not contain raw PII by default.

---

## 12. Commands Run And Results

- `git status --short`: clean before document creation.
- `git log --oneline -10`: latest commit is `ff89b13 docs(readiness): authorize limited Supabase RLS foundation sprint`.
- `find supabase -maxdepth 4 -type f | sort`: only `supabase/functions/semantic-extract/index.ts` found.
- `find docs -maxdepth 4 -type f | sort`: readiness and manager/advisor architecture docs exist; no consent access model was found before this brief.
- `rg -n "manager|partner|advisor|team|invite|membership|user_id|advisor_id|auth.uid|crm_data|prospects|alpha_events|forge_outputs|window.supabaseClient|item.table" docs supabase src platform comisiones.js tests`: found current advisor-owned Supabase references, legacy Supabase boundary references and manager/advisor conceptual docs; no implemented invitation/membership RLS model found.

Full test suite was not run because this sprint is discovery-only and time-boxed.

Runtime graph audit was not run because this sprint is documentation-only and time-boxed.

---

## 13. Git Status

Expected final status:

```text
?? docs/architecture/readiness/MANAGER_ADVISOR_ACCESS_MODEL_001.md
```

---

## 14. Commit Recommendation

`docs(readiness): define consent-based manager advisor access model`

---

## 15. Context Handoff

Access model verdict: ACCESS MODEL REQUIRED BEFORE MANAGER RLS.

Manager access should not be included in `SUPABASE RLS BETA FOUNDATION 001`.

Proposed tables: `profiles`, `teams` or `agencies`, `team_invitations`, `team_memberships`, `advisor_metric_snapshots` or `advisor_dashboard_metrics`.

Lifecycle: manager invites, advisor accepts, active membership grants scoped metrics, advisor can revoke or leave, revoked status denies access.

Visibility scopes: `metrics_only`, `coaching_summary`, `pipeline_summary`, `activity_summary`, `compensation_summary`; `raw_notes` and `raw_client_data` prohibited for beta.

RLS implications: advisor self-access stays primary; manager reads only derived metrics through active membership; raw Alpha notes, raw prospects and raw policy/client data remain denied by default.

Future sprint recommendation: MANAGER ADVISOR INVITATION ACCESS FOUNDATION 001.

Files created: `docs/architecture/readiness/MANAGER_ADVISOR_ACCESS_MODEL_001.md`.

Commands run: status, log, Supabase file inventory, docs inventory, manager/advisor RLS search.

Commit recommendation: `docs(readiness): define consent-based manager advisor access model`.
