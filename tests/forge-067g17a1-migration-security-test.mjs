import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260717000100_067g17a1_prospect_opportunity_security_foundation.sql';
const sql = readFileSync(migrationPath, 'utf8');
const normalized = sql.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ');

assert.match(normalized, /^\s*begin;/i);
assert.match(normalized, /commit;\s*$/i);
assert.equal((sql.match(/\$\$/g) || []).length % 2, 0, 'dollar-quoted SQL blocks must be balanced');
assert.equal((sql.match(/\(/g) || []).length, (sql.match(/\)/g) || []).length, 'SQL parentheses must be balanced');

const tables = [
  'prospects',
  'opportunities',
  'prospect_contact_methods',
  'prospect_provenance',
  'opportunity_status_history'
];

for (const table of tables) {
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`, 'i'), `${table}: RLS`);
  assert.match(sql, new RegExp(`'${table}'`), `${table}: policy runner membership`);
  for (const operation of ['select', 'insert', 'update']) {
    assert.ok(sql.includes(`table_name || '_${operation}_own_rows'`), `${operation} policy factory missing`);
  }
  assert.ok(sql.includes("table_name || '_archive_metadata_required'"), 'archive policy factory missing');
}

assert.match(sql, /advisor_id = auth\.uid\(\)/g);
assert.match(sql, /every existing prospect requires advisor ownership before migration/);
assert.match(sql, /alter table public\.prospects alter column advisor_id set not null/);
assert.match(sql, /constraint prospects_advisor_owner_fk[\s\S]*references auth\.users\(id\) on delete restrict/);
assert.doesNotMatch(sql, /create table if not exists public\.(opportunities|prospect_contact_methods|prospect_provenance|opportunity_status_history)/i);
assert.match(sql, /new\.advisor_id is distinct from old\.advisor_id/);
assert.match(sql, /advisor ownership transfer is not allowed/);
assert.match(sql, /archive history is immutable/);
assert.match(sql, /opportunity status history is append-only/);
assert.match(sql, /archived_by = auth\.uid\(\)/);
assert.match(sql, /nullif\(btrim\(archive_reason\), ''\) is not null/);
assert.match(sql, /drop policy if exists "prospects_delete_own_rows"/);
assert.match(sql, /grant select, insert, update on table/);
assert.doesNotMatch(sql, /grant[^;]*delete[^;]*authenticated/i);
assert.doesNotMatch(sql, /create policy[^;]*for delete/i);
assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i);
assert.doesNotMatch(sql, /prospects_archive_metadata_ck[\s\S]{0,300}not valid/i);
assert.match(sql, /from pg_policies[\s\S]*cmd = 'DELETE'/);
assert.match(sql, /revoke all on table public\.%I from anon/);
assert.match(sql, /references public\.prospects \(id, advisor_id\)/);
assert.match(sql, /references public\.opportunities \(id, advisor_id\)/);
assert.match(sql, /active_prospects[\s\S]*archived_at is null/);
assert.match(sql, /active_opportunities[\s\S]*archived_at is null/);
assert.match(sql, /active_opportunities[\s\S]*join public\.prospects[\s\S]*p\.archived_at is null/);

console.log('067G17A1 MIGRATION SECURITY: PASS');
