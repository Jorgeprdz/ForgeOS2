import { buildEventClientReview } from './event-client-review-engine.js';

const results = [];
function test(name, fn) { try { fn(); results.push({ name, status: 'PASS' }); } catch (error) { results.push({ name, status: 'FAIL', error: error.message }); } }
function assert(condition, message) { if (!condition) throw new Error(message); }

const review = buildEventClientReview({
  eventLabels: ['CHILDBIRTH', 'FOREIGN_EVENT'],
  missingEvidence: ['country', 'deliveryDate'],
  evaluationStatus: 'HUMAN_REVIEW_REQUIRED'
});

test('What we know generated', () => { assert(review.whatWeKnow.length > 10, 'whatWeKnow missing.'); });
test('What we need generated', () => { assert(review.whatWeNeed.includes('country'), 'whatWeNeed missing.'); });
test('Why cannot answer generated', () => { assert(review.whyWeCannotAnswerYet.length > 20, 'why missing.'); });
test('Next step generated', () => { assert(review.nextStep.endsWith('?'), 'nextStep missing.'); });

console.log('\nFORGE GMM EVENT CLIENT REVIEW SMOKE TEST v0.1\n');
for (const result of results) { console.log(`${result.status} ${result.name}`); if (result.error) console.log(`   ${result.error}`); }
console.log(JSON.stringify(review, null, 2));
const failed = results.filter((result) => result.status === 'FAIL');
console.log(`\nSummary:\nTotal: ${results.length}\nPass: ${results.length - failed.length}\nFail: ${failed.length}`);
if (failed.length > 0) process.exit(1);
