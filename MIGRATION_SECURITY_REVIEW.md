# 067G17A1 Migration Security Review

Date: 2026-07-17

Migration: `supabase/migrations/20260717000100_067g17a1_prospect_opportunity_security_foundation.sql`

## Decision

`LOCAL_STATIC_SECURITY_REVIEW=PASS`

`POSTGRES_EXECUTION_VALIDATION=PENDING_SUPABASE_PREVIEW`

`PRODUCTION_DEPLOYMENT_AUTHORIZED=NO_UNTIL_PREVIEW_AND_PREFLIGHT_PASS`

The migration is additive and transactional. It extends the existing `public.prospects` table and creates four normalized child entities. It does not drop tables, truncate data, delete rows, rewrite financial truth, or introduce productive UI CRUD.

## Ownership and RLS

- Canonical owner: `advisor_id = auth.uid()`.
- Browser-supplied ownership is constrained by INSERT and UPDATE policies.
- Ownership transfer is rejected by a trigger.
- Anonymous privileges are revoked.
- Authenticated privileges omit DELETE.
- Existing DELETE policies are removed by catalog inventory before owner policies are recreated.
- Child ownership is enforced with composite foreign keys to `(id, advisor_id)`.

## Archive semantics

- Archive metadata requires timestamp, owning advisor, and a nonblank reason.
- Archive metadata is immutable once set.
- Opportunity status history business fields are append-only; UPDATE exists only to support owner archive metadata.
- Active prospect queries exclude archived prospects.
- Active opportunity queries exclude archived opportunities and opportunities whose parent prospect is archived.
- Hard delete through the productive browser role is denied.

## Reconciled review findings

- The preexisting `prospects.advisor_id` foreign key is explicitly discovered and replaced with `ON DELETE RESTRICT`; `ADD COLUMN IF NOT EXISTS` is no longer relied upon to change FK behavior.
- New canonical tables use strict `CREATE TABLE`, not `IF NOT EXISTS`, so a partial preexisting schema fails rather than silently surviving.
- The prospect archive constraint is validated immediately, not left `NOT VALID`.
- Status-history business evidence cannot be rewritten after insertion.
- All preexisting DELETE policies on affected tables are removed through `pg_policies` inventory.

## Mandatory remote preflight

Before production deployment, a read-only Management API query must prove:

- `public.prospects` exists;
- no prospect has null `advisor_id`;
- none of the four new canonical tables already exists;
- the query is executed against `rmlxigxysujsuwzgoimv`;
- the Supabase Preview check executes this migration successfully.

## Failure and compensating plan

PostgreSQL automatically rolls back the entire migration if any statement fails before COMMIT. After a successful production commit, rollback by destructive table removal is prohibited. If a defect is discovered:

1. Immediately revoke affected browser grants or disable the affected application path through a new reviewed migration.
2. Preserve all rows and archive/audit history.
3. Apply a forward-only corrective versioned migration.
4. Re-run two-advisor isolation and anonymous denial.
5. Do not delete canonical tables or rewrite migration history.

