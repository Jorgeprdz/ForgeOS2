// tests/scripts/process-note.test.js
const assert = require('assert');
const repository = require('../../src/services/forge-alpha-repository');
const { processNote } = require('../../src/services/forge-alpha-service');

// Mock SupabaseRuntime
const mockSupabase = {
    from: (table) => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({ data: table === 'prospects' ? null : { id: 'mocked-event-id' }, error: null })
            })
        }),
        insert: () => ({
            select: () => ({
                single: async () => ({ data: { id: 'mocked-id' }, error: null })
            })
        })
    })
};

// Manually inject the mock into the repository for testing
repository.setSupabaseRuntime(mockSupabase);

async function testProcessNote() {
    console.log('Running test: Existing prospect');
    // Mock prospect
    const mockProspect = { id: 'existing-id', alias: 'Lariza' };
    repository.findProspectByAlias = async () => mockProspect;
    
    const result = await processNote({ prospectId: mockProspect.id, note: 'Valid note' });
    assert(result.eventId, 'Should have eventId');
    console.log('Existing prospect passed');

    console.log('Running test: New prospect creation');
    repository.findProspectByAlias = async () => null;
    repository.createProspect = async (alias) => ({ id: 'new-id', alias });
    
    const newProspect = await repository.createProspect('NewProspect');
    const result2 = await processNote({ prospectId: newProspect.id, note: 'Valid note' });
    assert(result2.eventId, 'Should have eventId for new prospect');
    console.log('New prospect creation passed');

    console.log('Running test: Lariza scenario');
    const larizaResult = await processNote({ prospectId: 'lariza-id', note: 'Hablé con Lariza. Lo revisa con su novio. Quedamos de hablar el viernes.' });
    assert(larizaResult.owner, 'Should have owner');
    console.log('Lariza scenario passed');

    console.log('Running test: Marlene scenario');
    const marleneResult = await processNote({ prospectId: 'marlene-id', note: 'Marlene said she will review the proposal and call me back by Friday.' });
    assert(marleneResult.owner, 'Should have owner');
    console.log('Marlene scenario passed');
}

testProcessNote().catch(err => {
    console.error('Test failed', err);
    process.exit(1);
});
