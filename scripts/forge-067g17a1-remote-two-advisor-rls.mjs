import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';

assert.equal(process.env.FORGE_067G17A1_REMOTE_RLS_AUTHORIZED, 'YES', 'REMOTE_RLS_AUTHORIZATION_REQUIRED');
assert.equal(process.env.FORGE_067G17A1_REMOTE_WRITE_CONFIRMATION, 'YES', 'REMOTE_WRITE_CONFIRMATION_REQUIRED');

const required = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY',
  'ADVISOR_A_EMAIL', 'ADVISOR_A_PASSWORD',
  'ADVISOR_B_EMAIL', 'ADVISOR_B_PASSWORD'
];
for (const name of required) assert.ok(process.env[name], `${name}_MISSING`);

const approvedRef = 'rmlxigxysujsuwzgoimv';
assert.equal(new URL(process.env.SUPABASE_URL).hostname, `${approvedRef}.supabase.co`, 'PROJECT_REF_MISMATCH');

const evidencePath = process.env.FORGE_067G17A1_REMOTE_EVIDENCE || 'artifacts/067g17a1-remote/ledger.jsonl';
mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, '');
const record = (name, status) => appendFileSync(evidencePath, `${JSON.stringify({ name, status })}\n`);

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const client = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, options);
const advisorA = client();
const advisorB = client();
const anonymous = client();
let userA;
let userB;
const fixtures = { prospects: [], opportunities: [], contacts: [], provenance: [], history: [] };

async function authenticate() {
  const [{ data: a, error: errorA }, { data: b, error: errorB }] = await Promise.all([
    advisorA.auth.signInWithPassword({ email: process.env.ADVISOR_A_EMAIL, password: process.env.ADVISOR_A_PASSWORD }),
    advisorB.auth.signInWithPassword({ email: process.env.ADVISOR_B_EMAIL, password: process.env.ADVISOR_B_PASSWORD })
  ]);
  assert.ifError(errorA);
  assert.ifError(errorB);
  userA = a.user;
  userB = b.user;
  assert.ok(userA?.id && userB?.id, 'ADVISOR_AUTHENTICATION_FAILED');
  assert.notEqual(userA.id, userB.id, 'ADVISOR_IDENTITIES_NOT_DISTINCT');
  assert.notEqual(userA.is_anonymous, true);
  assert.notEqual(userB.is_anonymous, true);
  record('advisor_authentication', 'PASS');
}

async function insertProspect(api, advisorId, suffix) {
  const { data, error } = await api.from('prospects').insert({ advisor_id: advisorId, display_name: `067g17a1-${suffix}` }).select('id,advisor_id').single();
  assert.ifError(error);
  fixtures.prospects.push({ api, id: data.id, advisorId });
  return data;
}

async function archive(api, table, id, advisorId, reason) {
  const { data, error } = await api.from(table).update({ archived_at: new Date().toISOString(), archived_by: advisorId, archive_reason: reason }).eq('id', id).select('id');
  assert.ifError(error);
  assert.equal(data.length, 1, `${table}_ARCHIVE_NOT_APPLIED`);
}

async function cleanup() {
  let failed = false;
  for (const [key, table] of [['history', 'opportunity_status_history'], ['contacts', 'prospect_contact_methods'], ['provenance', 'prospect_provenance'], ['opportunities', 'opportunities'], ['prospects', 'prospects']]) {
    for (const row of fixtures[key]) {
      try {
        await archive(row.api, table, row.id, row.advisorId, '067G17A1 acceptance cleanup');
      } catch {
        failed = true;
      }
    }
  }
  record('fixture_cleanup', failed ? 'CLEANUP_FAIL' : 'CLEANUP_PASS');
  if (failed) throw new Error('REMOTE_FIXTURE_CLEANUP_FAILED');
}

