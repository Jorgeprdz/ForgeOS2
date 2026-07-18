# 067G17A1 Migration Diff

## Existing table extension

`public.prospects` gains display, notes, update timestamp, and archive metadata. Existing ownership becomes mandatory and its auth-user FK is normalized to `ON DELETE RESTRICT`.

## New tables

- `public.opportunities`
- `public.prospect_contact_methods`
- `public.prospect_provenance`
- `public.opportunity_status_history`

Each uses UUID identity, advisor ownership, timestamps, validated constraints, restrictive foreign keys, ownership indexes, RLS, and archive metadata where applicable.

## New database objects

- Composite ownership indexes and foreign keys.
- `public.forge_067g17a1_guard_owned_archive_row()` trigger function.
- Owner/archive guard triggers on five tables.
- Explicit owner SELECT/INSERT/UPDATE and restrictive archive policies.
- `public.active_prospects` and `public.active_opportunities` security-invoker views.

## Explicitly absent

- No DROP TABLE, TRUNCATE, row DELETE, service-role browser access, financial truth, product truth, compensation truth, forecasts, Rule Pack results, ML scores, invented probabilities, or real customer fixtures.

