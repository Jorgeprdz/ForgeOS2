// tests/services/forge-alpha-service.test.js
const assert = require('assert');

const AUTHENTICATED_ADVISOR_ID = '11111111-1111-4111-8111-111111111111';
const FORGED_ADVISOR_ID = '22222222-2222-4222-8222-222222222222';

// Mock SupabaseRuntime before requiring the service
const mockSupabase = {
    from: () => ({
        insert: (row) => ({
            select: () => ({
                single: async () => row.advisor_id === AUTHENTICATED_ADVISOR_ID
                    ? { data: { id: 'mocked-id' }, error: null }
                    : { data: null, error: new Error('RLS advisor ownership denied') }
            })
        })
    })
};

// Manually setup the mock in the cache for the require
require.cache[require.resolve('../../supabase-runtime')] = {
    exports: { default: mockSupabase }
};

const { processNote } = require('../../src/services/forge-alpha-service');

async function testCases() {
  const cases = [
    {
      name: 'Lariza',
      prospectId: 'lariza-id',
      note: 'Need to refine proposal to match prospect risk-tolerance.'
    },
    {
      name: 'Claudia Sánchez',
      prospectId: 'claudia-id',
      note: 'Claudia requested policy document.'
    },
    {
      name: 'Marlene',
      prospectId: 'marlene-id',
      note: 'Marlene said she will review the proposal and call me back by Friday.'
    },
    {
      name: 'Ricardo Mejía',
      prospectId: 'ricardo-id',
      note: 'Medical exam scheduled for Tuesday.'
    },
    {
      name: 'Octavio',
      prospectId: 'octavio-id',
      note: 'Octavio needs clarification on the retirement plan.'
    },
    {
      name: 'Adry',
      prospectId: 'adry-id',
      note: 'Adry submitted payment.'
    }
  ];

  for (const c of cases) {
    console.log(`Running test: ${c.name}`);
    const result = await processNote({
      prospectId: c.prospectId,
      advisorId: AUTHENTICATED_ADVISOR_ID,
      note: c.note
    });
    
    // Validate persistence succeeded
    assert(result.eventId, 'Missing eventId');
    assert(result.outputId, 'Missing outputId');
    
    // Validate other fields
    assert(result.owner, `Missing owner for ${c.name}`);
    assert(result.waiting_state, `Missing waiting_state for ${c.name}`);
    assert(result.advancement_state, `Missing advancement_state for ${c.name}`);
    
    console.log(`Test ${c.name} passed`);
  }

  await assert.rejects(
    () => processNote({ prospectId: 'missing-advisor', note: 'Follow up tomorrow.' }),
    /advisorId is required/,
    'Missing advisorId must remain rejected'
  );

  await assert.rejects(
    () => processNote({
      prospectId: 'forged-advisor',
      advisorId: FORGED_ADVISOR_ID,
      note: 'Marlene said she will review the proposal.'
    }),
    /RLS advisor ownership denied/,
    'A forged advisorId must be denied by the ownership boundary'
  );
}

testCases().catch(err => {
  console.error('Test failed', err);
  process.exit(1);
});
