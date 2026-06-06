import { getNextBestQuestion } from './next-best-question-engine.js';

const results = [];
function test(name, fn) { try { fn(); results.push({ name, status: 'PASS' }); } catch (error) { results.push({ name, status: 'FAIL', error: error.message }); } }
function assert(condition, message) { if (!condition) throw new Error(message); }

const questions = [
  getNextBestQuestion({ missingEvidence: ['diagnosis'], eventLabels: ['HOSPITALIZATION'] }),
  getNextBestQuestion({ missingEvidence: ['country'], eventLabels: ['FOREIGN_EVENT'] }),
  getNextBestQuestion({ missingEvidence: ['accidentDescription'], eventLabels: ['ACCIDENT'] }),
  getNextBestQuestion({ missingEvidence: ['hospital'], eventLabels: ['SURGERY'] })
];

test('Human questions generated', () => {
  assert(questions.every((question) => question.endsWith('?')), 'Question style mismatch.');
});
test('Forbidden generic questions avoided', () => {
  assert(!questions.includes('What evidence is missing?'), 'Forbidden question found.');
  assert(!questions.includes('More information required.'), 'Forbidden question found.');
  assert(!questions.includes('Additional documentation needed.'), 'Forbidden question found.');
});

console.log('\nFORGE GMM NEXT BEST QUESTION SMOKE TEST v0.1\n');
for (const result of results) { console.log(`${result.status} ${result.name}`); if (result.error) console.log(`   ${result.error}`); }
console.log(JSON.stringify({ questions }, null, 2));
const failed = results.filter((result) => result.status === 'FAIL');
console.log(`\nSummary:\nTotal: ${results.length}\nPass: ${results.length - failed.length}\nFail: ${failed.length}`);
if (failed.length > 0) process.exit(1);