let acceptanceError;
try {
  await authenticate();
  const prospectA = await insertProspect(advisorA, userA.id, 'advisor-a');
  const prospectB = await insertProspect(advisorB, userB.id, 'advisor-b');

  const { data: opportunityA, error: opportunityError } = await advisorA.from('opportunities').insert({ advisor_id: userA.id, prospect_id: prospectA.id, title: 'Acceptance opportunity', status: 'new' }).select('id').single();
  assert.ifError(opportunityError);
  fixtures.opportunities.push({ api: advisorA, id: opportunityA.id, advisorId: userA.id });

  const { data: contactA, error: contactError } = await advisorA.from('prospect_contact_methods').insert({ advisor_id: userA.id, prospect_id: prospectA.id, method_type: 'acceptance', method_value: 'non-sensitive-fixture' }).select('id').single();
  assert.ifError(contactError);
  fixtures.contacts.push({ api: advisorA, id: contactA.id, advisorId: userA.id });

  const { data: provenanceA, error: provenanceError } = await advisorA.from('prospect_provenance').insert({ advisor_id: userA.id, prospect_id: prospectA.id, source_type: 'acceptance-test' }).select('id').single();
  assert.ifError(provenanceError);
  fixtures.provenance.push({ api: advisorA, id: provenanceA.id, advisorId: userA.id });

  const { data: historyA, error: historyError } = await advisorA.from('opportunity_status_history').insert({ advisor_id: userA.id, opportunity_id: opportunityA.id, to_status: 'new', changed_by: userA.id }).select('id').single();
  assert.ifError(historyError);
  fixtures.history.push({ api: advisorA, id: historyA.id, advisorId: userA.id });

  for (const [viewer, hiddenId] of [[advisorA, prospectB.id], [advisorB, prospectA.id]]) {
    const { data, error } = await viewer.from('prospects').select('id').eq('id', hiddenId);
    assert.ifError(error);
    assert.equal(data.length, 0, 'CROSS_ADVISOR_READ_SUCCEEDED');
  }
  record('two_advisor_isolation', 'PASS');

  const { error: forgedError } = await advisorB.from('prospects').insert({ advisor_id: userA.id, display_name: '067g17a1-forged' });
  assert.ok(forgedError, 'FORGED_ADVISOR_ID_SUCCEEDED');
  record('forged_advisor_id_denied', 'PASS');

  const { error: transferError } = await advisorA.from('prospects').update({ advisor_id: userB.id }).eq('id', prospectA.id);
  assert.ok(transferError, 'OWNERSHIP_TRANSFER_SUCCEEDED');
  record('ownership_transfer_denied', 'PASS');

  const { data: anonymousRows, error: anonymousError } = await anonymous.from('prospects').select('id').limit(1);
  assert.ok(anonymousError || anonymousRows.length === 0, 'ANONYMOUS_ACCESS_SUCCEEDED');
  record('anonymous_access_denied', 'PASS');

  const { data: crossArchive, error: crossArchiveError } = await advisorA.from('prospects').update({ archived_at: new Date().toISOString(), archived_by: userA.id, archive_reason: 'forbidden cross archive' }).eq('id', prospectB.id).select('id');
  assert.ifError(crossArchiveError);
  assert.equal(crossArchive.length, 0, 'CROSS_ADVISOR_ARCHIVE_SUCCEEDED');
  record('cross_advisor_archive_denied', 'PASS');

  const { error: deleteError } = await advisorA.from('prospects').delete().eq('id', prospectA.id);
  assert.ok(deleteError, 'FRONTEND_HARD_DELETE_SUCCEEDED');
  record('frontend_hard_delete_denied', 'PASS');

  await archive(advisorA, 'prospects', prospectA.id, userA.id, '067G17A1 owner archive acceptance');
  fixtures.prospects = fixtures.prospects.filter(row => row.id !== prospectA.id);
  const { data: activeProspects, error: activeProspectsError } = await advisorA.from('active_prospects').select('id').eq('id', prospectA.id);
  assert.ifError(activeProspectsError);
  assert.equal(activeProspects.length, 0);
  const { data: activeOpportunities, error: activeOpportunitiesError } = await advisorA.from('active_opportunities').select('id').eq('id', opportunityA.id);
  assert.ifError(activeOpportunitiesError);
  assert.equal(activeOpportunities.length, 0, 'ARCHIVED_PARENT_REMAINS_IN_ACTIVE_PIPELINE');
  record('archive_policy', 'PASS');
} catch (error) {
  acceptanceError = error;
  record('remote_acceptance', 'FAIL');
}

try {
  await cleanup();
} catch (error) {
  acceptanceError ||= error;
}
await Promise.all([advisorA.auth.signOut(), advisorB.auth.signOut()]);
if (acceptanceError) throw acceptanceError;
record('remote_acceptance', 'PASS');
console.log('067G17A1 REMOTE TWO-ADVISOR RLS: PASS');
