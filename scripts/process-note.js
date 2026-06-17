// scripts/process-note.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SupabaseRuntime = require('../supabase-runtime').default;

// Initialize Supabase if not already initialized
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  SupabaseRuntime.init(client);
}

const { processNote } = require('../src/services/forge-alpha-service');
const repository = require('../src/services/forge-alpha-repository');

async function run() {
  const args = process.argv.slice(2);
  const prospectIndex = args.indexOf('--prospect');
  const noteIndex = args.indexOf('--note');

  if (prospectIndex === -1 || noteIndex === -1) {
    console.error('Usage: node scripts/process-note.js --prospect <alias> --note <note>');
    process.exit(1);
  }

  const alias = args[prospectIndex + 1];
  const note = args[noteIndex + 1];

  if (!note) {
    console.error('Note cannot be empty.');
    process.exit(1);
  }

  try {
    let prospect = await repository.findProspectByAlias(alias);
    if (!prospect) {
      console.log(`Prospect ${alias} not found. Creating...`);
      prospect = await repository.createProspect(alias);
    }

    const result = await processNote({ prospectId: prospect.id, note });

    console.log('----------------------------------------');
    console.log(`PROSPECT: ${alias}`);
    console.log('');
    console.log(`OWNER: ${result.owner.toUpperCase()}`);
    console.log(`OWNERSHIP CONFIDENCE: ${result.ownership_confidence}`);
    console.log('');
    console.log('WAITING STATE:');
    console.log(`${result.waiting_state.toUpperCase()}`);
    console.log('');
    console.log('ADVANCEMENT:');
    console.log(`${result.advancement_state.toUpperCase()}`);
    console.log('');
    console.log('RECOMMENDATION:');
    console.log(result.recommendation);
    console.log('');
    console.log('EVIDENCE:');
    result.evidence_used.forEach(e => console.log(`- ${e}`));
    console.log('');
    console.log('RUNTIME CONFIDENCE:');
    console.log(result.runtimeConfidence || 'N/A');
    console.log('----------------------------------------');
  } catch (err) {
    console.error('Error processing note:', err);
    process.exit(1);
  }
}

run();
